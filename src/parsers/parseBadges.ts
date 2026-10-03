import type { AuthorBadges, LeaderboardBadge, YTChatBadges } from './types';
import { lastThumbnailUrl } from './parseMessage';

/** Parse "Member (6 months)" / "Membro há 2 anos" / "New member" etc. Returns months or undefined. */
export function parseMembershipMonths(tooltip: string): number | undefined {
  if (!tooltip) return undefined;
  if (/^\s*new\b/i.test(tooltip)) return 1;
  const m = tooltip.match(/(\d+)\s*(month|mes|mês|year|ano)/i);
  if (!m) return undefined;
  const n = parseInt(m[1]!, 10);
  if (Number.isNaN(n)) return undefined;
  const unit = m[2]!.toLowerCase();
  const isYear = unit.startsWith('year') || unit.startsWith('ano');
  return isYear ? n * 12 : n;
}

/** Best-effort normalization of the newer badge ViewModel shape. */
function normalizeBadgeViewModel(vm: any): any | null {
  if (!vm || typeof vm !== 'object') return null;
  if (!vm.iconType && !vm.icon && !vm.customThumbnail && !vm.tooltip) return null;
  return {
    icon: vm.icon || (vm.iconType ? { iconType: vm.iconType } : undefined),
    customThumbnail: vm.customThumbnail,
    tooltip: vm.tooltip || '',
    accessibility: vm.accessibility,
  };
}

export default function parseBadges(authorBadges: AuthorBadges[] | undefined | null, beforeContentButtons: LeaderboardBadge[] | undefined | null) {
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
  };
  if (authorBadges) {
    for (const entry of authorBadges) {
      // Newer payloads may use liveChatAuthorBadgeViewModel instead.
      const badge = entry?.liveChatAuthorBadgeRenderer || normalizeBadgeViewModel(entry?.liveChatAuthorBadgeViewModel);
      if (!badge) continue;
      if (badge.customThumbnail) {
        badges.sub = {
          url: lastThumbnailUrl((badge.customThumbnail as any)?.thumbnails),
          alt: badge.accessibility?.accessibilityData?.label || ''
        };
        responseJson.isMembership = true;
        const tooltip: string = (badge as any).tooltip || '';
        const months = parseMembershipMonths(tooltip);
        responseJson.isNewMember = /^\s*new\b/i.test(tooltip);
        if (months !== undefined) pushBadges("months", months);
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
          default:
            break;
        }
      }
    }
  }
  for (const { buttonViewModel } of (beforeContentButtons || [])) {
    if (!buttonViewModel) continue;
    if (buttonViewModel.iconName == 'CROWN' && buttonViewModel.title != null) {
      pushBadges('crown', String(buttonViewModel.title));
    }
    // XP leaderboard entry point (CROWN #N button opens the panel).
    const panel = buttonViewModel?.onTap?.innertubeCommand?.showEngagementPanelEndpoint;
    const tag: unknown = panel?.identifier?.tag;
    if (panel && typeof tag === 'string' && /leaderboard/i.test(tag)) {
      const params: unknown = panel?.globalConfiguration?.params;
      badges.leaderboard = {
        ...(buttonViewModel.title != null && { rank: String(buttonViewModel.title) }),
        ...(typeof params === 'string' && params && { panelParams: params }),
      };
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

  return responseJson;
}
