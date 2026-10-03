import { YtChatSignaler } from 'yt-chat-signaler';
import { AuthRequiredError, DEFAULT_CLIENT_VERSION, SessionExpiredError } from './auth';
import { startConnection, type FetchChat, type StartConnectionErrors, type VideoData } from './fetch/chat';
import { bootstrapReplayChat, fetchReplayPage, splitRanges } from './fetch/replay';
import { ensureSendParams, fetchMessageMenu, moderateWithParams, sendChatMessage, voteWithParams, type WriteState } from './fetch/send';
import EventEmitter from './lib/EventEmitter';
import { parse } from './parsers';
import type { ParseResult } from './parsers';
import { TUBECHAT } from './parsers/types';
import { backoffMs, isError, mergeObjects, sleep } from './utils';


export interface AuthConfig {
  /** Full "Cookie" header value copied from DevTools (logged-in Chrome session).
   *  Only needed for write/moderation actions. Reading stays anonymous. */
  cookie: string
}

export interface ClientOptions {
  // TODO authentication with token
  intervalChat?: number
  maxRetries?: number
  headers?: HeadersInit
  signalerConnectedInterval?: number
  signalerDisconnectedInterval?: number
  useSignaler?: boolean
  auth?: AuthConfig
  /**
   * @deprecated Kept for backward compatibility only.
   * When true, pinned/banner messages are ALSO emitted as `message`
   * (the pre-1.1 behavior). New code should listen to `pinned` instead.
   */
  legacyPinnedAsMessage?: boolean
}
/** Emitted message payloads: parsed shape plus live context (always present on events). */
export type WithLiveContext<T> = T & {
  chatId: string
  reply: TUBECHAT.ReplyFn
};

export type ConnectionEvents = {
  message: [message: WithLiveContext<TUBECHAT.Msg_Common>, chatId: string, userChannel: string, VideoData: VideoData]
  superchat: [message: WithLiveContext<TUBECHAT.Msg_SuperChat>, chatId: string, userChannel: string, VideoData: VideoData]
  subgift_announce: [message: WithLiveContext<TUBECHAT.Msg_SubGift>, chatId: string, userChannel: string, VideoData: VideoData]
  subgift: [message: WithLiveContext<TUBECHAT.Msg_SubGift>, chatId: string, userChannel: string, VideoData: VideoData]
  member: [message: WithLiveContext<TUBECHAT.Msg_Sub>, chatId: string, userChannel: string, VideoData: VideoData]
  jewels: [message: WithLiveContext<TUBECHAT.Msg_Jewels>, chatId: string, userChannel: string, VideoData: VideoData]
  donation: [message: WithLiveContext<TUBECHAT.Msg_Donation>, chatId: string, userChannel: string, VideoData: VideoData]
  poll: [message: TUBECHAT.Msg_Poll, chatId: string, userChannel: string, VideoData: VideoData]
  notice: [message: TUBECHAT.Msg_Notice, chatId: string, userChannel: string, VideoData: VideoData]
  pinned: [message: WithLiveContext<TUBECHAT.Msg_Pinned>, chatId: string, userChannel: string, VideoData: VideoData]
  system: [message: TUBECHAT.SYSTEM.ChatMode, chatId: string, userChannel: string, VideoData: VideoData]
  deletedMessage: [messageId: string, chatId: string, userChannel: string, VideoData: VideoData]
  deleteUserMessages: [channelId: string, chatId: string, userChannel: string, VideoData: VideoData]
  cleared: [chatId: string, userChannel: string, VideoData: VideoData]
  dimmed: [messageId: string, chatId: string, userChannel: string, VideoData: VideoData]
  /** Emitted (alongside the rejection) when the session is detected dead during a write/check. */
  authExpired: []
};

export type ChatFilter = 'live' | 'top';

export interface DownloadChatOptions {
  headers?: HeadersInit
  /** Max emitted messages (default Infinity). */
  limit?: number
  /** Delay between pages in ms (default 50, be nice to the API). */
  delayMs?: number
  /**
   * Parallel segment workers (default 1). Splits the video by duration and
   * seeks each worker to its offset (playerOffsetMs). Event order becomes
   * completion order, but the returned array is timestamp-sorted.
   * Higher values download faster; back off if you hit rate limits.
   */
  concurrency?: number
  onProgress?: (info: { pages: number, actions: number, messages: number }) => void
}

export type DownloadChatResult =
  | { completed: true, videoData: VideoData, messages: ParseResult[], actions: number, pages: number }
  | { completed: false, error: { code: string, message: string }, videoData?: VideoData, messages: ParseResult[], actions: number, pages: number };

