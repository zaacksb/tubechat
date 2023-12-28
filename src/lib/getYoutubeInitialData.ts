import { findKey, getStr } from "./utils"
import type { ISendLiveChatMessageEndpoint, IYoutubeInitialData, IYoutubeInitialDataResponse, IYoutubeInitialDataResponseError } from "../types/Types";


export async function getYoutubeInitialData(videoId: string, cookies: string = ""): Promise<IYoutubeInitialDataResponse | IYoutubeInitialDataResponseError> {
  let error = 0
  let messageError = ""
  try {
    const headers = {
      'Accept-Language': 'pt-BR',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 OPR/100.0.0.0',
      "Cookies": cookies
    }
    const responseData = await fetch(`https://www.youtube.com/live_chat?is_popout=1&v=${videoId}`, {
      headers
    })
    const responseText = await responseData.text()
    if (responseText.includes("search-button")) {
      error = 1
    }
    const apiKey = getStr(responseText, 'INNERTUBE_API_KEY":"', '"')
    const ytInitialDataText = getStr(responseText, `window["ytInitialData"] = `, `;</script>`)
    const ytInitialData = JSON.parse(ytInitialDataText) as IYoutubeInitialData
    const endedEvent = ytInitialData.contents?.messageRenderer?.text?.runs[0]?.text || ""
    if (endedEvent) {
      error = 2
      messageError = endedEvent
    }
    const [clientName, clientVersion] = ytInitialData.responseContext.serviceTrackingParams[0].params
    const [loggedIn] = ytInitialData.responseContext.serviceTrackingParams[1].params
    const [_chatMain, chatAll] = ytInitialData.contents.liveChatRenderer.header.liveChatHeaderRenderer.viewSelector.sortFilterSubMenuRenderer.subMenuItems
    const continuation = chatAll.continuation.reloadContinuationData.continuation
    const sendLiveChatMessageEndpoint = findKey(ytInitialData, "sendLiveChatMessageEndpoint") as ISendLiveChatMessageEndpoint
    return {
      code: "success",
      clientName: clientName.value,
      clientVersion: clientVersion.value,
      loggedIn: loggedIn.value || "0",
      continuation: continuation,
      params: sendLiveChatMessageEndpoint?.params || "",
      apiKey
    }
  } catch (err) {
    if (error == 0) {
      return {
        code: "error",
        message: "Unknown fetch error"
      }
    }
    if (error = 1) {
      return {
        code: "chat_not_found",
        message: "Cannot find stream chat"
      }
    }
    if (error = 2) {
      return {
        code: "ended_event",
        message: messageError
      }
    }
  }
  return {
    code: "error",
    message: "Unknown error"
  }
}


type VideoFormats = {
  itag: number
  url: URL
  mimeType: string
  bitrate: number
  width: number
  height: number
  lastModified: string
  contentLength: string
  initRange?: {
    start: string
    end: string
  },
  indexRange?: {
    start: string
    end: string
  },
  quality: "tiny" | "small" | "medium" | "hd720" | "hd1080" | "large"
  fps: number
  qualityLabel: "144p" | "240p" | "360p" | "480p" | "720p" | "720p60" | "1080p60"
  projectionType: "RECTANGULAR",
  averageBitrate: number,
  approxDurationMs: string
  colorInfo: {
    primaries: string
    transferCharacteristics: string
    matrixCoefficients: string
  }
}

type FetchVideo = {
  liveIn?: boolean
  status: "OK" | "ERROR"
  reason?: string
  channelId: string
  userIdYT: string
  author: string
  ownerProfileUrl: string
  videoId: string
  isLiveContent: boolean
  isUnlisted: boolean
  isPrivate: boolean
  duration: number
  title: string
  views: number
  category: {
    image: string
    name: string
    id: string
  }
  publishDate: string
  uploadDate: string
  shortDescription: string
  keywords: string[]
  thumbnails: {
    url: URL
    width: number
    height: number
  }[]
  formats: VideoFormats[]
  adaptiveFormats: VideoFormats[]
  audioQuality?: "AUDIO_QUALITY_LOW" | "AUDIO_QUALITY_MEDIUM" | "AUDIO_QUALITY_LOW"
  audioSampleRate: string
  audioChannels: number
  highReplication?: true,
  loudnessDb?: number
  baseScript: URL
  isLive?: true
  live?: {
    viewers: number
    isLiveNow: boolean
    startTimestamp: Date
    expiresInSeconds: string
    dashManifestUrl: URL
    hlsManifestUrl: URL
    latencyClass: string,
    isLowLatencyLiveStream: boolean
  }
}
export type FetchError = {
  error?: string,
  code?: 'network_error'
}

