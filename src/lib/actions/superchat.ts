import { convertSymbolCurrencies } from '../..'
import { IChatYTMessage } from "../../types/Client"
import { IChatAuthorBadge, IChatMessage, IChatThumbnail } from "../../types/Types"
import { convertColorToHex6, parseThumbnailToImageItem } from "../utils"
import { createCommonUserResponse } from "./actionsUtils"
interface LiveSuperChat {
  id: string
  timestampUsec: string
  authorPhoto: {
    thumbnails: IChatThumbnail[]
  }
  authorName: {
    simpleText: string
  }
  purchaseAmountText: {
    simpleText: string
  }
  authorBadges: IChatAuthorBadge[]
  authorNameTextColor: number
  authorExternalChannelId: string
}
interface LiveChatPaidStickerRendererRes {
  sticker: {
    thumbnails: IChatThumbnail[]
    accessibility: {
      accessibilityData: {
        label: string
      }
    }
  }
  moneyChipBackgroundColor: number
  moneyChipTextColor: number
  backgroundColor: number
}
type LiveChatPaidStickerRenderer = LiveSuperChat & LiveChatPaidStickerRendererRes

interface LiveChatPaidMessageRendererRes {
  headerBackgroundColor: number
  headerTextColor: number
  bodyBackgroundColor: number
  bodyTextColor: number
  timestampColor: number
  headerOverlayImage: {
    thumbnails: IChatThumbnail[]
  }
  textInputBackgroundColor: number
}

interface LiveChatPaidMessageRenderer extends LiveSuperChat, LiveChatPaidMessageRendererRes {
  message: {
    runs: IChatMessage[]
  }

}

interface ISuperChats {
  liveChatPaidStickerRenderer: LiveChatPaidStickerRenderer
  liveChatPaidMessageRenderer: LiveChatPaidMessageRenderer
}

export interface ISuperChat extends IChatYTMessage {
  bodyBackgroundColor: string
  authorNameTextColor: string
  headerBackgroundColor: string
  headerTextColor: string
  bodyTextColor: string
  timestampColor: string
  headerOverlayImage: {
    thumbnails: IChatThumbnail[]
  }
  formated: string
  amount: number
  currency: string
  textInputBackgroundColor: string
}
export interface ISuperChatSticker extends IChatYTMessage {
  moneyChipBackgroundColor: string
  moneyChipTextColor: string
  backgroundColor: string
  formated: string
  amount: number
  currency: string
  sticker: {
    url: string,
    alt: string
  }
}

const superchat = (messageData: ISuperChats, emitter: NodeJS.EventEmitter, channel: string) => {
  if (messageData?.liveChatPaidMessageRenderer) {
    const { purchaseAmountText, bodyBackgroundColor, authorNameTextColor, headerBackgroundColor, headerTextColor, bodyTextColor, timestampColor, headerOverlayImage, textInputBackgroundColor } = messageData.liveChatPaidMessageRenderer
    const responseData = createCommonUserResponse(messageData.liveChatPaidMessageRenderer) as ISuperChat
    responseData.bodyBackgroundColor = convertColorToHex6(bodyBackgroundColor)
    responseData.authorNameTextColor = convertColorToHex6(authorNameTextColor)
    responseData.headerBackgroundColor = convertColorToHex6(headerBackgroundColor)
    responseData.headerTextColor = convertColorToHex6(headerTextColor)
    responseData.bodyTextColor = convertColorToHex6(bodyTextColor)
    responseData.timestampColor = convertColorToHex6(timestampColor)
    responseData.textInputBackgroundColor = convertColorToHex6(textInputBackgroundColor)
    responseData.headerOverlayImage = headerOverlayImage
    const { value: amount, currency } = convertSymbolCurrencies(purchaseAmountText.simpleText)
    responseData.amount = amount
    responseData.currency = currency
    responseData.formated = purchaseAmountText.simpleText
    emitter.emit("superchat", { channel, ...responseData })
  } else if (messageData?.liveChatPaidStickerRenderer) {
    const { purchaseAmountText, sticker, moneyChipBackgroundColor, moneyChipTextColor, backgroundColor } = messageData.liveChatPaidStickerRenderer
    const responseData = createCommonUserResponse(messageData.liveChatPaidStickerRenderer) as ISuperChatSticker
    responseData.moneyChipBackgroundColor = convertColorToHex6(moneyChipBackgroundColor)
    responseData.moneyChipTextColor = convertColorToHex6(moneyChipTextColor)
    responseData.backgroundColor = convertColorToHex6(backgroundColor)
    responseData.formated = purchaseAmountText.simpleText
    responseData.sticker = parseThumbnailToImageItem(sticker.thumbnails, sticker.accessibility.accessibilityData.label)
    const { value: amount, currency } = convertSymbolCurrencies(purchaseAmountText.simpleText)
    responseData.amount = amount
    responseData.currency = currency
    responseData.formated = purchaseAmountText.simpleText
    emitter.emit("superchatSticker", { channel, ...responseData })
  }
}

