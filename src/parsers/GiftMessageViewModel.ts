import { harvestModeration } from "./common";
import { lastThumbnailUrl } from "./parseMessage";
import { TUBECHAT } from "./types";
import { normalizeThumbUrl } from "./utilsParser";


function avatarUrl(avatarViewModel: any): string {
  const sources = avatarViewModel?.image?.sources;
  if (Array.isArray(sources) && sources.length > 0) {
    return sources[sources.length - 1]?.url || '';
  }
  return '';
}

function giftSources(giftImage: any): string {
  if (!giftImage) return '';
  if (Array.isArray(giftImage.sources) && giftImage.sources.length > 0) {
    return normalizeThumbUrl(giftImage.sources[giftImage.sources.length - 1]?.url || '');
  }
  if (Array.isArray(giftImage.thumbnails)) {
    return normalizeThumbUrl(lastThumbnailUrl(giftImage.thumbnails));
  }
  return '';
}

export class GiftMessageViewModel {
  // giftMessageViewModel:
  public static readonly rendererKey = 'giftMessageViewModel';

  public static parseItem(item: any): TUBECHAT.Msg_Jewels | null {
    const renderer = item?.[this.rendererKey];
    if (!renderer) {
      return null;
    }
    try {
      const moderation = harvestModeration(renderer);
      const authorName = typeof renderer['authorName']?.content === 'string'
        ? renderer['authorName'].content
        : (renderer['authorName']?.simpleText || '');
      const content = typeof renderer['text']?.content === 'string'
        ? renderer['text'].content
        : '';
      const jewels = {
        id: renderer['id'],
        author: {
          channelName: (authorName || '').trim(),
          ...(renderer['authorExternalChannelId'] && { channelId: renderer['authorExternalChannelId'] }),
          ...(avatarUrl(renderer['authorAvatar']?.['avatarViewModel']) && { photo: avatarUrl(renderer['authorAvatar']?.['avatarViewModel']) }),
        },
        content,
        ...(renderer['giftImageA11yLabel'] && { giftLabel: renderer['giftImageA11yLabel'] }),
        ...(giftSources(renderer['giftImage']) && { giftImage: giftSources(renderer['giftImage']) }),
        ...(moderation && { moderation }),
      } satisfies TUBECHAT.Msg_Jewels;
      return jewels;

    } catch (e) {
      console.error("Error parsing data in giftMessageViewModel:", e);
      return null;
    }
  }
}
