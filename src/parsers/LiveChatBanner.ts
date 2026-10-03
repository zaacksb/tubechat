import { firstText, nodeText, timestampMs } from "./common";
import { parseItemRenderers, type ParseResult } from "./index";
import { pollRendererToPoll } from "./LiveChatPollAction";
import { RunWithText, TUBECHAT } from "./types";

/** Banner-family renderers that can wrap chat content. */
const BANNER_KEYS = [
  'liveChatBannerRenderer',
  'liveChatBannerPollRenderer',
  'liveChatBannerChatSummaryRenderer',
  'liveChatBannerRedirectRenderer',
  'liveChatSponsorshipsGiftRedemptionBannerRenderer',
];

export function isBannerKey(key: string): boolean {
  return BANNER_KEYS.includes(key);
}

function headerText(banner: any): string {
  const header = banner?.header;
  if (!header) return '';
  return nodeText(header?.liveChatBannerHeaderRenderer?.text)
    || firstText(header, ['text', 'title'])
    || '';
}

/** Parse a banner renderer: pinned message, poll, or kind-tagged notice. */
export function parseBannerItem(banner: any, key: string): ParseResult | null {
  if (!banner || typeof banner !== 'object') return null;
  try {
    const contents = banner.contents;
    const pinnedBy = (() => {
      const runs = (banner?.header?.liveChatBannerHeaderRenderer?.text?.runs || []) as RunWithText[];
      if (runs.length > 1) return runs.slice(1).map(r => r.text).join('').trim() || undefined;
      const all = headerText(banner).replace(/^pinned by\s*/i, '').trim();
      return all || undefined;
    })();
    if (contents?.pollRenderer) {
      const poll = pollRendererToPoll(contents.pollRenderer);
      if (poll) return { event: 'poll', data: poll } as ParseResult;
    }
    if (contents && typeof contents === 'object') {
      const inner = parseItemRenderers(contents);
      if (inner) {
        if (inner.event === 'message') {
          return {
            event: 'pinned',
            data: { ...(inner.data as TUBECHAT.Msg_Common), ...(pinnedBy && { pinnedBy }) },
          } as ParseResult;
        }
        return inner;
      }
      const innerText = firstText(contents, ['message', 'text', 'headerText', 'pollQuestion', 'subtext', 'title', 'primaryText']);
      const text = [headerText(banner), innerText].filter(Boolean).join(' — ');
      if (text) {
        return {
          event: 'notice',
          data: {
            id: banner.id || contents.id || '',
            message: text,
            timestampUsec: banner.timestampUsec || contents.timestampUsec || '',
            timestamp: timestampMs(banner.timestampUsec || contents.timestampUsec),
            kind: key,
          },
        } as ParseResult;
      }
    }
    const text = headerText(banner);
    if (text) {
      return {
        event: 'notice',
        data: {
          id: banner.id || '',
          message: text,
          timestampUsec: banner.timestampUsec || '',
          timestamp: timestampMs(banner.timestampUsec),
          kind: key,
        },
      } as ParseResult;
    }
    return null;
  } catch (e) {
    console.error('Error parsing banner item:', e);
    return null;
  }
}