export default superchat



// {"id":"ChwKGkNQbkx0TUNkLW9BREZjckN3Z1FkcWdFRHBn","timestampUsec":"1693049668062024","authorName":{"simpleText":"Cris Sykes"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/ytc/AOPolaR_hOyn7EVjXzj8824PeV5sUe9_o3ojs1x8TwDsVw=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/ytc/AOPolaR_hOyn7EVjXzj8824PeV5sUe9_o3ojs1x8TwDsVw=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"purchaseAmountText":{"simpleText":"R$2.00"},"message":{"runs":[{"text":"whey vem do meu leite que é de graça "}]},"headerBackgroundColor":4278237396,"headerTextColor":4278190080,"bodyBackgroundColor":4278248959,"bodyTextColor":4278190080,"authorExternalChannelId":"UCvtnuLIfOPrvoP3oExvRJyg","authorNameTextColor":3003121664,"contextMenuEndpoint":{"clickTrackingParams":"CAIQ7rsEIhMIuIi3wZ36gAMV0ISVAh0lhAL2","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMUJ1VEhSTlEyUXRiMEZFUm1OeVEzZG5VV1J4WjBWRWNHY2FLU29uQ2hoVlExQXRTRXBKVWxoT0xXRndWVkJUUTA5bGFFVkVXbmNTQzBob01XOXpjV2xKVVRaRklBSW9BVElhQ2hoVlEzWjBiblZNU1daUFVISjJiMUF6YjBWNGRsSktlV2M0QWtnQVVBOCUzRA=="}},"timestampColor":2147483648,"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CAIQ7rsEIhMIuIi3wZ36gAMV0ISVAh0lhAL2","authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/LUPdKi5-ofX8v1VsboT5k7Heff0sAmj4DCSEqcfUsRz8qMEob_xNyDwy8W_3KfIP3UbXYIDk=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/LUPdKi5-ofX8v1VsboT5k7Heff0sAmj4DCSEqcfUsRz8qMEob_xNyDwy8W_3KfIP3UbXYIDk=s32-c-k","width":32,"height":32}]},"tooltip":"Member (2 months)","accessibility":{"accessibilityData":{"label":"Member (2 months)"}}}}],"textInputBackgroundColor":822083583}


