import { findKey } from "../utils";
import parseBadges from "./parseBadges";
import { RunWithText, TUBECHAT } from "./types";
import { formatBeforeContentButtons } from "./utilsParser";


export class LiveChatSponsorshipsGiftRedemptionAnnouncementRenderer {
  // liveChatSponsorshipsGiftRedemptionAnnouncementRenderer",
  public static readonly rendererKey = 'liveChatSponsorshipsGiftRedemptionAnnouncementRenderer'

  public static parse(data: any): TUBECHAT.Msg_SubGift | null {
    const renderer = findKey<any>(data, this.rendererKey);
    if (!renderer) {
      return null;
    }
    
    
    try {
      const badges = parseBadges(renderer['authorBadges'] || [], formatBeforeContentButtons(renderer['beforeContentButtons'] || []))
      const subgift: TUBECHAT.Msg_SubGift = {
        id: renderer['id'],
        author: {
          ...badges,
          photo: renderer['authorPhoto']['thumbnails'][0].url,
          channelName: renderer['authorName']['simpleText'],
          channelId: renderer['authorExternalChannelId'],
        },
        gifter: renderer.message.runs[1]!.text,
        plan: 'default',
        count: 1,

        message: (renderer['message'].runs as RunWithText[]).map(i => ({ text: i.text })),
        timestampUsec: renderer['timestampUsec'],
        isResub: false
      }

      return subgift
    } catch (e) {
      console.error("Error parsing data in liveChatSponsorshipsGiftRedemptionAnnouncementRenderer:", e);
      return null;
    }
  }
}