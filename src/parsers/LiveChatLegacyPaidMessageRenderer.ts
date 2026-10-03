import { authorNameToText, authorPhotoUrl, harvestModeration, messageText, parseAuthorBadges, timestampMs } from "./common";
import { lastThumbnailUrl } from "./parseMessage";
import parseMessages from "./parseMessage";
import { TUBECHAT } from "./types";
import { convertSymbolCurrencies, normalizeThumbUrl, purchaseAmountToText } from "./utilsParser";


/** Older superchat wire format. Normalized into a superchat event. */
export class LiveChatLegacyPaidMessageRenderer {
  public static readonly rendererKey = 'liveChatLegacyPaidMessageRenderer';

  public static parseItem(item: any): TUBECHAT.Msg_SuperChat | null {
    const renderer = item?.[this.rendererKey];
    if (!renderer) {
      return null;
    }
    const amountText = purchaseAmountToText(renderer['purchaseAmountText'] || renderer['amountText']);
    const { value: amount, currency } = amountText ? convertSymbolCurrencies(amountText) : { value: NaN as number, currency: '' as string };

    try {
      const message = renderer?.['message']?.['runs'] ? parseMessages(renderer['message']) : [];
      const badges = parseAuthorBadges(renderer);
      const moderation = harvestModeration(renderer);
      const stickerSrc = renderer.sticker?.thumbnails ? lastThumbnailUrl(renderer.sticker.thumbnails) : '';
      const donate: TUBECHAT.Msg_SuperChat = {
        id: renderer['id'],
        formatted: amountText,
        amount,
        author: {
          ...badges,
          photo: authorPhotoUrl(renderer['authorPhoto']),
          channelName: authorNameToText(renderer['authorName']),
          channelId: renderer['authorExternalChannelId'] || '',
        },
        currency,
        isSticker: !!stickerSrc,
        ...(stickerSrc && {
          sticker: {
            alt: renderer.sticker?.accessibility?.accessibilityData?.label || '',
            url: normalizeThumbUrl(stickerSrc),
          }
        }),
        message,
        text: messageText(message),
        timestampUsec: renderer['timestampUsec'],
        timestamp: timestampMs(renderer['timestampUsec']),
        ...(moderation && { moderation }),
      };
      return donate;
    } catch (e) {
      console.error("Error parsing data in liveChatLegacyPaidMessageRenderer:", e);
      return null;
    }
  }
}
