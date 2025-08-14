import { findKey } from "../utils";
import parseBadges from "./parseBadges";
import parseMessages from "./parseMessage";
import { RunWithText, TUBECHAT } from "./types";
import { formatBeforeContentButtons } from "./utilsParser";


export class LiveChatMembershipItemRenderer {
  // liveChatMembershipItemRenderer",
  public static readonly rendererKey = 'liveChatMembershipItemRenderer'


  public static parse(data: any): TUBECHAT.Msg_Sub | null {
    const renderer = findKey<any>(data, this.rendererKey);
    if (!renderer) {
      return null;
    }
    const isFromChatHeader = findKey(data, 'liveChatTickerSponsorItemRenderer') ? true : false
    if (isFromChatHeader) return null // To avoid duplicate data when getting from chat header
    
    try {
      const badges = parseBadges(renderer['authorBadges'] || [], formatBeforeContentButtons(renderer['beforeContentButtons'] || []))
      
      if (
        !renderer?.headerSubtext?.simpleText &&
        !renderer.headerPrimaryText?.runs
      ) {
        // New Member
        const sub: TUBECHAT.Msg_Sub = {
          id: renderer['id'],
          author: {
            ...badges,
            photo: renderer['authorPhoto']['thumbnails'][0].url,
            channelName: renderer['authorName']['simpleText'],
            channelId: renderer['authorExternalChannelId'],
        },
        message: [
          {
            text: (renderer.headerSubtext.runs as RunWithText[]).map((run) => run.text).join('')
          },
        ],
        plan: renderer?.headerSubtext.runs.length > 1 ? renderer.headerSubtext?.runs[1]?.text : 'Member',
        isResub: false,
        timestampUsec: renderer['timestampUsec'],
      }

        return sub
      } 
      const [, months, monthsText] = renderer.headerPrimaryText.runs
      // Resub
        const resub: TUBECHAT.Msg_Resub = {
          id: renderer['id'],
          author: {
            ...badges,
            photo: renderer['authorPhoto']['thumbnails'][0].url,
            channelName: renderer['authorName']['simpleText'],
            channelId: renderer['authorExternalChannelId'],
          },
          message: renderer['message'] ? parseMessages(renderer['message']) : [
            {
              text: (renderer.headerPrimaryText.runs as RunWithText[]).map((run) => run.text).join('')
            },
          ],
          plan: renderer['headerSubtext']['simpleText'],
          isResub: true,
          timestampUsec: renderer['timestampUsec']
        }
        const count = renderer['headerPrimaryText'].runs.length == 1 ? renderer['headerPrimaryText'].runs[0].text.split(' ')[2] :  months?.text || monthsText?.text || '0'
        resub.author.badges.months = Number(count)
        return resub
      } catch (e) {
        console.error("Error parsing data in liveChatMembershipItemRenderer:", e);
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