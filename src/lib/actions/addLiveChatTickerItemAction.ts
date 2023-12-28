const addLiveChatTickerItemAction = (value: any, emitter: NodeJS.EventEmitter) => {
  emitter.emit("addLiveChatTickerItemAction", value);
}

export default addLiveChatTickerItemAction