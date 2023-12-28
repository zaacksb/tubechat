import { IChatYTMessage } from "../../types/Client"
import { IChatAuthorBadge, IChatMessage, IChatThumbnail } from "../../types/Types"
import { findKey } from "../utils"
import { createCommonUserResponse } from "./actionsUtils"

interface SubData {
  "id": string,
  "timestampUsec": string,
  "authorExternalChannelId": string,
  "headerPrimaryText"?: {
    "runs": [
      {
        "text": "Member for "
      },
      {
        "text": "7"
      },
      {
        "text": " months"
      }
    ]
  },
  "headerSubtext": {
    "simpleText": string,
    "runs": { text: string }[]
  },
  "message": {
    "runs": IChatMessage[]
  },
  "authorName": {
    "simpleText": string
  },
  "authorPhoto": {
    "thumbnails": IChatThumbnail[]
  },
  "authorBadges": IChatAuthorBadge[]
}

export interface ISub extends IChatYTMessage {
  isResub: boolean
  toolTip: string
  months: number
  tier: string
}

const sub = (messageData: SubData, emitter: NodeJS.EventEmitter, channel: string) => {
  const isResub = findKey(messageData, "headerPrimaryText")
  const responseData = createCommonUserResponse(messageData) as ISub
  responseData.isResub = isResub ? true : false
  responseData.months = Number(isResub?.runs[1] || Number(1))
  responseData.toolTip = messageData?.authorBadges?.[0]?.liveChatAuthorBadgeRenderer?.tooltip || ''
  const headerSubtext = messageData.headerSubtext
  responseData.tier = headerSubtext?.simpleText || headerSubtext?.runs?.[1]?.text
  if (!responseData?.message?.[0]) responseData.message = [{ text: '' }]
  emitter.emit("sub", { channel, ...responseData });
}

export default sub


// {"id":"CjEKL0NPTU1VTklUWV9HVUlERUxJTkVTX1ZFTTIwMjMvMDgvMjYtMDM6NTY6NTEuMzE5","timestampUsec":"1693047411319254","icon":{"iconType":"YOUTUBE_ROUND"},"message":{"runs":[{"text":"Welcome to live chat! Remember to guard your privacy and abide by our community guidelines."}]},"actionButton":{"buttonRenderer":{"style":"STYLE_BLUE_TEXT","size":"SIZE_DEFAULT","isDisabled":false,"text":{"simpleText":"Learn more"},"navigationEndpoint":{"clickTrackingParams":"CBgQ8FsiEwi5mqaMlfqAAxWlWkgAHd_wDWs=","commandMetadata":{"webCommandMetadata":{"url":"//support.google.com/youtube/answer/2853856?hl=en#safe","webPageType":"WEB_PAGE_TYPE_UNKNOWN","rootVe":83769}},"urlEndpoint":{"url":"//support.google.com/youtube/answer/2853856?hl=en#safe","target":"TARGET_NEW_WINDOW"}},"trackingParams":"CBgQ8FsiEwi5mqaMlfqAAxWlWkgAHd_wDWs=","accessibilityData":{"accessibilityData":{"label":"Learn more"}}}},"trackingParams":"CAEQl98BIhMIuZqmjJX6gAMVpVpIAB3f8A1r"}

// {"id":"ChwKGkNJR2kyc2JoLW9BREZUWUkxZ0FkbkMwSEZR","timestampUsec":"1693067934876097","authorExternalChannelId":"UCeYdlQxExfYz5LW0zuknxVw","headerSubtext":{"runs":[{"text":"Welcome to "},{"text":"Horse Squad VIP"},{"text":"!"}]},"authorName":{"simpleText":"DAMIANOO9"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/j0N3Wl11ZbjR_p2A3aUsXCwAcitsxsbDmzlWyU2P-uMg8evH1GNeu1bTYkUJrmYAHdsLbf1vxA=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/j0N3Wl11ZbjR_p2A3aUsXCwAcitsxsbDmzlWyU2P-uMg8evH1GNeu1bTYkUJrmYAHdsLbf1vxA=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/n0-Yv5D6SHRp3VIgst6mub-Txa0Iimtcbw-KmVaIbhHk17SwpxKS3HKZrN3OS3QBGgWeP2JZqdM=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/n0-Yv5D6SHRp3VIgst6mub-Txa0Iimtcbw-KmVaIbhHk17SwpxKS3HKZrN3OS3QBGgWeP2JZqdM=s32-c-k","width":32,"height":32}]},"tooltip":"New member","accessibility":{"accessibilityData":{"label":"New member"}}}}],"contextMenuEndpoint":{"clickTrackingParams":"CCAQ4P0GIhMIlKuYzOH6gAMVDfmRCh25kwdq","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMGxIYVRKelltZ3RiMEZFUmxSWlNURm5RV1J1UXpCSVJsRWFLU29uQ2hoVlEzaHphemRvY1VWZlEzZGFWMGRGU2tWclIyRnVZa0VTQzJjdFZEQlZWMnRLTW5KUklBSW9BVElhQ2hoVlEyVlpaR3hSZUVWNFpsbDZOVXhYTUhwMWEyNTRWbmM0QWtnQVVBUSUzRA=="}},"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CCAQ4P0GIhMIlKuYzOH6gAMVDfmRCh25kwdq"}


