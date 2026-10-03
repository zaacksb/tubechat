import type { MessageData } from '../types';
import type { Message, MessageRun, RunWithEmoji } from './types';

function hasEmoji(run: MessageRun): run is RunWithEmoji {
  return typeof run === 'object' && run !== null && 'emoji' in run;
}

function lastThumb(thumbs: { url: string }[] | undefined): string {
  if (!thumbs || thumbs.length === 0) return '';
  return thumbs[thumbs.length - 1]?.url || '';
}

export function lastThumbnailUrl(thumbs: { url: string }[] | undefined): string {
  return lastThumb(thumbs);
}

function parseRun(run: MessageRun) {
  if (hasEmoji(run)) {
    const emoji = run.emoji as any;
    const isCustomEmoji = !!emoji?.isCustomEmoji;
    const shortcut: string | undefined = emoji?.shortcuts?.[0];
    const label: string | undefined = emoji?.image?.accessibility?.accessibilityData?.label;
    // Standard unicode emoji: emojiId IS the char (or label matches it).
    // Custom channel emoji: render shortcut (:name:) as text.
    const text = isCustomEmoji
      ? String(shortcut || label || '')
      : (typeof emoji?.emojiId === 'string' && emoji.emojiId.length <= 8 && !/^[A-Za-z0-9_]+$/.test(emoji.emojiId)
        ? emoji.emojiId
        : String(label || shortcut || emoji?.emojiId || ''));
    return {
      text,
      emoji: {
        ...(typeof emoji?.emojiId === 'string' && { emojiId: emoji.emojiId }),
        ...(shortcut && { shortcut }),
        isCustomEmoji: isCustomEmoji,
        emojiImage: lastThumb(emoji?.image?.thumbnails),
      }
    };
  } else {
    return {
      text: String((run as { text?: unknown })?.text ?? ''),
      ...((run as any)?.navigationEndpoint && { navigationEndpoint: (run as any)?.navigationEndpoint })
    };
  }
}

export default function parseMessages(messageRuns: Message) {
  if (!messageRuns || !Array.isArray(messageRuns.runs)) return [] as unknown as MessageData;
  const message = messageRuns.runs.map((run) => {
    try {
      return parseRun(run);
    } catch {
      // One malformed run must not drop the whole message.
      return { text: '' };
    }
  }) as MessageData;

  return message;
}
