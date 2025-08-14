import { GiftMessageViewModel } from "./GiftMessageViewModel";
import { LiveChatMembershipItemRenderer } from "./LiveChatMembershipItemRenderer";
import { LiveChatModeChangeMessageRenderer } from "./liveChatModeChangeMessageRenderer";
import { LiveChatPaidMessageRenderer } from "./LiveChatPaidMessageRenderer";
import { LiveChatPaidStickerRenderer } from "./LiveChatPaidStickerRenderer";
import { LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer } from "./LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer";
import { LiveChatSponsorshipsGiftRedemptionAnnouncementRenderer } from "./LiveChatSponsorshipsGiftRedemptionAnnouncementRenderer";
import { LiveChatTextMessageRenderer } from "./LiveChatTextMessageRenderer";
import { RemoveChatItemAction } from "./RemoveChatItemAction";
import { RemoveChatItemByAuthorAction } from "./RemoveChatItemByAuthorAction";
import { TUBECHAT } from "./types";

// when a user sends a text message
// liveChatTextMessageRenderer

// when a user sends a superchat 0.1 or more
// liveChatPaidMessageRenderer

// when a user sends a superchat suficiently to stay on (header of chat)
// liveChatTickerPaidMessageItemRenderer

// when a user sends a superchat sticker 0.1 or more
// liveChatPaidStickerRenderer

// when a user sends a superchat suficiently to stay on (header of chat)
// liveChatTickerPaidStickerItemRenderer

// when a user become a member
// liveChatMembershipItemRenderer

// when a user become a member (header of chat)
// liveChatTickerSponsorItemRenderer

// when a user receive a sub gift
// liveChatSponsorshipsGiftRedemptionAnnouncementRenderer  

// when one or more people sends subgift
// liveChatSponsorshipsGiftPurchaseAnnouncementRenderer

// when a user send gift Jewels (type of shorts donate)
// giftMessageViewModel

// when a user has been silenced/banned - delete all messages
// removeChatItemByAuthorAction

// when a unique message has been deleted
// removeChatItemAction


const allParsers = [
    { group: 'message' as const, parser: LiveChatTextMessageRenderer },
    { group: 'superchat' as const, parser: LiveChatPaidMessageRenderer },
    { group: 'superchat' as const, parser: LiveChatPaidStickerRenderer},
    { group: 'subgift_announce' as const, parser: LiveChatSponsorshipsGiftPurchaseAnnouncementRenderer},
    { group: 'subgift' as const, parser: LiveChatSponsorshipsGiftRedemptionAnnouncementRenderer},
    { group: 'member' as const, parser: LiveChatMembershipItemRenderer},
    { group: 'jewels' as const, parser: GiftMessageViewModel},
    { group: 'system' as const, parser: LiveChatModeChangeMessageRenderer},
    { group: 'deletedMessage' as const, parser: RemoveChatItemAction},
    { group: 'deleteUserMessages' as const, parser: RemoveChatItemByAuthorAction}
]
export interface EventTypeMap {
    'message': TUBECHAT.Msg_Common
    'superchat': TUBECHAT.Msg_SuperChat
    'subgift_announce': TUBECHAT.Msg_SubGift
    'subgift': TUBECHAT.Msg_SubGift
    'member': TUBECHAT.Msg_Sub
    'jewels': TUBECHAT.Msg_Jewels
    'system': TUBECHAT.SYSTEM.ChatMode
    'deletedMessage': string
    'deleteUserMessages': string
}
export function parse(data: any): ParseResult | null {
    for (const { group, parser } of allParsers) {
        const parsedData = parser.parse(data);
        if (parsedData) {
            return {
                event: group,
                data: parsedData
            } as ParseResult
        }
    }

    return null;
}



export type ParseResult = {
    [K in keyof EventTypeMap]: {
        event: K;
        data: EventTypeMap[K];
    }
}[keyof EventTypeMap];

type ParserClass = {
    parse(data: any): EventTypeMap[keyof EventTypeMap] | null;
}