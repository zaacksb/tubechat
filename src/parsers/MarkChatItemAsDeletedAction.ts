import { TUBECHAT } from "./types";


/** New-format single-message delete. Same event as removeChatItemAction. */
export class MarkChatItemAsDeletedAction {
  public static readonly rendererKey = 'markChatItemAsDeletedAction';

  public static parseAction(action: any): string | null {
    const renderer = action?.[this.rendererKey] as TUBECHAT.SYSTEM.Msg_deletedMessage | undefined;
    if (!renderer) {
      return null;
    }

    try {
      return renderer.targetItemId || null;
    } catch (e) {
      console.error("Error parsing data in markChatItemAsDeletedAction:", e);
      return null;
    }
  }
}
