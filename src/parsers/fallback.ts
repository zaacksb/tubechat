import { firstText, timestampMs } from "./common";
import { TUBECHAT } from "./types";

/**
 * Catch-all for live chat renderers without a dedicated parser
 * (Q&A prompts, new gift variants, error cards, ...). Emits a kind-tagged
 * notice instead of silently dropping the item. Pure UI chrome
 * (placeholders, tickers, input, lists, panels, dialogs) stays ignored.
 */
const IGNORED = new Set([
  'liveChatPlaceholderItemRenderer',
  'liveChatTickerRenderer',
  'liveChatTickerPaidMessageItemRenderer',
  'liveChatTickerPaidStickerItemRenderer',
  'liveChatTickerSponsorItemRenderer',
  'liveChatTickerCreatorGoalViewModel',
  'liveChatTickerFanzoneViewModel',
  'liveChatMessageInputRenderer',
  'liveChatTextInputFieldRenderer',
  'liveChatItemListRenderer',
  'liveChatItemDisplayListRenderer',
  'liveChatItemDisplayRenderer',
  'liveChatHeaderRenderer',
  'liveChatParticipantsListRenderer',
  'liveChatParticipantRenderer',
  'liveChatProductPickerRenderer',
  'liveChatProductPickerPanelViewModel',
  'liveChatProductPickerPanelItemViewModel',
  'liveChatProductButtonRenderer',
  'liveChatEngagementPanelRenderer',
  'liveChatEngagementPanelInputRenderer',
  'liveChatPollEditorPanelRenderer',
  'liveChatQnaStartPanelRenderer',
  'liveChatQnaInputPromptHeaderRenderer',
  'liveChatIconToggleButtonRenderer',
  'liveChatEmptyFeedViewModel',
  'liveChatItemBumperViewModel',
  'liveChatProfileIdentityViewModel',
  'liveChatGoalBannerViewModel',
  'liveChatChannelGuidelinesDialogRenderer',
  'liveChatDialogRenderer',
]);

const TEXT_KEYS = [
  'message', 'text', 'headerText', 'pollQuestion', 'subtext', 'title',
  'primaryText', 'question', 'content', 'description', 'label',
];

export function isIgnoredRendererKey(key: string): boolean {
  return IGNORED.has(key);
}

export function parseGenericItem(item: any): { event: 'notice', data: TUBECHAT.Msg_Notice } | null {
  if (!item || typeof item !== 'object') return null;
  for (const key of Object.keys(item)) {
    if (!/^(liveChat|gift|poll|banner)[A-Za-z0-9_]*(Renderer|ViewModel)$/.test(key)) continue;
    if (IGNORED.has(key)) return null;
    const renderer = item[key];
    if (!renderer || typeof renderer !== 'object') continue;
    const text = firstText(renderer, TEXT_KEYS);
    const id = typeof renderer.id === 'string' ? renderer.id : '';
    if (!text && !id) continue;
    return {
      event: 'notice',
      data: {
        id,
        message: text,
        timestampUsec: renderer.timestampUsec || '',
        timestamp: timestampMs(renderer.timestampUsec),
        kind: key,
      },
    };
  }
  return null;
}