// {"id":"ChwKGkNNTC0xTGFlLW9BREZTckR3Z1Fkc3JFQmlB","timestampUsec":"1693049916059589","authorName":{"simpleText":"Cris Sykes"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/ytc/AOPolaR_hOyn7EVjXzj8824PeV5sUe9_o3ojs1x8TwDsVw=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/ytc/AOPolaR_hOyn7EVjXzj8824PeV5sUe9_o3ojs1x8TwDsVw=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"purchaseAmountText":{"simpleText":"R$2.00"},"message":{"runs":[{"text":"renan, nao adianta ter rosto de 19 e ter corpo d50"}]},"headerBackgroundColor":4278237396,"headerTextColor":4278190080,"bodyBackgroundColor":4278248959,"bodyTextColor":4278190080,"authorExternalChannelId":"UCvtnuLIfOPrvoP3oExvRJyg","authorNameTextColor":3003121664,"contextMenuEndpoint":{"clickTrackingParams":"CAIQ7rsEIhMIm8W-t576gAMVqQweAB2tVQbC","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMDFNTFRGTVlXVXRiMEZFUmxOeVJIZG5VV1J6Y2tWQ2FVRWFLU29uQ2hoVlExQXRTRXBKVWxoT0xXRndWVkJUUTA5bGFFVkVXbmNTQzBob01XOXpjV2xKVVRaRklBSW9BVElhQ2hoVlEzWjBiblZNU1daUFVISjJiMUF6YjBWNGRsSktlV2M0QWtnQVVBOCUzRA=="}},"timestampColor":2147483648,"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CAIQ7rsEIhMIm8W-t576gAMVqQweAB2tVQbC","authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/LUPdKi5-ofX8v1VsboT5k7Heff0sAmj4DCSEqcfUsRz8qMEob_xNyDwy8W_3KfIP3UbXYIDk=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/LUPdKi5-ofX8v1VsboT5k7Heff0sAmj4DCSEqcfUsRz8qMEob_xNyDwy8W_3KfIP3UbXYIDk=s32-c-k","width":32,"height":32}]},"tooltip":"Member (2 months)","accessibility":{"accessibilityData":{"label":"Member (2 months)"}}}}],"textInputBackgroundColor":822083583}

