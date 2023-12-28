import { IAddChatItemAction } from "../../types/Types";
import engagement from "./engagement";
import liveChatSponsorshipsGiftPurchaseAnnouncementRenderer from "./liveChatSponsorshipsGiftPurchaseAnnouncementRenderer";
import sub from "./sub";
import subGift from "./subGift";
import superchat from "./superchat";
import textMessage from "./textMessaage";

const addChatItemAction = (messageData: IAddChatItemAction, emitter: NodeJS.EventEmitter, channel: string) => {
  const entries = Object.entries(messageData?.item)
  const [action, firstValue] = entries[0];
  if (action == 'liveChatPlaceholderItemRenderer') return // unless
  if (action == 'liveChatTextMessageRenderer') { // common message
    return textMessage(messageData.item.liveChatTextMessageRenderer, emitter, channel)
  }
  if (action == 'liveChatViewerEngagementMessageRenderer') {
    return engagement(messageData.item.liveChatViewerEngagementMessageRenderer, emitter, channel)
  }
  if (action == 'liveChatPaidMessageRenderer' || action == 'liveChatPaidStickerRenderer') {
    return superchat(messageData.item, emitter, channel)
  }

  if (action == 'liveChatSponsorshipsGiftPurchaseAnnouncementRenderer') {
    return liveChatSponsorshipsGiftPurchaseAnnouncementRenderer(messageData.item.liveChatSponsorshipsGiftPurchaseAnnouncementRenderer, emitter, channel)
  }

  if (action == 'liveChatSponsorshipsGiftRedemptionAnnouncementRenderer' || action == 'liveChatTickerPaidMessageItemRenderer') {
    return subGift(messageData.item.liveChatSponsorshipsGiftRedemptionAnnouncementRenderer, emitter, channel)
  }
  if (action == 'liveChatMembershipItemRenderer') { // member - resub
    return sub(messageData.item.liveChatMembershipItemRenderer, emitter, channel)
  }
  emitter.emit('unkown', { ...messageData, channel })

}


export default addChatItemAction