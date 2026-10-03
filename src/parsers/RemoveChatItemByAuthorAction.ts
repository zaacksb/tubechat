import { TUBECHAT } from "./types";


export class RemoveChatItemByAuthorAction {
  // removeChatItemByAuthorAction
  public static readonly rendererKey = 'removeChatItemByAuthorAction';

  public static parseAction(action: any): string | null {
    const renderer = action?.[this.rendererKey] as TUBECHAT.SYSTEM.Msg_deleteUserMessage | undefined;
    if (!renderer) {
      return null;
    }

    try {
      return renderer.externalChannelId || null;
    } catch (e) {
      console.error("Error parsing data in removeChatItemByAuthorAction:", e);
      return null;
    }
  }
}
