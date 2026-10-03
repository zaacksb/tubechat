import { AuthRequiredError, DEFAULT_USER_AGENT, ModActionError, SessionExpiredError, buildAuthHeaders, isLoggedOutResponse, parseCookieString, throwIfServerToast } from '../auth';
import { getStr } from '../utils';

export interface WriteState {
  videoId: string
  clientName: string
  clientVersion: string
  datasyncId: string
  visitorData?: string
  cookie?: string
  sendParams?: string
  clientIdPrefix?: string
  popoutHtml?: string
  customHeaders?: HeadersInit
  globalHeaders?: HeadersInit
  /** Called when the session is detected dead (TubeChat emits 'authExpired'). */
  onAuthExpired?: () => void
}

function notifyAuthExpired(state: WriteState): void {
  try {
    state.onAuthExpired?.();
  } catch {
    // Listener errors must never break the request flow.
  }
}

function mergeHeaders(...inits: (HeadersInit | undefined)[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const init of inits) {
    if (!init) continue;
    if (Array.isArray(init)) {
      for (const [k, v] of init) out[k.toLowerCase()] = String(v);
    } else if (typeof (init as any).forEach === 'function') {
      (init as Headers).forEach((v, k) => { out[k.toLowerCase()] = String(v); });
    } else {
      for (const [k, v] of Object.entries(init)) out[k.toLowerCase()] = String(v);
    }
  }
  return out;
}

/** Full innertube client context (mirrors the WEB client). */
export function buildInnertubeContext(state: Pick<WriteState, 'clientName' | 'clientVersion' | 'visitorData' | 'videoId'>): Record<string, any> {
  const now = Date.now();
  return {
    client: {
      hl: 'en',
      gl: 'US',
      deviceMake: '',
      deviceModel: '',
      ...(state.visitorData && { visitorData: state.visitorData }),
      userAgent: `${DEFAULT_USER_AGENT},gzip(gfe)`,
      clientName: state.clientName,
      clientVersion: state.clientVersion,
      osName: 'Windows',
      osVersion: '10.0',
      originalUrl: `https://www.youtube.com/live_chat?is_popout=1&v=${state.videoId}`,
      screenPixelDensity: 1,
      platform: 'DESKTOP',
      clientFormFactor: 'UNKNOWN_FORM_FACTOR',
      screenDensityFloat: 1,
      userInterfaceTheme: 'USER_INTERFACE_THEME_DARK',
      timeZone: 'UTC',
      browserName: 'Chrome',
      browserVersion: state.clientVersion.split('.')[0] || '154',
      acceptHeader: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      screenWidthPoints: 1920,
      screenHeightPoints: 1080,
      utcOffsetMinutes: 0,
      mainAppWebInfo: {
        graftUrl: `https://www.youtube.com/live_chat?is_popout=1&v=${state.videoId}`,
        webDisplayMode: 'WEB_DISPLAY_MODE_BROWSER',
        isWebNativeShareAvailable: false,
      },
    },
    user: { lockedSafetyMode: false },
    request: { useSsl: true, internalExperimentFlags: [], consistencyTokenJars: [] },
    adSignalsInfo: {
      params: [
        { key: 'dt', value: String(now) },
        { key: 'u_tz', value: '0' },
      ],
    },
  };
}

export interface YoutubeiResult {
  status: number
  data: any
}

export async function youtubeiPost(state: WriteState, path: string, query: string, body: Record<string, any>): Promise<YoutubeiResult> {
  const url = `https://www.youtube.com/youtubei/v1/${path}?${query}`;
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'X-Youtube-Client-Name': state.clientName,
    'X-Youtube-Client-Version': state.clientVersion,
    'Origin': 'https://www.youtube.com',
    'Referer': `https://www.youtube.com/live_chat?is_popout=1&v=${state.videoId}`,
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': DEFAULT_USER_AGENT,
  };
  if (state.cookie) {
    Object.assign(baseHeaders, buildAuthHeaders({
      cookie: state.cookie,
      datasyncId: state.datasyncId,
      clientName: state.clientName,
      clientVersion: state.clientVersion,
      visitorData: state.visitorData,
      referer: `https://www.youtube.com/live_chat?is_popout=1&v=${state.videoId}`,
    }));
  }
  const headers = mergeHeaders(baseHeaders, state.globalHeaders, state.customHeaders);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    throw new Error(`[tubechat] Request failed (${path}): ${e?.message || e}`);
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (res.status === 401 || res.status === 403) {
    notifyAuthExpired(state);
    throw new SessionExpiredError();
  }
  if (data && isLoggedOutResponse(data) && state.cookie) {
    notifyAuthExpired(state);
    throw new SessionExpiredError();
  }
  if (!res.ok) {
    const msg = (data?.error?.message) || res.statusText || `HTTP ${res.status}`;
    throw new Error(`[tubechat] youtubei error (${path}): ${msg}`);
  }
  throwIfServerToast(data);
  return { status: res.status, data };
}

function requireAuth(state: WriteState, action: string): string {
  if (!state.cookie) throw new AuthRequiredError(action);
  return state.cookie;
}

