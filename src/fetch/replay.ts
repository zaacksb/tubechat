import { DEFAULT_USER_AGENT, buildAuthHeaders, parseCookieString } from '../auth';
import { buildInnertubeContext } from './send';
import type { VideoData } from './chat';
import { findKey, getStr, sleep } from '../utils';

export interface ReplayBootstrap {
  videoData: VideoData
  clientName: string
  clientVersion: string
  datasyncId: string
  visitorData?: string
  continuation: string
  /** Video duration in seconds (from videoDetails), when available. */
  durationSec?: number
}

export interface ReplayPage {
  actions: Object[]
  /** Per-action video offset in ms (from replayChatItemAction.videoOffsetTimeMsec),
   *  aligned with `actions`; null when the server didn't provide one. */
  offsets: (number | null)[]
  continuation?: string
  timeoutMs?: number
}

/** Extract the JSON object following `marker` via brace matching.
 *  Safer than end-marker slicing: payloads may contain '</script>' inside
 *  strings, and logged-in pages are larger/differently shaped. */
function extractJsonObject(html: string, marker: string): string | undefined {
  const i = html.indexOf(marker);
  if (i < 0) return undefined;
  const start = html.indexOf('{', i + marker.length);
  if (start < 0) return undefined;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let p = start; p < html.length; p++) {
    const c = html[p];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) return html.slice(start, p + 1);
      }
    }
  }
  return undefined;
}

/** Watch page headers, with session cookie when logged in (members-only VODs). */
function authedGetHeaders(headers?: HeadersInit, customHeaders?: HeadersInit, cookie?: string): Record<string, string> {
  const merged: Record<string, string> = { 'User-Agent': DEFAULT_USER_AGENT };
  const push = (init?: HeadersInit) => {
    if (!init) return;
    if (Array.isArray(init)) {
      for (const [k, v] of init) merged[String(k).toLowerCase()] = String(v);
    } else if (typeof (init as any).forEach === 'function') {
      (init as Headers).forEach((v, k) => { merged[String(k).toLowerCase()] = String(v); });
    } else {
      for (const [k, v] of Object.entries(init)) merged[String(k).toLowerCase()] = String(v);
    }
  };
  push(headers);
  push(customHeaders);
  if (cookie) {
    merged['cookie'] = Object.entries(parseCookieString(cookie)).map(([k, v]) => `${k}=${v}`).join('; ');
  }
  return merged;
}

/** Player videoDetails (has lengthSeconds). The watch page also contains an
 *  overlay wrapper under the same key (playerOverlayVideoDetailsRenderer,
 *  no lengthSeconds) which a naive first-match search hits instead. */
export function findVideoDetails(root: any, videoId: string): any {
  const cands: any[] = [];
  const walk = (o: any): void => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) {
      for (const v of o) walk(v);
      return;
    }
    for (const [k, v] of Object.entries(o)) {
      if (k === 'videoDetails' && v && typeof v === 'object') cands.push(v);
      else walk(v);
    }
  };
  walk(root);
  return cands.find((c) => c?.videoId === videoId && c?.lengthSeconds)
    || cands.find((c) => c?.lengthSeconds)
    || {};
}

/** Bootstrap VOD replay chat from the watch page.
 *  The initial token lives in conversationBar.liveChatRenderer
 *  (the chat-menu reload tokens are NOT accepted by the replay endpoint). */