// {"id":"ChwKGkNKNlJxOHlvLW9BREZWMEgxZ0FkNHhzSXNB","timestampUsec":"1693052645875079","authorName":{"simpleText":"dilli dillinger"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/ytc/AOPolaRmDhRtIZDcvLLoGRgarx66OWdTsyRlZvcOeVLD8w=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/ytc/AOPolaRmDhRtIZDcvLLoGRgarx66OWdTsyRlZvcOeVLD8w=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"purchaseAmountText":{"simpleText":"NOK 200.00"},"message":{"runs":[{"text":"have a GREAT day dude love from norway"}]},"headerBackgroundColor":4293284096,"headerTextColor":3758096383,"bodyBackgroundColor":4294278144,"bodyTextColor":3758096383,"authorExternalChannelId":"UCMoTz2amx--ztump8RwT5Ew","authorNameTextColor":3019898879,"contextMenuEndpoint":{"clickTrackingParams":"CCMQ7rsEIhMIwduD-an6gAMVAbeVAh1PEQ1Y","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMG8yVW5FNGVXOHRiMEZFUmxZd1NERm5RV1EwZUhOSmMwRWFLU29uQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2NTQ3kwMVRtTlhiVEowVUMxSklBSW9BVElhQ2hoVlEwMXZWSG95WVcxNExTMTZkSFZ0Y0RoU2QxUTFSWGM0QWtnQVVBOCUzRA=="}},"timestampColor":2164260863,"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CCMQ7rsEIhMIwduD-an6gAMVAbeVAh1PEQ1Y","authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/DrgybYTJ1oeQYrgmU2X_GJ3ev8wUkJpu1vwo4yRQ6dFNtBW7gDZAyzJ64L2epmYwhOINZHeI=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/DrgybYTJ1oeQYrgmU2X_GJ3ev8wUkJpu1vwo4yRQ6dFNtBW7gDZAyzJ64L2epmYwhOINZHeI=s32-c-k","width":32,"height":32}]},"tooltip":"New member","accessibility":{"accessibilityData":{"label":"New member"}}}}],"textInputBackgroundColor":805306368}
// superchat  {"id":"ChwKGkNQeUtydEtuLW9BREZmcUI1UWNkdW80Q2J3","timestampUsec":"1693052419255507","authorName":{"simpleText":"Quincy & Cathy Adams"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/ytc/AOPolaTY5B9BDbUV1tqQow5e0F_-IaquTLnuDijiDuU9g0QJ7r5YT7FS92njDwtcKW-5=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/ytc/AOPolaTY5B9BDbUV1tqQow5e0F_-IaquTLnuDijiDuU9g0QJ7r5YT7FS92njDwtcKW-5=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"purchaseAmountText":{"simpleText":"$50.00"},"message":{"runs":[{"text":"this is for anniversary beers. happy anniversary. "}]},"headerBackgroundColor":4290910299,"headerTextColor":4294967295,"bodyBackgroundColor":4293467747,"bodyTextColor":4294967295,"authorExternalChannelId":"UCPcPH1aLYsb8uGTlO8ZgEhQ","authorNameTextColor":3019898879,"contextMenuEndpoint":{"clickTrackingParams":"CBwQ7rsEIhMIwduD-an6gAMVAbeVAh1PEQ1Y","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMUI1UzNKMFMyNHRiMEZFUm1aeFFqVlJZMlIxYnpSRFluY2FLU29uQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2NTQ3kwMVRtTlhiVEowVUMxSklBSW9BVElhQ2hoVlExQmpVRWd4WVV4WmMySTRkVWRVYkU4NFdtZEZhRkU0QWtnQVVBOCUzRA=="}},"timestampColor":2164260863,"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CBwQ7rsEIhMIwduD-an6gAMVAbeVAh1PEQ1Y","headerOverlayImage":{"thumbnails":[{"url":"//youtube.com/img/pdg/novelty/FirstPurchase_2x.png","width":190,"height":120}]},"authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/vXlir8ZStxl0DJLVfbMjssgeOkOjel4ylgdzJqT1pLlrG8z1zBEEeurKTQowwd_ZXchAJp_SKpk=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/vXlir8ZStxl0DJLVfbMjssgeOkOjel4ylgdzJqT1pLlrG8z1zBEEeurKTQowwd_ZXchAJp_SKpk=s32-c-k","width":32,"height":32}]},"tooltip":"Member (6 months)","accessibility":{"accessibilityData":{"label":"Member (6 months)"}}}}],"textInputBackgroundColor":805306368,"lowerBumper":{"liveChatItemBumperViewModel":{"content":{"bumperUserEduContentViewModel":{"text":{"content":"Celebrate the first Super Chat from Quincy & Cathy Adams!","styleRuns":[{"startIndex":0,"length":57}]},"trackingParams":"CB8Qk5YLIhMIwduD-an6gAMVAbeVAh1PEQ1Y","image":{"sources":[{"clientResource":{"imageName":"CELEBRATION","imageColor":4294901760}}]}}},"pdgPurchasedBumperLoggingDirectives":{"loggingDirectives":{"trackingParams":"CB4Q784LIhMIwduD-an6gAMVAbeVAh1PEQ1Y","visibility":{"types":"12"}}}}},"pdgPurchasedNoveltyLoggingDirectives":{"loggingDirectives":{"trackingParams":"CB0Q7s4LIhMIwduD-an6gAMVAbeVAh1PEQ1Y","visibility":{"types":"12"}}}}



