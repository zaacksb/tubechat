import { findKey } from "../utils";
import { ChatModes, RunWithText, TUBECHAT } from "./types";

export class LiveChatModeChangeMessageRenderer {
  // liveChatModeChangeMessageRenderer:
  public static readonly rendererKey = 'liveChatModeChangeMessageRenderer';

  public static parse(data: any): TUBECHAT.SYSTEM.ChatMode | null {
    const renderer = findKey<any>(data, this.rendererKey);
    if (!renderer) {
      return null;
    }
    try {
      const textRuns = renderer['text']['runs'] as RunWithText[]
      const allModes = Object.values(ChatModes);
      let mode: ChatModes | '' = '';
      for (const element of textRuns) {
        const text = element.text.toLowerCase();
        const foundMode = allModes.find(m => text.includes(m.toLowerCase()));

        if (foundMode) {
          mode = foundMode;
          break;
        }
      }

      if (mode === ChatModes.SelectedUsers) {
        const enabled = renderer.text?.runs[0].text.endsWith('on') ? true : false
        const selectedUsers: TUBECHAT.SYSTEM.Msg_SelectedUsers = {
          type: ChatModes.SelectedUsers,
          id: renderer['id'],
          enabled,
          message: (renderer.subtext.runs as RunWithText[]).map(run => run.text).join(''),
          timestampUsec: renderer['timestampUsec'],
        }
        return selectedUsers
      }
      if (mode === ChatModes.SlowMode) {
        const enabled = renderer.text?.runs[0].text.endsWith('on') ? true : false
        const slowDown: TUBECHAT.SYSTEM.Msg_SlowMode = {
          type: ChatModes.SlowMode,
          id: renderer['id'],
          enabled,
          message: (renderer.subtext.runs as RunWithText[]).map(run => run.text).join(''),
          minutes: enabled ? Number(renderer.subtext.runs.at(-1).text.split(' ')[0]) : 0,
          timestampUsec: renderer['timestampUsec'],
        }
        return slowDown
      }
      if (mode === ChatModes.SubscribersOnly) {
        const enabled = renderer.text?.runs[1].text.includes('turned on') ? true : false
        const subscribersOnly: TUBECHAT.SYSTEM.Msg_SubscribersOnly = {
          type: ChatModes.SubscribersOnly,
          id: renderer['id'],
          user: renderer['text']['runs'][0].text,
          enabled,
          message: (renderer.subtext.runs as RunWithText[]).map(run => run.text).join(''),
          minutes: enabled ? Number(renderer.subtext.runs[1].text.split(' ')[0]) : 0,
          timestampUsec: renderer['timestampUsec'],
        }

        return subscribersOnly

      }

      return null
    } catch (e) {
      console.error("Error parsing data in liveChatModeChangeMessageRenderer:", e);
      return null;
    }
  }
}
