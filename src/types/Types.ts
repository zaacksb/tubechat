export type loggedInYT = "1" | "0"

export interface IYoutubeInitialDataResponse {
  code: "success"
  clientName: string
  clientVersion: string
  loggedIn: loggedInYT
  params: string
  apiKey: string
  continuation: string
}

export interface IYoutubeInitialDataResponseError {
  code: "error" | "chat_not_found" | "ended_event"
  message?: string
}


export interface IYoutubeInitialData {
  contents: {
    messageRenderer: {
      text: {
        runs: {
          text: string;
        }[];
      };
    };
    liveChatRenderer: {
      header: {
        liveChatHeaderRenderer: {
          viewSelector: {
            sortFilterSubMenuRenderer: {
              subMenuItems: {
                continuation: {
                  reloadContinuationData: {
                    continuation: string
                  }
                }
              }[]
            };
          };
        };
      };
    };
  };
  responseContext: {
    serviceTrackingParams: [
      {
        params: {
          key: string,
          value: string
        }[]
      },
      {
        params: {
          key: string
          value: loggedInYT | undefined
        }[]
      }
    ];
  };
}

export interface ISendLiveChatMessageEndpoint {
  params?: string
}



export interface IChatThumbnail {
  "url": string,
  "width": number,
  "height": number
}

export interface IChatAuthorBadge {
  "liveChatAuthorBadgeRenderer": {
    icon: {
      iconType: string
    }
    "customThumbnail": {
      "thumbnails": IChatThumbnail[]
    },
    "tooltip": string, //Member (1 year)
    "accessibility": {
      "accessibilityData": {
        "label": string // Member (1 year)
      }
    }
  }
}

export interface IChatMessage {
  "text": string
  "emoji": {
    "emojiId": "UCqm3BQLlJfvkTsX_hvm0UmA/UHsLYLObLs6S_AOK37G4Bg",
    "shortcuts": string[],
    "searchTerms": string[],
    "image": {
      "thumbnails": IChatThumbnail[],
      "accessibility": {
        "accessibilityData": {
          "label": string
        }
      }
    },
    "isCustomEmoji": boolean
  }
}

export interface IChatData {
  "authorName": {
    "simpleText": string
  },
  "authorPhoto": {
    "thumbnails": IChatThumbnail[]
  },
  "timestampUsec": string, // 1692965160401114
  "authorExternalChannelId": string,
  "id": string,
  "authorBadges": IChatAuthorBadge[],
  "message": {
    "runs": IChatMessage[]
  }
}

export type TPossibleActions = "addChatItemAction" | "addBannerToLiveChatCommand" | "removeChatItemByAuthorAction" | "removeBannerForLiveChatCommand" | "updateLiveChatPollAction" | "closeLiveChatActionPanelAction" | "showLiveChatActionPanelAction"

export type IAddChatItemAction = {
  item: {
    liveChatTextMessageRenderer: IChatData
    liveChatViewerEngagementMessageRenderer: any
    liveChatPaidMessageRenderer: any
    liveChatPaidStickerRenderer: any
    liveChatSponsorshipsGiftRedemptionAnnouncementRenderer: any
    liveChatMembershipItemRenderer: any
    liveChatSponsorshipsGiftPurchaseAnnouncementRenderer: any,
    liveChatPlaceholderItemRenderer?: any
    liveChatTickerPaidMessageItemRenderer?: any
  }
}


export interface YTChatBadges {
  thumbnail?: {
    url: string
    alt: string
  },
  label?: string
  subscriber?: 0 | 1
  owner?: 0 | 1
  verified?: 0 | 1
  moderator?: 0 | 1
}


export interface IMessageParsed {
  text?: string
  url?: string
  alt?: string
  isCustomEmoji?: boolean
  emojiText?: string
}

