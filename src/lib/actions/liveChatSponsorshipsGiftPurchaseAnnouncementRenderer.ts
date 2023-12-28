import { IChatYTMessage } from "../../types/Client"
import { IChatAuthorBadge, IChatThumbnail } from "../../types/Types"
import { findKey } from "../utils"
import { createCommonUserResponse } from "./actionsUtils"
import { GiftRuns } from "./liveChatTickerSponsorItemRenderer"

interface LiveChatSponsorShipsGiftPurchaseAnnouncementRenderer {
  id: string,
  timestampUsec: string,
  authorExternalChannelId: string,
  header: {
    liveChatSponsorshipsHeaderRenderer: {
      authorName: {
        simpleText: string
      },
      authorPhoto: {
        thumbnails: IChatThumbnail[]
      },
      primaryText: {
        runs: GiftRuns[]
      },
      authorBadges: IChatAuthorBadge[],
      image: {
        thumbnails: [
          {
            url: "https://www.gstatic.com/youtube/img/sponsorships/sponsorships_gift_purchase_announcement_artwork.png"
          }
        ]
      }
    }
  }
}

export interface ISubGift extends IChatYTMessage {
  id: string
  giftImage: string
  amount: number
  text: string
  name: string
}

const liveChatSponsorshipsGiftPurchaseAnnouncementRenderer = (messageData: LiveChatSponsorShipsGiftPurchaseAnnouncementRenderer, emitter: NodeJS.EventEmitter, channel: string) => {
  const { header: { liveChatSponsorshipsHeaderRenderer: { image, authorName, authorPhoto } }, id } = messageData
  const responseData = createCommonUserResponse(messageData) as ISubGift
  const primaryText = findKey(messageData, "primaryText") as { runs: GiftRuns[] }
  responseData.name = authorName.simpleText
  responseData.thumbnail.url = authorPhoto.thumbnails[1].url
  responseData.thumbnail.alt = `${authorName.simpleText} profile photo`
  responseData.text = primaryText.runs.map(({ text }) => text).join('')
  responseData.amount = Number(primaryText.runs[1].text)
  responseData.giftImage = image.thumbnails[0].url
  emitter.emit("subgiftGroup", { channel, ...responseData });
}


// {"id":"ChwKGkNMTHUxS2VyLW9BREZhVEN3Z1FkMDRvSDdB","timestampUsec":"1693053387883874","authorExternalChannelId":"UCyfdgHbIjM9SEac_Gsq6ZRw","header":{"liveChatSponsorshipsHeaderRenderer":{"authorName":{"simpleText":"TATDan90"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/ytc/AOPolaThIf4GvZfYfhyCDpXCpqkkzqLfBS9AlKvrYn3lIr-Y_ThCqOR0y57db9E297ts=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/ytc/AOPolaThIf4GvZfYfhyCDpXCpqkkzqLfBS9AlKvrYn3lIr-Y_ThCqOR0y57db9E297ts=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"primaryText":{"runs":[{"text":"Gifted ","bold":true},{"text":"10","bold":true},{"text":" ","bold":true},{"text":"Phixate","bold":true},{"text":" memberships","bold":true}]},"authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/_fq1mRpbuSODBLv40Z2G75HvjAHcJVJivfOufjnD4YbhOijQ_XS4s3M7wJAYdpX0If5pZGN8rg=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/_fq1mRpbuSODBLv40Z2G75HvjAHcJVJivfOufjnD4YbhOijQ_XS4s3M7wJAYdpX0If5pZGN8rg=s32-c-k","width":32,"height":32}]},"tooltip":"Member (1 month)","accessibility":{"accessibilityData":{"label":"Member (1 month)"}}}}],"contextMenuEndpoint":{"clickTrackingParams":"CBsQ3MMKIhMIv4H4rK76gAMVlBUeAB0wHAT3","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMHhNZFRGTFpYSXRiMEZFUm1GVVEzZG5VV1F3Tkc5SU4wRWFLU29uQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2NTQ3kwMVRtTlhiVEowVUMxSklBSW9BVElhQ2hoVlEzbG1aR2RJWWtscVRUbFRSV0ZqWDBkemNUWmFVbmM0QWtnQVVDUSUzRA=="}},"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"image":{"thumbnails":[{"url":"https://www.gstatic.com/youtube/img/sponsorships/sponsorships_gift_purchase_announcement_artwork.png"}]}}}}
export default liveChatSponsorshipsGiftPurchaseAnnouncementRenderer

