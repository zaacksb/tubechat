import { harvestModeration, nodeText, timestampMs } from "./common";
import { parseGenericItem } from "./fallback";
import { GiftMessageViewModel } from "./GiftMessageViewModel";
import { isBannerKey, parseBannerItem } from "./LiveChatBanner";
import { LiveChatDonationAnnouncementRenderer } from "./LiveChatDonationAnnouncementRenderer";
import { LiveChatLegacyPaidMessageRenderer } from "./LiveChatLegacyPaidMessageRenderer";
import { LiveChatMembershipItemRenderer } from "./LiveChatMembershipItemRenderer";
import { LiveChatPaidMessageRenderer } from "./LiveChatPaidMessageRenderer";
import { LiveChatPaidStickerRenderer } from "./LiveChatPaidStickerRenderer";
import { LiveChatPollAction } from "./LiveChatPollAction";
import { LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer } from "./LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer";
import { LiveChatSponsorshipsGiftRedemptionAnnouncementRenderer } from "./LiveChatSponsorshipsGiftRedemptionAnnouncementRenderer";
import { LiveChatTextMessageRenderer } from "./LiveChatTextMessageRenderer";
import { LiveChatViewerEngagementMessageRenderer } from "./LiveChatViewerEngagementMessageRenderer";
import { LiveChatModeChangeMessageRenderer } from "./liveChatModeChangeMessageRenderer";
import { MarkChatItemAsDeletedAction } from "./MarkChatItemAsDeletedAction";
import { MarkChatItemsByAuthorAsDeletedAction } from "./MarkChatItemsByAuthorAsDeletedAction";
import { RemoveChatItemAction } from "./RemoveChatItemAction";
import { RemoveChatItemByAuthorAction } from "./RemoveChatItemByAuthorAction";
import { TUBECHAT } from "./types";

// Top-level action routing (shapes read from live_chat_polymer.js handlers).
//
// addChatItemAction.item.*
//   liveChatTextMessageRenderer            -> message
//   liveChatPaidMessageRenderer            -> superchat
//   liveChatPaidStickerRenderer            -> superchat
//   liveChatLegacyPaidMessageRenderer      -> superchat
//   liveChatMembershipItemRenderer         -> member
//   liveChatSponsorshipsGiftPurchaseAnnouncementRenderer -> subgift_announce
//   liveChatSponsorshipsGiftRedemptionAnnouncementRenderer -> subgift
//   giftMessageViewModel                   -> jewels
//   liveChatDonationAnnouncementRenderer   -> donation
//   liveChatAutoModMessageRenderer         -> message (heldForReview, unwrapped)
//   liveChatModeChangeMessageRenderer      -> system
//   liveChatModerationMessageRenderer      -> notice
//   liveChatViewerEngagementMessageRenderer -> notice
//   liveChatPlaceholderItemRenderer        -> ignored (spinner, replaced later)
//   other liveChat*/gift*/poll*/banner*   -> notice (kind-tagged fallback)
// replaceChatItemAction.replacementItem.*  -> message (placeholder resolved)
// addBannerToLiveChatCommand               -> pinned / poll / notice
// updateLiveChatPollAction / showLiveChatActionPanelAction(poll) -> poll
// removeChatItemAction / markChatItemAsDeletedAction -> deletedMessage
// removeChatItemByAuthorAction / markChatItemsByAuthorAsDeletedAction -> deleteUserMessages
// clearChatWindowAction                   -> cleared
// dimChatItemAction                       -> dimmed
// serverErrorMessage                      -> notice
// addLiveChatTickerItemAction, liveChatReportModerationStateCommand,
// removeBannerForLiveChatCommand, dialogs, panels, replay, ... -> ignored

export interface EventTypeMap {
    'message': TUBECHAT.Msg_Common
    'superchat': TUBECHAT.Msg_SuperChat
    'subgift_announce': TUBECHAT.Msg_SubGift
    'subgift': TUBECHAT.Msg_SubGift
    'member': TUBECHAT.Msg_Sub
    'jewels': TUBECHAT.Msg_Jewels
    'donation': TUBECHAT.Msg_Donation
    'system': TUBECHAT.SYSTEM.ChatMode
    'notice': TUBECHAT.Msg_Notice
    'pinned': TUBECHAT.Msg_Pinned
    'poll': TUBECHAT.Msg_Poll
    'deletedMessage': string
    'deleteUserMessages': string
    'cleared': null
    'dimmed': string
}

