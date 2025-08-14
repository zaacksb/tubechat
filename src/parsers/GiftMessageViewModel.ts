import { findKey } from "../utils";
import { TUBECHAT } from "./types";


export class GiftMessageViewModel {
  // giftMessageViewModel:
  public static readonly rendererKey = 'giftMessageViewModel';

  public static parse(data: any): TUBECHAT.Msg_Jewels | null {
    const renderer = findKey<any>(data, this.rendererKey);
    if (!renderer) {
      return null;
    }
    try {
      const jewels = {
        id: renderer['id'],
        author: {
          channelName: renderer['authorName']['content']
        },
        content: renderer['text']['content']
      } satisfies TUBECHAT.Msg_Jewels
      return jewels

    } catch (e) {
      console.error("Error parsing data in giftMessageViewModel:", e);
      return null;
    }
  }
}
