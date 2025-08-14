import { findKey } from "../utils";
import parseBadges from "./parseBadges";
import { RunWithText, TUBECHAT } from "./types";
import { formatBeforeContentButtons } from "./utilsParser";


export class LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer {
  // LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer",
  public static readonly rendererKey = 'liveChatSponsorshipsGiftPurchaseAnnouncementRenderer'

  public static parse(data: any): TUBECHAT.Msg_SubGift | null {
    const renderer = findKey<any>(data, this.rendererKey);
    if (!renderer) {
      return null;
    }

    const isFromChatHeader = findKey(data, 'liveChatTickerSponsorItemRenderer') ? true : false
    if (isFromChatHeader) return null // To avoid duplicate data when getting from chat header
    try {
      const badges = parseBadges(renderer['header']['liveChatSponsorshipsHeaderRenderer']['authorBadges'] || [], formatBeforeContentButtons(renderer['header']['liveChatSponsorshipsHeaderRenderer']['beforeContentButtons'] || []))
      const subgift_announce: TUBECHAT.Msg_SubGift = {
        id: renderer['id'],
        author: {
          ...badges,
          photo: renderer['header']['liveChatSponsorshipsHeaderRenderer']['authorPhoto']['thumbnails'][0].url,
          channelName: renderer['header']['liveChatSponsorshipsHeaderRenderer']['authorName']?.['simpleText'],
          channelId: renderer['authorExternalChannelId'],
        },        
        message: (renderer.header.liveChatSponsorshipsHeaderRenderer.primaryText.runs as RunWithText[]).map(i => ({ text: i.text })),
        count: Number(
          renderer.header.liveChatSponsorshipsHeaderRenderer.primaryText.runs[1].text,
        ),
        gifter: renderer['header']['liveChatSponsorshipsHeaderRenderer']['authorName']?.['simpleText'],
        plan: renderer.header.liveChatSponsorshipsHeaderRenderer.primaryText.runs.at(-2)
          ?.text!,
        timestampUsec: renderer['timestampUsec'],
        isResub: false

      }
      return subgift_announce
    } catch (e) {
      console.error("Error parsing data in liveChatSponsorshipsGiftPurchaseAnnouncementRenderer:", e);
      return null;
    }
  }
}