import type { ISubGift } from "./lib/actions/liveChatSponsorshipsGiftPurchaseAnnouncementRenderer"
import type { MemberGift } from "./lib/actions/liveChatTickerSponsorItemRenderer"
import type { DeletedMessage } from "./lib/actions/removeChatItemAction"
import type { ISub } from "./lib/actions/sub"
import type { ISuperChat, ISuperChatSticker } from "./lib/actions/superchat"
import type { IUserReceiveSubGift } from "./lib/actions/subGift"
import type { LivePools } from "./lib/actions/updateLiveChatPollAction"
import type { ChatChannel, IChatYTMessage } from "./types/Client"

type ExtendChannel = { channel: string }

export type MessageEvent = (message: IChatYTMessage & ExtendChannel) => void
export type SuperchatEventEvent = (superchat: ISuperChat & ExtendChannel) => void
export type SuperchatStickerEvent = (superchatSticker: ISuperChatSticker & ExtendChannel) => void
export type GiftEvent = (gift: MemberGift & ExtendChannel) => void
export type SubGiftGroupEvent = (subgiftGroup: ISubGift & ExtendChannel) => void
export type SubEvent = (sub: ISub & ExtendChannel) => void
export type UpdateLiveChatPollEvent = (livePool: LivePools & ExtendChannel) => void
export type DeletedMessageEvent = (message: DeletedMessage & ExtendChannel) => void
export type UserReceiveSubGiftEvent = (IUserReceiveSubGift: IUserReceiveSubGift & ExtendChannel) => void

export type voidEvent = () => void
export type anyEvent = (value: any) => void
type UnkownMessageEvent = (message: any & ChatChannel & ExtendChannel) => void
export type ZytChatEvents = {
  message: MessageEvent
  superchat: SuperchatEventEvent
  superchatSticker: SuperchatStickerEvent
  gift: GiftEvent
  liveChatSponsorshipsGiftPurchaseAnnouncementRenderer: GiftEvent
  subgiftGroup: SubGiftGroupEvent
  subGift: GiftEvent
  userReceiveSubGift: UserReceiveSubGiftEvent
  sub: SubEvent
  updateLiveChatPoll: UpdateLiveChatPollEvent
  deleted_message: DeletedMessageEvent
  deleted_message_author: DeletedMessageEvent
  chatEndedEvent: voidEvent
  disconnect: voidEvent
  connected: voidEvent

  showLiveChatActionPanelAction: anyEvent
  liveChatTickerSponsorItemRenderer: anyEvent
  chat_error: anyEvent
  unkown: UnkownMessageEvent
  closeLiveChatActionPanelAction: anyEvent
  engagement: anyEvent
  banner: anyEvent
  chat_not_found: anyEvent
  replaceChatItemAction: anyEvent
  addLiveChatTickerItemAction: anyEvent
  removeBannerForLiveChatCommand: anyEvent
}