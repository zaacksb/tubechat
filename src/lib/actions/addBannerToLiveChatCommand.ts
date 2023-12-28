const addBannerToLiveChatCommand = (value: any, emitter: NodeJS.EventEmitter, channel: string) => {
  emitter.emit("banner", { channel, ...value });
}

export default addBannerToLiveChatCommand

// {"bannerRenderer":{"liveChatBannerRenderer":{"header":{"liveChatBannerHeaderRenderer":{"icon":{"iconType":"POLL"},"text":{"runs":[{"text":"Poll"}]}}},"contents":{"pollRenderer":{"choices":[{"text":{"runs":[{"text":"Yes"}]},"selected":false,"signinEndpoint":{"clickTrackingParams":"CBsQu3AiEwiSlcGZqfqAAxUhrZUCHSGiB3I=","commandMetadata":{"webCommandMetadata":{"url":"https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Den&hl=en","webPageType":"WEB_PAGE_TYPE_UNKNOWN","rootVe":83769}},"signInEndpoint":{"nextEndpoint":{"clickTrackingParams":"CBsQu3AiEwiSlcGZqfqAAxUhrZUCHSGiB3I="}}}},{"text":{"runs":[{"text":"No"}]},"selected":false,"signinEndpoint":{"clickTrackingParams":"CBsQu3AiEwiSlcGZqfqAAxUhrZUCHSGiB3I=","commandMetadata":{"webCommandMetadata":{"url":"https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Den&hl=en","webPageType":"WEB_PAGE_TYPE_UNKNOWN","rootVe":83769}},"signInEndpoint":{"nextEndpoint":{"clickTrackingParams":"CBsQu3AiEwiSlcGZqfqAAxUhrZUCHSGiB3I="}}}}],"trackingParams":"CBsQu3AiEwiSlcGZqfqAAxUhrZUCHSGiB3I=","liveChatPollId":"ChwKGkNMMlJyNFdWLW9BREZmVUVaUW9kUjN3UFFR","header":{"pollHeaderRenderer":{"pollQuestion":{"runs":[{"text":"If you had to pay to play DMZ in the future, would you?"}]},"thumbnail":{"thumbnails":[{"url":"https://yt4.ggpht.com/83Z4qgwFSTkhL_IyWRQvYpIa3MlNKmRHZmpooVPxmB9kVuqnWSYT80tzDBwckG-MuEPYDU6FEi4=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/83Z4qgwFSTkhL_IyWRQvYpIa3MlNKmRHZmpooVPxmB9kVuqnWSYT80tzDBwckG-MuEPYDU6FEi4=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"metadataText":{"runs":[{"text":"Phixate"},{"text":" • "},{"text":"1h ago"},{"text":" • "},{"text":"1,197 votes"}]},"liveChatPollType":"LIVE_CHAT_POLL_TYPE_CREATOR","contextMenuButton":{"buttonRenderer":{"icon":{"iconType":"MORE_VERT"},"accessibility":{"label":"Chat actions"},"trackingParams":"CBwQ8FsiEwiSlcGZqfqAAxUhrZUCHSGiB3I=","accessibilityData":{"accessibilityData":{"label":"Chat actions"}},"targetId":"live-chat-action-panel-poll-context-menu","command":{"clickTrackingParams":"CBwQ8FsiEwiSlcGZqfqAAxUhrZUCHSGiB3I=","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMHd5VW5JMFYxWXRiMEZFUm1aVlJWcFJiMlJTTTNkUVVWRWFLU29uQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2NTQ3kwMVRtTlhiVEowVUMxSklBSW9BVElhQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2M0QTBnQVVCVSUzRA=="}}}}}}}},"actionId":"ChwKGkNMMlJyNFdWLW9BREZmVUVaUW9kUjN3UFFR","viewerIsCreator":false,"targetId":"live-chat-banner","isStackable":true,"backgroundType":"LIVE_CHAT_BANNER_BACKGROUND_TYPE_STATIC","bannerType":"LIVE_CHAT_BANNER_TYPE_ACTIVE_POLL"}}}


