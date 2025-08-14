import type { MessageData } from '../types';
import type { Message, MessageRun, RunWithEmoji } from './types';

function hasEmoji(run: MessageRun): run is RunWithEmoji {
  return 'emoji' in run;
}

export default function parseMessages(messageRuns: Message) {
  const message = messageRuns.runs?.map((run) => {
    if (hasEmoji(run)) {
      const isCustomEmoji = run?.emoji.isCustomEmoji || false
      const shortcut = run?.emoji?.shortcuts?.[0]
      return {
        text: isCustomEmoji ? shortcut : run.emoji.image.accessibility.accessibilityData.label,
        emoji: {
          ...(isCustomEmoji && { emojiId: run.emoji.emojiId }),
          ...(shortcut && { shortcut }),
          isCustomEmoji: isCustomEmoji,
          emojiImage: run.emoji.image.thumbnails.pop()?.url!,
        }
      }
    } else {
      return {
        text: run.text,
        ...(run?.navigationEndpoint && { navigationEndpoint: run?.navigationEndpoint })
      }
    }
  }) as MessageData

  return message

}