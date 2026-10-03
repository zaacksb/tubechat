/**
 * Discord.js-style event names. Optional: plain strings keep working
 * with identical typing (`tube.on('message', ...)`).
 *
 * ```ts
 * import { TubeChat, Events } from 'tubechat';
 * const tube = new TubeChat();
 * tube.once(Events.Join, (chatId) => console.log('joined', chatId));
 * tube.on(Events.Message, (m) => console.log(m.author.channelName, m.text));
 * ```
 */
export const Events = {
  Message: 'message',
  SuperChat: 'superchat',
  SubGiftAnnounce: 'subgift_announce',
  SubGift: 'subgift',
  Member: 'member',
  Jewels: 'jewels',
  Donation: 'donation',
  Poll: 'poll',
  Notice: 'notice',
  Pinned: 'pinned',
  System: 'system',
  DeletedMessage: 'deletedMessage',
  DeleteUserMessages: 'deleteUserMessages',
  Cleared: 'cleared',
  Dimmed: 'dimmed',
  Raw: 'raw',
  Error: 'error',
  Join: 'join',
  Retry: 'retry',
  JoinError: 'joinError',
  Disconnected: 'disconnected',
  AuthExpired: 'authExpired',
} as const;

/** Union of all event name strings (`'message' | 'superchat' | ...`). */
export type EventName = (typeof Events)[keyof typeof Events];
