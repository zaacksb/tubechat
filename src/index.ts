import { EventEmitter } from 'stream';
import { fetchChat } from './lib/ChatMessages';
import addBannerToLiveChatCommand from './lib/actions/addBannerToLiveChatCommand';
import addChatItemAction from './lib/actions/addChatItemAction';
import closeLiveChatActionPanelAction from './lib/actions/closeLiveChatActionPanelAction';
import liveChatMembershipItemRenderer from './lib/actions/liveChatMembershipItemRenderer';
import liveChatTickerSponsorItemRenderer from './lib/actions/liveChatTickerSponsorItemRenderer';
import removeBannerForLiveChatCommand from './lib/actions/removeBannerForLiveChatCommand';
import removeChatItemAction from './lib/actions/removeChatItemAction';
import removeChatItemByAuthorAction from './lib/actions/removeChatItemByAuthorAction';
import replaceChatItemAction from './lib/actions/replaceChatItemAction';
import showLiveChatActionPanelAction from './lib/actions/showLiveChatActionPanelAction';
import updateLiveChatPollAction from './lib/actions/updateLiveChatPollAction';
import { getYoutubeInitialData } from './lib/getYoutubeInitialData';
import { findKey, sleep } from './lib/utils';
import { TPossibleActions } from './types/Types';



import { FlowMonitor } from 'flow-monitor';
import { ZytChatEvents } from './types';


export type TubeChatT = {
  intervalChat?: number
  flowMonitor?: FlowMonitor
}

type TubeChatChannel = {
  user: string
  videoId: string | null
  continuationData?: {
    nextPage?: string,
    apiKey?: string
    clientVersion?: string
    clientName?: string
  }
  shownFirstMessages: true | null
}
// TubeChat (YouTube Chat Capture)
export class TubeChat extends EventEmitter {
  #channels: TubeChatChannel[] = []
  #intervalChat: number = 1000
  #monitor: FlowMonitor
  constructor(config: TubeChatT = {}) {
    super()
    this.#intervalChat = config.intervalChat || 1000
    this.#monitor = config?.flowMonitor || new FlowMonitor()
    this.checkers()
  }
  on<E extends keyof TubeChatEvents>(event: E, listener: TubeChatEvents[E]): this {
    return super.on(event, listener);
  }

  private async updateVideo(user: string, videoId: string) {
    const response = await getYoutubeInitialData(videoId);
    if (response.code == 'success') {
      const {
        clientName,
        clientVersion,
        loggedIn,
        continuation,
        params,
        apiKey,
      } = response;
      this.updateChannelData(user, {
        videoId,
        continuationData: {
          apiKey,
          clientName,
          clientVersion,
          nextPage: continuation
        },
      })
      this.emit('chat_connected', user, videoId)
    } else if (response.code == 'ended_event' || response.code == 'chat_not_found' || response.code == 'error') {
      this.chatDisconnected(user)
    }
  }

  private async channelUpdate(user: string, videoId: string, streamDown: boolean = false, platform: string) {
    if (platform == 'youtube') {
      const channelData = this.#channels.find(chn => chn.user == user)
      if (channelData?.user) {
        if (streamDown) {
          this.chatDisconnected(channelData?.user)
          return
        }
        if (!channelData?.videoId && videoId) {
          this.updateVideo(channelData.user, videoId)
        } else if (channelData?.videoId && channelData.videoId !== videoId) {
          this.updateVideo(channelData.user, videoId)
        }
      }
    }
  }

  private async checkerLive() {
    this.#monitor?.on('streamUp', (data) => this.channelUpdate(data.channel, data.vodId, false, data.platform))
    this.#monitor?.on('streamDown', (data) => this.channelUpdate(data.channel, data.vodId, true, data.platform))
    this.#monitor?.on('viewerCount', (data) => this.channelUpdate(data.channel, data.vodId, false, data.platform))
    this.#monitor?.start()
  }

