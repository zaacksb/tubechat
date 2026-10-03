import { timestampMs } from "./common";
import { RunWithText, TUBECHAT } from "./types";

/** Viewer-facing notices (subscribers-only notice, welcome card, ...). */
export class LiveChatViewerEngagementMessageRenderer {
  public static readonly rendererKey = 'liveChatViewerEngagementMessageRenderer';

  public static parseItem(item: any): TUBECHAT.Msg_Notice | null {
    const renderer = item?.[this.rendererKey];
    if (!renderer) return null;
    try {
      const message = Array.isArray(renderer.message?.runs)
        ? (renderer.message.runs as RunWithText[]).map(r => r.text).join('')
        : (renderer.message?.simpleText || '');
      return {
        id: renderer.id,
        message,
        timestampUsec: renderer.timestampUsec,
        timestamp: timestampMs(renderer.timestampUsec),
      };
    } catch (e) {
      console.error("Error parsing data in liveChatViewerEngagementMessageRenderer:", e);
      return null;
    }
  }
}
