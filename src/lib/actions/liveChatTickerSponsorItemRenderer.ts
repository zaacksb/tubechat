import { IChatThumbnail, YTChatBadges } from "../../types/Types"
import { convertColorToHex6, createBadgesElements, filterAndExtractSubGiftNames, findKey } from "../utils"

export interface GiftRuns {
  text: string
  bold: boolean
}

interface LiveChatRendererMembership {
  "item": {
    "liveChatTickerSponsorItemRenderer": {
      "id": string,
      "detailText": {
        "accessibility": {
          "accessibilityData": {
            "label": string
          }
        },
        "simpleText": string
      },
      "detailTextColor": number,
      "startBackgroundColor": number,
      "endBackgroundColor": number,
      "sponsorPhoto": {
        "thumbnails": IChatThumbnail[]
      },
      "durationSec": number,
      "showItemEndpoint": {
        "clickTrackingParams": string,
        "commandMetadata": {
          "webCommandMetadata": {
            "ignoreNavigation": boolean
          }
        },
        "showLiveChatItemEndpoint": {
          "renderer": {
            "liveChatSponsorshipsGiftPurchaseAnnouncementRenderer": {
              "authorExternalChannelId": string,
              "header": {
                "liveChatSponsorshipsHeaderRenderer": {
                  "authorName": {
                    "simpleText": string
                  },
                  "authorPhoto": {
                    "thumbnails": IChatThumbnail[]
                  },
                  "primaryText": {
                    "runs": GiftRuns[]
                  },
                  "authorBadges": [
                    {
                      "liveChatAuthorBadgeRenderer": {
                        "customThumbnail": {
                          "thumbnails": IChatThumbnail[]
                        },
                        "tooltip": string,
                        "accessibility": {
                          "accessibilityData": {
                            "label": string
                          }
                        }
                      }
                    }
                  ],
                  "image": {
                    "thumbnails": {
                      "url": string
                    }[]
                  }
                }
              }
            }
          },
        }
      },
      "authorExternalChannelId": string,
      "fullDurationSec": number,
      "detailIcon": {
        "iconType": "GIFT"
      }
    }
  },
  "durationSec": string
}

export interface MemberGift {
  amount: number
  channelName: string
  id: string
  channelId: string
  giftTo: string[]
  duration: number
  detailTextColor: string
  startBackgroundColor: string
  endBackgroundColor: string,
  badges: YTChatBadges
}

const liveChatTickerSponsorItemRenderer = ({ item: { liveChatTickerSponsorItemRenderer } }: LiveChatRendererMembership, emitter: NodeJS.EventEmitter, channel: string) => {
  if (!liveChatTickerSponsorItemRenderer) return
  const { detailTextColor, startBackgroundColor, endBackgroundColor, fullDurationSec, authorExternalChannelId } = liveChatTickerSponsorItemRenderer
  const accessibilityData = findKey(liveChatTickerSponsorItemRenderer, "accessibilityData") as { label: string }
  const primaryText = findKey(liveChatTickerSponsorItemRenderer, "primaryText") as GiftRuns[]
  const authorName = findKey(liveChatTickerSponsorItemRenderer, "authorName") as { simpleText: string }
  const liveChatAuthorBadgeRenderer = liveChatTickerSponsorItemRenderer.showItemEndpoint.showLiveChatItemEndpoint.renderer.liveChatSponsorshipsGiftPurchaseAnnouncementRenderer.header.liveChatSponsorshipsHeaderRenderer.authorBadges
  const giftTo = filterAndExtractSubGiftNames(primaryText)
  const responseData = {
    amount: Number(primaryText[1].text),
    channelName: authorName.simpleText,
    channelId: authorExternalChannelId,
    giftTo,
    badges: createBadgesElements(liveChatAuthorBadgeRenderer[0].liveChatAuthorBadgeRenderer?.customThumbnail?.thumbnails, liveChatAuthorBadgeRenderer[0].liveChatAuthorBadgeRenderer.tooltip),
    duration: fullDurationSec,
    detailTextColor: convertColorToHex6(detailTextColor),
    startBackgroundColor: convertColorToHex6(startBackgroundColor),
    endBackgroundColor: convertColorToHex6(endBackgroundColor)
  } as MemberGift


  emitter.emit("gift", { channel, ...responseData });
}

export default liveChatTickerSponsorItemRenderer