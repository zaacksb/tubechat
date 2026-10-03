import { DEFAULT_CLIENT_VERSION, DEFAULT_USER_AGENT, buildAuthHeaders } from '../auth'
import { buildInnertubeContext } from './send'
import { TubeChat } from '../TubeChat'
import { VideoDescriptionHeaderRenderer, VideoPrimaryInfoRenderer } from '../types'
import { findKey, getStr, sleep } from '../utils'

export type VideoData = {
  videoId: string
  user: string
  chatType: 'vod' | 'live'
  channelId: string
  title: string
  clientName?: string
  clientVersion?: string
  datasyncId?: string
  visitorData?: string
}

export type FetchChat = Promise<{
  code: 'success',
  videoData: VideoData,
  actions: Object[]
  timeoutMs?: number
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

function extractVisitorData(html: string): string | undefined {
  const m = html.match(/"visitorData":"([^"]+)"/);
  return m?.[1];
}

function extractDatasyncId(ytcfg: any): string {
  const raw = findKey<string>(ytcfg, 'DATASYNC_ID') || '';
  return raw.split('||')[0] || '';
}

export interface PopoutInitial {
  continuation?: string
  timeoutMs?: number
  actions: Object[]
  html: string
  /** Stable session datasync (for write auth hashes), when logged in. */
  datasyncId?: string
  /** Filter reload tokens by chat mode ('live' = unfiltered, 'top' = filtered). */
  filterTokens?: { live?: string, top?: string }
  ended: boolean
  endedMessage?: string
}

/** Stable (per-session) datasync id embedded in logged-in pages.
 *  Watch-page ytcfg only carries a short per-load token that youtubei
 *  rejects in auth hashes. */
export function extractStableDatasync(html: string): string {
  const patterns = [
    /\\"DATASYNC_ID\\":\\"(\d{10,})/,
    /\\"datasyncId\\":\\"(\d{10,})/,
    /\\"syncId\\":\\"(\d{10,})/,
    /"DATASYNC_ID":"(\d{10,})/,
    /"datasyncId":"(\d{10,})/,
    /"syncId":"(\d{10,})/,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1];
  }
  return '';
}

/** Fetch live_chat popout HTML and extract the live continuation + first actions. */
export async function fetchPopoutInitial(videoId: string, headers: HeadersInit | undefined, cookie?: string): Promise<PopoutInitial> {
  const merged: Record<string, string> = { 'User-Agent': DEFAULT_USER_AGENT };
  if (headers) {
    for (const [k, v] of Object.entries(headers as Record<string, string>)) merged[k] = String(v);
  }
  if (cookie) merged['cookie'] = cookie;
  // hl=en pins English menu titles (Top/Live chat); extractFilterTokens
  // still tolerates other locales as fallback.
  const req = await fetch(`https://www.youtube.com/live_chat?is_popout=1&v=${videoId}&hl=en`, { headers: merged });
  const html = await req.text();
  const empty: PopoutInitial = { actions: [], html, ended: false };
  const raw = getStr(html, 'window["ytInitialData"] = ', ';</script>');
  if (!raw) return { ...empty, ended: true, endedMessage: 'Chat not found' };
  let initial: any;
  try {
    initial = JSON.parse(raw);
  } catch {
    return { ...empty, ended: true, endedMessage: 'Chat not found' };
  }
  // Ended streams render a messageRenderer instead of the chat.
  const endedText = initial?.contents?.messageRenderer?.text?.runs?.map((r: any) => r?.text || '').join('') || '';
  if (endedText) return { ...empty, ended: true, endedMessage: endedText };
  const live = initial?.contents?.liveChatRenderer;
  if (!live) return { ...empty, ended: true, endedMessage: 'Chat not found' };
  const first = (live.continuations || [])[0] || {};
  const cont = first.invalidationContinuationData || first.timedContinuationData || {};
  return {
    continuation: cont.continuation,
    timeoutMs: typeof cont.timeoutMs === 'number' ? cont.timeoutMs : undefined,
    actions: Array.isArray(live.actions) ? live.actions : [],
    html,
    datasyncId: extractStableDatasync(html) || undefined,
    filterTokens: extractFilterTokens(live),
    ended: false,
  };
}