export type Videos = {
  videoData: VideoData
  customHeaders?: HeadersInit
  fetchChat: () => FetchChat
  isJoined: boolean
  firstFetch: boolean
  skipFirstResults: boolean
  interval: number
  popoutHtml?: string
  sendParams?: string
  clientIdPrefix?: string
  chatFilter?: ChatFilter
}




export type OtherEvents = {
  raw: [action: any]
  error: [chatId: string, message: string]
  join: [chatId: string, userChannel: string, videoData: VideoData]
  retry: [chatId: string, error: StartConnectionErrors, retry: number, maxRetries: number]
  joinError: [chatId: string, error: StartConnectionErrors]
  disconnected: [chatId: string, userChannel: string, VideoData: VideoData]
};
export type ClientEvents = ConnectionEvents & OtherEvents;

type ToTuples<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends any[] ? T[K] : T[K] extends void ? [] : [event: T[K]];
};

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, any> ? RecursivePartial<T[P]> : T[P];
};

const MAX_SEEN_IDS = 5000;

/** Events whose payloads get chatId + a bound reply() on emit. */
const REPLYABLE_EVENTS = new Set(['message', 'superchat', 'member', 'subgift', 'subgift_announce', 'jewels', 'donation', 'pinned']);


export class TubeChat extends EventEmitter<ToTuples<ClientEvents>> {
  intervalChat: number = 1000
  maxRetries: number = 4
  public headers: HeadersInit | undefined
  public videos: Map<string, Videos> = new Map()
  public signaler: YtChatSignaler | undefined;
  private signalerConnected: Map<string, boolean> = new Map();
  private isFetching: Map<string, boolean> = new Map();
  private seenIds: Map<string, Set<string>> = new Map();
  /** clientMessageId -> item id per video (resolves dimChatItemAction targets). */
  private clientIds: Map<string, Map<string, string>> = new Map();
  private fetchGen: Map<string, number> = new Map();
  /** Consecutive network failures per video (backoff only, never disconnects). */
  private fetchErrors: Map<string, number> = new Map();
  /** Consecutive failed re-bootstrap rounds per video (disconnects when exhausted). */
  private recoveryRounds: Map<string, number> = new Map();
  private signalerConnectedInterval: number;
  private signalerDisconnectedInterval: number;
  private useSignaler: boolean;
  private cookie: string | undefined;
  /** @deprecated Backward-compat: also emit pinned messages as `message`. */
  private legacyPinnedAsMessage: boolean = false;

  constructor({ intervalChat, maxRetries, headers, signalerConnectedInterval, signalerDisconnectedInterval, useSignaler, auth, legacyPinnedAsMessage }: ClientOptions = {}) {
    super()
    this.intervalChat = intervalChat || 1000
    this.maxRetries = Math.min(maxRetries || 4, 15)
    this.headers = headers
    this.useSignaler = useSignaler !== false; // Default to true if not explicitly false
    this.cookie = auth?.cookie
    this.legacyPinnedAsMessage = legacyPinnedAsMessage === true

    this.signalerConnectedInterval = Math.max(signalerConnectedInterval || 15000, 100);
    this.signalerDisconnectedInterval = Math.max(signalerDisconnectedInterval || 1000, 100);

    if (this.useSignaler) {
      this.signaler = new YtChatSignaler({ chats: [], maxReconnectWaitMs: 2000, maxReconnectAttempts: 0});
      this.signaler.start();

      this.signaler.on('data', ({ chatData }) => {
        const gen = this.fetchGen.get(chatData.chatId);
        if (gen !== undefined) this.fetchChatAndUpdate(chatData.chatId, gen);
      });

      this.signaler.on('connected', (chatData) => {
        this.signalerConnected.set(chatData.chatId, true);
      });

      this.signaler.on('reconnecting', () => {
        this.signalerConnected.forEach((_, key) => {
          this.signalerConnected.set(key, false);
        });
      });

      this.signaler.on('part', (chatData) => {
        this.signalerConnected.set(chatData.chatId, false);
      });
    }
  }

  /** Update (or set) the login cookie used for write/moderation actions. */
  setAuth(auth: AuthConfig) {
    this.cookie = auth.cookie;
  }

  /** Session cookie for authenticated bootstrap calls (internal). */
  authCookie(): string | undefined {
    return this.cookie;
  }

  private writeState(videoId: string): WriteState {
    const video = this.videos.get(videoId);
    if (!video) throw new Error(`[tubechat] Not joined: ${videoId}. Call join(videoId) first.`);
    const vd = video.videoData;
    if (!vd.datasyncId) throw new Error(`[tubechat] Missing DATASYNC_ID for ${videoId}. Leave and join again.`);
    return {
      videoId,
      clientName: vd.clientName || 'WEB',
      clientVersion: vd.clientVersion || DEFAULT_CLIENT_VERSION,
      datasyncId: vd.datasyncId || '',
      visitorData: vd.visitorData,
      cookie: this.cookie,
      customHeaders: video.customHeaders,
      globalHeaders: this.headers,
      popoutHtml: video.popoutHtml,
      sendParams: video.sendParams,
      clientIdPrefix: video.clientIdPrefix,
      onAuthExpired: () => {
        this.emit('authExpired');
      },
    };
  }

