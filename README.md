<br/>
<p align="center">
  <a href="https://github.com/zaacksb/tubechat">
    <img src="https://i.imgur.com/NpFXjZF.png" alt="Logo" width="200" height="200">
  </a>

  <h3 align="center">Tubechat</h3>

  <p align="center">  
  TubeChat is an efficient and user-friendly library for YouTube chat integration. Designed for developers and content creators, it streamlines the capture, analysis, and interaction with live chat messages.
    <br/>
    <br/>
    <a href="https://github.com/zaacksb/tubechat/blob/main/README.md"><strong>Explore the docs »</strong></a>
    <br/>
    <br/>
    <a href="https://github.com/zaacksb/tubechat/issues">Report Bug</a>
    .
    <a href="https://github.com/zaacksb/tubechat/issues">Request Feature</a>
  </p>
</p>

![Contributors](https://img.shields.io/github/contributors/zaacksb/tubechat?color=dark-green) ![Issues](https://img.shields.io/github/issues/zaacksb/tubechat) ![License](https://img.shields.io/github/license/zaacksb/tubechat)
[![npm version](https://img.shields.io/npm/v/tubechat.svg?style=flat)](https://www.npmjs.com/package/tubechat)

## About The Project

The TubeChat NodeJS library offers a highly efficient way to integrate with YouTube's live chat. 

Its key differentiator is the use of **`yt-chat-signaler`**, which listens to YouTube's internal RPC signals. Unlike other libraries that rely on constant, resource-intensive polling (`setInterval`), TubeChat only fetches new messages when they are actually available, resulting in superior performance and efficiency.

## Getting Started

### Installation

First install our library

```sh
npm install tubechat
```

## Usage

Import the library

```javascript
import { TubeChat } from 'tubechat'
```

Instantiate the class

```javascript
const tubeChat = new TubeChat({
  // All settings are optional
  useSignaler: true,
  // Only needed for sending messages, live members only, voting and moderation:
  // auth: { cookie: "SID=...; HSID=...; ..." },
});
```

### Constructor Options

You can pass an options object to the `TubeChat` constructor to customize its behavior:

- `useSignaler` (boolean): Whether to use the `yt-chat-signaler` for intelligent, push-based fetching. It is highly recommended to keep this enabled for performance. Defaults to `true`.
- `headers` (HeadersInit): Custom headers to be used for all HTTP requests made by the library.
- `intervalChat` (number): The base interval in milliseconds for fetching chat messages. This is mainly a fallback for when the signaler is not in use. Defaults to `1000`.
- `signalerConnectedInterval` (number): The long-polling interval in milliseconds for when the signaler is connected and waiting for a push signal. Defaults to `15000`.
- `signalerDisconnectedInterval` (number): The faster polling interval for when the signaler is temporarily disconnected, ensuring messages are not missed. Defaults to `1000`.
- `maxRetries` (number): Maximum number of retry attempts for the initial connection to a chat. Defaults to `4`.
- `auth` (object, optional): Login for write/moderation actions. Reading chat stays anonymous; only `say`, `vote`, `removeMessage`, `timeoutUser`, `banUser`, `getMenu` and `checkAuth` require it. Pass `{ cookie }` with the full `Cookie` header value of a logged-in Chrome session. You can also set it later with `tubeChat.setAuth({ cookie })`.
- `legacyPinnedAsMessage` (boolean, **deprecated**): when `true`, pinned/banner messages are ALSO emitted as `message` (pre-1.1 behavior). New code should listen to `pinned` instead. Defaults to `false`.

> **Compatibility (1.1.0):** new events (`poll`, `notice`, `pinned`, `donation`, `cleared`, `dimmed`, `authExpired`) and fields (`text`, `timestamp`, `moderation`, `chatId`/`reply` on emissions) are purely additive. The only behavior change is that pinned banners now emit `pinned` instead of `message` — set `legacyPinnedAsMessage: true` if you relied on the old behavior. Sending messages (`say`) never required moderator status, only login; moderation methods require a moderator session (enforced by YouTube).

### Login (optional — only for sending / moderating)

No official API, no OAuth, no password. Everything else (hashes, session ids) is derived automatically from the cookie:

1. In Chrome (logged in), open the live chat of any live.
2. Press F12 → Network tab → click a `get_live_chat` request.
3. Right-click the `Cookie` request header → Copy value.
4. `new TubeChat({ auth: { cookie: "<pasted>" } })` (or `TUBECHAT_COOKIE` env / `~/.tubechat/auth.json` in your own bootstrap).

Notes: YouTube rotates session cookies roughly hourly — when writes start failing with `SessionExpiredError`, paste a fresh `Cookie`. Paste the value only (no `Cookie:` prefix; surrounding quotes/whitespace are stripped automatically). Never commit the cookie (it is full access to the account); prefer a secondary account for bots.

The client also emits `authExpired` (no payload) whenever a write/check detects the dead session — use it to prompt a cookie refresh instead of polling `checkAuth()`:

```javascript
tubeChat.on('authExpired', () => {
  console.log('Login expired — paste a fresh Cookie.');
});
```


### Connecting to a Chat

To connect to a chat, you need a **Video ID**. The method returns a promise indicating if the join was successful.
```javascript
tubeChat.join(videoId, skipFirstResults, options)
```

- `videoId` (string, **required**): The ID of the YouTube live stream.
- `skipFirstResults` (boolean, optional): If `true`, it will ignore the initial batch of messages that YouTube sends upon connection (which are often historical messages). Defaults to `false`.
- `options` (object, optional):
    - `headers` (HeadersInit): Custom headers specifically for this video's connection requests.
    - `interval` (number): A custom polling interval for this specific video, overriding the global setting.
    - `chatFilter` (`'live' | 'top'`, optional): Which YouTube chat filter to read. Defaults to `'live'` (every message, unfiltered). `'top'` reads YouTube's filtered Top chat instead.

You can switch filters on a live connection without rejoining:

```javascript
await tubeChat.setChatFilter('VIDEO_ID_HERE', 'top'); // or 'live'
```

#### How to get a Video ID from a Channel Name?

If you need to monitor a channel and get its `videoId` when it goes live, we recommend using a library like [**Flow Monitor**](https://github.com/zaacksb/flow-monitor). It can watch a channel and notify you when a stream starts, providing the necessary `videoId`.

Here’s a brief example of how you could integrate it:

```javascript
import { FlowMonitor } from 'flow-monitor';
import { TubeChat } from 'tubechat';

const fMonitor = new FlowMonitor();
const tubeChat = new TubeChat();

// Tell Flow Monitor to watch a channel
fMonitor.connect('LofiGirl', 'youtube');

// When Flow Monitor detects a live stream, it gives you the videoId
fMonitor.on('streamUp', (liveData) => {
  console.log(`${liveData.channel} is live with video ID: ${liveData.vodId}`);
  
  // Now, use the videoId to join the chat with TubeChat
  tubeChat.join(liveData.vodId);
});

// Start monitoring
fMonitor.start();
```

### Uptime & reconnects
The client prioritizes staying connected. It only emits `disconnected` when the chat is confirmed gone:

- **Network failure** (`fetch failed`, DNS, timeouts): never disconnects — retries forever with capped exponential backoff (~1s → ~30s). Each attempt emits `error`.
- **Stale continuation / permission flap**: silently re-bootstraps a fresh continuation (no `join`/`disconnected` noise, no duplicate messages) and keeps polling.
- **Chat really gone** (not found, VOD-only, disabled, ended): retries with attempt counts, then emits `error` + `disconnected`.

### Badges & XP

Badges are parsed from icons (`MODERATOR`/`VERIFIED`/`OWNER`), member thumbnails with tenures in months (English and Portuguese tooltips, e.g. `Member (1 year)`, `Membro (1 ano)`), and the leaderboard crown (`badges.crown` like `#1`). When the author holds an XP leaderboard rank, `badges.leaderboard` carries `{ rank, panelParams }` (entry point to open the leaderboard panel). Per-viewer XP totals are not exposed by the chat API — only the top-N panel, opened client-side.

## Event Handling

All events, in addition to their specific data, also return `chatId` (the video ID), `userChannel` (the channel's vanity name, e.g., "@LofiGirl"), and `videoData` (an object with details about the video). The only exception is `authExpired`, which carries no payload.

You can subscribe with plain strings or with the discord.js-style `Events` const — both are fully typed:

```javascript
import { TubeChat, Events } from 'tubechat';

tubeChat.on('message', (message) => { /* ... */ });
tubeChat.on(Events.Poll, (poll) => { /* ... */ });
tubeChat.once(Events.Join, (chatId) => { /* runs a single time */ });
```

### Connection Events

```javascript
// Emitted when a connection to the chat is successfully established.
tubeChat.on('join', (chatId, userChannel, videoData) => {
  console.log(`Joined chat for ${userChannel} (Video: ${chatId})`);
});

// Emitted when the client disconnects from a chat.
tubeChat.on('disconnected', (chatId, userChannel, videoData) => {
  console.log(`Disconnected from ${userChannel} (Video: ${chatId})`);
});

// Emitted when there's an error joining a chat.
tubeChat.on('joinError', (chatId, error) => {
  console.error(`Failed to join chat ${chatId}:`, error.message);
});

// Emitted on connection retry attempts.
tubeChat.on('retry', (chatId, error, retry, maxRetries) => {
  console.log(`Retrying connection to ${chatId} (${retry}/${maxRetries})...`);
});

// Emitted on general errors, usually during message fetching.
tubeChat.on('error', (chatId, message) => {
  console.error(`An error occurred in chat ${chatId}:`, message);
});
```

### Chat Message Events

```javascript
// A regular chat message.
tubeChat.on('message', (message, chatId, userChannel, videoData) => {
  console.log(`[${userChannel}] ${message.author.channelName}: ${message.text}`);
  // message.message keeps the runs (emoji/links); message.timestamp is millis.
  // Messages held by AutoMod arrive here too, flagged with heldForReview: true.
});

// A Super Chat message (paid message or sticker).
tubeChat.on('superchat', (message, chatId, userChannel, videoData) => {
  console.log(`${message.author.channelName} sent a Super Chat of ${message.formatted}!`);
});

// A new or returning member announcement.
tubeChat.on('member', (message, chatId, userChannel, videoData) => {
  if (message.isResub) {
    console.log(`${message.author.channelName} has been a member for ${message.author.badges.months} months!`);
  } else {
    console.log(`Welcome ${message.author.channelName}, our newest member!`);
  }
});

// When a user gifts one or more subscriptions to the community.
tubeChat.on('subgift_announce', (message, chatId, userChannel, videoData) => {
  console.log(`${message.author.channelName} gifted ${message.count} subs to the community!`);
});

// When a specific user receives a gifted subscription.
tubeChat.on('subgift', (message, chatId, userChannel, videoData) => {
  console.log(`${message.author.channelName} received a gifted sub from ${message.gifter}!`);
});

// For "Jewels" donations, typically from YouTube Shorts.
tubeChat.on('jewels', (message, chatId, userChannel, videoData) => {
  console.log(`${message.author.channelName} sent Jewels!`);
});

// Fundraiser / donation announcements (not superchats).
tubeChat.on('donation', (donation, chatId, userChannel, videoData) => {
  console.log(`${donation.author.channelName} donated ${donation.formatted ?? ''}: ${donation.text}`);
});

// A poll update (question, choices with live vote counts).
// Anyone can vote via choices[].params — see vote() below.
tubeChat.on('poll', (poll, chatId, userChannel, videoData) => {
  console.log(`Poll: ${poll.question} (${poll.totalVotes ?? '?'} votes)`);
  for (const choice of poll.choices) console.log(` - ${choice.text}: ${choice.votePercentage}`);
});

// A viewer-facing notice (e.g. subscribers-only mode card).
// Rare/new renderers (AutoMod holds, Q&A prompts, new gift types, ...) also
// arrive here with a `kind` field naming the renderer.
tubeChat.on('notice', (notice, chatId, userChannel, videoData) => {
  console.log(`Notice in ${chatId}: ${notice.message}`);
});

// A pinned/banner message (never emitted as a regular 'message').
tubeChat.on('pinned', (message, chatId, userChannel, videoData) => {
  console.log(`Pinned by ${message.pinnedBy}: ${message.text}`);
});
```

### Moderation and System Events

```javascript
// When a message is deleted by a moderator.
tubeChat.on('deletedMessage', (messageId, chatId, userChannel, videoData) => {
  console.log(`Message ${messageId} was deleted from chat ${chatId}.`);
});

// When all messages from a specific user are deleted (ban/timeout).
tubeChat.on('deleteUserMessages', (channelId, chatId, userChannel, videoData) => {
  console.log(`All messages from user ${channelId} were removed in chat ${chatId}.`);
});

// When a moderator clears the whole chat window.
tubeChat.on('cleared', (chatId, userChannel, videoData) => {
  console.log(`Chat ${chatId} was cleared by a moderator.`);
});

// When a message is dimmed/hidden (clientAssignedId resolved to the item id when seen).
tubeChat.on('dimmed', (messageId, chatId, userChannel, videoData) => {
  console.log(`Message ${messageId} was dimmed in chat ${chatId}.`);
});

// For changes in chat mode (e.g., slow mode, subscribers-only).
tubeChat.on('system', (message, chatId, userChannel, videoData) => {
  console.log(`System message in ${chatId}: ${message.message}`);
});
```

### Raw Data Event

```javascript
// Emits the raw action object from YouTube for custom parsing.
tubeChat.on('raw', (action) => {
  // console.log('Received raw action:', action);
});
```

## Signaler for Efficiency

This library integrates **[yt-chat-signaler](https://github.com/zaacksb/yt-chat-signaler)** to listen for new messages efficiently, reducing the need for constant polling. When `useSignaler` is `true` (the default), TubeChat will receive a push notification when a new message is available. You can listen to the signaler's own events if you need fine-grained control or diagnostics.

```javascript
if (tubeChat.signaler) {
  tubeChat.signaler.on('connected', (chatData) => {
    console.log(`Signaler connected for video: ${chatData.chatId}`);
  });

  tubeChat.signaler.on('data', ({ chatData }) => {
    console.log(`Signaler received new message notification for ${chatData.chatId}`);
  });
}
```

## Additional Functions

- **`leave(videoId)`**
  Disconnects from a specific video's chat.

  ```javascript
  tubeChat.leave('VIDEO_ID_HERE');
  ```

- **`say(videoId, text)`** *(requires login)*
  Sends a chat message (truncated to 200 characters). Returns the posted message id
  (plus `timeoutMs` when the server reports a slow-mode cooldown).
  The sent message is also emitted immediately as a `message` event marked
  with `isOwn: true` (deduped when polls return it later).

  ```javascript
  const { id } = await tubeChat.say('VIDEO_ID_HERE', 'hello chat!');
  ```

- **`reply` on messages** *(requires login)*
  Every `message`-like event (`message`, `superchat`, `member`, `subgift`,
  `jewels`, `donation`, `pinned`) carries its `chatId` and a bound `reply()`,
  so bots answer without tracking video ids. Both are always present on
  events (only absent on standalone `parse()` output, which has no session):

  ```javascript
  tubeChat.on('message', (m) => {
    if (m.text === '!ping') m.reply('pong', { mention: true }); // "@author pong"
  });
  ```

  Superchats also expose `replyThread.params` (entry point to open the reply
  thread panel) and `creatorHeart.by` (read-only state; hearting needs the
  owner session). Liking superchats is entity-driven (no direct params) and
  not implemented.

- **`vote(videoId, choice)`** *(requires login)*
  Votes on a poll. Pass a choice object from the `poll` event (or its `params` string).

  ```javascript
  tubeChat.on('poll', async (poll) => {
    await tubeChat.vote('VIDEO_ID_HERE', poll.choices[0]);
  });
  ```

- **`removeMessage(videoId, message)`** *(moderator)*
  Deletes a single message. Pass a parsed message from any event — moderation
  params are harvested automatically — or a raw params string.

  ```javascript
  tubeChat.on('message', async (message) => {
    if (isSpam(message)) await tubeChat.removeMessage('VIDEO_ID_HERE', message);
  });
  ```

- **`timeoutUser(videoId, message)`** *(moderator)* — default-duration timeout.
- **`banUser(videoId, message)`** *(moderator)* — "Hide user on this channel".
- **`getMenu(videoId, message)`** *(requires login, read-only)* — fetches the full context menu of a message (discovers available actions).
- **`checkAuth(videoId)`** — validates the login without side effects. Throws `SessionExpiredError` when the cookie is dead.
- **`setAuth({ cookie })`** — sets/rotates the login cookie at runtime.
- **`videos`**
  A public `Map` containing the state and data of all currently connected video chats.

  ```javascript
  // Get a list of all connected video IDs
  const connectedVideoIds = Array.from(tubeChat.videos.keys());
  console.log('Connected to:', connectedVideoIds);

  // Get data for a specific video
  const videoDetails = tubeChat.videos.get('VIDEO_ID_HERE');
  ```

## Downloading VOD replay chats

Past broadcasts and premieres with chat can be downloaded with a separate
function (not `join` — there is no polling loop and no `join`/`leave`/
`disconnected` events). The same message events fire, so existing handlers
record everything, and the parsed log is also returned. Login is optional
(only needed for members-only/private videos — pass `auth` like anywhere else).

```javascript
const res = await tubeChat.downloadChat('VIDEO_ID_HERE', {
  limit: 5000,                    // optional: max messages
  delayMs: 50,                    // optional: pacing between pages (0 = fastest; 429s back off automatically)
  concurrency: 4,                 // optional: parallel segment workers (default 1; splits by video
                                  //   duration, seeks each worker via playerOffsetMs, merges
                                  //   timestamp-sorted with global dedup — much faster on long VODs)
  onProgress: ({ pages, actions, messages }) => console.log(pages, actions, messages),
});
if (res.completed) {
  console.log(`downloaded ${res.messages.length} messages`);
  // res.messages: [{ event: 'message', data: {...} }, ...]
} else {
  console.error('stopped:', res.error);
}
```

## Upgrading from 1.0.x

**Nothing to change** for documented usage — 1.1.0 is backward compatible. Notes only if one of these applies to you:

- You relied on pinned banners arriving as `message`: set `legacyPinnedAsMessage: true` (deprecated), or better, listen to `pinned`.
- You `switch` on `parse()` results with an exhaustive `never` default: handle the new `poll | notice | pinned | donation | cleared | dimmed` members.
- You manually `emit('message', ...)` with a hand-built object: payloads now require `chatId` + `reply` (see `WithLiveContext`).
- You used `disconnected` as a network-failure signal: transient fetch errors now reconnect silently with backoff instead of disconnecting.

## License

Distributed under the MIT License. See [LICENSE](https://github.com/zaacksb/tubechat/blob/main/LICENSE) for more information.

## Testing

```sh
npm test          # 98 hermetic tests (no network): parsers, auth, write-path, wiring
npm run test:types  # compile-time checks of the public type surface
```

Tests use hand-crafted fixtures mirroring real youtubei shapes (`tests/fixtures.ts`) plus a stubbed `fetch` for the write path (`send_message`, `moderate`, `vote`, `get_item_context_menu`) — no live connection needed.

## Authors

- **ZackSB** - _Master's degree in life_ - [ZackSB](https://github.com/zaacksb/) - _Built tubechat_

## Acknowledgements

- [zacksb](https://github.com/zaacksb)

<h3 align="left">Support:</h3>
<p><a href="https://www.buymeacoffee.com/zacksb"> <img align="left" src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" height="50" width="210" alt="buy me a coffe" /></a></p>
<p><a href="https://livepix.gg/zvods"> <img align="left" src="https://pbs.twimg.com/profile_images/1499159563081244672/tWvzZWKI_400x400.png" height="50" width="50" alt="Donate with livepix" /></a></p><br><br>