// {"bannerRenderer":{"liveChatBannerRenderer":{"header":{"liveChatBannerHeaderRenderer":{"icon":{"iconType":"POLL"},"text":{"runs":[{"text":"Poll"}]}}},"contents":{"pollRenderer":{"choices":[{"text":{"runs":[{"text":"Yes"}]},"selected":false,"signinEndpoint":{"clickTrackingParams":"CBwQu3AiEwi_gfisrvqAAxWUFR4AHTAcBPc=","commandMetadata":{"webCommandMetadata":{"url":"https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Den&hl=en","webPageType":"WEB_PAGE_TYPE_UNKNOWN","rootVe":83769}},"signInEndpoint":{"nextEndpoint":{"clickTrackingParams":"CBwQu3AiEwi_gfisrvqAAxWUFR4AHTAcBPc="}}}},{"text":{"runs":[{"text":"No"}]},"selected":false,"signinEndpoint":{"clickTrackingParams":"CBwQu3AiEwi_gfisrvqAAxWUFR4AHTAcBPc=","commandMetadata":{"webCommandMetadata":{"url":"https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Den&hl=en","webPageType":"WEB_PAGE_TYPE_UNKNOWN","rootVe":83769}},"signInEndpoint":{"nextEndpoint":{"clickTrackingParams":"CBwQu3AiEwi_gfisrvqAAxWUFR4AHTAcBPc="}}}}],"trackingParams":"CBwQu3AiEwi_gfisrvqAAxWUFR4AHTAcBPc=","liveChatPollId":"ChwKGkNMMlJyNFdWLW9BREZmVUVaUW9kUjN3UFFR","header":{"pollHeaderRenderer":{"pollQuestion":{"runs":[{"text":"If you had to pay to play DMZ in the future, would you?"}]},"thumbnail":{"thumbnails":[{"url":"https://yt4.ggpht.com/83Z4qgwFSTkhL_IyWRQvYpIa3MlNKmRHZmpooVPxmB9kVuqnWSYT80tzDBwckG-MuEPYDU6FEi4=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/83Z4qgwFSTkhL_IyWRQvYpIa3MlNKmRHZmpooVPxmB9kVuqnWSYT80tzDBwckG-MuEPYDU6FEi4=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"metadataText":{"runs":[{"text":"Phixate"},{"text":" • "},{"text":"1h ago"},{"text":" • "},{"text":"1,451 votes"}]},"liveChatPollType":"LIVE_CHAT_POLL_TYPE_CREATOR","contextMenuButton":{"buttonRenderer":{"icon":{"iconType":"MORE_VERT"},"accessibility":{"label":"Chat actions"},"trackingParams":"CB0Q8FsiEwi_gfisrvqAAxWUFR4AHTAcBPc=","accessibilityData":{"accessibilityData":{"label":"Chat actions"}},"targetId":"live-chat-action-panel-poll-context-menu","command":{"clickTrackingParams":"CB0Q8FsiEwi_gfisrvqAAxWUFR4AHTAcBPc=","commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMHd5VW5JMFYxWXRiMEZFUm1aVlJWcFJiMlJTTTNkUVVWRWFLU29uQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2NTQ3kwMVRtTlhiVEowVUMxSklBSW9BVElhQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2M0QTBnQVVCVSUzRA=="}}}}}}}},"actionId":"ChwKGkNMMlJyNFdWLW9BREZmVUVaUW9kUjN3UFFR","viewerIsCreator":false,"targetId":"live-chat-banner","isStackable":true,"backgroundType":"LIVE_CHAT_BANNER_BACKGROUND_TYPE_STATIC","bannerType":"LIVE_CHAT_BANNER_TYPE_ACTIVE_POLL"}}}