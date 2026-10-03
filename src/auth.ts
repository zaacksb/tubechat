/** Optional login for write/moderation actions (send, vote, delete, timeout, ban).
 *
 *  Reading chat stays anonymous. Auth is lazy: only write methods require it.
 *  The user pastes ONE string (Cookie header from DevTools, 20s recipe in README).
 *  Everything else (SAPISIDHASH trio, DATASYNC_ID) is derived automatically.
 */

// Minimal sync SHA1 (keeps browser bundles working without node:crypto).
function sha1Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const ml = bytes.length * 8;
  const withOne = new Uint8Array(bytes.length + 1);
  withOne.set(bytes);
  withOne[bytes.length] = 0x80;
  let len = withOne.length;
  while (len % 64 !== 56) len++;
  const padded = new Uint8Array(len + 8);
  padded.set(withOne);
  const view = new DataView(padded.buffer);
  // 64-bit big-endian length (high bits zero for realistic inputs)
  view.setUint32(len + 4, ml >>> 0, false);
  view.setUint32(len, Math.floor(ml / 0x100000000), false);

  let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
  const w = new Uint32Array(80);
  const rotl = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
    for (let i = 16; i < 80; i++) {
      w[i] = rotl(w[i - 3]! ^ w[i - 8]! ^ w[i - 14]! ^ w[i - 16]!, 1);
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f: number, k: number;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
      else { f = b ^ c ^ d; k = 0xCA62C1D6; }
      const tmp = (rotl(a, 5) + f + e + k + w[i]!) >>> 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = tmp;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  return [h0, h1, h2, h3, h4].map(x => x.toString(16).padStart(8, '0')).join('');
}

export const YOUTUBE_ORIGIN = 'https://www.youtube.com';

/** Fallback innertube client version (overridden per session from ytcfg). */
export const DEFAULT_CLIENT_VERSION = '2.20260930.00.00';

export class AuthRequiredError extends Error {
  constructor(action = 'this action') {
    super(
      `[tubechat] Login required for ${action}.\n` +
      `Paste your Cookie (20s recipe): open the live chat in Chrome (logged in) -> F12 -> Network -> click a "get_live_chat" request -> copy the "Cookie" header value -> new TubeChat({ auth: { cookie: "..." } }).`
    );
    this.name = 'AuthRequiredError';
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('[tubechat] Session expired (YouTube rotated session cookies). Copy a fresh "Cookie" header from DevTools and update auth.cookie.');
    this.name = 'SessionExpiredError';
  }
}

export class ModActionError extends Error {
  constructor(message: string) {
    super(`[tubechat] Moderation refused: ${message}`);
    this.name = 'ModActionError';
  }
}

export interface CookieMap extends Record<string, string> { }

/** Parse a "Cookie" header value (or document.cookie) into a name->value map. */
export function parseCookieString(cookie: string): CookieMap {
  const map: CookieMap = {};
  let src = (cookie || '').trim().replace(/^Cookie:\s*/i, '');
  if ((src.startsWith('"') && src.endsWith('"')) || (src.startsWith("'") && src.endsWith("'"))) {
    src = src.slice(1, -1);
  }
  for (const part of src.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) map[name] = value;
  }
  return map;
}

function sidHash(sid: string, datasyncId: string, ts: string, origin = YOUTUBE_ORIGIN): string {
  return sha1Hex(`${datasyncId} ${ts} ${sid} ${origin}`);
}

/** Build the triple Authorization header. Recomputed per request (fresh ts). */
export function buildAuthorization(cookie: CookieMap, datasyncId: string, ts: number = Math.floor(Date.now() / 1000)): string {
  const t = String(ts);
  const parts: string[] = [];
  const triple: [string, string][] = [
    ['SAPISIDHASH', cookie['SAPISID'] || ''],
    ['SAPISID1PHASH', cookie['__Secure-1PAPISID'] || ''],
    ['SAPISID3PHASH', cookie['__Secure-3PAPISID'] || ''],
  ];
  for (const [scheme, sid] of triple) {
    if (!sid) continue;
    parts.push(`${scheme} ${t}_${sidHash(sid, datasyncId, t)}_u`);
  }
  return parts.join(' ');
}

export interface AuthHeadersOptions {
  cookie: CookieMap | string
  datasyncId: string
  clientName?: string
  clientVersion?: string
  visitorData?: string
  referer?: string
  userAgent?: string
}

export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36';

/** Full header set for youtubei write calls (mirrors the web client). */
export function buildAuthHeaders(opts: AuthHeadersOptions): Record<string, string> {
  const cookieMap = typeof opts.cookie === 'string' ? parseCookieString(opts.cookie) : opts.cookie;
  const cookieHeader = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');
  return {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Authorization': buildAuthorization(cookieMap, opts.datasyncId),
    'X-Goog-AuthUser': '0',
    ...(opts.visitorData && { 'X-Goog-Visitor-Id': opts.visitorData }),
    'X-Origin': YOUTUBE_ORIGIN,
    'X-Youtube-Client-Name': opts.clientName || '1',
    'X-Youtube-Client-Version': opts.clientVersion || DEFAULT_CLIENT_VERSION,
    'X-Youtube-Bootstrap-Logged-In': 'true',
    'Origin': YOUTUBE_ORIGIN,
    ...(opts.referer && { 'Referer': opts.referer }),
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': opts.userAgent || DEFAULT_USER_AGENT,
    'Cookie': cookieHeader,
  };
}

/** True when a youtubei response indicates a dead/anonymous session. */
export function isLoggedOutResponse(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (data?.mainAppWebResponseContext?.loggedOut === true) return true;
  const services = data?.responseContext?.serviceTrackingParams;
  if (Array.isArray(services)) {
    for (const s of services) {
      if (s?.service === 'GFEEDBACK' || s?.service === 'GUIDED_HELP') {
        for (const p of (s?.params || [])) {
          if (p?.key === 'logged_in' && p?.value === '0') return true;
        }
      }
    }
  }
  return false;
}

/** Surface server toasts (e.g. "You cannot moderate yourself.") as errors. */
export function throwIfServerToast(data: any): void {
  const actions = data?.actions;
  if (!Array.isArray(actions)) return;
  for (const a of actions) {
    const runs = a?.liveChatAddToToastAction?.item?.notificationTextRenderer?.successResponseText?.runs
      || a?.liveChatAddToToastAction?.item?.notificationTextRenderer?.errorResponseText?.runs;
    if (Array.isArray(runs) && runs.length > 0) {
      const text = runs.map((r: any) => r?.text || '').join('').trim();
      if (text) throw new ModActionError(text);
    }
  }
}
