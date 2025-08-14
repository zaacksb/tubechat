import { YtChatSignaler } from 'yt-chat-signaler';
import { startConnection, type FetchChat, type StartConnectionErrors, type VideoData } from './fetch/chat';
import EventEmitter from './lib/EventEmitter';
import { parse } from './parsers';
import { TUBECHAT } from './parsers/types';
import { isError, mergeObjects } from './utils';


export interface ClientOptions {
  // TODO authentication with token
  intervalChat?: number
  maxRetries?: number
  headers?: HeadersInit
  signalerConnectedInterval?: number
  signalerDisconnectedInterval?: number
  useSignaler?: boolean
}
export type ConnectionEvents = {
  message: [message: TUBECHAT.Msg_Common, chatId: string, userChannel: string, VideoData: VideoData]
  superchat: [message: TUBECHAT.Msg_SuperChat, chatId: string, userChannel: string, VideoData: VideoData]
  subgift_announce: [message: TUBECHAT.Msg_SubGift, chatId: string, userChannel: string, VideoData: VideoData]
  subgift: [message: TUBECHAT.Msg_SubGift, chatId: string, userChannel: string, VideoData: VideoData]
  member: [message: TUBECHAT.Msg_Sub, chatId: string, userChannel: string, VideoData: VideoData]
  jewels: [message: TUBECHAT.Msg_Jewels, chatId: string, userChannel: string, VideoData: VideoData]
  system: [message: TUBECHAT.SYSTEM.ChatMode, chatId: string, userChannel: string, VideoData: VideoData]
  deletedMessage: [messageId: string, chatId: string, userChannel: string, VideoData: VideoData]
  deleteUserMessages: [channelId: string, chatId: string, userChannel: string, VideoData: VideoData]
};

export type Videos = {
  videoData: VideoData
  customHeaders?: HeadersInit
  fetchChat: () => FetchChat
  isJoined: boolean
  firstFetch: boolean
  skipFirstResults: boolean
  interval: number
}



export type OtherEvents = {
  raw: [actions: any[]]
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


export class TubeChat extends EventEmitter<ToTuples<ClientEvents>> {
  intervalChat: number = 1000
  maxRetries: number = 4
  public headers: HeadersInit | undefined
  public videos: Map<string, Videos> = new Map()
  public signaler: YtChatSignaler | undefined;
  private signalerConnected: Map<string, boolean> = new Map();
  private isFetching: Map<string, boolean> = new Map();
  private signalerConnectedInterval: number;
  private signalerDisconnectedInterval: number;
  private useSignaler: boolean;

  constructor({ intervalChat, maxRetries, headers, signalerConnectedInterval, signalerDisconnectedInterval, useSignaler }: ClientOptions = {}) {
    super()
    this.intervalChat = intervalChat || 1000
    this.maxRetries = Math.min(maxRetries || 4, 15)
    this.headers = headers
    this.useSignaler = useSignaler !== false; // Default to true if not explicitly false

    this.signalerConnectedInterval = Math.max(signalerConnectedInterval || 15000, 100);
    this.signalerDisconnectedInterval = Math.max(signalerDisconnectedInterval || 1000, 100);

    if (this.useSignaler) {
      this.signaler = new YtChatSignaler({ chats: [], maxReconnectWaitMs: 2000, maxReconnectAttempts: 0});
      this.signaler.start();

      this.signaler.on('data', ({ chatData }) => {
        this.fetchChatAndUpdate(chatData.chatId);
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


  /**
 * Join a channel by name. The channel name will be normalized.
 */
  async join(videoId: string, skipFirstResults = false, options?: { headers?: HeadersInit, interval: number }): Promise<{ joined: true, videoData: Videos } | { joined: false, error: StartConnectionErrors }> {
    if (this.videos.has(videoId)) {
      return { joined: true, videoData: this.videos.get(videoId)! }
    }
    this.updateVideoData(videoId, {
      isJoined: false,
      firstFetch: true,
      customHeaders: options?.headers,
      skipFirstResults,
      interval: options?.interval || this.intervalChat
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
        videoData: connection?.videoData,
        fetchChat: connection?.fetchChat,
      })
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
    await this.fetchChatAndUpdate(videoId);
    this.scheduleNextFetch(videoId);
  }

  private scheduleNextFetch(videoId: string) {
    let interval = this.intervalChat; // Default to original interval
    if (this.useSignaler && this.signaler) {
      const isConnected = this.signalerConnected.get(videoId);
      interval = isConnected ? this.signalerConnectedInterval : this.signalerDisconnectedInterval;
    }
    setTimeout(() => this.recursiveFetchChat(videoId), interval);
  }

  private async fetchChatAndUpdate(videoId: string) {
    if (this.isFetching.get(videoId)) {
      return;
    }
    this.isFetching.set(videoId, true);

    try {
      const videoData = this.videos.get(videoId)

      if (!videoData?.fetchChat) {
        return
      }
      if (videoData?.fetchChat) {
        try {
          const chat = await videoData.fetchChat()
          if (chat && chat?.code == 'success' && chat?.actions) {
            const actions = chat.actions
            actions.map((msg: any) => {
              this.emit('raw', msg)
              if(videoData.firstFetch == true && videoData.skipFirstResults == true)  return
              const formated = parse(msg)
              if (formated) {
                const commonArgs = [videoData.videoData.videoId, videoData.videoData.user, videoData.videoData] as const;
                switch (formated.event) {
                  case 'message':
                    this.emit(formated.event, formated.data, ...commonArgs);
                    break;
                  case 'superchat':
                    this.emit(formated.event, formated.data, ...commonArgs);
                    break;
                  case 'subgift_announce':
                    this.emit(formated.event, formated.data, ...commonArgs);
                    break;
                  case 'subgift':
                    this.emit(formated.event, formated.data, ...commonArgs);
                    break;
                  case 'member':
                    this.emit(formated.event, formated.data, ...commonArgs);
                    break;
                  case 'jewels':
                    this.emit(formated.event, formated.data, ...commonArgs);
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
                }
              }
              // for (const [actionName, value] of Object.entries(msg)) {
              //   if (&& (actionName == 'addChatItemAction' || actionName == 'clickTrackingParams')) return
              //   parseChatActions((value as Object), actionName, videoData.videoData, this)
              // }
            });
            this.updateVideoData(videoId, {
              firstFetch: false
            })
          } else {
            if (chat.code == 'fetch_error') {
              this.emit('error', videoId, `[Fetch error]: ${chat.error}`)
              this.leave(videoId)
            } else if (chat.code == 'continuation_not_found') {
              this.emit('error', videoId, `[Continuation not found]: ${chat.error}`)
              this.leave(videoId)
            } else if (chat.code == 'permission_denied') {
              this.emit('error', videoId, `[Insufficient permission]: ${chat.error}`)
              this.leave(videoId)
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
      this.videos.delete(videoId)
      if (this.useSignaler && this.signaler) {
        this.signaler.stop(videoId);
        this.signalerConnected.delete(videoId);
      }
      this.emit('disconnected', videoId, video?.videoData?.user, video?.videoData)

    }
  }
  /**
 * Send a message to a chat. Messages must be <= 300 characters in length.
 * Cannot send messages if the client is logged in anonymously.
 */
  async say(user: string, message: string) {
    throw new Error('Not implemented');
  }
  /**
   * reply a message.
   * @private Not implemented yet.
   */
  async reply(_targetUser: string | { id: string; }, _message: string) {
    throw new Error('Not implemented');
  }

}