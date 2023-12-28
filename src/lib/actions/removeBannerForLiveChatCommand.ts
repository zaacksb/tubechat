const removeBannerForLiveChatCommand = (value: any, emitter: NodeJS.EventEmitter, channel: string) => {
  emitter.emit("removeBannerForLiveChatCommand", { channel, ...value });
}

export default removeBannerForLiveChatCommand