import { authorNameToText, authorPhotoUrl, emptyAuthor, harvestModeration, messageText, parseAuthorBadges, timestampMs } from "./common";
import parseMessages from "./parseMessage";
import { TUBECHAT } from "./types";
import { convertSymbolCurrencies, purchaseAmountToText } from "./utilsParser";


/** Fundraiser / donation announcements (distinct from superchats). */
export class LiveChatDonationAnnouncementRenderer {
  public static readonly rendererKey = 'liveChatDonationAnnouncementRenderer';

  public static parseItem(item: any): TUBECHAT.Msg_Donation | null {
    const renderer = item?.[this.rendererKey];
    if (!renderer) {
      return null;
    }

    try {
      const amountText = purchaseAmountToText(renderer['purchaseAmountText'] || renderer['amountText']);
      const { value: amount, currency } = amountText ? convertSymbolCurrencies(amountText) : { value: undefined as number | undefined, currency: undefined as string | undefined };
      const rawMessage = renderer?.['message']?.['runs'] || renderer?.['subtext']?.['runs'] ? (renderer['message'] || renderer['subtext']) : undefined;
      const message = rawMessage?.runs ? parseMessages(rawMessage) : [];
      const hasAuthor = renderer?.authorName || renderer?.authorPhoto;
      const badges = parseAuthorBadges(renderer);
      const moderation = harvestModeration(renderer);
      const donation: TUBECHAT.Msg_Donation = {
        id: renderer['id'],
        author: hasAuthor ? {
          ...badges,
          photo: authorPhotoUrl(renderer['authorPhoto']),
          channelName: authorNameToText(renderer['authorName']),
          channelId: renderer['authorExternalChannelId'] || '',
        } : emptyAuthor(),
        message,
        text: messageText(message),
        ...(amountText && { formatted: amountText }),
        ...(typeof amount === 'number' && !Number.isNaN(amount) && { amount }),
        ...(currency && { currency }),
        timestampUsec: renderer['timestampUsec'],
        timestamp: timestampMs(renderer['timestampUsec']),
        ...(moderation && { moderation }),
      };
      return donation;
    } catch (e) {
      console.error("Error parsing data in liveChatDonationAnnouncementRenderer:", e);
      return null;
    }
  }
}