  /**
   * Watch-page DATASYNC_IDs are short per-load tokens that youtubei rejects
   * in write auth hashes; the stable session id only arrives via poll
   * responses. If we still hold a short one, run one poll cycle first so the
   * harvest updates it (also emits any pending messages).
   */
  private looksShortDatasync(datasyncId: string): boolean {
    return !/^\d{10,}$/.test(datasyncId || '');
  }

  private async readyWriteState(videoId: string): Promise<WriteState> {
    let state = this.writeState(videoId);
    if (this.cookie && this.looksShortDatasync(state.datasyncId)) {
      const gen = this.fetchGen.get(videoId);
      if (gen !== undefined) {
        await this.fetchChatAndUpdate(videoId, gen).catch(() => undefined);
        state = this.writeState(videoId);
      }
    }
    return state;
  }


  /**
 * Join a channel by name. The channel name will be normalized.
 */
  async join(videoId: string, skipFirstResults = false, options?: { headers?: HeadersInit, interval: number, chatFilter?: ChatFilter }): Promise<{ joined: true, videoData: Videos } | { joined: false, error: StartConnectionErrors }> {
    if (this.videos.has(videoId)) {
      return { joined: true, videoData: this.videos.get(videoId)! }
    }
    this.updateVideoData(videoId, {
      isJoined: false,
      firstFetch: true,
      customHeaders: options?.headers,
      skipFirstResults,
      interval: options?.interval || this.intervalChat,
      chatFilter: options?.chatFilter || 'live',
    })
    const chatIsAlive = await this.chatIsAlive(videoId)
    if (chatIsAlive == true) {
      if (this.useSignaler && this.signaler) {
        this.signaler.join(videoId);
      }
      return { joined: true, videoData: this.videos.get(videoId)! }
    } else if (chatIsAlive.code == "vod_chat_not_supported" || chatIsAlive.code == 'chat_not_found') {
      this.leave(videoId)
    }
    this.videos.delete(videoId)
    return { joined: false, error: chatIsAlive }
  }

  private async chatIsAlive(videoId: string): Promise<true | StartConnectionErrors> {
    const connection = await startConnection(videoId, this)
    if (connection.code == 'success') {
      if (connection.videoData.chatType === 'vod') {
        this.emit('joinError', videoId, { code: 'vod_chat_not_supported', message: 'Chat from previous broadcasts or previous premieres are not yet available' })
        return {
          code: 'vod_chat_not_supported',
          message: ''
        }
      }
      this.updateVideoData(videoId, {
        isJoined: true,
      })
      // Direct reference (NOT via mergeObjects): fetchChat's closure mutates
      // this same object (continuation, datasyncId harvest), so the stored
      // entry must alias it instead of holding a detached copy.
      const entry = this.videos.get(videoId)!;
      entry.videoData = connection.videoData;
      entry.fetchChat = connection.fetchChat;
      entry.popoutHtml = connection.popoutHtml;
      this.seenIds.set(videoId, new Set());
      this.clientIds.set(videoId, new Map());
      this.fetchErrors.delete(videoId);
      this.recoveryRounds.delete(videoId);
      this.fetchGen.set(videoId, (this.fetchGen.get(videoId) || 0) + 1);
      this.recursiveFetchChat(videoId)
      this.emit('join', videoId, connection?.videoData?.user, connection?.videoData)
      return true

    }
    this.emit('joinError', videoId, connection)
    return connection
  }

  private updateVideoData(videoId: string, data: RecursivePartial<Videos>) {
    this.videos.set(videoId, {
      ...mergeObjects(this.videos.get(videoId) || {} as Videos, data)
    })
  }

  async recursiveFetchChat(videoId: string) {
    const gen = this.fetchGen.get(videoId);
    if (gen === undefined) return; // left
    const next = await this.fetchChatAndUpdate(videoId, gen);
    this.scheduleNextFetch(videoId, gen, next);
  }