// DONATE
// {"item":{"liveChatTickerPaidMessageItemRenderer":{"id":"ChwKGkNNTFoxX3psOTRBREZjSEJ3Z1FkT3UwRGdR","amount":{"simpleText":"₱125.00"},"amountTextColor":4278190080,"startBackgroundColor":4280150454,"endBackgroundColor":4278239141,"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/X93jyYktZZICgpGzAuHIGRP8e6floMJ9-W8y2a3ZgRJYMHSjXq66HKG9s054n1FgsN8PxGFVuQ=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/X93jyYktZZICgpGzAuHIGRP8e6floMJ9-W8y2a3ZgRJYMHSjXq66HKG9s054n1FgsN8PxGFVuQ=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}],"accessibility":{"accessibilityData":{"label":"isunohon"}}},"durationSec":120,"showItemEndpoint":{"clickTrackingParams":"CAIQsMgEIhMInPux_eX3gAMVoFxIAB1dGwKA","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"showLiveChatItemEndpoint":{"renderer":{"liveChatPaidMessageRenderer":{"id":"ChwKGkNNTFoxX3psOTRBREZjSEJ3Z1FkT3UwRGdR","timestampUsec":"1692966042611943","authorName":{"simpleText":"isunohon"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/X93jyYktZZICgpGzAuHIGRP8e6floMJ9-W8y2a3ZgRJYMHSjXq66HKG9s054n1FgsN8PxGFVuQ=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/X93jyYktZZICgpGzAuHIGRP8e6floMJ9-W8y2a3ZgRJYMHSjXq66HKG9s054n1FgsN8PxGFVuQ=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"purchaseAmountText":{"simpleText":"₱125.00"},"message":{"runs":[{"text":"おつかれサマー！いっぱい楽しかったよ！いつもありがとうね！改めてビンゴとクイズ４位おめでとう！明日と明後日のライブ頑張ってね！ステージの上を楽しんできてね！応援してるよ！わためNo.1"}]},"headerBackgroundColor":4278239141,"headerTextColor":4278190080,"bodyBackgroundColor":4280150454,"bodyTextColor":4278190080,"authorExternalChannelId":"UCQKa6GnHX0aGvHwpnV8_I_w","authorNameTextColor":2315255808,"contextMenuEndpoint":{"clickTrackingParams":"CAQQ7rsEIhMInPux_eX3gAMVoFxIAB1dGwKA","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMDFNV2pGZmVtdzVORUZFUm1OSVFuZG5VV1JQZFRCRVoxRWFLU29uQ2hoVlEzRnRNMEpSVEd4S1puWnJWSE5ZWDJoMmJUQlZiVUVTQzE5WWJrVTViRXM1Y2xaM0lBSW9BVElhQ2hoVlExRkxZVFpIYmtoWU1HRkhka2gzY0c1V09GOUpYM2M0QWtnQVVBOCUzRA=="}},"timestampColor":2147483648,"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CAQQ7rsEIhMInPux_eX3gAMVoFxIAB1dGwKA","authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/OBlEowC_cpJ-gPq465Ly0gVdTr7Jotnai4Em0MQm2UZOkzwT5d3AVgGzoAiM9uy5DgU3qVCNww=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/OBlEowC_cpJ-gPq465Ly0gVdTr7Jotnai4Em0MQm2UZOkzwT5d3AVgGzoAiM9uy5DgU3qVCNww=s32-c-k","width":32,"height":32}]},"tooltip":"Member (3 years)","accessibility":{"accessibilityData":{"label":"Member (3 years)"}}}}],"textInputBackgroundColor":822083583}},"trackingParams":"CAMQjtEGIhMInPux_eX3gAMVoFxIAB1dGwKA"}},"authorExternalChannelId":"UCQKa6GnHX0aGvHwpnV8_I_w","fullDurationSec":120,"trackingParams":"CAIQsMgEIhMInPux_eX3gAMVoFxIAB1dGwKA"}},"durationSec":"120"}
// {"item":{"liveChatTickerPaidMessageItemRenderer":{"id":"ChwKGkNLck14NUhtOTRBREZiVEN3Z1FkZ0pFSHRB","amount":{"simpleText":"¥1,000"},"amountTextColor":3741319168,"startBackgroundColor":4294953512,"endBackgroundColor":4294947584,"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/6VXLBb_4zQfpyHxjQFsGV3NwNN_-q6rpCgOFoQ8e_IgX-lAvx9fmbCkorw08wPDxJj_GqauIBg=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/6VXLBb_4zQfpyHxjQFsGV3NwNN_-q6rpCgOFoQ8e_IgX-lAvx9fmbCkorw08wPDxJj_GqauIBg=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}],"accessibility":{"accessibilityData":{"label":"WDもとなま"}}},"durationSec":300,"showItemEndpoint":{"clickTrackingParams":"CAIQsMgEIhMIuumekub3gAMV6aKVAh3VKw67","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"showLiveChatItemEndpoint":{"renderer":{"liveChatPaidMessageRenderer":{"id":"ChwKGkNLck14NUhtOTRBREZiVEN3Z1FkZ0pFSHRB","timestampUsec":"1692966086383054","authorName":{"simpleText":"WDもとなま"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/6VXLBb_4zQfpyHxjQFsGV3NwNN_-q6rpCgOFoQ8e_IgX-lAvx9fmbCkorw08wPDxJj_GqauIBg=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/6VXLBb_4zQfpyHxjQFsGV3NwNN_-q6rpCgOFoQ8e_IgX-lAvx9fmbCkorw08wPDxJj_GqauIBg=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"purchaseAmountText":{"simpleText":"¥1,000"},"message":{"runs":[{"text":"ミラーでの配信参加おつのまき！お仕事しながらと帰りの運転中、ずっと声だけ聴いてたよ～！楽しい笑い声が聴こえてきて凄いほっこりしたし、わたおじさんには笑っちゃったｗクイズは惜しかったね…！でも同率2位には変わりないし、わためぇ、
// 本当に俺誇らしいよ。トロフィーあげちゃう！！ビッグカツも、わためぇらしい景品が当たって良かったね～！ビンゴ頑張ったもんね。おめでとう！とっても楽しい時間だったよ～！！大好き！"}]},"headerBackgroundColor":4294947584,"headerTextColor":3741319168,"bodyBackgroundColor":4294953512,"bodyTextColor":3741319168,"authorExternalChannelId":"UCOAkB4jFc_lYAj1mMcydXLA","authorNameTextColor":2315255808,"contextMenuEndpoint":{"clickTrackingParams":"CAQQ7rsEIhMIuumekub3gAMV6aKVAh3VKw67","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMHR5VFhnMVNHMDVORUZFUm1KVVEzZG5VV1JuU2tWSWRFRWFLU29uQ2hoVlEzRnRNMEpSVEd4S1puWnJWSE5ZWDJoMmJUQlZiVUVTQzE5WWJrVTViRXM1Y2xaM0lBSW9BVElhQ2hoVlEwOUJhMEkwYWtaalgyeFpRV294YlUxamVXUllURUU0QWtnQVVBOCUzRA=="}},"timestampColor":2147483648,"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CAQQ7rsEIhMIuumekub3gAMV6aKVAh3VKw67","authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/NmVS6jMTmLZ_2LGjkNTt9lKY8_xOOZ3dh3ye_HwN_6VqvLlK3VvE8wERjHRKXvGnlKIw5I5H2wQ=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/NmVS6jMTmLZ_2LGjkNTt9lKY8_xOOZ3dh3ye_HwN_6VqvLlK3VvE8wERjHRKXvGnlKIw5I5H2wQ=s32-c-k","width":32,"height":32}]},"tooltip":"Member (1 year)","accessibility":{"accessibilityData":{"label":"Member
// (1 year)"}}}}],"textInputBackgroundColor":822083583}},"trackingParams":"CAMQjtEGIhMIuumekub3gAMV6aKVAh3VKw67"}},"authorExternalChannelId":"UCOAkB4jFc_lYAj1mMcydXLA","fullDurationSec":300,"trackingParams":"CAIQsMgEIhMIuumekub3gAMV6aKVAh3VKw67"}},"durationSec":"300"}


