import { authorNameToText, authorPhotoUrl, messageText, parseAuthorBadges, timestampMs } from "./common";
import { RunWithText, TUBECHAT } from "./types";


export class LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer {
  // LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer",
  public static readonly rendererKey = 'liveChatSponsorshipsGiftPurchaseAnnouncementRenderer'

  public static parseItem(item: any): TUBECHAT.Msg_SubGift | null {
    const renderer = item?.[this.rendererKey];
    if (!renderer) {
      return null;
    }

    try {
      const header = renderer['header']?.['liveChatSponsorshipsHeaderRenderer'] || {};
      const badges = parseAuthorBadges(header);
      const primaryRuns = (header.primaryText?.runs || []) as RunWithText[];
      // runs shape: ["<Name> gifted ", "5", " <Plan> memberships", ...] (locale varies;
      // count = first standalone number run).
      const countRun = primaryRuns.find((r) => /^\d+$/.test((r.text || '').trim()));
      const gifterName = authorNameToText(header['authorName']);
      const announceMessage = primaryRuns.map(i => ({ text: i.text }));
      const subgift_announce: TUBECHAT.Msg_SubGift = {
        id: renderer['id'],
        author: {
          ...badges,
          photo: authorPhotoUrl(header['authorPhoto']),
          channelName: gifterName,
          channelId: header['authorExternalChannelId'] || renderer['authorExternalChannelId'],
        },
        message: announceMessage,
        text: messageText(announceMessage),
        count: countRun ? Number(countRun.text.trim()) : 1,
        gifter: gifterName,
        plan: primaryRuns.length > 0 ? primaryRuns[primaryRuns.length - 2]?.text || primaryRuns[primaryRuns.length - 1]?.text || 'default' : 'default',
        timestampUsec: renderer['timestampUsec'],
        timestamp: timestampMs(renderer['timestampUsec']),
        isResub: false

      };
      return subgift_announce;
    } catch (e) {
      console.error("Error parsing data in liveChatSponsorshipsGiftPurchaseAnnouncementRenderer:", e);
      return null;
    }
  }
}
