import { TUBECHAT } from "./types";


/** New-format ban/timeout (delete all messages from author). Same event as removeChatItemByAuthorAction. */
export class MarkChatItemsByAuthorAsDeletedAction {
  public static readonly rendererKey = 'markChatItemsByAuthorAsDeletedAction';

  public static parseAction(action: any): string | null {
    const renderer = action?.[this.rendererKey] as TUBECHAT.SYSTEM.Msg_deleteUserMessage | undefined;
    if (!renderer) {
      return null;
    }

    try {
      return (renderer as any).externalChannelId || (renderer as any).deletedStateOwnerChannelId || null;
    } catch (e) {
      console.error("Error parsing data in markChatItemsByAuthorAsDeletedAction:", e);
      return null;
    }
  }
}
