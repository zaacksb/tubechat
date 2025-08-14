import { findKey } from "../utils";
import { TUBECHAT } from "./types";


export class RemoveChatItemAction {
  // removeChatItemAction
  public static readonly rendererKey = 'removeChatItemAction';

  public static parse(data: any): string | null {
    const renderer = findKey<any>(data, this.rendererKey);
    if (!renderer) {
      return null;
    }
    
    try {
      return (renderer as TUBECHAT.SYSTEM.Msg_deletedMessage).targetItemId
     
    } catch (e) {
      console.error("Error parsing data in removeChatItemAction:", e);
      return null;
    }
  }
}
