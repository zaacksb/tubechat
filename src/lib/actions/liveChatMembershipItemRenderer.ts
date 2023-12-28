
const liveChatMembershipItemRenderer = (value: any, emitter: NodeJS.EventEmitter, channel: string) => {
  emitter.emit("member", { channel, ...value });
}

export default liveChatMembershipItemRenderer