// {"liveChatPaidStickerRenderer":{"id":"ChwKGkNJbW8zNzJ0LW9BREZVU2J3UW9kUHA0T0ZR","contextMenuEndpoint":{"clickTrackingParams":"CBYQ77sEIhMI_t_G8q36gAMVSqiQCh0bUAXS","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMGx0YnpNM01uUXRiMEZFUmxWVFluZFJiMlJRY0RSUFJsRWFLU29uQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2NTQ3kwMVRtTlhiVEowVUMxSklBSW9BVElhQ2hoVlF6QXhWWFkwTjJGb2RuQnZaRzkxWnpsbExXVXRhbmM0QWtnQVVCUSUzRA=="}},"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"timestampUsec":"1693053973930988","authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/VbuPUpKB0gV52sknlkZJqF9M5wukIFB20wyaxkU85UnmRq5aWdqXfVXfdIFZXlSWLwdnQ9qd=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/VbuPUpKB0gV52sknlkZJqF9M5wukIFB20wyaxkU85UnmRq5aWdqXfVXfdIFZXlSWLwdnQ9qd=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"authorName":{"simpleText":"Earl Taylor"},"authorExternalChannelId":"UC01Uv47ahvpodoug9e-e-jw","sticker":{"thumbnails":[{"url":"//lh3.googleusercontent.com/uvDsxVrGmXBek8mI088npeMakgaPMDkI8tYbi4EyDIK3RJHL5VSRPeyrfqrpNfEv7dSa4p23A8W8qqX4gw=s72-rg","width":72,"height":72},{"url":"//lh3.googleusercontent.com/uvDsxVrGmXBek8mI088npeMakgaPMDkI8tYbi4EyDIK3RJHL5VSRPeyrfqrpNfEv7dSa4p23A8W8qqX4gw=s144-rg","width":144,"height":144}],"accessibility":{"accessibilityData":{"label":"A pixelated hippo chomps on a 1up"}}},"authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/DrgybYTJ1oeQYrgmU2X_GJ3ev8wUkJpu1vwo4yRQ6dFNtBW7gDZAyzJ64L2epmYwhOINZHeI=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/DrgybYTJ1oeQYrgmU2X_GJ3ev8wUkJpu1vwo4yRQ6dFNtBW7gDZAyzJ64L2epmYwhOINZHeI=s32-c-k","width":32,"height":32}]},"tooltip":"New member","accessibility":{"accessibilityData":{"label":"New member"}}}}],"moneyChipBackgroundColor":4278248959,"moneyChipTextColor":4278190080,"purchaseAmountText":{"simpleText":"£2.00"},"stickerDisplayWidth":72,"stickerDisplayHeight":72,"backgroundColor":4278237396,"authorNameTextColor":3003121664,"trackingParams":"CBYQ77sEIhMI_t_G8q36gAMVSqiQCh0bUAXS"}}

// {"liveChatPaidMessageRenderer":{"id":"ChwKGkNLVFIwX210LW9BREZjTUIxZ0FkV3ZFTHR3","timestampUsec":"1693054083082284","authorName":{"simpleText":"drillsarge"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/ytc/AOPolaQ-HXJWImxqo4ijjW5IicZ3ViM6krDG0FwwBZq9=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/ytc/AOPolaQ-HXJWImxqo4ijjW5IicZ3ViM6krDG0FwwBZq9=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"purchaseAmountText":{"simpleText":"€2.00"},"message":{"runs":[{"text":"bless u "}]},"headerBackgroundColor":4278237396,"headerTextColor":4278190080,"bodyBackgroundColor":4278248959,"bodyTextColor":4278190080,"authorExternalChannelId":"UC579QXEJOG0H3acGBwE7Rxw","authorNameTextColor":3003121664,"contextMenuEndpoint":{"clickTrackingParams":"CAIQ7rsEIhMI9Pu8-q36gAMVDq2QCh1xOAaM","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMHRVVWpCZmJYUXRiMEZFUm1OTlFqRm5RV1JYZGtWTWRIY2FLU29uQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2NTQ3kwMVRtTlhiVEowVUMxSklBSW9BVElhQ2hoVlF6VTNPVkZZUlVwUFJ6QklNMkZqUjBKM1JUZFNlSGM0QWtnQVVBOCUzRA=="}},"timestampColor":2147483648,"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CAIQ7rsEIhMI9Pu8-q36gAMVDq2QCh1xOAaM","headerOverlayImage":{"thumbnails":[{"url":"https://www.gstatic.com/youtube/img/pdg/novelty/1st_purchase_celebration_novelty_animation/1st_Purchase_Celebration_Novelty_SC_T2_v3.webp","width":150,"height":56}]},"authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/DrgybYTJ1oeQYrgmU2X_GJ3ev8wUkJpu1vwo4yRQ6dFNtBW7gDZAyzJ64L2epmYwhOINZHeI=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/DrgybYTJ1oeQYrgmU2X_GJ3ev8wUkJpu1vwo4yRQ6dFNtBW7gDZAyzJ64L2epmYwhOINZHeI=s32-c-k","width":32,"height":32}]},"tooltip":"New member","accessibility":{"accessibilityData":{"label":"New member"}}}}],"textInputBackgroundColor":822083583,"lowerBumper":{"liveChatItemBumperViewModel":{"content":{"bumperUserEduContentViewModel":{"text":{"content":"Celebrate the first Super Chat from drillsarge!","styleRuns":[{"startIndex":0,"length":47}]},"trackingParams":"CAUQk5YLIhMI9Pu8-q36gAMVDq2QCh1xOAaM","image":{"sources":[{"clientResource":{"imageName":"CELEBRATION","imageColor":4294901760}}]}}},"pdgPurchasedBumperLoggingDirectives":{"loggingDirectives":{"trackingParams":"CAQQ784LIhMI9Pu8-q36gAMVDq2QCh1xOAaM","visibility":{"types":"12"}}}}},"pdgPurchasedNoveltyLoggingDirectives":{"loggingDirectives":{"trackingParams":"CAMQ7s4LIhMI9Pu8-q36gAMVDq2QCh1xOAaM","visibility":{"types":"12"}}}}}