/** Reload tokens per chat filter. Titles are locale-dependent
 *  ("Top chat"/"Principais mensagens", "Live chat"/"Chat ao vivo"),
 *  so match by keyword with index fallback (0 = top, 1 = live). */
export function extractFilterTokens(liveChatRenderer: any): { live?: string, top?: string } | undefined {
  const items = liveChatRenderer?.header?.liveChatHeaderRenderer?.viewSelector
    ?.sortFilterSubMenuRenderer?.subMenuItems;
  if (!Array.isArray(items) || items.length === 0) return undefined;
  const tokenOf = (it: any): string | undefined =>
    it?.continuation?.reloadContinuationData?.continuation || undefined;
  const isLiveTitle = (t: unknown) => typeof t === 'string' && /live|ao vivo|en vivo|en direct/i.test(t);
  const isTopTitle = (t: unknown) => typeof t === 'string' && /top|principa|destacad|meilleur|top/i.test(t);
  let live: string | undefined;
  let top: string | undefined;
  for (const it of items) {
    const tok = tokenOf(it);
    if (!tok) continue;
    if (isLiveTitle(it?.title)) live = live || tok;
    else if (isTopTitle(it?.title)) top = top || tok;
  }
  if (!live && items.length > 1) live = live || tokenOf(items[1]);
  if (!top && items.length > 0) top = top || tokenOf(items[0]);
  if (!live && !top) return undefined;
  return { ...(live && { live }), ...(top && { top }) };
}

/** Exchange a filter reload token for a polling continuation + first actions. */
export async function exchangeFilterToken(args: {
  videoId: string
  reloadToken: string
  clientName: string | null
  clientVersion: string | undefined
  visitorData: string | undefined
  datasyncId: string
  headers?: HeadersInit
  customHeaders?: HeadersInit
  cookie?: string
}): Promise<{ continuation: string, actions: Object[], timeoutMs?: number } | null> {
  try {
    const context = buildInnertubeContext({
      clientName: args.clientName || 'WEB',
      clientVersion: args.clientVersion || DEFAULT_CLIENT_VERSION,
      visitorData: args.visitorData,
      videoId: args.videoId,
    });
    const authed: Record<string, string> = {};
    if (args.cookie && args.datasyncId) {
      Object.assign(authed, buildAuthHeaders({
        cookie: args.cookie,
        datasyncId: args.datasyncId,
        clientName: args.clientName || 'WEB',
        clientVersion: args.clientVersion || DEFAULT_CLIENT_VERSION,
        visitorData: args.visitorData,
        referer: `https://www.youtube.com/live_chat?is_popout=1&v=${args.videoId}`,
      }));
    }
    const res = await fetch('https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?prettyPrint=false', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'User-Agent': DEFAULT_USER_AGENT,
        ...args.headers as Record<string, string>,
        ...args.customHeaders as Record<string, string>,
        ...authed,
      },
      body: JSON.stringify({ context, continuation: args.reloadToken }),
    });
    const data = await res.json() as any;
    const lcc = data?.continuationContents?.liveChatContinuation;
    const next = (lcc?.continuations || [])
      .map((c: any) => c.invalidationContinuationData || c.timedContinuationData)
      .find((c: any) => c?.continuation);
    if (!next?.continuation) return null;
    return {
      continuation: next.continuation,
      actions: Array.isArray(lcc.actions) ? lcc.actions : [],
      ...(typeof next.timeoutMs === 'number' ? { timeoutMs: next.timeoutMs } : {}),
    };
  } catch {
    return null;
  }
}

