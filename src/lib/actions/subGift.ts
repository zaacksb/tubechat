interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

interface AuthorName {
  simpleText: string;
}

interface AuthorPhoto {
  thumbnails: Thumbnail[];
}

interface Run {
  text: string;
  italics?: boolean;
  bold?: boolean;
}

interface Message {
  runs: Run[];
}

interface WebCommandMetadata {
  ignoreNavigation: boolean;
}

interface LiveChatItemContextMenuEndpoint {
  params: string;
}

interface CommandMetadata {
  webCommandMetadata: WebCommandMetadata;
}

interface ContextMenuEndpoint {
  commandMetadata: CommandMetadata;
  liveChatItemContextMenuEndpoint: LiveChatItemContextMenuEndpoint;
}

interface AccessibilityData {
  label: string;
}

interface ContextMenuAccessibility {
  accessibilityData: AccessibilityData;
}

interface MessageDataUserReceiveSubGift {
  id: string;
  timestampUsec: string;
  authorExternalChannelId: string;
  authorName: AuthorName;
  authorPhoto: AuthorPhoto;
  message: Message;
  contextMenuEndpoint: ContextMenuEndpoint;
  contextMenuAccessibility: ContextMenuAccessibility;
}

export interface IUserReceiveSubGift {
  id: string
  amount: number
  text: string
  name: string
  authorExternalChannelId: string
  timestamp: string
  thumbnail: {
    url: string
    alt: string
  }
}
const userReceiveSubGift = (messageData: MessageDataUserReceiveSubGift, emitter: NodeJS.EventEmitter, channel: string) => {
  const { authorName, id, message, authorExternalChannelId, authorPhoto, contextMenuAccessibility, contextMenuEndpoint, timestampUsec } = messageData
  const responseData = { thumbnail: {} } as IUserReceiveSubGift
  responseData.amount = 1
  responseData.id = id
  responseData.text = message?.runs?.map?.(({ text }) => text).join(' ')
  responseData.name = authorName.simpleText
  responseData.timestamp = timestampUsec
  responseData.thumbnail.alt = `${responseData.name} Profile photo`
  responseData.thumbnail.url = authorPhoto.thumbnails[1].url
  responseData.authorExternalChannelId = authorExternalChannelId

  emitter.emit("userReceiveSubGift", { channel, ...responseData });
}

export default userReceiveSubGift


// {"id":"CjEKL0NPTU1VTklUWV9HVUlERUxJTkVTX1ZFTTIwMjMvMDgvMjYtMDM6NTY6NTEuMzE5","timestampUsec":"1693047411319254","icon":{"iconType":"YOUTUBE_ROUND"},"message":{"runs":[{"text":"Welcome to live chat! Remember to guard your privacy and abide by our community guidelines."}]},"actionButton":{"buttonRenderer":{"style":"STYLE_BLUE_TEXT","size":"SIZE_DEFAULT","isDisabled":false,"text":{"simpleText":"Learn more"},"navigationEndpoint":{"clickTrackingParams":"CBgQ8FsiEwi5mqaMlfqAAxWlWkgAHd_wDWs=","commandMetadata":{"webCommandMetadata":{"url":"//support.google.com/youtube/answer/2853856?hl=en#safe","webPageType":"WEB_PAGE_TYPE_UNKNOWN","rootVe":83769}},"urlEndpoint":{"url":"//support.google.com/youtube/answer/2853856?hl=en#safe","target":"TARGET_NEW_WINDOW"}},"trackingParams":"CBgQ8FsiEwi5mqaMlfqAAxWlWkgAHd_wDWs=","accessibilityData":{"accessibilityData":{"label":"Learn more"}}}},"trackingParams":"CAEQl98BIhMIuZqmjJX6gAMVpVpIAB3f8A1r"}