  private scheduleNextFetch(videoId: string, gen: number, next?: { timeoutMs?: number, retryInMs?: number }) {
    if (this.fetchGen.get(videoId) !== gen) return; // left meanwhile
    if (!this.videos.has(videoId)) return;
    let interval: number;
    if (next?.retryInMs !== undefined) {
      interval = Math.min(Math.max(next.retryInMs, 500), 60000);
    } else if (typeof next?.timeoutMs === 'number' && Number.isFinite(next.timeoutMs)) {
      interval = Math.min(Math.max(next.timeoutMs, 1000), 30000);
    } else if (this.useSignaler && this.signaler) {
      const isConnected = this.signalerConnected.get(videoId);
      interval = isConnected ? this.signalerConnectedInterval : this.signalerDisconnectedInterval;
    } else {
      interval = this.intervalChat;
    }
    setTimeout(() => {
      if (this.fetchGen.get(videoId) !== gen) return;
      if (!this.videos.has(videoId)) return;
      this.recursiveFetchChat(videoId);
    }, interval);
  }

  /**
   * Silent re-bootstrap: fetch a fresh continuation without emitting
   * join/disconnected. Seen message ids are kept, so no duplicates.
   * Returns 'recovered' | 'retry' (transient, keep polling) | 'dead' (chat is gone).
   */
  private async rebootstrap(videoId: string, gen: number): Promise<'recovered' | 'retry' | 'dead'> {
    if (!this.videos.has(videoId) || this.fetchGen.get(videoId) !== gen) return 'retry';
    let connection: Awaited<ReturnType<typeof startConnection>>;
    try {
      connection = await startConnection(videoId, this);
    } catch {
      return 'retry';
    }
    if (!this.videos.has(videoId) || this.fetchGen.get(videoId) !== gen) return 'retry';
    if (connection.code !== 'success') {
      switch (connection.code) {
        case 'chat_not_found':
        case 'vod_chat_not_supported':
        case 'chat_disabled':
        case 'permission_denied':
          return 'dead';
        default:
          return 'retry';
      }
    }
    if (connection.videoData.chatType === 'vod') return 'dead';
    // Same aliasing requirement as chatIsAlive: the fetchChat closure mutates
    // connection.videoData in place (datasync harvest), so store the reference.
    const entry = this.videos.get(videoId);
    if (!entry) return 'retry';
    entry.videoData = connection.videoData;
    entry.fetchChat = connection.fetchChat;
    entry.popoutHtml = connection.popoutHtml;
    return 'recovered';
  }

  private bumpErrors(videoId: string): number {
    const n = (this.fetchErrors.get(videoId) || 0) + 1;
    this.fetchErrors.set(videoId, n);
    return n;
  }

  /** Emit a parsed action on its event (shared by live polling and VOD download). */
  private emitParsed(videoId: string, entry: Videos, msg: any, formated: ParseResult, dimMap?: Map<string, string>): void {
    const videoData = entry.videoData;
    // Context for reply() without videoId: chat id + bound sender.
    this.attachMessageContext(videoId, formated.event, formated.data);
    // Remember clientMessageId -> item id for dim resolution.
    // Download path passes its own map; live path records on the shared one.
    const actionClientId = msg?.addChatItemAction?.clientId;
    const parsedId = (formated.data as any)?.id;
    if (typeof actionClientId === 'string' && actionClientId && typeof parsedId === 'string' && parsedId) {
      let cmap = dimMap;
      if (!cmap) {
        cmap = this.clientIds.get(videoId);
        if (!cmap) {
          cmap = new Map<string, string>();
          this.clientIds.set(videoId, cmap);
        }
      }
      cmap.set(actionClientId, parsedId);
      if (cmap.size > MAX_SEEN_IDS) {
        const first = cmap.keys().next().value;
        if (first !== undefined) cmap.delete(first);
      }
    }
    const commonArgs = [videoData.videoId, videoData.user, videoData] as const;
    switch (formated.event) {
      case 'message':
        this.emit(formated.event, formated.data as WithLiveContext<TUBECHAT.Msg_Common>, ...commonArgs);
        break;
      case 'superchat':
        this.emit(formated.event, formated.data as WithLiveContext<TUBECHAT.Msg_SuperChat>, ...commonArgs);
        break;
      case 'subgift_announce':
        this.emit(formated.event, formated.data as WithLiveContext<TUBECHAT.Msg_SubGift>, ...commonArgs);
        break;
      case 'subgift':
        this.emit(formated.event, formated.data as WithLiveContext<TUBECHAT.Msg_SubGift>, ...commonArgs);
        break;
      case 'member':
        this.emit(formated.event, formated.data as WithLiveContext<TUBECHAT.Msg_Sub>, ...commonArgs);
        break;
      case 'jewels':
        this.emit(formated.event, formated.data as WithLiveContext<TUBECHAT.Msg_Jewels>, ...commonArgs);
        break;
      case 'donation':
        this.emit(formated.event, formated.data as WithLiveContext<TUBECHAT.Msg_Donation>, ...commonArgs);
        break;
      case 'poll':
        this.emit(formated.event, formated.data, ...commonArgs);
        break;
      case 'notice':
        this.emit(formated.event, formated.data, ...commonArgs);
        break;
      case 'pinned':
        this.emit(formated.event, formated.data as WithLiveContext<TUBECHAT.Msg_Pinned>, ...commonArgs);
        if (this.legacyPinnedAsMessage) {
          this.emit('message', formated.data as WithLiveContext<TUBECHAT.Msg_Common>, ...commonArgs);
        }
        break;
      case 'system':
        this.emit(formated.event, formated.data, ...commonArgs);
        break;
      case 'deletedMessage':
        this.emit(formated.event, formated.data, ...commonArgs);
        break;
      case 'deleteUserMessages':
        this.emit(formated.event, formated.data, ...commonArgs);
        break;
      case 'cleared':
        this.emit(formated.event, ...commonArgs);
        break;
                  case 'dimmed': {
                    const resolved = (dimMap || this.clientIds.get(videoId))?.get(formated.data as string) || (formated.data as string);
                    this.emit(formated.event, resolved, ...commonArgs);
                    break;
                  }
    }
  }