export default async function fetchVideo(userId: string): Promise<FetchVideo & FetchError | Partial<FetchVideo & FetchError>> {
  let fetchVideoData
  try {
    fetchVideoData = await fetch(`https://www.youtube.com/@${userId}/live`, { cache: "no-cache" })
  } catch (e) {
    return {
      error: 'fetch Error',
      code: 'network_error'
    }
  }

  const videoResponseRaw = await fetchVideoData.text()
  let ytInitialPlayerResponse
  const videoId = getStr(videoResponseRaw, 'https://www.youtube.com/embed/', '">')
  try {
    ytInitialPlayerResponse = JSON.parse(getStr(videoResponseRaw, `var ytInitialPlayerResponse = `, ";</script>"))
  } catch (e) {
    try {
      ytInitialPlayerResponse = JSON.parse(getStr(videoResponseRaw, `var ytInitialPlayerResponse = `, ";var head"))
    } catch {
      return {
        liveIn: false,
        videoId,
        status: 'ERROR',
        reason: 'Channel is Offline'
      }

    }
  }
  const ytInitialData = JSON.parse(getStr(videoResponseRaw, 'var ytInitialData = ', ';</script>'))
  const { status, reason, messages } = ytInitialPlayerResponse.playabilityStatus
  if (reason || messages) {
    return ytInitialPlayerResponse.playabilityStatus
  }

  const storyboardSpec = ytInitialPlayerResponse?.storyboards?.playerStoryboardSpecRenderer?.spec
  const duration = ytInitialPlayerResponse?.videoDetails?.lengthSeconds

  const { title, shortDescription, channelId, thumbnail: { thumbnails }, viewCount, author, lengthSeconds, isLiveContent, isLive, isPrivate, latencyClass, keywords, isLowLatencyLiveStream } = ytInitialPlayerResponse.videoDetails
  const { uploadDate, ownerProfileUrl, isUnlisted, category: categoryName, publishDate, liveBroadcastDetails, } = ytInitialPlayerResponse.microformat.playerMicroformatRenderer
  const { formats, adaptiveFormats, expiresInSeconds, dashManifestUrl, hlsManifestUrl } = ytInitialPlayerResponse.streamingData
  const category_richMetadataRenderer = findKey(ytInitialData, 'richMetadataRenderer')
  const category = {
    id: '0',
    name: categoryName,
    image: 'https://yt3.ggpht.com/QqoTjrpKRDMfGFPYpgIaTmHkbQ6Lk-brN77OxCYwl0jTtluavivXDdd4lR2wQsr_hcIggw=s136-w136-h136-c-k-c0x00ffffff-no-nd-rj'
  }
  const viewers = Number(findKey(ytInitialData, 'originalViewCount'))
  if (category_richMetadataRenderer) {
    const categoryThumbs = findKey(category_richMetadataRenderer, 'thumbnails')
    const categoryThumbnail = categoryThumbs.pop().url
    const categoryName = findKey(findKey(category_richMetadataRenderer, 'title'), 'simpleText').concat(' ') + findKey(findKey(category_richMetadataRenderer, 'subtitle'), 'simpleText')
    if (categoryName) category.name = categoryName
    if (categoryThumbnail) category.image = categoryThumbnail
  }
  const live = {
    ...liveBroadcastDetails,
    viewers,
    expiresInSeconds,
    dashManifestUrl,
    hlsManifestUrl,
    latencyClass,
    isLowLatencyLiveStream
  }
  const baseScript = `https://www.youtube.com/s/player/${getStr(videoResponseRaw, '/s/player/', '"')}`
  const userIdYT = ownerProfileUrl.split("/").pop()


  return {
    status,
    channelId,
    userIdYT,
    author,
    ownerProfileUrl,
    isLive,
    isLiveContent,
    isUnlisted,
    isPrivate,
    videoId,
    duration: Number(lengthSeconds),
    title,
    views: Number(viewCount),
    category,
    keywords,
    thumbnails,
    shortDescription,
    publishDate,
    uploadDate,
    ...(isLive && { live }),
    baseScript,
    formats,
    adaptiveFormats
  }
}