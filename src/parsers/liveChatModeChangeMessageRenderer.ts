import { ChatModes, RunWithText, TUBECHAT } from "./types";

function runsToText(node: any): string {
  if (!node) return '';
  if (typeof node.simpleText === 'string') return node.simpleText;
  if (Array.isArray(node.runs)) {
    return (node.runs as RunWithText[]).map(run => run.text).join('');
  }
  return '';
}

export class LiveChatModeChangeMessageRenderer {
  // liveChatModeChangeMessageRenderer:
  public static readonly rendererKey = 'liveChatModeChangeMessageRenderer';

  public static parseItem(item: any): TUBECHAT.SYSTEM.ChatMode | null {
    const renderer = item?.[this.rendererKey];
    if (!renderer) {
      return null;
    }
    try {
      const textRuns = (renderer['text']?.['runs'] || []) as RunWithText[];
      const allModes = Object.values(ChatModes);
      let mode: ChatModes | '' = '';
      for (const element of textRuns) {
        const text = (element.text || '').toLowerCase();
        const foundMode = allModes.find(m => text.includes(m.toLowerCase()));

        if (foundMode) {
          mode = foundMode;
          break;
        }
      }

      if (mode === ChatModes.SelectedUsers) {
        const enabled = (renderer.text?.runs?.[0]?.text || '').endsWith('on') ? true : false;
        const selectedUsers: TUBECHAT.SYSTEM.Msg_SelectedUsers = {
          type: ChatModes.SelectedUsers,
          id: renderer['id'],
          enabled,
          message: runsToText(renderer.subtext),
          timestampUsec: renderer['timestampUsec'],
        };
        return selectedUsers;
      }
      if (mode === ChatModes.SlowMode) {
        const enabled = (renderer.text?.runs?.[0]?.text || '').endsWith('on') ? true : false;
        const subtext = runsToText(renderer.subtext);
        const minutes = enabled ? Number((subtext.match(/(\d+)/) || [])[1] || 0) : 0;
        const slowDown: TUBECHAT.SYSTEM.Msg_SlowMode = {
          type: ChatModes.SlowMode,
          id: renderer['id'],
          enabled,
          message: subtext,
          minutes,
          timestampUsec: renderer['timestampUsec'],
        };
        return slowDown;
      }
      if (mode === ChatModes.SubscribersOnly) {
        const enabled = (renderer.text?.runs?.[1]?.text || '').includes('turned on') ? true : false;
        const subtext = runsToText(renderer.subtext);
        const subRuns = (renderer.subtext?.runs || []) as RunWithText[];
        const minutes = enabled ? Number(((subRuns[1]?.text || subtext).match(/(\d+)/) || [])[1] || 0) : 0;
        const subscribersOnly: TUBECHAT.SYSTEM.Msg_SubscribersOnly = {
          type: ChatModes.SubscribersOnly,
          id: renderer['id'],
          user: renderer['text']?.['runs']?.[0]?.text || '',
          enabled,
          message: subtext,
          minutes,
          timestampUsec: renderer['timestampUsec'],
        };

        return subscribersOnly;

      }

      return null;
    } catch (e) {
      console.error("Error parsing data in liveChatModeChangeMessageRenderer:", e);
      return null;
    }
  }
}
