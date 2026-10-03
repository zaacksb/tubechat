import parseBadges from './parseBadges';
import { lastThumbnailUrl } from './parseMessage';
import { MessageData, TUBECHAT } from './types';
import { formatBeforeContentButtons } from './utilsParser';

/** Join message runs into plain text. */
export function messageText(message: MessageData | undefined | null): string {
  if (!Array.isArray(message)) return '';
  return message.map(part => part?.text || '').join('');
}

/** Micros -> millis (0 when absent/invalid). */
export function timestampMs(timestampUsec: string | undefined | null): number {
  const ms = Math.round(Number(timestampUsec) / 1000);
  return Number.isFinite(ms) ? ms : 0;
}

export function authorNameToText(authorName: any): string {
  if (!authorName) return '';
  if (typeof authorName === 'string') return authorName;
  if (typeof authorName.simpleText === 'string') return authorName.simpleText;
  if (Array.isArray(authorName.runs)) {
    return authorName.runs.map((r: any) => r?.text || '').join('');
  }
  return '';
}

export function authorPhotoUrl(authorPhoto: any): string {
  return lastThumbnailUrl(authorPhoto?.thumbnails);
}

const MOD_ICON_MAP: Record<string, 'remove' | 'timeout' | 'hide'> = {
  DELETE: 'remove',
  HOURGLASS: 'timeout',
  REMOVE_CIRCLE: 'hide',
};

/** Find a menu item's moderate params by slot, matching icon or label.
 *  Accepts both inline `buttonRenderer` entries and fetched
 *  `menuServiceItemRenderer` entries (get_item_context_menu). */
export function findMenuButtonParams(items: any[], slot: 'remove' | 'timeout' | 'hide'): string | undefined {
  if (!Array.isArray(items)) return undefined;
  for (const entry of items) {
    const btn = entry?.buttonRenderer || entry?.menuServiceItemRenderer;
    if (!btn) continue;
    const params = btn?.serviceEndpoint?.moderateLiveChatEndpoint?.params;
    if (typeof params !== 'string' || !params) continue;
    const kind = MOD_ICON_MAP[btn?.icon?.iconType] || (
      /timeout/i.test(btn?.accessibility?.label || '') ? 'timeout' :
        /hide|ban/i.test(btn?.accessibility?.label || '') ? 'hide' :
          /remove|delete/i.test(btn?.accessibility?.label || '') ? 'remove' : undefined
    );
    if (kind === slot) return params;
  }
  return undefined;
}

/** Harvest server-minted moderation params from a message renderer. */
export function harvestModeration(renderer: any): TUBECHAT.ModerationParams | undefined {
  if (!renderer) return undefined;
  const out: TUBECHAT.ModerationParams = {};
  const buttons = renderer.inlineActionButtons;
  if (Array.isArray(buttons)) {
    for (const entry of buttons) {
      const btn = entry?.buttonRenderer;
      const params = btn?.serviceEndpoint?.moderateLiveChatEndpoint?.params;
      const slot = MOD_ICON_MAP[btn?.icon?.iconType] || (
        /timeout/i.test(btn?.accessibility?.label || '') ? 'timeout' :
          /hide/i.test(btn?.accessibility?.label || '') ? 'hide' :
            /remove|delete/i.test(btn?.accessibility?.label || '') ? 'remove' : undefined
      );
      if (slot && typeof params === 'string' && params) out[slot] = params;
    }
  }
  const ctxParams = renderer?.contextMenuEndpoint?.liveChatItemContextMenuEndpoint?.params;
  if (typeof ctxParams === 'string' && ctxParams) out.contextMenu = ctxParams;
  return Object.keys(out).length > 0 ? out : undefined;
}

export function parseAuthorBadges(renderer: any) {
  return parseBadges(
    renderer?.['authorBadges'] || [],
    formatBeforeContentButtons(renderer?.['beforeContentButtons'] || [])
  );
}

/** Empty author shell for renderers that may omit author details. */
export function emptyAuthor() {
  return {
    isMembership: false,
    isNewMember: false,
    isOwner: false,
    isVerified: false,
    isModerator: false,
    badges: {},
    color: '#bcbcbc',
    channelId: '',
    channelName: '',
    photo: '',
  };
}

/** Best-effort text from runs/simpleText/content shapes. */
export function nodeText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node.simpleText === 'string') return node.simpleText;
  if (typeof node.content === 'string') return node.content;
  if (Array.isArray(node.runs)) {
    return node.runs.map((r: any) => (typeof r?.text === 'string' ? r.text : nodeText(r))).join('');
  }
  return '';
}

/** First non-empty text across candidate sub-nodes (for heterogeneous renderers). */
export function firstText(renderer: any, keys: string[]): string {
  if (!renderer) return '';
  for (const k of keys) {
    const t = nodeText(renderer[k]);
    if (t) return t;
  }
  return '';
}

/** Superchat engagement affordances (all read-only except panel entry points).
 *  replyThread: params to open the reply thread panel (PAreply_thread).
 *  creatorHeart: who hearted (creator-only action; exposed as read state). */
export function harvestSuperchatExtras(renderer: any): {
  replyThread?: { params: string }
  creatorHeart?: { by: string }
} | undefined {
  if (!renderer) return undefined;
  const out: { replyThread?: { params: string }, creatorHeart?: { by: string } } = {};
  const panelParams = renderer?.replyButton?.pdgReplyButtonViewModel?.replyButton?.buttonViewModel
    ?.onTap?.innertubeCommand?.showEngagementPanelEndpoint?.globalConfiguration?.params;
  if (typeof panelParams === 'string' && panelParams) {
    out.replyThread = { params: panelParams };
  }
  const hoverText: unknown = renderer?.creatorHeartButton?.creatorHeartViewModel?.heartedHoverText;
  if (typeof hoverText === 'string') {
    const m = hoverText.match(/@([^\s]+)/);
    out.creatorHeart = { by: m?.[1] ? `@${m[1]}` : hoverText };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
