import { authorNameToText, authorPhotoUrl, harvestModeration, harvestSuperchatExtras, messageText, parseAuthorBadges, timestampMs } from "./common";
import parseMessages from "./parseMessage";
import { TUBECHAT } from "./types";
import { convertSymbolCurrencies, normalizeThumbUrl, purchaseAmountToText } from "./utilsParser";
import { lastThumbnailUrl } from "./parseMessage";


export class LiveChatPaidStickerRenderer {
  // liveChatPaidStickerRenderer",
  public static readonly rendererKey = 'liveChatPaidStickerRenderer'

  public static parseItem(item: any): TUBECHAT.Msg_SuperChat | null {
    const renderer = item?.[this.rendererKey];
    if (!renderer) {
      return null;
    }
    const amountText = purchaseAmountToText(renderer['purchaseAmountText']);
    const { value: amount, currency } = convertSymbolCurrencies(amountText);

    try {
      const message = renderer?.['message']?.['runs'] ? parseMessages(renderer['message']) : [];
      const badges = parseAuthorBadges(renderer);
      const moderation = harvestModeration(renderer);
      const extras = harvestSuperchatExtras(renderer);
      const stickerImg = lastThumbnailUrl(renderer.sticker?.thumbnails);
      const donate: TUBECHAT.Msg_SuperChat = {
        id: renderer['id'],
        formatted: amountText,
        amount,
        author: {
          ...badges,
          photo: authorPhotoUrl(renderer['authorPhoto']),
          channelName: authorNameToText(renderer['authorName']),
          channelId: renderer['authorExternalChannelId'],
        },
        currency,
        sticker: {
          alt: renderer.sticker?.accessibility?.accessibilityData?.label || '',
          url: normalizeThumbUrl(stickerImg),
        },
        isSticker: true,
        message,
        text: messageText(message),
        timestampUsec: renderer['timestampUsec'],
        timestamp: timestampMs(renderer['timestampUsec']),
        ...(moderation && { moderation }),
        ...(extras?.replyThread && { replyThread: extras.replyThread }),
        ...(extras?.creatorHeart && { creatorHeart: extras.creatorHeart }),
      }



      return donate
    } catch (e) {
      console.error("Error parsing data in liveChatPaidStickerRenderer:", e);
      return null;
    }
  }
}
