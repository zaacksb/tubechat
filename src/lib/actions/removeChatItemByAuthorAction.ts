const removeChatItemByAuthorAction = (value: any, emitter: NodeJS.EventEmitter, channel: string) => {
  emitter.emit("deleted_message_author", { channel, ...value });
}

export default removeChatItemByAuthorAction