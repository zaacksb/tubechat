import { findKey } from "../utils";
import parseBadges from "./parseBadges";
import parseMessages from "./parseMessage";
import { TUBECHAT } from "./types";
import { convertSymbolCurrencies, formatBeforeContentButtons } from "./utilsParser";


export class LiveChatPaidStickerRenderer {
  // liveChatPaidStickerRenderer",
  public static readonly rendererKey = 'liveChatPaidStickerRenderer'

  public static parse(data: any): TUBECHAT.Msg_SuperChat | null {
    const renderer = findKey<any>(data, this.rendererKey);
    if (!renderer) {
      return null;
    }
    const isFromChatHeader = findKey(data, 'liveChatTickerPaidStickerItemRenderer') ? true : false
    if (isFromChatHeader) return null // To avoid duplicate data when getting from chat header
    const { value: amount, currency } = convertSymbolCurrencies(
      renderer['purchaseAmountText']['simpleText'],
    )

    try {
      const message = renderer?.['message']?.['runs'] ? parseMessages(renderer['message']) : []
      const badges = parseBadges(renderer['authorBadges'] || [], formatBeforeContentButtons(renderer['beforeContentButtons'] || []))
      const donate: TUBECHAT.Msg_SuperChat = {
        id: renderer['id'],
        formatted: renderer['purchaseAmountText'].simpleText,
        amount,
        author: {
          ...badges,
          photo: renderer['authorPhoto']['thumbnails'][0].url,
          channelName: renderer['authorName']['simpleText'],
          channelId: renderer['authorExternalChannelId'],
        },
        currency,
        sticker: {
          alt: renderer.sticker.accessibility.accessibilityData.label,
          url: (renderer.sticker.thumbnails.pop()?.url || '').replace('//', ''),
        },
        isSticker: true,
        message,
        timestampUsec: renderer['timestampUsec'],
      }



      return donate
    } catch (e) {
      console.error("Error parsing data in liveChatPaidStickerRenderer:", e);
      return null;
    }
  }
}





// id: renderer['id'],
// authorName: renderer['authorName']['simpleText'],
// authorExternalChannelId: renderer['authorExternalChannelId'],
// message: renderer['message']?.['runs'] || [],
// authorPhoto: (renderer['authorPhoto']['thumbnails'] as Thumbnails[]).map(thumb => thumb.url),
// authorBadges: renderer['authorBadges'] || [],
// purchaseAmountText: renderer['purchaseAmountText'],
// headerBackgroundColor: renderer['headerBackgroundColor'],
// headerTextColor: renderer['headerTextColor'],
// bodyBackgroundColor: renderer['bodyBackgroundColor'],
// bodyTextColor: renderer['bodyTextColor'],
// authorNameTextColor: renderer['authorNameTextColor'],
// ...(renderer['leaderboardBadge'] && ({
//   leaderboardBadge: {
//     buttonViewModel: {
//       accessibilityText: renderer['leaderboardBadge']['buttonViewModel']['accessibilityText'],
//       iconName: renderer['leaderboardBadge']['buttonViewModel']['iconName'],
//       title: renderer['leaderboardBadge']['buttonViewModel']['title'],
//     }
//   }
// })),

// timestampUsec: renderer['timestampUsec'],