  private async fetchChatAndUpdate(videoId: string, gen: number): Promise<{ timeoutMs?: number, retryInMs?: number }> {
    if (this.isFetching.get(videoId)) {
      return {};
    }
    this.isFetching.set(videoId, true);

    try {
      const videoData = this.videos.get(videoId)

      if (!videoData?.fetchChat) {
        return {}
      }
      if (videoData?.fetchChat) {
        try {
          const chat = await videoData.fetchChat()
          if (chat && chat?.code == 'success' && chat?.actions) {
            this.fetchErrors.delete(videoId);
            this.recoveryRounds.delete(videoId);
            const actions = chat.actions
            let seen = this.seenIds.get(videoId) || new Set<string>();
            actions.map((msg: any) => {
              try {
                this.emit('raw', msg)
                if (videoData.firstFetch == true && videoData.skipFirstResults == true) return
                const formated = parse(msg)
                if (formated) {
                  // Deduplicate: YouTube re-sends recent items on every poll.
                  const id = (formated.data as any)?.id;
                  if (typeof id === 'string' && id) {
                    if (seen.has(id)) return;
                    seen.add(id);
                    if (seen.size > MAX_SEEN_IDS) {
                      const trimmed = new Set<string>();
                      let skip = seen.size - MAX_SEEN_IDS;
                      for (const old of seen) {
                        if (skip > 0) { skip--; continue; }
                        trimmed.add(old);
                      }
                      seen = trimmed;
                      this.seenIds.set(videoId, seen);
                    }
                  }
                  this.emitParsed(videoId, videoData, msg, formated);
                }
              } catch (e) {
                console.error(`[tubechat] Skipping unparsable action in ${videoId}:`, e);
              }
            });
            this.updateVideoData(videoId, {
              firstFetch: false
            })
            return { timeoutMs: (chat as { timeoutMs?: number }).timeoutMs };
          } else {
            if (chat.code == 'fetch_error') {
              // Transient network failure: NEVER disconnect, back off and retry forever.
              const attempt = this.bumpErrors(videoId);
              this.emit('error', videoId, `[Fetch error] attempt ${attempt}: ${chat.error}. Retrying...`)
              return { retryInMs: backoffMs(attempt) };
            } else if (chat.code == 'continuation_not_found' || chat.code == 'permission_denied') {
              const label = chat.code == 'permission_denied' ? 'Insufficient permission' : 'Continuation not found';
              const rounds = (this.recoveryRounds.get(videoId) || 0) + 1;
              this.emit('error', videoId, `[${label}]: ${chat.error} (reconnect attempt ${rounds}/${this.maxRetries})`);
              const outcome = await this.rebootstrap(videoId, gen);
              if (!this.videos.has(videoId) || this.fetchGen.get(videoId) !== gen) return {};
              if (outcome === 'recovered') {
                this.fetchErrors.delete(videoId);
                this.recoveryRounds.delete(videoId);
                return { retryInMs: 1000 };
              }
              if (outcome === 'retry') {
                const attempt = this.bumpErrors(videoId);
                return { retryInMs: backoffMs(attempt) };
              }
              // 'dead': the chat is confirmed gone — retry a few rounds, then disconnect.
              this.recoveryRounds.set(videoId, rounds);
              if (rounds > this.maxRetries) {
                this.emit('error', videoId, `[Chat unavailable]: giving up after ${rounds} attempts (${label}).`);
                this.leave(videoId);
                return {};
              }
              return { retryInMs: backoffMs(rounds) };
            }
          }
        } catch (e) {
          if (isError(e) && e instanceof TypeError) {
            if (e.code !== "ERR_UNHANDLED_ERROR") {
              console.error(e)
            }
          }
        }
      }
    } finally {
      this.isFetching.set(videoId, false);
    }
    return {};
  }

