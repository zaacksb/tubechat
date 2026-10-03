import { nodeText } from "./common";
import { RunWithText, TUBECHAT } from "./types";

/** updateLiveChatPollAction + liveChatActionPanelRenderer poll content -> poll event.
 *  Creator-only for creation; anyone can vote via choices[].params. */
export class LiveChatPollAction {
  public static parseAction(action: any): TUBECHAT.Msg_Poll | null {
    try {
      const update = action?.updateLiveChatPollAction?.pollToUpdate?.pollRenderer;
      if (update) return pollRendererToPoll(update);
      const panel = action?.showLiveChatActionPanelAction?.panelToShow?.liveChatActionPanelRenderer?.contents;
      const fromPanel = panel?.pollRenderer;
      if (fromPanel) return pollRendererToPoll(fromPanel);
      return null;
    } catch (e) {
      console.error("Error parsing data in liveChatPollAction:", e);
      return null;
    }
  }
}

export function pollRendererToPoll(poll: any): TUBECHAT.Msg_Poll {  const header = poll?.header?.pollHeaderRenderer || {};
  const question = Array.isArray(header?.pollQuestion?.runs)
    ? (header.pollQuestion.runs as RunWithText[]).map(r => r.text).join('')
    : (header?.pollQuestion?.simpleText || '');
  const metadataRuns = (header?.metadataText?.runs || []) as RunWithText[];
  const metadata = metadataRuns.map(r => r.text).join('');
  const votesMatch = metadata.match(/([\d.,]+)\s*votes?/i);
  const totalVotes = votesMatch ? parseInt(votesMatch[1]!.replace(/[.,]/g, ''), 10) : undefined;
  const choices = (poll?.choices || []).map((c: any) => ({
    text: Array.isArray(c?.text?.runs)
      ? (c.text.runs as RunWithText[]).map(r => r.text).join('')
      : (c?.text?.simpleText || ''),
    ...(typeof c?.voteRatio === 'number' && { voteRatio: c.voteRatio }),
    ...((nodeText(c?.votePercentage)) && { votePercentage: nodeText(c.votePercentage) }),
    ...(c?.selectServiceEndpoint?.sendLiveChatVoteEndpoint?.params && {
      params: c.selectServiceEndpoint.sendLiveChatVoteEndpoint.params
    }),
  }));
  return {
    id: poll?.liveChatPollId || header?.pollId || '',
    question,
    ...(Array.isArray(header?.thumbnail?.thumbnails) && header.thumbnail.thumbnails.length > 0 && {
      thumbnail: header.thumbnail.thumbnails[header.thumbnail.thumbnails.length - 1]?.url
    }),
    ...(metadata && { metadata }),
    ...(totalVotes !== undefined && !Number.isNaN(totalVotes) && { totalVotes }),
    choices,
  };
}
