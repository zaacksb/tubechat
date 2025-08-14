import { findKey } from "../utils";
import { TUBECHAT } from "./types";


export class RemoveChatItemByAuthorAction {
  // removeChatItemByAuthorAction
  public static readonly rendererKey = 'removeChatItemByAuthorAction';

  public static parse(data: any): string | null {
    const renderer = findKey<any>(data, this.rendererKey);
    if (!renderer) {
      return null;
    }
    
    try {
      return (renderer as TUBECHAT.SYSTEM.Msg_deleteUserMessage).externalChannelId
     
    } catch (e) {
      console.error("Error parsing data in removeChatItemByAuthorAction:", e);
      return null;
    }
  }
}