//
// {"id":"ChwKGkNJeXV5YmJrLW9BREZmcUI1UWNkdW80Q2J3","timestampUsec":"1693068706352767","authorExternalChannelId":"UCauvm3EkJ1GCJ-S_Nr9-DIw","headerSubtext":{"runs":[{"text":"Welcome to "},{"text":"Horse Squad"},{"text":"!"}]},"authorName":{"simpleText":"Grimace"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/ytc/AOPolaR1E686x6Z3Eyrr0uc1M7Q7O-7wk2qJHolQuctn81dxWmRrGb4BMOyge5uLXM4o=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/ytc/AOPolaR1E686x6Z3Eyrr0uc1M7Q7O-7wk2qJHolQuctn81dxWmRrGb4BMOyge5uLXM4o=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/n0-Yv5D6SHRp3VIgst6mub-Txa0Iimtcbw-KmVaIbhHk17SwpxKS3HKZrN3OS3QBGgWeP2JZqdM=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/n0-Yv5D6SHRp3VIgst6mub-Txa0Iimtcbw-KmVaIbhHk17SwpxKS3HKZrN3OS3QBGgWeP2JZqdM=s32-c-k","width":32,"height":32}]},"tooltip":"New member","accessibility":{"accessibilityData":{"label":"New member"}}}}],"contextMenuEndpoint":{"clickTrackingParams":"CAUQ4P0GIhMIhribt-T6gAMVT5yVAh0rXAjs","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMGw1ZFhsaVltc3RiMEZFUm1aeFFqVlJZMlIxYnpSRFluY2FLU29uQ2hoVlEzaHphemRvY1VWZlEzZGFWMGRGU2tWclIyRnVZa0VTQzJjdFZEQlZWMnRLTW5KUklBSW9BVElhQ2hoVlEyRjFkbTB6Uld0S01VZERTaTFUWDA1eU9TMUVTWGM0QWtnQVVBUSUzRA=="}},"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CAUQ4P0GIhMIhribt-T6gAMVT5yVAh0rXAjs"}


// {"id":"Ci8KLUNPTF8tWnVidllBREZTMHVzd0FkT21vTWpRLUxveU1lc0lELTMzODYxMzcyNQ%3D%3D","timestampUsec":"1693068627902649","authorExternalChannelId":"UCPznwEVlGRK-r6XnsWJjjbA","headerPrimaryText":{"runs":[{"text":"Member for 1 month"}]},"headerSubtext":{"simpleText":"Horse Squad"},"message":{"runs":[{"text":"hi kreek"}]},"authorName":{"simpleText":"Crocisgay"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/KRlzI_lP-skmg5RKihQTDR4tDDlaY4VNkeKtqg70oFh1H2WeKsQZkazyeamHP8ea82jftsmpnA=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/KRlzI_lP-skmg5RKihQTDR4tDDlaY4VNkeKtqg70oFh1H2WeKsQZkazyeamHP8ea82jftsmpnA=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/kQD9woozmgOQdEM8yfLENg5ElDNYhP-8eMsyXXUtoGWMKNjBDq3fHa6zN4yoeOl_KDNf09K-pnU=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/kQD9woozmgOQdEM8yfLENg5ElDNYhP-8eMsyXXUtoGWMKNjBDq3fHa6zN4yoeOl_KDNf09K-pnU=s32-c-k","width":32,"height":32}]},"tooltip":"Member (1 month)","accessibility":{"accessibilityData":{"label":"Member (1 month)"}}}}],"contextMenuEndpoint":{"clickTrackingParams":"CA0Q4f0GIhMIk5vwk-T6gAMV-qCVAh0V5gor","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2pFS0x3b3RRMDlNWHkxYWRXSjJXVUZFUmxNd2RYTjNRV1JQYlc5TmFsRXRURzk1VFdWelNVUXRNek00TmpFek56STFHaWtxSndvWVZVTjRjMnMzYUhGRlgwTjNXbGRIUlVwRmEwZGhibUpCRWd0bkxWUXdWVmRyU2pKeVVTQUNLQUV5R2dvWVZVTlFlbTUzUlZac1IxSkxMWEkyV0c1elYwcHFhbUpCT0FKSUFGQVg="}},"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CA0Q4f0GIhMIk5vwk-T6gAMV-qCVAh0V5gor"}