import { IChatThumbnail } from "../../types/Types"
import { FormatPoolChoices, formatPoolChoices } from "./actionsUtils"

export interface PoolChoices {
  "text": {
    "runs": { text: string }[]
  },
  "selected": boolean,
  "voteRatio": number,
  "votePercentage": {
    "simpleText": string
  }
}
interface UpdateLiveChatPollAction {
  "pollToUpdate": {
    "pollRenderer": {
      "choices": PoolChoices[]
      "liveChatPollId": string,
      "header": {
        "pollHeaderRenderer": {
          "pollQuestion": {
            "runs": { text: string }[]
          },
          "thumbnail": {
            "thumbnails": IChatThumbnail[]
          },
          "metadataText": {
            "runs": { text: string }[] /// [0] channel:  [2] time [4] votes
          },
          "liveChatPollType": string
        }
      }
    }
  }
}


export interface LivePools {
  choices: FormatPoolChoices[]
  question: {
    text: string
  }[]
  started: string
  votes: string
  channel: string
}

const updateLiveChatPollAction = (messageData: UpdateLiveChatPollAction, emitter: NodeJS.EventEmitter, channel: string) => {

  const responseData = {
    question: messageData.pollToUpdate.pollRenderer.header.pollHeaderRenderer.pollQuestion.runs,
    choices: formatPoolChoices(messageData.pollToUpdate.pollRenderer.choices),
    votes: messageData.pollToUpdate.pollRenderer.header.pollHeaderRenderer.metadataText.runs[4].text,
    channel: messageData.pollToUpdate.pollRenderer.header.pollHeaderRenderer.metadataText.runs[0].text,
    started: messageData.pollToUpdate.pollRenderer.header.pollHeaderRenderer.metadataText.runs[2].text
  } as LivePools

  emitter.emit("updateLiveChatPoll", { ...responseData, channel });
}

export default updateLiveChatPollAction


// {"pollToUpdate":{"pollRenderer":{"choices":[{"text":{"runs":[{"text":"Yes"}]},"selected":false,"voteRatio":0.70652174949646,"votePercentage":{"simpleText":"71%"},"signinEndpoint":{"commandMetadata":{"webCommandMetadata":{"url":"https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Den&hl=en","webPageType":"WEB_PAGE_TYPE_UNKNOWN","rootVe":83769}},"signInEndpoint":{"nextEndpoint":{}}}},{"text":{"runs":[{"text":"No"}]},"selected":false,"voteRatio":0.29347825050354004,"votePercentage":{"simpleText":"29%"},"signinEndpoint":{"commandMetadata":{"webCommandMetadata":{"url":"https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Den&hl=en","webPageType":"WEB_PAGE_TYPE_UNKNOWN","rootVe":83769}},"signInEndpoint":{"nextEndpoint":{}}}}],"liveChatPollId":"ChwKGkNMMlJyNFdWLW9BREZmVUVaUW9kUjN3UFFR","header":{"pollHeaderRenderer":{"pollQuestion":{"runs":[{"text":"If you had to pay to play DMZ in the future, would you?"}]},"thumbnail":{"thumbnails":[{"url":"https://yt4.ggpht.com/83Z4qgwFSTkhL_IyWRQvYpIa3MlNKmRHZmpooVPxmB9kVuqnWSYT80tzDBwckG-MuEPYDU6FEi4=s32-c-k-c0x00ffffff-no-rj","width":32,"height":32},{"url":"https://yt4.ggpht.com/83Z4qgwFSTkhL_IyWRQvYpIa3MlNKmRHZmpooVPxmB9kVuqnWSYT80tzDBwckG-MuEPYDU6FEi4=s64-c-k-c0x00ffffff-no-rj","width":64,"height":64}]},"metadataText":{"runs":[{"text":"Phixate"},{"text":" • "},{"text":"2h ago"},{"text":" • "},{"text":"2,024 votes"}]},"liveChatPollType":"LIVE_CHAT_POLL_TYPE_CREATOR","contextMenuButton":{"buttonRenderer":{"icon":{"iconType":"MORE_VERT"},"accessibility":{"label":"Chat actions"},"accessibilityData":{"accessibilityData":{"label":"Chat actions"}},"targetId":"live-chat-action-panel-poll-context-menu","command":{"commandMetadata":{"webCommandMetadata":{"ignoreNavigation":true}},"liveChatItemContextMenuEndpoint":{"params":"Q2g0S0hBb2FRMHd5VW5JMFYxWXRiMEZFUm1aVlJWcFJiMlJTTTNkUVVWRWFLU29uQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2NTQ3kwMVRtTlhiVEowVUMxSklBSW9BVElhQ2hoVlExWlVMVGd6TlRCMFEzQlRZemRmV0RSa1FtaHVaV2M0QTBnQVVCVSUzRA=="}}}}}}}}}