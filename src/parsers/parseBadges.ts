;
import type { AuthorBadges, LeaderboardBadge, YTChatBadges } from './types';

export default function parseBadges(authorBadges: AuthorBadges[], beforeContentButtons: LeaderboardBadge[]) {
  let badges: YTChatBadges = {};

  function pushBadges(objectName: string, value: number | string) {
    badges = { ...badges, [objectName]: value };
  }
  const responseJson = {
    isMembership: false,
    isNewMember: false,
    isOwner: false,
    isVerified: false,
    isModerator: false,
    badges,
    color: "#bcbcbc",
  }
  if (authorBadges) {
    for (const entry of authorBadges) {
      const badge = entry.liveChatAuthorBadgeRenderer;
      if (badge.customThumbnail) {
        badges.sub = {
          url: badge.customThumbnail.thumbnails.pop()?.url!,
          alt: badge.accessibility.accessibilityData.label
        }
        responseJson.isMembership = true;
        const isNewMember = badge.tooltip.includes('New')
        const subMonths = isNewMember ? 1 : parseInt(badge.tooltip.split('(')[1]?.split(' ')[0]!)
        const multiplier = badge.tooltip.includes("month") || isNewMember ? 1 : 12
        responseJson.isNewMember = isNewMember
        pushBadges("months", subMonths * multiplier);
      } else {
        const iconType = badge.icon?.iconType || "";
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
  beforeContentButtons.forEach(({buttonViewModel}) => {
    if(buttonViewModel.iconName == 'CROWN') pushBadges('crown', String(buttonViewModel.title))
  })
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

  return responseJson
}