export function parseItemRenderers(item: any): ParseResult | null {
  if (!item || typeof item !== 'object') return null;
  // AutoMod wraps the real message: unwrap and flag it.
  const automod = item.liveChatAutoModMessageRenderer;
  if (automod && typeof automod === 'object') {
    const inner = automod.autoModeratedItem;
    if (inner && typeof inner === 'object') {
      const innerKey = Object.keys(inner)[0];
      const unwrapped = innerKey ? parseItemRenderers({ [innerKey]: inner[innerKey] }) : null;
      if (unwrapped && (unwrapped.event === 'message' || unwrapped.event === 'superchat' || unwrapped.event === 'member')) {
        (unwrapped.data as TUBECHAT.Msg_Common).heldForReview = true;
        const outerMod = harvestModeration(automod);
        if (outerMod) {
          (unwrapped.data as TUBECHAT.Msg_Common).moderation = {
            ...outerMod,
            ...((unwrapped.data as TUBECHAT.Msg_Common).moderation || {}),
          };
        }
        return unwrapped;
      }
    }
    // fall through to the generic notice below
  }
  let parsed: ParseResult | null = null;
  if (item[LiveChatTextMessageRenderer.rendererKey]) {
    const data = LiveChatTextMessageRenderer.parseItem(item);
    if (data) parsed = { event: 'message', data };
  } else if (item[LiveChatPaidMessageRenderer.rendererKey]) {
    const data = LiveChatPaidMessageRenderer.parseItem(item);
    if (data) parsed = { event: 'superchat', data };
  } else if (item[LiveChatPaidStickerRenderer.rendererKey]) {
    const data = LiveChatPaidStickerRenderer.parseItem(item);
    if (data) parsed = { event: 'superchat', data };
  } else if (item[LiveChatLegacyPaidMessageRenderer.rendererKey]) {
    const data = LiveChatLegacyPaidMessageRenderer.parseItem(item);
    if (data) parsed = { event: 'superchat', data };
  } else if (item[LiveChatMembershipItemRenderer.rendererKey]) {
    const data = LiveChatMembershipItemRenderer.parseItem(item);
    if (data) parsed = { event: 'member', data };
  } else if (item[LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer.rendererKey]) {
    const data = LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer.parseItem(item);
    if (data) parsed = { event: 'subgift_announce', data };
  } else if (item[LiveChatSponsorshipsGiftRedemptionAnnouncementRenderer.rendererKey]) {
    const data = LiveChatSponsorshipsGiftRedemptionAnnouncementRenderer.parseItem(item);
    if (data) parsed = { event: 'subgift', data };
  } else if (item[GiftMessageViewModel.rendererKey]) {
    const data = GiftMessageViewModel.parseItem(item);
    if (data) parsed = { event: 'jewels', data };
  } else if (item[LiveChatDonationAnnouncementRenderer.rendererKey]) {
    const data = LiveChatDonationAnnouncementRenderer.parseItem(item);
    if (data) parsed = { event: 'donation', data };
  } else if (item[LiveChatModeChangeMessageRenderer.rendererKey]) {
    const data = LiveChatModeChangeMessageRenderer.parseItem(item);
    if (data) parsed = { event: 'system', data };
  } else if (item[LiveChatViewerEngagementMessageRenderer.rendererKey]) {
    const data = LiveChatViewerEngagementMessageRenderer.parseItem(item);
    if (data) parsed = { event: 'notice', data };
  } else if (Object.keys(item).some(isBannerKey)) {
    const key = Object.keys(item).find(isBannerKey)!;
    const bannered = parseBannerItem(item[key], key);
    if (bannered) return bannered;
  }
  if (parsed) return parsed as ParseResult;
  return parseGenericItem(item);
}

export function parse(data: any): ParseResult | null {
    if (!data || typeof data !== 'object') return null;

    if (data.addChatItemAction) {
        return parseItemRenderers(data.addChatItemAction.item);
    }
    if (data.replaceChatItemAction) {
        // Placeholder resolved into the real message: same 'message' event.
        return parseItemRenderers(data.replaceChatItemAction.replacementItem);
    }
    if (data.addBannerToLiveChatCommand) {
        const bannerRenderer = data.addBannerToLiveChatCommand.bannerRenderer || {};
        const key = Object.keys(bannerRenderer).find(isBannerKey) || 'liveChatBannerRenderer';
        return parseBannerItem(bannerRenderer[key] || bannerRenderer, key);
    }
    if (data.updateLiveChatPollAction || data.showLiveChatActionPanelAction) {
        const poll = LiveChatPollAction.parseAction(data);
        if (poll) return { event: 'poll', data: poll } as ParseResult;
        return null;
    }
    if (data.removeChatItemAction || data.markChatItemAsDeletedAction) {
        const id = RemoveChatItemAction.parseAction(data)
            ?? MarkChatItemAsDeletedAction.parseAction(data);
        if (id) return { event: 'deletedMessage', data: id } as ParseResult;
        return null;
    }
    if (data.removeChatItemByAuthorAction || data.markChatItemsByAuthorAsDeletedAction) {
        const channelId = RemoveChatItemByAuthorAction.parseAction(data)
            ?? MarkChatItemsByAuthorAsDeletedAction.parseAction(data);
        if (channelId) return { event: 'deleteUserMessages', data: channelId } as ParseResult;
        return null;
    }
    if (data.clearChatWindowAction !== undefined) {
        return { event: 'cleared', data: null } as ParseResult;
    }
    if (data.dimChatItemAction) {
        const dim = data.dimChatItemAction;
        const id = dim.targetItemId || dim.clientAssignedId;
        if (id) return { event: 'dimmed', data: id } as ParseResult;
        return null;
    }
    if (data.serverErrorMessage) {
        const err = data.serverErrorMessage;
        const text = nodeText(err.message) || nodeText(err) || 'Server error';
        return {
          event: 'notice',
          data: {
            id: '',
            message: text,
            timestampUsec: err.timestampUsec || '',
            timestamp: timestampMs(err.timestampUsec),
            kind: 'serverErrorMessage',
          },
        } as ParseResult;
    }
    if (data.addLiveChatTickerItemAction) {
        // The ticker duplicates the superchat card (same id -> deduped).
        // Parsing the nested renderer also harvests its reply/heart/menu params.
        const nested = data.addLiveChatTickerItemAction?.item?.showItemEndpoint?.renderer;
        if (nested && typeof nested === 'object') {
            const key = Object.keys(nested)[0];
            if (key) return parseItemRenderers({ [key]: (nested as any)[key] });
        }
        return null;
    }

    return null;
}



export type ParseResult = {
    [K in keyof EventTypeMap]: {
        event: K;
        data: EventTypeMap[K];
    }
}[keyof EventTypeMap];
