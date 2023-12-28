import { YTChatBadges } from "./Types"

export type MessageTypes = "add_text_message"

export interface MessageFragments {
  text?: string,
  textEmoji?: string
  emoji?: string
}

export type ChatChannel = { channel: string }

export interface IChatYTMessage {
  timestamp: Date
  id: string
  message: MessageFragments[]
  name: string
  thumbnail: {
    url: string
    alt: string
  },
  channelId: string
  isMembership: boolean,
  isNewMember: boolean,
  isOwner: boolean,
  isVerified: boolean,
  isModerator: boolean,
  badges: YTChatBadges,
  color: string
}