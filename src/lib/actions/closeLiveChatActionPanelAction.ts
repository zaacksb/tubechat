const closeLiveChatActionPanelAction = (value: any, emitter: NodeJS.EventEmitter, channel: string) => {
  emitter.emit("closeLiveChatActionPanelAction", { channel, ...value });
  // const parsed: ClosePanelAction = {
  //   type: "closePanelAction",
  //   targetPanelId: payload.targetPanelId,
  //   skipOnDismissCommand: payload.skipOnDismissCommand,
  // };
  // return parsed;
}

export default closeLiveChatActionPanelAction