  /**
* disconnect a channel by name. The channel name will be normalized.
*/
  async leave(videoId: string) {

    if (!this.videos.has(videoId)) {
      // TODO: Should it throw an error here?
      // throw new Error(`Not joined @${user}`);
      return;
    }
    const video = this.videos.get(videoId)
    if (video) {
      this.fetchGen.set(videoId, (this.fetchGen.get(videoId) || 0) + 1);
      this.fetchGen.delete(videoId);
      this.videos.delete(videoId)
      this.seenIds.delete(videoId);
      this.clientIds.delete(videoId);
      this.isFetching.delete(videoId);
      this.fetchErrors.delete(videoId);
      this.recoveryRounds.delete(videoId);
      if (this.useSignaler && this.signaler) {
        this.signaler.stop(videoId);
        this.signalerConnected.delete(videoId);
      }
      this.emit('disconnected', videoId, video?.videoData?.user, video?.videoData)

    }
  }

  private resolveModParams(target: TUBECHAT.Msg_Common | TUBECHAT.Msg_Jewels | string, slot: 'remove' | 'timeout' | 'hide' | 'contextMenu'): string {
    if (typeof target === 'string') return target;
    const mod = (target as TUBECHAT.Msg_Common).moderation;
    const params = mod?.[slot];
    if (!params) {
      throw new Error(`[tubechat] No ${slot} params on this message (it was received before moderation harvest, params expired, or your session is not moderator).`);
    }
    return params;
  }

  /**
   * Send a message to a live chat. Messages are truncated to 200 characters.
   * Requires login: new TubeChat({ auth: { cookie } }).
   */
  async say(videoId: string, message: string): Promise<{ id: string, timeoutMs?: number }> {
    if (!this.cookie) throw new AuthRequiredError('send messages');
    const state = await this.readyWriteState(videoId);
    const { id, data, timeoutMs } = await sendChatMessage(state, message);
    if (state.sendParams) {
      this.updateVideoData(videoId, {
        sendParams: state.sendParams,
        clientIdPrefix: state.clientIdPrefix,
      });
    }
    // Local echo so the sent message shows instantly (marked isOwn).
    // When polls return it later, dedup drops the duplicate by id.
    try {
      let seen = this.seenIds.get(videoId);
      if (!seen) {
        seen = new Set<string>();
        this.seenIds.set(videoId, seen);
      }
      if (id) seen.add(id);
      const echoAction = data?.actions?.[0];
      const video = this.videos.get(videoId);
      if (echoAction && video) {
        const parsed = parse(echoAction);
        if (parsed && parsed.event === 'message') {
          (parsed.data as TUBECHAT.Msg_Common).isOwn = true;
          this.attachMessageContext(videoId, parsed.event, parsed.data);
          this.emit('message', parsed.data as WithLiveContext<TUBECHAT.Msg_Common>, videoId, video.videoData.user, video.videoData);
        }
      }
    } catch {
      // Echo is best-effort; the id is still returned.
    }
    return { id, ...(timeoutMs ? { timeoutMs } : {}) };
  }

  /**
   * Attach chat context (chatId + bound reply) to an emitted payload.
   * Used by both poll processing and the local send echo.
   */
  private attachMessageContext(videoId: string, event: string, data: any): void {
    if (!REPLYABLE_EVENTS.has(event)) return;
    const d = data as TUBECHAT.Msg_Common;
    d.chatId = videoId;
    const author = (d as any)?.author?.channelName || '';
    d.reply = (text: string, opts?: TUBECHAT.ReplyOptions) => this.sendReply(videoId, author, text, opts);
  }

  /**
   * Reply to a received message (mention send). Used by the bound
   * `message.reply(text, { mention })` — no videoId needed there.
   */
  private async sendReply(videoId: string, authorName: string, text: string, opts?: TUBECHAT.ReplyOptions): Promise<{ id: string, timeoutMs?: number }> {
    const clean = (text || '').trim();
    const mention = opts?.mention !== false;
    if (mention) {
      const handle = (authorName || '').trim().replace(/^@+/, '');
      if (handle) return this.say(videoId, `@${handle} ${clean}`.slice(0, 200));
    }
    return this.say(videoId, text);
  }

  /**
   * Vote on a poll choice. Use choices[].params from the "poll" event.
   * Requires login.
   */
  async vote(videoId: string, choice: TUBECHAT.PollChoice | string): Promise<any> {
    if (!this.cookie) throw new AuthRequiredError('vote in polls');
    const params = typeof choice === 'string' ? choice : choice.params || '';
    return await voteWithParams(await this.readyWriteState(videoId), params);
  }

