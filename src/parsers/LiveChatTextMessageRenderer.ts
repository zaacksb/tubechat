import { authorNameToText, authorPhotoUrl, harvestModeration, messageText, parseAuthorBadges, timestampMs } from "./common";
import parseMessages from "./parseMessage";
import { TUBECHAT } from "./types";


export class LiveChatTextMessageRenderer {
  // liveChatTextMessageRenderer
  public static readonly rendererKey = 'liveChatTextMessageRenderer';

  public static parseItem(item: any): TUBECHAT.Msg_Common | null {
    const renderer = item?.[this.rendererKey];
    if (!renderer) {
      return null;
    }

    try {
      const message = renderer?.['message']?.['runs'] ? parseMessages(renderer['message']) : [];
      const badges = parseAuthorBadges(renderer);
      const moderation = harvestModeration(renderer);
      const commonMsg: TUBECHAT.Msg_Common = {
        id: renderer['id'],
        author: {
          ...badges,
          photo: authorPhotoUrl(renderer['authorPhoto']),
          channelName: authorNameToText(renderer['authorName']),
          channelId: renderer['authorExternalChannelId'],
        },
        message,
        text: messageText(message),
        timestampUsec: renderer['timestampUsec'],
        timestamp: timestampMs(renderer['timestampUsec']),
        ...(moderation && { moderation }),
      };


      return commonMsg;
    } catch (e) {
      console.error("Error parsing data in liveChatTextMessageRenderer:", e);
      return null;
    }
  }
}