// {"liveChatPaidMessageRenderer":{"id":"ChwKGkNJZnZyYml5LW9BREZSTGo0d2NkRzN3SWpB","timestampUsec":"1693055305237974","authorName":{"simpleText":"howardsmith0570"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/ytc/AOPolaQyy4yhySwSaIeHs-gwLaFSLHhZP-a3DkIvOg=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/ytc/AOPolaQyy4yhySwSaIeHs-gwLaFSLHhZP-a3DkIvOg=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"purchaseAmountText":{"simpleText":"$20.00"},"message":{"runs":[{"text":"Good morning Phixate and chat. I can't stay long. I just wanted to stop by and say Happy Anniversary to you and Ms. Phixate. May you have many more years of love, happiness and great adventures together. Enjoy your day."}]},"headerBackgroundColor":4293284096,"headerTextColor":3758096383,"bodyBackgroundColor":4294278144,"bodyTextColor":3758096383,"authorExternalChannelId":"UCYGGnlROXUAlOv7WQUXPnHg","authorNameTextColor":3019898879,"contextMenuEndpoint":{"clickTrackingParams":"CBAQ7rsEIhMI2o7b-7L6gAMV6woeAB3vTwX4","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMGxtZG5KaWFYa3RiMEZFUmxKTWFqUjNZMlJITTNkSmFrRWFLU29uQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2NTQ3kwMVRtTlhiVEowVUMxSklBSW9BVElhQ2hoVlExbEhSMjVzVWs5WVZVRnNUM1kzVjFGVldGQnVTR2M0QWtnQVVBOCUzRA=="}},"timestampColor":2164260863,"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CBAQ7rsEIhMI2o7b-7L6gAMV6woeAB3vTwX4","authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/vXlir8ZStxl0DJLVfbMjssgeOkOjel4ylgdzJqT1pLlrG8z1zBEEeurKTQowwd_ZXchAJp_SKpk=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/vXlir8ZStxl0DJLVfbMjssgeOkOjel4ylgdzJqT1pLlrG8z1zBEEeurKTQowwd_ZXchAJp_SKpk=s32-c-k","width":32,"height":32}]},"tooltip":"Member (6 months)","accessibility":{"accessibilityData":{"label":"Member (6 months)"}}}}],"textInputBackgroundColor":805306368}}
// deleted message { targetItemId: 'ChwKGkNJSEc1ZlN5LW9BREZjdkl3UW9kblZVS0V3' }