  /**
   * Delete a single message (moderator). Accepts a parsed message (with
   * harvested moderation params) or raw params string.
   */
  async removeMessage(videoId: string, target: TUBECHAT.Msg_Common | TUBECHAT.Msg_Jewels | string): Promise<any> {
    if (!this.cookie) throw new AuthRequiredError('delete messages');
    return await moderateWithParams(await this.readyWriteState(videoId), this.resolveModParams(target, 'remove'));
  }

  /**
   * Timeout the author of a message (moderator, default duration).
   */
  async timeoutUser(videoId: string, target: TUBECHAT.Msg_Common | TUBECHAT.Msg_Jewels | string): Promise<any> {
    if (!this.cookie) throw new AuthRequiredError('timeout users');
    return await moderateWithParams(await this.readyWriteState(videoId), this.resolveModParams(target, 'timeout'));
  }

  /**
   * Ban the author from the channel ("Hide user", moderator).
   */
  async banUser(videoId: string, target: TUBECHAT.Msg_Common | TUBECHAT.Msg_Jewels | string): Promise<any> {
    if (!this.cookie) throw new AuthRequiredError('ban users');
    return await moderateWithParams(await this.readyWriteState(videoId), this.resolveModParams(target, 'hide'));
  }

  /**
   * Read-only: fetch the full context menu of a message (discovers available
   * mod actions and their params).
   */
  async getMenu(videoId: string, target: TUBECHAT.Msg_Common | TUBECHAT.Msg_Jewels | string): Promise<any[]> {
    if (!this.cookie) throw new AuthRequiredError('read the context menu');
    return await fetchMessageMenu(await this.readyWriteState(videoId), this.resolveModParams(target, 'contextMenu'));
  }

  /**
   * Switch the chat filter of a joined video ('live' = all messages, the
   * default; 'top' = YouTube's filtered Top chat). Re-bootstraps silently;
   * already-seen messages are not re-emitted.
   * Returns true when the switch took effect.
   */
  async setChatFilter(videoId: string, filter: ChatFilter): Promise<boolean> {
    const video = this.videos.get(videoId);
    if (!video) throw new Error(`[tubechat] Not joined: ${videoId}. Call join(videoId) first.`);
    this.updateVideoData(videoId, { chatFilter: filter });
    const gen = this.fetchGen.get(videoId);
    if (gen === undefined) return false;
    return (await this.rebootstrap(videoId, gen)) === 'recovered';
  }

  /**
   * Validate the login without side effects: fetches the chat input config
   * with the session cookie. Resolves true when logged in and allowed to
   * chat here; throws SessionExpiredError when the session is dead.
   */
  async checkAuth(videoId: string): Promise<true> {
    if (!this.cookie) throw new AuthRequiredError('validate the session');
    const state = this.writeState(videoId);
    try {
      await ensureSendParams(state);
      return true;
    } catch (e: any) {
      if (e instanceof SessionExpiredError) throw e;
      if (/Cookie|Session|log|auth|401|403|denied/i.test(e?.message || '')) {
        throw new SessionExpiredError();
      }
      throw e;
    }
  }

  /**
   * reply a message.
   * @private Not implemented yet (YouTube live chat has no reply primitive).
   */
  async reply(_targetUser: string | { id: string; }, _message: string) {
    throw new Error('Not implemented');
  }