/** Fetch the live_chat popout HTML to harvest send params (cached per video). */
export async function ensureSendParams(state: WriteState): Promise<{ params: string, clientIdPrefix?: string }> {
  if (state.sendParams) return { params: state.sendParams, clientIdPrefix: state.clientIdPrefix };
  requireAuth(state, 'send messages');
  const html = state.popoutHtml || await fetchPopoutHtml(state);
  const params = getStr(html, '"sendLiveChatMessageEndpoint":{"params":"', '"');
  const clientIdPrefix = getStr(html, '"clientIdPrefix":"', '"');
  if (!params) {
    // Dead sessions render loggedOut:true and no chat input; restricted chats
    // (slow/sub-only) render the input shell without send params for sessions
    // that cannot chat. Only the first case means "re-paste the cookie".
    if (/"loggedOut":\s*true/.test(html)) {
      notifyAuthExpired(state);
      throw new SessionExpiredError();
    }
    throw new Error('[tubechat] Could not find send params (chat input unavailable: slow/subscribers-only mode or no permission).');
  }
  state.sendParams = params;
  state.clientIdPrefix = clientIdPrefix || undefined;
  return { params, clientIdPrefix: state.clientIdPrefix };
}

async function fetchPopoutHtml(state: WriteState): Promise<string> {
  const headers = mergeHeaders(
    { 'User-Agent': DEFAULT_USER_AGENT },
    state.globalHeaders,
    state.customHeaders,
  );
  if (state.cookie) {
    headers['cookie'] = Object.entries(parseCookieString(state.cookie)).map(([k, v]) => `${k}=${v}`).join('; ');
  }
  const res = await fetch(`https://www.youtube.com/live_chat?is_popout=1&v=${state.videoId}&hl=en`, { headers });
  return await res.text();
}

export function randomClientId(prefix?: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let rand = '';
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && (crypto as any).getRandomValues) {
    (crypto as any).getRandomValues(bytes);
    for (const b of bytes) rand += chars[b! % 64];
  } else {
    for (let i = 0; i < 16; i++) rand += chars[Math.floor(Math.random() * 64)];
  }
  return `${prefix || 'C'}${rand}`;
}

/** Post a chat message (<= 200 chars). Returns the echoed message id. */
export async function sendChatMessage(state: WriteState, text: string): Promise<{ id: string, data: any, timeoutMs?: number }> {
  requireAuth(state, 'send messages');
  const clean = (text || '').slice(0, 200);
  if (!clean) throw new Error('[tubechat] Message is empty.');
  const { params } = await ensureSendParams(state);
  const body = {
    context: buildInnertubeContext(state),
    params,
    clientMessageId: randomClientId(state.clientIdPrefix),
    richMessage: { textSegments: [{ text: clean }] },
  };
  const { data } = await youtubeiPost(state, 'live_chat/send_message', 'prettyPrint=false', body);
  const item = data?.actions?.[0]?.addChatItemAction?.item?.liveChatTextMessageRenderer;
  // Slow-mode feedback: server returns the cooldown + optional error text.
  const timeoutMs = data?.timeoutDurationUsec !== undefined ? Math.round(Number(data.timeoutDurationUsec) / 1000) : undefined;
  if (!item?.id) {
    const errText = typeof data?.errorMessage === 'string'
      ? data.errorMessage
      : (data?.errorMessage?.simpleText || data?.errorMessage?.runs?.map((r: any) => r?.text || '').join('') || '');
    if (errText) {
      throw new ModActionError(errText);
    }
    throw new Error('[tubechat] Send failed (no message echoed).');
  }
  return { id: item.id, data, ...(timeoutMs ? { timeoutMs } : {}) };
}

/** Run a moderation action with harvested params (remove/timeout/hide). */
export async function moderateWithParams(state: WriteState, params: string): Promise<any> {
  requireAuth(state, 'moderation actions');
  if (!params) throw new Error('[tubechat] Missing moderation params (message was received before moderation harvest or params expired).');
  const body = { context: buildInnertubeContext(state), params };
  const { data } = await youtubeiPost(state, 'live_chat/moderate', 'prettyPrint=false', body);
  return data;
}

/** Vote on a poll choice with harvested params. */
export async function voteWithParams(state: WriteState, params: string): Promise<any> {
  requireAuth(state, 'vote in polls');
  if (!params) throw new Error('[tubechat] Missing vote params (use choices[].params from the "poll" event).');
  const body = { context: buildInnertubeContext(state), params };
  const { data } = await youtubeiPost(state, 'live_chat/send_live_chat_vote', 'prettyPrint=false', body);
  return data;
}

/** Read-only: fetch the full context menu of a message (discovers available actions). */
export async function fetchMessageMenu(state: WriteState, contextMenuParams: string): Promise<any> {
  requireAuth(state, 'read the context menu');
  if (!contextMenuParams) throw new Error('[tubechat] Missing context menu params.');
  const body = { context: buildInnertubeContext(state) };
  const { data } = await youtubeiPost(
    state,
    'live_chat/get_item_context_menu',
    `params=${encodeURIComponent(contextMenuParams)}&pbj=1&prettyPrint=false`,
    body
  );
  return data?.liveChatItemContextMenuSupportedRenderers?.menuRenderer?.items || [];
}
