const showLiveChatActionPanelAction = (value: any, emitter: NodeJS.EventEmitter, channel: string) => {
  emitter.emit("showLiveChatActionPanelAction", { channel, ...value });
}

export default showLiveChatActionPanelAction