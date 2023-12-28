export interface DeletedMessage {
  commentId: string
}

const removeChatItemAction = (messageData: { targetItemId: string}, emitter: NodeJS.EventEmitter) => {
  const responseData = {
    commentId: messageData.targetItemId
  } as DeletedMessage
  emitter.emit("deleted_message", responseData);
}

export default removeChatItemAction