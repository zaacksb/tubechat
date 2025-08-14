import { TubeChat } from '../TubeChat'
import { VideoDescriptionHeaderRenderer, VideoPrimaryInfoRenderer } from '../types'
import { findKey, getStr, sleep } from '../utils'

export type VideoData = {
  videoId: string
  user: string
  chatType: 'vod' | 'live'
  channelId: string
  title: string
}

export type FetchChat = Promise<{
  code: 'success',
  videoData: VideoData,
  actions: Object[]
} | {
  code: 'fetch_error',
  error: any
} | {
  code: 'continuation_not_found',
  error: string
} | {
  code: 'permission_denied',
  error: string
}>

export type StartConnectionErrors = {
  code: 'chat_unavailable' | 'chat_disabled' | 'chat_not_found' | 'vod_chat_not_supported' | 'permission_denied'
  message: string
}
async function retryConnect(videoId: string, eventEmitter: TubeChat, isVodContent: boolean, retry: number, errorReturn: StartConnectionErrors) {
  if (retry >= eventEmitter.maxRetries) {
    return errorReturn
  }
  await sleep(1000 * retry)
  eventEmitter.emit('retry', videoId, errorReturn, retry, eventEmitter.maxRetries)
  return await startConnection(videoId, eventEmitter, isVodContent, retry + 1)
}

export async function startConnection(videoId: string, eventEmitter: TubeChat, isVodContent = false, retry = 1): Promise<StartConnectionErrors | {
  code: 'success',
  videoData: VideoData,
  fetchChat: () => FetchChat
}> {
  let continuation: string | null = null
  let clientVersion: string | null = null
  let clientName: string | null = null
  let apiKey: string | null = null
  const videoData = {} as VideoData
  const video = eventEmitter.videos.get(videoId)!
  videoData.videoId = videoId
  try {
    if (!continuation && !apiKey && !clientName && !clientVersion) {
      const req = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en&persist_hl=1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          ...eventEmitter.headers,
          ...video.customHeaders
        },
      })
      const htmlContent = (await req.text()).trim()
      let ytcfg = {}
      let ytInitialData = {}
      try {
        ytcfg = JSON.parse(getStr(htmlContent, '{window.ytplayer={};\nytcfg.set(', '); window.ytcfg')!)
      } catch (e) {
      }
      try {
        ytInitialData = JSON.parse(getStr(htmlContent, 'var ytInitialData = ', ';</script>')!)

        const videoPrimaryInfoRenderer = findKey<VideoPrimaryInfoRenderer>(ytInitialData, 'videoPrimaryInfoRenderer')
        const style = videoPrimaryInfoRenderer?.badges?.[0]?.metadataBadgeRenderer?.style ?? ''
        if (style == 'BADGE_STYLE_TYPE_MEMBERS_ONLY') {
          return {
            code: 'chat_unavailable',
            message: 'Content is for members only, use headers for authentication'
          }
        }
        if (findKey(ytInitialData, 'availabilityMessage')) {
          return {
            code: 'chat_disabled',
            message: 'Chat is disabled for this live stream.'
          }

        }
      } catch (e) {

      }
      const videoDescriptionHeaderRenderer = findKey<VideoDescriptionHeaderRenderer>(ytInitialData, 'videoDescriptionHeaderRenderer')
      if (videoDescriptionHeaderRenderer) {
        videoData.channelId = videoDescriptionHeaderRenderer.channelNavigationEndpoint.browseEndpoint.browseId
        videoData.user = videoDescriptionHeaderRenderer.channelNavigationEndpoint.browseEndpoint.canonicalBaseUrl.slice(1)
        videoData.title = videoDescriptionHeaderRenderer.title.runs.map(run => run?.text).join(' ')
        const dateText = findKey<{ simpleText: string }>(ytInitialData, 'dateText')?.simpleText.toLowerCase()
        if (dateText?.includes('streaming') || dateText?.startsWith('premiere') || dateText?.includes('premieres')) {
          videoData.chatType = 'live'
        }
        if (dateText?.includes('premiered') || dateText?.includes('streamed')) {
          videoData.chatType = 'vod'
        }
        videoData.title = videoDescriptionHeaderRenderer.title.runs.map(run => run?.text).join(' ')
      }
      const subMenuItems = findKey(ytInitialData, 'subMenuItems') as {
        continuation: {
          reloadContinuationData: {
            continuation: string
          }
        }
      }[]

      if (!subMenuItems) {
        // Bun.write('./error_initial_data_subitems.json', JSON.stringify(htmlContent, null, 1))
        return await retryConnect(videoId, eventEmitter, isVodContent, retry, {
          code: 'chat_not_found',
          message: 'Chat not found',
        })
      }
      const WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH = findKey(ytcfg, 'WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH') as {
        innertubeApiKey: string,
        device: {
          interfaceName: string,
          interfaceVersion: string
        },
      }
      continuation = subMenuItems?.[1]?.continuation.reloadContinuationData.continuation!
      clientName = WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH?.device.interfaceName
      clientVersion = WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH?.device.interfaceVersion
      apiKey = WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH?.innertubeApiKey
    }
  } catch (e) {
    // console.log(e)
    return await retryConnect(videoId, eventEmitter, isVodContent, retry, {
      code: 'chat_unavailable',
      message: 'Cannot fetch initial chat data'
    })
  }
  return {
    code: 'success',
    videoData,
    fetchChat: async function (): FetchChat {
      try {
        const bodyPost = {
          context: {
            client: {
              clientName,
              clientVersion
            }
          },
          continuation
        }
        const requestOptions = {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify(bodyPost),
        } as unknown as RequestInit

        const fetchMessages = await fetch(`https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${apiKey}&prettyPrint=false&hl=en&persist_hl=1`, requestOptions)
        const messageData = await fetchMessages.json() as Object
        const nextContinuation = findKey<string>(messageData, ('continuation'))
        const status = findKey<string | undefined>(messageData, 'status')
        if (status == 'PERMISSION_DENIED') {
          return {
            code: 'permission_denied',
            error: 'No permission to get the chat, maybe the video was private or was taken down by youtube'
          }
        }
        if (!nextContinuation) {
          return {
            code: 'continuation_not_found',
            error: 'Cannot get chat continuation'
          }
        }
        const actions = findKey(messageData, 'actions') as Object[]
        continuation = nextContinuation

        return {
          code: 'success',
          videoData,
          actions
        }
      } catch (err) {
        return { code: 'fetch_error', error: err }
      }
    }
  }

}