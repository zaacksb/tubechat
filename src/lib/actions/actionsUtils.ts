import { IChatYTMessage } from "../../types/Client";
import { IChatData, YTChatBadges } from "../../types/Types";
import { compactMessage, createBadgesElements, parseMessages, parseThumbnailToImageItem } from "../utils";
import { PoolChoices } from "./updateLiveChatPollAction";

export function createCommonUserResponse(messageData: Partial<IChatData>): IChatYTMessage {
  var _a, _b, _c;
  const {
    authorName,
    authorPhoto = { thumbnails: [] },
    timestampUsec,
    authorExternalChannelId,
    id,
    authorBadges,
    message,
  } = messageData;
  const authorNameText =
    (_b =
      (_a = authorName) === null || _a === void 0 ? void 0 : _a.simpleText) !==
      null && _b !== void 0
      ? _b
      : "";
  const liveChatAuthorBadgeRenderer =
    authorBadges?.[0].liveChatAuthorBadgeRenderer;
  let badges: YTChatBadges = {};
  if (liveChatAuthorBadgeRenderer?.customThumbnail?.thumbnails) {
    badges = createBadgesElements(
      liveChatAuthorBadgeRenderer?.customThumbnail.thumbnails,
      liveChatAuthorBadgeRenderer.tooltip
    );
  }

  function pushBadges(objectName: string, value: number) {
    badges = { ...badges, [objectName]: value };
  }
  var msg

  if (message) {
    const messageFormated = parseMessages(message.runs);
    msg = messageFormated.map(({ alt, emojiText, isCustomEmoji, text, url }) => {
      if (text?.trim()) {
        return { text }
      }
      if (isCustomEmoji == true) {
        return { emoji: url }
      }
      if (isCustomEmoji == false) {
        return { text: emojiText }
      }
    });
    msg = compactMessage(compactMessage(msg)?.filter(item => item))?.filter(item => item)
  }
  const responseJson = {
    id,
    message: msg,
    name: authorNameText,
    thumbnail: parseThumbnailToImageItem(
      authorPhoto.thumbnails,
      authorNameText
    ),
    channelId: authorExternalChannelId,
    isMembership: false,
    isOwner: false,
    isVerified: false,
    isModerator: false,
    isNewMember: false,
    badges,
    color: "#bcbcbc",
    timestamp: new Date(),
  } as IChatYTMessage;

  if (authorBadges) {
    for (const entry of authorBadges) {
      const badge = entry.liveChatAuthorBadgeRenderer;
      if (badge.customThumbnail) {
        responseJson.isMembership = true;
        const isNewMember = badge.tooltip.includes('New')
        const subMonths = isNewMember ? 1 : parseInt(badge.tooltip.split('(')[1]?.split(' ')[0])
        const multiplier = badge.tooltip.includes("month") || isNewMember ? 1 : 12
        responseJson.isNewMember = isNewMember
        pushBadges("subscriber", subMonths * multiplier);
      } else {
        const iconType: string = badge.icon.iconType || "";
        switch (iconType) {
          case "OWNER":
            responseJson.isOwner = true;
            pushBadges("owner", 1);
            break;
          case "VERIFIED":
            responseJson.isVerified = true;
            pushBadges("verified", 1);
            break;
          case "MODERATOR":
            responseJson.isModerator = true;
            pushBadges("moderator", 1);
            break;
        }
      }
    }
  }
  const color = responseJson.isOwner
    ? "#f35b44"
    : responseJson.isVerified
      ? "#44eef3"
      : responseJson.isModerator
        ? "#1bf232"
        : responseJson.isMembership
          ? "#0bb819"
          : "#bcbcbc";
  responseJson.color = color;
  responseJson.badges = badges;
  responseJson.timestamp = new Date(Number(timestampUsec) / 1000);

  return responseJson
}



export interface FormatPoolChoices {
  runs: {
    text: string
  }[]
  voteRatio: number
  votePercentage: string
}
export function formatPoolChoices(choices: PoolChoices[]): FormatPoolChoices[] {
  const formatedChoices = [] as FormatPoolChoices[]
  choices.map(({ voteRatio, text, votePercentage }) => {
    formatedChoices.push({
      voteRatio,
      votePercentage: votePercentage.simpleText,
      runs: text.runs
    })
  })
  return formatedChoices


}