export async function startConnection(videoId: string, eventEmitter: TubeChat, isVodContent = false, retry = 1): Promise<StartConnectionErrors | {
  code: 'success',
  videoData: VideoData,
  fetchChat: () => FetchChat
  popoutHtml?: string
}> {
  let continuation: string | null = null
  let clientVersion: string | null = null
  let clientName: string | null = null
  let datasyncId = ''
  let visitorData: string | undefined
  let initialActions: Object[] | null = null
  let initialTimeoutMs: number | undefined
  let popoutHtmlCache: string | undefined
  const videoData = {} as VideoData
  const video = eventEmitter.videos.get(videoId)!
  videoData.videoId = videoId
  try {
    if (!continuation && !clientVersion) {
      // Watch page is best-effort metadata (title/channel/client config).
      // Some lives (premieres, restricted layouts) omit the chat menu and
      // dateText there — liveness is decided by the popout below instead.
      let watchOk = false;
      try {
        const req = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en&persist_hl=1`, {
          headers: {
            'User-Agent': DEFAULT_USER_AGENT,
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
          try {
            videoData.channelId = videoDescriptionHeaderRenderer.channelNavigationEndpoint.browseEndpoint.browseId
            videoData.user = videoDescriptionHeaderRenderer.channelNavigationEndpoint.browseEndpoint.canonicalBaseUrl.slice(1)
            videoData.title = videoDescriptionHeaderRenderer.title.runs.map(run => run?.text).join(' ')
          } catch { /* partial metadata */ }
          const dateText = findKey<{ simpleText: string }>(ytInitialData, 'dateText')?.simpleText.toLowerCase()
          if (dateText?.includes('streaming') || dateText?.startsWith('premiere') || dateText?.includes('premieres')) {
            videoData.chatType = 'live'
          }
          if (dateText?.includes('premiered') || dateText?.includes('streamed')) {
            videoData.chatType = 'vod'
          }
        }
        const WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH = findKey(ytcfg, 'WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH') as {
          innertubeApiKey: string,
          device: {
            interfaceName: string,
            interfaceVersion: string
          },
        }
        clientName = WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH?.device.interfaceName
        clientVersion = WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH?.device.interfaceVersion
        datasyncId = extractDatasyncId(ytcfg)
        visitorData = extractVisitorData(htmlContent)
        watchOk = true;
      } catch (e) {
        // Watch page failed: keep going, the popout decides.
      }
      videoData.clientName = clientName || 'WEB'
      videoData.clientVersion = clientVersion || DEFAULT_CLIENT_VERSION
      videoData.datasyncId = datasyncId
      videoData.visitorData = visitorData
      videoData.channelId = videoData.channelId || ''
      videoData.user = videoData.user || ''
      videoData.title = videoData.title || videoId

      // Bootstrap via the popout page: its ytInitialData already carries a live
      // invalidation/timed continuation plus the first batch of actions.
      // (The watch page reloadContinuationData is rejected by get_live_chat.)
      const popout = await fetchPopoutInitial(videoId, {
        ...eventEmitter.headers,
        ...video.customHeaders
      }, eventEmitter.authCookie());
      if (popout.ended) {
        return await retryConnect(videoId, eventEmitter, isVodContent, retry, {
          code: 'chat_not_found',
          message: popout.endedMessage || 'Chat not found (stream ended or chat disabled)',
        })
      }
      if (!popout.continuation) {
        if (!watchOk) {
          return await retryConnect(videoId, eventEmitter, isVodContent, retry, {
            code: 'chat_unavailable',
            message: 'Cannot fetch initial chat data',
          })
        }
        return await retryConnect(videoId, eventEmitter, isVodContent, retry, {
          code: 'chat_not_found',
          message: 'Chat not found (live chat unavailable)',
        })
      }
      // A live continuation proves liveness even when the watch page stayed silent.
      if (!videoData.chatType) videoData.chatType = 'live';
      continuation = popout.continuation
      initialActions = popout.actions
      initialTimeoutMs = popout.timeoutMs
      popoutHtmlCache = popout.html
      if (popout.datasyncId) {
        datasyncId = popout.datasyncId
        videoData.datasyncId = popout.datasyncId
      }
      // Chat filter: exchange the filter's reload token for a polling
      // continuation (default 'live' = unfiltered). Falls back to the
      // embedded (default/top) continuation when the exchange fails.
      const wantedFilter = video.chatFilter || 'live';
      const reloadToken = wantedFilter === 'top'
        ? popout.filterTokens?.top
        : popout.filterTokens?.live;
      if (reloadToken) {
        const exchanged = await exchangeFilterToken({
          videoId,
          reloadToken,
          clientName,
          clientVersion: clientVersion || videoData.clientVersion,
          visitorData,
          datasyncId: videoData.datasyncId || datasyncId,
          headers: eventEmitter.headers,
          customHeaders: video.customHeaders,
          cookie: eventEmitter.authCookie?.(),
        });
        if (exchanged) {
          continuation = exchanged.continuation
          initialActions = exchanged.actions
          initialTimeoutMs = exchanged.timeoutMs
        }
      }
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
    popoutHtml: popoutHtmlCache,
    fetchChat: async function (): FetchChat {
      try {
        // First poll: serve the actions already embedded in the popout HTML.
        if (initialActions) {
          const seeded = initialActions;
          const seededTimeout = initialTimeoutMs;
          initialActions = null;
          return {
            code: 'success',
            videoData,
            actions: seeded,
            ...(seededTimeout ? { timeoutMs: seededTimeout } : {}),
          };
        }
        const context = buildInnertubeContext({
          clientName: clientName || 'WEB',
          clientVersion: clientVersion || videoData.clientVersion || DEFAULT_CLIENT_VERSION,
          visitorData,
          videoId,
        })
        const bodyPost = { context, continuation }
        const authedHeaders: Record<string, string> = {};
        const sessionCookie = eventEmitter.authCookie?.();
        if (sessionCookie && (videoData.datasyncId || datasyncId)) {
          Object.assign(authedHeaders, buildAuthHeaders({
            cookie: sessionCookie,
            datasyncId: videoData.datasyncId || datasyncId,
            clientName: clientName || 'WEB',
            clientVersion: clientVersion || videoData.clientVersion,
            visitorData,
            referer: `https://www.youtube.com/live_chat?is_popout=1&v=${videoId}`,
          }));
        }
        const requestOptions = {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'User-Agent': DEFAULT_USER_AGENT,
            ...eventEmitter.headers,
            ...video.customHeaders,
            ...authedHeaders
          },
          body: JSON.stringify(bodyPost),
        } as unknown as RequestInit

        const fetchMessages = await fetch(`https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?prettyPrint=false`, requestOptions)
        const messageData = await fetchMessages.json() as any
        const liveCont = messageData?.continuationContents?.liveChatContinuation as {
          continuations?: { invalidationContinuationData?: { continuation: string, timeoutMs: number }, timedContinuationData?: { continuation: string, timeoutMs: number } }[]
          actions?: Object[]
        } | undefined;
        const conts = liveCont?.continuations || [];
        const next = conts.map(c => c.invalidationContinuationData || c.timedContinuationData).find(c => c?.continuation);
        const status = findKey<string | undefined>(messageData, 'status')
        if (status == 'PERMISSION_DENIED') {
          return {
            code: 'permission_denied',
            error: 'No permission to get the chat, maybe the video was private or was taken down by youtube'
          }
        }
        if (!next?.continuation) {
          const legacyContinuation = findKey<string>(messageData, 'continuation');
          if (!legacyContinuation) {
            return {
              code: 'continuation_not_found',
              error: 'Cannot get chat continuation'
            }
          }
          continuation = legacyContinuation
        } else {
          continuation = next.continuation
        }
        const actions = (liveCont?.actions || findKey(messageData, 'actions') || []) as Object[]
        const freshDatasync = (messageData?.mainAppWebResponseContext?.datasyncId as string | undefined)?.split('||')[0];
        // Only accept stable (long numeric) ids, and never clobber one with a short per-load token.
        if (freshDatasync && /^\d{10,}$/.test(freshDatasync)) {
          videoData.datasyncId = freshDatasync;
          datasyncId = freshDatasync;
        }

        return {
          code: 'success',
          videoData,
          actions,
          ...(next?.timeoutMs ? { timeoutMs: next.timeoutMs } : {}),
        }
      } catch (err) {
        return { code: 'fetch_error', error: err }
      }
    }
  }

}
