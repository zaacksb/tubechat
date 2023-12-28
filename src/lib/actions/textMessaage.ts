import { IChatData } from "../../types/Types";
import { createCommonUserResponse } from "./actionsUtils";

const textMessage = (messageData: IChatData, emitter: NodeJS.EventEmitter, channel: string) => {
  /// liveChatViewerEngagementMessageRenderer
  // liveChatPaidMessageRenderer donate
  const responseData = createCommonUserResponse(messageData)

  emitter.emit("message", { channel, ...responseData });
};

export default textMessage;