// GIFT
// {"item":{"liveChatTickerSponsorItemRenderer":{"id":"ChwKGkNKdjl0WXJtOTRBREZYWEJ3Z1FkYUU4SXRB","detailText":{"accessibility":{"accessibilityData":{"label":"「WD」水無月しろねこ gifted a membership"}},"simpleText":"1"},"detailTextColor":4294967295,"startBackgroundColor":4279213400,"endBackgroundColor":4278943811,"sponsorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/ytc/AOPolaR-fAF80Re8pxyv_9E_lJgKaIS3NICnsksnSWxWvcg=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/ytc/AOPolaR-fAF80Re8pxyv_9E_lJgKaIS3NICnsksnSWxWvcg=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"durationSec":120,"showItemEndpoint":{"clickTrackingParams":"CAMQ6ocJIhMI7tOjl-b3gAMVGm-RCh1BNQL8","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"showLiveChatItemEndpoint":{"renderer":{"liveChatSponsorshipsGiftPurchaseAnnouncementRenderer":{"authorExternalChannelId":"UCv7bfJl5HPsCKVg0xqnEn8A","header":{"liveChatSponsorshipsHeaderRenderer":{"authorName":{"simpleText":"「WD」水無月しろねこ"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/ytc/AOPolaR-fAF80Re8pxyv_9E_lJgKaIS3NICnsksnSWxWvcg=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/ytc/AOPolaR-fAF80Re8pxyv_9E_lJgKaIS3NICnsksnSWxWvcg=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"primaryText":{"runs":[{"text":"Gifted ","bold":true},{"text":"1","bold":true},{"text":" ","bold":true},{"text":"Watame Ch. 角巻わため","bold":true},{"text":" memberships","bold":true}]},"authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/OBlEowC_cpJ-gPq465Ly0gVdTr7Jotnai4Em0MQm2UZOkzwT5d3AVgGzoAiM9uy5DgU3qVCNww=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/OBlEowC_cpJ-gPq465Ly0gVdTr7Jotnai4Em0MQm2UZOkzwT5d3AVgGzoAiM9uy5DgU3qVCNww=s32-c-k","width":32,"height":32}]},"tooltip":"Member (3 years)","accessibility":{"accessibilityData":{"label":"Member (3 years)"}}}}],"contextMenuEndpoint":{"clickTrackingParams":"CAUQ3MMKIhMI7tOjl-b3gAMVGm-RCh1BNQL8","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMHAyT1hSWmNtMDVORUZFUmxoWVFuZG5VV1JoUlRoSmRFRWFLU29uQ2hoVlEzRnRNMEpSVEd4S1puWnJWSE5ZWDJoMmJUQlZiVUVTQzE5WWJrVTViRXM1Y2xaM0lBSW9BVElhQ2hoVlEzWTNZbVpLYkRWSVVITkRTMVpuTUhoeGJrVnVPRUU0QWtnQVVDUSUzRA=="}},"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"image":{"thumbnails":[{"url":"https://www.gstatic.com/youtube/img/sponsorships/sponsorships_gift_purchase_announcement_artwork.png"}]}}}}},"trackingParams":"CAQQjtEGIhMI7tOjl-b3gAMVGm-RCh1BNQL8"}},"authorExternalChannelId":"UCv7bfJl5HPsCKVg0xqnEn8A","fullDurationSec":120,"trackingParams":"CAMQ6ocJIhMI7tOjl-b3gAMVGm-RCh1BNQL8","detailIcon":{"iconType":"GIFT"}}},"durationSec":"120"}

