<br/>
<p align="center">
  <a href="https://github.com/zaacksb/tubechat">
    <img src="https://i.imgur.com/UT2xEbA.png" alt="Logo" width="200" height="200">
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

The TubeChat NodeJS library is a project designed to streamline YouTube chat integration for developers. By requiring only the channel name, this library simplifies the process of connecting to live chats effortlessly. When a channel goes live, TubeChat automatically establishes a connection, providing a hassle-free solution for seamless interaction with YouTube live chat. Enhance your development experience with TubeChat, making YouTube chat integration straightforward and efficient.

## Getting Started

### Installation

First install our library

```sh
npm install tubechat
```

## Usage

Import the library

```js
import TubeChat from 'tubechat'
```

instantiate the class

```js
const tubeChat = new TubeChat()
```

#### Connect to channels

```js
tubeChat.connect('CNNbrasil')
tubeChat.connect('LofiGirl')
```

### Event Handling

```js
tubeChat.on('chat_connected', (channel, videoId) => {
  console.log(`${channel} chat connected ${videoId}`)
})
```

```js
tubeChat.on('chat_disconnected', (channel, videoId) => {
  console.log(`${channel} chat disconnected`, videoId)
})

tubeChat.on('message', ({ badges, channel, channelId, color, id, isMembership, isModerator, isNewMember, isOwner, isVerified, message, name, thumbnail, timestamp }) => {
  console.log(channel, name, message)
})

tubeChat.on('chat_disconnected', (channel, videoId) => {
  console.log(`${channel} chat disconnected`, videoId)
})

tubeChat.on('superchatSticker', (superchatSticker) => {})
tubeChat.on('superchat', (superchat) => {})

tubeChat.on('sub', (sub) => {})
tubeChat.on('subGift', (subGift) => {})
tubeChat.on('subgiftGroup', (subgiftGroup) => {})

tubeChat.on('userReceiveSubGift', (userReceiveSubGift) => {})
```

...

### Additional Functions

- `disconnect`
  Disconnects a channel

  ```js
  tubeChat.disconnect('LofiGirl')
  ```

- `channelList`
  Returns the list of connected channels

  ```js
  fMonitor.channelList()
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
