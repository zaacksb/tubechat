import { authorNameToText, authorPhotoUrl, harvestModeration, messageText, parseAuthorBadges, timestampMs } from "./common";
import { RunWithText, TUBECHAT } from "./types";


export class LiveChatSponsorshipsGiftRedemptionAnnouncementRenderer {
  // liveChatSponsorshipsGiftRedemptionAnnouncementRenderer",
  public static readonly rendererKey = 'liveChatSponsorshipsGiftRedemptionAnnouncementRenderer'

  public static parseItem(item: any): TUBECHAT.Msg_SubGift | null {
    const renderer = item?.[this.rendererKey];
    if (!renderer) {
      return null;
    }


    try {
      const badges = parseAuthorBadges(renderer);
      const moderation = harvestModeration(renderer);
      const runs = (renderer.message?.runs || []) as RunWithText[];
      // Gifter is usually the linked (navigationEndpoint) run, else runs[1].
      const linked = (renderer.message?.runs || []).find((r: any) => r?.navigationEndpoint && typeof r?.text === 'string');
      const gifter = (linked?.text || runs[1]?.text || '').trim();
      const giftMessage = runs.map(i => ({ text: i.text }));
      const subgift: TUBECHAT.Msg_SubGift = {
        id: renderer['id'],
        author: {
          ...badges,
          photo: authorPhotoUrl(renderer['authorPhoto']),
          channelName: authorNameToText(renderer['authorName']),
          channelId: renderer['authorExternalChannelId'],
        },
        gifter,
        plan: 'default',
        count: 1,

        message: giftMessage,
        text: messageText(giftMessage),
        timestampUsec: renderer['timestampUsec'],
        timestamp: timestampMs(renderer['timestampUsec']),
        isResub: false,
        ...(moderation && { moderation }),
      };

      return subgift;
    } catch (e) {
      console.error("Error parsing data in liveChatSponsorshipsGiftRedemptionAnnouncementRenderer:", e);
      return null;
    }
  }
}