export async function bootstrapReplayChat(
  videoId: string,
  headers?: HeadersInit,
  customHeaders?: HeadersInit,
  cookie?: string,
): Promise<{ ok: true, bootstrap: ReplayBootstrap } | { ok: false, code: string, message: string }> {
  let htmlContent: string;
  try {
    const req = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en&persist_hl=1`, {
      headers: authedGetHeaders(headers, customHeaders, cookie),
    });
    htmlContent = (await req.text()).trim();
  } catch (e: any) {
    return { ok: false, code: 'fetch_error', message: `Cannot fetch video page: ${e?.message || e}` };
  }
  let ytcfg: any = {};
  let ytInitialData: any = {};
  try {
    ytcfg = JSON.parse(getStr(htmlContent, '{window.ytplayer={};\nytcfg.set(', '); window.ytcfg')!);
  } catch { /* ignore */ }
  try {
    ytInitialData = JSON.parse(getStr(htmlContent, 'var ytInitialData = ', ';</script>')!);
  } catch { /* ignore */ }

  const videoData = { videoId } as VideoData;
  const header = findKey<any>(ytInitialData, 'videoDescriptionHeaderRenderer');
  if (header) {
    try {
      videoData.channelId = header.channelNavigationEndpoint.browseEndpoint.browseId;
      videoData.user = header.channelNavigationEndpoint.browseEndpoint.canonicalBaseUrl.slice(1);
      videoData.title = (header.title?.runs || []).map((run: any) => run?.text).join(' ');
    } catch { /* partial metadata */ }
  }
  const dateText = (findKey<{ simpleText: string }>(ytInitialData, 'dateText')?.simpleText || '').toLowerCase();
  const conv = findKey<any>(ytInitialData, 'conversationBar')?.liveChatRenderer;
  const first = (conv?.continuations || [])[0] || {};
  const token: string | undefined = first.reloadContinuationData?.continuation;
  if (!token) {
    // No replay continuation: live now, upcoming premiere, or no chat.
    // NOTE: finished premieres ("Premiered ...") ARE downloadable (they carry
    // a token, handled above), so only the unfinished spellings count here.
    const liveNow = dateText.includes('streaming') || dateText.includes('watching now')
      || dateText.includes('started streaming') || dateText.includes('live now');
    const upcomingPremiere = !dateText.startsWith('premiered') && dateText.includes('premier');
    if (liveNow || upcomingPremiere) {
      return { ok: false, code: 'is_live', message: 'Video is live: use join() instead of downloadChat().' };
    }
    const endedText = findKey<any>(ytInitialData, 'messageRenderer')?.text?.runs
      ?.map((r: any) => r?.text || '').join('') || '';
    if (/disabled|unavailable|members only/i.test(endedText)) {
      return { ok: false, code: 'chat_disabled', message: endedText };
    }
    return { ok: false, code: 'chat_not_found', message: 'No replay chat found on this video.' };
  }
  videoData.chatType = 'vod';

  const wp = findKey<any>(ytcfg, 'WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH');
  const clientName: string = wp?.device?.interfaceName || 'WEB';
  const clientVersion: string = wp?.device?.interfaceVersion || '2.20260930.00.00';
  const datasyncRaw: string = findKey<string>(ytcfg, 'DATASYNC_ID') || '';
  const visitorMatch = htmlContent.match(/"visitorData":"([^"]+)"/);
  const details = findVideoDetails(ytInitialData, videoId);
  // Duration lives in the player response (ytInitialData only carries an
  // overlay wrapper + schema.org microdata under the same key).
  let durationSec = Number(details?.lengthSeconds || 0) || undefined;
  if (!durationSec) {
    try {
      const prRaw = extractJsonObject(htmlContent, 'var ytInitialPlayerResponse = ')
        || extractJsonObject(htmlContent, 'ytInitialPlayerResponse = ');
      if (prRaw) durationSec = Number(JSON.parse(prRaw)?.videoDetails?.lengthSeconds || 0) || undefined;
    } catch { /* ignore */ }
  }
  videoData.clientName = clientName;
  videoData.clientVersion = clientVersion;
  videoData.datasyncId = datasyncRaw.split('||')[0] || '';
  videoData.visitorData = visitorMatch?.[1];
  return {
    ok: true,
    bootstrap: {
      videoData,
      clientName,
      clientVersion,
      datasyncId: videoData.datasyncId || '',
      visitorData: videoData.visitorData,
      continuation: token,
      ...(durationSec ? { durationSec } : {}),
    },
  };
}

/** Fetch one replay page. Returns inner actions (unwrapped) + next continuation. */
export async function fetchReplayPage(
  bootstrap: ReplayBootstrap,
  continuation: string,
  headers?: HeadersInit,
  customHeaders?: HeadersInit,
  cookie?: string,
  playerOffsetMs?: number,
): Promise<{ ok: true, page: ReplayPage } | { ok: false, code: string, message: string }> {
  const context = buildInnertubeContext({
    clientName: bootstrap.clientName,
    clientVersion: bootstrap.clientVersion,
    visitorData: bootstrap.visitorData,
    videoId: bootstrap.videoData.videoId,
  });
  // Replay grafts off the watch URL (not the popout).
  (context.client as any).originalUrl = `https://www.youtube.com/watch?v=${bootstrap.videoData.videoId}`;
  ((context.client as any).mainAppWebInfo || {}).graftUrl = `https://www.youtube.com/watch?v=${bootstrap.videoData.videoId}`;
  // Session auth (members-only/private VODs). Reads honor cookies; the hash
  // is best-effort (falls back to anonymous treatment when it mismatches).
  const postHeaders = authedGetHeaders(headers, customHeaders, cookie);
  postHeaders['content-type'] = 'application/json';
  if (cookie && bootstrap.datasyncId) {
    Object.assign(postHeaders, buildAuthHeaders({
      cookie,
      datasyncId: bootstrap.datasyncId,
      clientName: bootstrap.clientName,
      clientVersion: bootstrap.clientVersion,
      visitorData: bootstrap.visitorData,
      referer: `https://www.youtube.com/watch?v=${bootstrap.videoData.videoId}`,
    }));
  }
  let res: Response;
  try {
    const body: Record<string, any> = { context, continuation };
    // Seeks the replay to an absolute player position (parallel segments).
    if (typeof playerOffsetMs === 'number' && Number.isFinite(playerOffsetMs) && playerOffsetMs > 0) {
      body.currentPlayerState = {
        videoId: bootstrap.videoData.videoId,
        playerOffsetMs: String(Math.floor(playerOffsetMs)),
      };
    }
    res = await fetch('https://www.youtube.com/youtubei/v1/live_chat/get_live_chat_replay?prettyPrint=false', {
      method: 'POST',
      headers: postHeaders,
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    return { ok: false, code: 'fetch_error', message: String(e?.message || e) };
  }
  let data: any;
  try {
    data = await res.json();
  } catch {
    return { ok: false, code: 'fetch_error', message: `HTTP ${res.status}` };
  }
  if (!res.ok) {
    return { ok: false, code: 'fetch_error', message: (data?.error?.message) || `HTTP ${res.status}` };
  }
  // Harvest the stable session datasync for subsequent authed pages.
  const ds = (data?.mainAppWebResponseContext?.datasyncId as string | undefined)?.split('||')[0];
  if (ds && /^\d{10,}$/.test(ds)) bootstrap.datasyncId = ds;
  const lcc = data?.continuationContents?.liveChatContinuation as any;
  const rawActions: Object[] = Array.isArray(lcc?.actions) ? lcc.actions : [];
  // Replay wraps items: replayChatItemAction.actions[] (plus occasional bare actions).
  const actions: Object[] = [];
  const offsets: (number | null)[] = [];
  for (const a of rawActions) {
    const wrap = (a as any)?.replayChatItemAction;
    if (wrap && Array.isArray(wrap.actions)) {
      const n = wrap.videoOffsetTimeMsec == null ? NaN : Number(wrap.videoOffsetTimeMsec);
      const off = Number.isFinite(n) ? n : null;
      for (const inner of wrap.actions) {
        actions.push(inner);
        offsets.push(off);
      }
    } else {
      actions.push(a);
      offsets.push(null);
    }
  }
  const conts = lcc?.continuations || [];
  const next = conts
    .map((c: any) => c.liveChatReplayContinuationData || c.invalidationContinuationData || c.timedContinuationData)
    .find((c: any) => c?.continuation);
  return {
    ok: true,
    page: {
      actions,
      offsets,
      ...(next?.continuation ? { continuation: next.continuation } : {}),
      ...(typeof next?.timeoutMs === 'number' ? { timeoutMs: next.timeoutMs } : {}),
    },
  };
}

/** Split a duration into N [startMs, endMs) ranges (last one open-ended). */
export function splitRanges(durationMs: number, workers: number): { startMs: number | null, endMs: number | null }[] {
  const n = Math.max(1, Math.floor(workers) || 1);
  if (n === 1 || !(durationMs > 0)) return [{ startMs: null, endMs: null }];
  const out: { startMs: number | null, endMs: number | null }[] = [];
  for (let i = 0; i < n; i++) {
    const start = Math.floor((durationMs * i) / n);
    const end = i === n - 1 ? null : Math.floor((durationMs * (i + 1)) / n);
    out.push({ startMs: i === 0 ? null : start, endMs: end });
  }
  return out;
}

/** Small delay between replay pages (be nice to the API). */
export async function replayDelay(ms: number): Promise<void> {
  if (ms > 0) await sleep(ms);
}
