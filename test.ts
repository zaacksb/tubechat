import TubeChat from './src'

const tubeChat = new TubeChat()

tubeChat.connect('CNNbrasil')
// tubeChat.connect('LofiGirl')

tubeChat.on('chat_connected', (channel, videoId) => {
  console.log(`${channel} chat connected ${videoId}`)
})

tubeChat.on('message', ({ badges, channel, channelId, color, id, isMembership, isModerator, isNewMember, isOwner, isVerified, message, name, thumbnail, timestamp }) => {
  console.log(channel, name, message)
})

tubeChat.on('chat_disconnected', (channel, videoId) => {
  console.log(`${channel} chat disconnected`, videoId)
})

tubeChat.on('superchatSticker', (superchatSticker) => {

})
tubeChat.on('superchat', (superchat) => {

})



tubeChat.on('sub', (sub) => {

})
tubeChat.on('subGift', (subGift) => {

})
tubeChat.on('subgiftGroup', (subgiftGroup) => {

})

tubeChat.on('userReceiveSubGift', (userReceiveSubGift) => {

})