  private updateChannelData(updateUser: string, newData: Partial<TubeChatChannel>) {
    this.#channels = this.#channels.map((channel) => {
      if (channel.user === updateUser) {
        if (newData?.continuationData)
          channel = {
            ...channel,
            ...newData,
            continuationData: {
              ...channel?.continuationData,
              ...newData?.continuationData
            },
          }
      }
      return channel
    })
  }
  private async checkerChat() {
    const channels = this.#channels.filter(({ videoId }) => videoId !== null)
    for (const { user, videoId, continuationData, shownFirstMessages } of channels) {
      if (videoId && !continuationData) {
        const response = await getYoutubeInitialData(videoId);
        if (response.code == 'success') {
          const {
            clientName,
            clientVersion,
            loggedIn,
            continuation,
            params,
            apiKey,
          } = response;
          this.updateChannelData(user, {
            continuationData: {
              apiKey,
              clientName,
              clientVersion,
              nextPage: continuation
            },
          })
        } else if (response.code == 'ended_event' || response.code == 'chat_not_found' || response.code == 'error') {
          this.chatDisconnected(user)
        }
      } else if (videoId && continuationData?.nextPage && continuationData?.apiKey && continuationData?.clientName && continuationData?.clientVersion) {
        const chatRes = await fetchChat(continuationData.nextPage, continuationData.apiKey, continuationData.clientName, continuationData.clientVersion);
        const continuation = findKey(chatRes, "continuation") as string
        if (chatRes?.error) {
          if (chatRes.error.code == 400) {
            this.chatDisconnected(user)
          }
        } else if (!continuation || chatRes?.code == 'ENOTFOUND') {
          this.chatDisconnected(user)
        } else {

          if (shownFirstMessages) {
            const actions = findKey(chatRes, "actions");
            if (actions) {
              actions.map((msg: any) => {
                for (const [key, value] of Object.entries(msg)) {
                  const val = value as any;
                  const actionName = key as TPossibleActions;
                  const parser = this.parseChatItem();
                  const parseChatActionsFn = parser?.[actionName];
                  if (parseChatActionsFn) {
                    parseChatActionsFn(val, this, user);
                  } else {
                    this.emit("unkown", { key, value, channel: user });
                  }
                }
              });
            }
          }
          this.updateChannelData(user, {
            shownFirstMessages: true,
            continuationData: {
              nextPage: continuation
            },
          })

        }


      }


    }

    await sleep(this.#intervalChat / 2)
    this.checkerChat()
  }
  private parseChatItem() {
    const actions = {
      addChatItemAction, // common message
      addBannerToLiveChatCommand, // fixed messages, polls and others
      removeChatItemByAuthorAction, // deleted message
      removeBannerForLiveChatCommand, // when remove live banner
      updateLiveChatPollAction, // loop receiving polls data
      closeLiveChatActionPanelAction, //
      showLiveChatActionPanelAction,
      liveChatMembershipItemRenderer,
      liveChatTickerSponsorItemRenderer,
      replaceChatItemAction,
      removeChatItemAction
    };
    return actions;
  }

  private async chatDisconnected(user: string) {
    const userData = this.#channels.find((chn) => chn.user == user)
    if (userData) {
      this.emit('chat_disconnected', userData?.user, userData?.videoId)
      this.updateChannelData(user, {
        continuationData: {
          nextPage: '',
          apiKey: '',
          clientName: '',
          clientVersion: ''
        },
        videoId: null,
        shownFirstMessages: null
      })
    }
  }

  public disconnect(user: string) {
    user = user.replace('@', '')
    this.chatDisconnected(user)
    this.#monitor?.disconnect(user, 'youtube')
  }



  private checkers() {
    this.checkerLive()
    this.checkerChat()
  }

  public channelList = () => this.#channels
  public connect(channel: string) {
    if (channel) {
      const alreadyAdded = this.#channels.find(chn => chn.user == channel)
      if (alreadyAdded) return
      const user = channel.replace('@', '')
      this.#channels.push({
        user,
        videoId: null,
        shownFirstMessages: null
      })
      this.#monitor?.connect(user, 'youtube')
    }
  }

}


export function convertSymbolCurrencies(stringValue: string, customFormats?: Record<string, string>): { symbol: string, currency: string, value: number } {
  const currencyFormats: Record<string, string> = customFormats || {
    "$": "usd",
    "£": "gbp",
    "¥": "jpy",
    "jp¥": "jpy",
    "฿": "thb",
    "₩": "krw",
    "₪": "ils",
    "€": "eur",
    "₱": "php",
    "₹": "inr",
    "A$": "aud",
    "CA$": "cad",
    "HK$": "hkd",
    "MX$": "mxn",
    "NT$": "twd",
    "NZ$": "nzd",
    "R$": "brl",
    "₽": "rub",
    "SEK": "sek",
    "ARS": "ars"
  };

  let symbolStr = "",
    value = 0
  for (const symbol in currencyFormats) {
    symbolStr = symbol
    if (stringValue.startsWith(symbol)) {
      value = Number(stringValue.split(symbol)[1])
      return { symbol, currency: currencyFormats[symbol], value };
    }
  }
  const currency = stringValue.split(' ')[0].split(' ')[0]
  // @ts-ignore
  return { symbol: currency, currency: currency.toLowerCase(), value: value == 0 ? Number(stringValue?.split && stringValue.split(' ').pop().split(' ')?.pop()) : value }
}


export type DisconnectedEvent = (channel: string, videoId: string) => void


export type ChannelConnectedEvent = (channel: string, videoId: string) => void

type TubeChatEvents = ZytChatEvents & {
  chat_connected: ChannelConnectedEvent
  chat_disconnected: DisconnectedEvent
}