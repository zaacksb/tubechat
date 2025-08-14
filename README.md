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

## Event Handling

All events, in addition to their specific data, also return `chatId` (the video ID), `userChannel` (the channel's vanity name, e.g., "@LofiGirl"), and `videoData` (an object with details about the video).

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
  const author = message.author.channelName;
  const text = message.message.map(part => part.text).join('');
  console.log(`[${userChannel}] ${author}: ${text}`);
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

// For changes in chat mode (e.g., slow mode, subscribers-only).
tubeChat.on('system', (message, chatId, userChannel, videoData) => {
  console.log(`System message in ${chatId}: ${message.message}`);
});
```

### Raw Data Event

```javascript
// Emits the raw action object from YouTube for custom parsing.
tubeChat.on('raw', (actions) => {
  // console.log('Received raw actions:', actions);
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

- **`videos`**
  A public `Map` containing the state and data of all currently connected video chats.

  ```javascript
  // Get a list of all connected video IDs
  const connectedVideoIds = Array.from(tubeChat.videos.keys());
  console.log('Connected to:', connectedVideoIds);

  // Get data for a specific video
  const videoDetails = tubeChat.videos.get('VIDEO_ID_HERE');
  ```

## License

Distributed under the MIT License. See [LICENSE](https://github.com/zaacksb/tubechat/blob/main/LICENSE) for more information.

## Authors

- **ZackSB** - _Master's degree in life_ - [ZackSB](https://github.com/zaacksb/) - _Built tubechat_

## Acknowledgements

- [zacksb](https://github.com/zaacksb)

<h3 align="left">Support:</h3>
<p><a href="https://www.buymeacoffee.com/zacksb"> <img align="left" src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" height="50" width="210" alt="buy me a coffe" /></a></p>
<p><a href="https://livepix.gg/zvods"> <img align="left" src="https://pbs.twimg.com/profile_images/1499159563081244672/tWvzZWKI_400x400.png" height="50" width="50" alt="Donate with livepix" /></a></p><br><br>