  /**
   * Download a VOD's replay chat (past broadcasts/premieres with chat).
   * Separate from join(): no polling loop, no join/leave/disconnect events.
   * Standard message events ARE emitted (so existing handlers record them),
   * and the parsed log is also returned.
   */
  async downloadChat(videoId: string, options: DownloadChatOptions = {}): Promise<DownloadChatResult> {
    const boot = await bootstrapReplayChat(videoId, this.headers, options.headers, this.cookie);
    if (!boot.ok) {
      return {
        completed: false,
        error: { code: boot.code, message: boot.message },
        messages: [],
        actions: 0,
        pages: 0,
      };
    }
    const videoData = boot.bootstrap.videoData;
    const messages: ParseResult[] = [];
    const seen = new Set<string>();
    const dimMap = new Map<string, string>();
    // Minimal entry for the shared emit path (never registered in videos).
    const entry = { videoData } as Videos;
    const limit = options.limit ?? Infinity;
    const delayMs = options.delayMs ?? 50;
    let pages = 0;
    let actionCount = 0;
    const report = () => options.onProgress?.({ pages, actions: actionCount, messages: messages.length });
    const byTimestamp = (a: ParseResult, b: ParseResult) =>
      (((a.data as any)?.timestamp || Infinity) - ((b.data as any)?.timestamp || Infinity));

    // Parse + range-filter + dedup one page. Ranges are video offsets
    // ([startMs, endMs), from replayChatItemAction.videoOffsetTimeMsec);
    // items without an offset are always kept (deduped globally).
    const ingest = (actions: Object[], offsets: (number | null)[], startMs: number, endMs: number | null): { minOff: number, hasOff: boolean } => {
      let minOff = Infinity;
      let hasOff = false;
      for (let k = 0; k < actions.length; k++) {
        const action = actions[k];
        const off = offsets[k];
        actionCount++;
        this.emit('raw', action);
        let formated: ParseResult | null = null;
        try {
          formated = parse(action);
        } catch {
          formated = null;
        }
        if (!formated) continue;
        if (typeof off === 'number' && Number.isFinite(off)) {
          hasOff = true;
          if (off < minOff) minOff = off;
          if (off < startMs) continue;
          if (endMs !== null && off >= endMs) continue;
        }
        const id = (formated.data as any)?.id;
        if (typeof id === 'string' && id) {
          if (seen.has(id)) continue;
          seen.add(id);
        }
        if (messages.length >= limit) break;
        messages.push(formated);
        this.emitParsed(videoId, entry, action, formated, dimMap);
      }
      return { minOff, hasOff };
    };

    const workers = Math.max(1, Math.floor(options.concurrency ?? 1) || 1);
    const ranges = splitRanges((boot.bootstrap.durationSec || 0) * 1000, workers);
    if (ranges.length === 1) {
      // Serial path: walk from the bootstrap continuation to exhaustion.
      const seenContinuations = new Set<string>();
      let continuation: string | undefined = boot.bootstrap.continuation;
      let failures = 0;
      while (continuation && messages.length < limit) {
        if (seenContinuations.has(continuation)) break; // server cycling: treat as end
        seenContinuations.add(continuation);
        const res = await fetchReplayPage(boot.bootstrap, continuation, this.headers, options.headers, this.cookie);
        if (!res.ok) {
          failures++;
          if (failures > this.maxRetries) {
            return {
              completed: false,
              error: { code: res.code, message: res.message },
              videoData,
              messages,
              actions: actionCount,
              pages,
            };
          }
          await sleep(backoffMs(failures));
          continue;
        }
        failures = 0;
        pages++;
        ingest(res.page.actions, res.page.offsets, 0, null);
        report();
        continuation = res.page.continuation;
        if (continuation && messages.length < limit) await sleep(delayMs);
      }
      return { completed: true, videoData, messages, actions: actionCount, pages };
    }

    // Parallel path: one worker per time segment, seeking via playerOffsetMs.
    // All workers reuse the bootstrap continuation (proven: the token is a
    // session handle, position comes from currentPlayerState.playerOffsetMs).
    const OVERLAP_MS = 60000; // re-fetch margin against late server landings (deduped)
    let failed = false;
    let failure: { code: string, message: string } | undefined;
    const runRange = async (startMs: number | null, endMs: number | null): Promise<void> => {
      const trueStart = startMs ?? 0;
      const fetchStart = startMs === null ? null : Math.max(0, startMs - OVERLAP_MS);
      const seenContinuations = new Set<string>();
      let continuation: string | undefined = boot.bootstrap.continuation;
      let failures = 0;
      let first = true;
      while (continuation && messages.length < limit && !failed) {
        if (seenContinuations.has(continuation)) break;
        seenContinuations.add(continuation);
        const res = await fetchReplayPage(
          boot.bootstrap, continuation, this.headers, options.headers, this.cookie,
          first && fetchStart !== null ? fetchStart : undefined,
        );
        first = false;
        if (!res.ok) {
          failures++;
          if (failures > this.maxRetries) {
            failed = true;
            failure = { code: res.code, message: res.message };
            return;
          }
          await sleep(backoffMs(failures));
          continue;
        }
        failures = 0;
        pages++;
        const { minOff, hasOff } = ingest(res.page.actions, res.page.offsets, trueStart, endMs);
        report();
        // Pages advance chronologically: once a page's oldest message is past
        // our segment end, everything after is beyond our range too.
        if (endMs !== null && hasOff && minOff >= endMs) break;
        continuation = res.page.continuation;
        if (continuation && messages.length < limit && !failed) await sleep(delayMs);
      }
    };
    await Promise.all(ranges.map((r) => runRange(r.startMs, r.endMs)));
    messages.sort(byTimestamp);
    if (failed) {
      return {
        completed: false,
        error: failure!,
        videoData,
        messages,
        actions: actionCount,
        pages,
      };
    }
    return { completed: true, videoData, messages, actions: actionCount, pages };
  }

}