// {"item":{"liveChatTickerPaidMessageItemRenderer":{"id":"ChwKGkNPaUUxcFBsOTRBREZhVEN3Z1FkRDhzT3NB","amount":{"simpleText":"¥2,000"},"amountTextColor":3758096383,"startBackgroundColor":4294278144,"endBackgroundColor":4293284096,"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/KvuEFm9RUAAwt9vS3xFV4dhiBgbAvH7GAU5Xm5-ypJDAkHQBjfvTjzyqftJ-7AdXRdNe4mFPBA=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/KvuEFm9RUAAwt9vS3xFV4dhiBgbAvH7GAU5Xm5-ypJDAkHQBjfvTjzyqftJ-7AdXRdNe4mFPBA=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}],"accessibility":{"accessibilityData":{"label":"WD緒化羊子"}}},"durationSec":234,"showItemEndpoint":{"clickTrackingParams":"CBkQsMgEIhMI1NLCwub3gAMV6aKVAh3VKw67","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"showLiveChatItemEndpoint":{"renderer":{"liveChatPaidMessageRenderer":{"id":"ChwKGkNPaUUxcFBsOTRBREZhVEN3Z1FkRDhzT3NB","timestampUsec":"1692965822381741","authorName":{"simpleText":"WD緒化羊子"},"authorPhoto":{"thumbnails":[{"url":"https://yt4.ggpht.com/KvuEFm9RUAAwt9vS3xFV4dhiBgbAvH7GAU5Xm5-ypJDAkHQBjfvTjzyqftJ-7AdXRdNe4mFPBA=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/KvuEFm9RUAAwt9vS3xFV4dhiBgbAvH7GAU5Xm5-ypJDAkHQBjfvTjzyqftJ-7AdXRdNe4mFPBA=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"purchaseAmountText":{"simpleText":"¥2,000"},"message":{"runs":[{"text":"わため、スプラッシュパーティがんばれ！！最高に輝いてる所みせてね！応援してるよー！！"},{"emoji":{"emojiId":"UCqm3BQLlJfvkTsX_hvm0UmA/PCO_Xre8EJKN-gOKlLSYCg","shortcuts":[":_ナンバー1:",":ナンバー1:"],"searchTerms":["_ナンバ
// ー1","ナンバー1"],"image":{"thumbnails":[{"url":"https://yt3.ggpht.com/_xqWZ5GVmpdMUB4H6mCizReu1r2MS3Cobu4DLWnlLqdZgUFUDmvc5YPYD49jGFEf7YiTE9ch=w24-h24-c-k-nd","width":24,"height":24},{"url":"https://yt3.ggpht.com/_xqWZ5GVmpdMUB4H6mCizReu1r2MS3Cobu4DLWnlLqdZgUFUDmvc5YPYD49jGFEf7YiTE9ch=w48-h48-c-k-nd","width":48,"height":48}],"accessibility":{"accessibilityData":{"label":"ナンバー1"}}},"isCustomEmoji":true}},{"emoji":{"emojiId":"UCqm3BQLlJfvkTsX_hvm0UmA/PCO_Xvm8EJKN-gOKlLSYCg","shortcuts":[":_にこにこ:",":にこにこ:"],"searchTerms":["_にこにこ","にこにこ"],"image":{"thumbnails":[{"url":"https://yt3.ggpht.com/rVufF71v-pfdpTG7bZCJG4OXbEM3pJW_ryZF0GzAGVvIwprRfAcF6PJNt_sTeRRuuCwM1oQCCg=w24-h24-c-k-nd","width":24,"height":24},{"url":"https://yt3.ggpht.com/rVufF71v-pfdpTG7bZCJG4OXbEM3pJW_ryZF0GzAGVvIwprRfAcF6PJNt_sTeRRuuCwM1oQCCg=w48-h48-c-k-nd","width":48,"height":48}],"accessibility":{"accessibilityData":{"label":"にこにこ"}}},"isCustomEmoji":true}},{"emoji":{"emojiId":"UCqm3BQLlJfvkTsX_hvm0UmA/ayavYLK3GsGT8wSxnae4DA","shortcuts":[":_専用ハート:",":専用ハート:"],"searchTerms":["_専用ハート","専用ハート"],"image":{"thumbnails":[{"url":"https://yt3.ggpht.com/V2C_AokG24FlJJlfXref2S81RhkKiI61wtIHtMueoZRoV6w9JXJiu51jE8vXzfhtCTKHNrscVA=w24-h24-c-k-nd","width":24,"height":24},{"url":"https://yt3.ggpht.com/V2C_AokG24FlJJlfXref2S81RhkKiI61wtIHtMueoZRoV6w9JXJiu51jE8vXzfhtCTKHNrscVA=w48-h48-c-k-nd","width":48,"height":48}],"accessibility":{"accessibilityData":{"label":"専用ハート"}}},"isCustomEmoji":true}}]},"headerBackgroundColor":4293284096,"headerTextColor":3758096383,"bodyBackgroundColor":4294278144,"bodyTextColor":3758096383,"authorExternalChannelId":"UCoULEeC9OyqjTZ0tfc9VX3Q","authorNameTextColor":3019898879,"contextMenuEndpoint":{"clickTrackingParams":"CBsQ7rsEIhMI1NLCwub3gAMV6aKVAh3VKw67","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMDlwUlRGd1VHdzVORUZFUm1GVVEzZG5VV1JFT0hOUGMwRWFLU29uQ2hoVlEzRnRNMEpSVEd4S1puWnJWSE5ZWDJoMmJUQlZiVUVTQzE5WWJrVTViRXM1Y2xaM0lBSW9BVElhQ2hoVlEyOVZURVZsUXpsUGVYRnFWRm93ZEdaak9WWllNMUU0QWtnQVVBOCUzRA=="}},"timestampColor":2164260863,"contextMenuAccessibility":{"accessibilityData":{"label":"Chat actions"}},"trackingParams":"CBsQ7rsEIhMI1NLCwub3gAMV6aKVAh3VKw67","authorBadges":[{"liveChatAuthorBadgeRenderer":{"customThumbnail":{"thumbnails":[{"url":"https://yt3.ggpht.com/GbY7r0cX87kSsHAK6r8DDJE8z87dg-FB-pwATFMR2N8owH4FvbA_AuboagAbSmHU3jjup62fgX8=s16-c-k","width":16,"height":16},{"url":"https://yt3.ggpht.com/GbY7r0cX87kSsHAK6r8DDJE8z87dg-FB-pwATFMR2N8owH4FvbA_AuboagAbSmHU3jjup62fgX8=s32-c-k","width":32,"height":32}]},"tooltip":"Member (2 years)","accessibility":{"accessibilityData":{"label":"Member (2 years)"}}}}],"textInputBackgroundColor":805306368}},"trackingParams":"CBoQjtEGIhMI1NLCwub3gAMV6aKVAh3VKw67"}},"authorExternalChannelId":"UCoULEeC9OyqjTZ0tfc9VX3Q","fullDurationSec":600,"trackingParams":"CBkQsMgEIhMI1NLCwub3gAMV6aKVAh3VKw67"}},"durationSec":"234"}