import { authorNameToText, authorPhotoUrl, harvestModeration, messageText, parseAuthorBadges, timestampMs } from "./common";
import { parseMembershipMonths } from "./parseBadges";
import parseMessages from "./parseMessage";
import { RunWithText, TUBECHAT } from "./types";


export class LiveChatMembershipItemRenderer {
  // liveChatMembershipItemRenderer",
  public static readonly rendererKey = 'liveChatMembershipItemRenderer'


  public static parseItem(item: any): TUBECHAT.Msg_Sub | null {
    const renderer = item?.[this.rendererKey];
    if (!renderer) {
      return null;
    }

    try {
      const badges = parseAuthorBadges(renderer);
      const moderation = harvestModeration(renderer);
      const baseAuthor = {
        ...badges,
        photo: authorPhotoUrl(renderer['authorPhoto']),
        channelName: authorNameToText(renderer['authorName']),
        channelId: renderer['authorExternalChannelId'],
      };
      const primaryRuns = renderer.headerPrimaryText?.runs as RunWithText[] | undefined;
      const isResub = !!primaryRuns && primaryRuns.length > 0;

      if (!isResub) {
        // New member: plan lives in headerSubtext (simpleText or runs).
        const subtext = renderer.headerSubtext?.simpleText
          || (Array.isArray(renderer.headerSubtext?.runs)
            ? (renderer.headerSubtext.runs as RunWithText[]).map((run) => run.text).join('')
            : '');
        const runs = renderer.headerSubtext?.runs as RunWithText[] | undefined;
        const subMessage = [{ text: subtext || 'New member' }];
        const sub: TUBECHAT.Msg_Sub = {
          id: renderer['id'],
          author: baseAuthor,
          message: subMessage,
          text: messageText(subMessage),
          plan: (runs && runs.length > 1 ? runs[1]?.text : undefined) || subtext || 'Member',
          isResub: false,
          timestampUsec: renderer['timestampUsec'],
          timestamp: timestampMs(renderer['timestampUsec']),
          ...(moderation && { moderation }),
        };
        return sub;
      }
      // Resub / milestone: "Member (6 months)" style or primary text with count.
      const resubMessage = renderer['message']?.runs ? parseMessages(renderer['message']) : [
        {
          text: ((renderer.headerPrimaryText?.runs || []) as RunWithText[]).map((run) => run.text).join('')
        },
      ];
      const resub: TUBECHAT.Msg_Resub = {
        id: renderer['id'],
        author: baseAuthor,
        message: resubMessage,
        text: messageText(resubMessage),
        plan: renderer['headerSubtext']?.['simpleText']
          || (Array.isArray(renderer.headerSubtext?.runs)
            ? (renderer.headerSubtext.runs as RunWithText[]).map((r) => r.text).join('')
            : 'Member'),
        isResub: true,
        timestampUsec: renderer['timestampUsec'],
        timestamp: timestampMs(renderer['timestampUsec']),
        ...(moderation && { moderation }),
      };
      const primaryText = ((renderer.headerPrimaryText?.runs || []) as RunWithText[]).map((r) => r.text).join(' ');
      const months = parseMembershipMonths(primaryText)
        ?? parseMembershipMonths(renderer.headerSubtext?.simpleText || '');
      if (months !== undefined) resub.author.badges.months = months;
      return resub;
    } catch (e) {
      console.error("Error parsing data in liveChatMembershipItemRenderer:", e);
      return null;
    }
  }
}
