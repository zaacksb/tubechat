import { findKey } from "../utils";
import parseBadges from "./parseBadges";
import parseMessages from "./parseMessage";
import { TUBECHAT } from "./types";
import { formatBeforeContentButtons } from "./utilsParser";


export class LiveChatTextMessageRenderer {
  // liveChatTextMessageRenderer
  public static readonly rendererKey = 'liveChatTextMessageRenderer';

  public static parse(data: any): TUBECHAT.Msg_Common | null {
    const renderer = findKey<any>(data, this.rendererKey);
    if (!renderer) {
      return null;
    }
    
    try {
      const message = renderer?.['message']?.['runs'] ? parseMessages(renderer['message']) : []
      const badges = parseBadges(renderer['authorBadges'] || [], formatBeforeContentButtons(renderer['beforeContentButtons'] || []))
      const commonMsg: TUBECHAT.Msg_Common = {
        id: renderer['id'],
        author: {
          ...badges,
          photo: renderer['authorPhoto']['thumbnails'][0].url,
          channelName: renderer['authorName']['simpleText'],
          channelId: renderer['authorExternalChannelId'],
        },
        message,
        timestampUsec: renderer['timestampUsec'],
      }


      return commonMsg
    } catch (e) {
      console.error("Error parsing data in liveChatTextMessageRenderer:", e);
      return null;
    }
  }
}
