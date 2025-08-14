import { NavigationEndpoint } from "./parsers/types"

export type MessageData = {
  text: string
  emoji?: {
    emojiId?: string
    shortcut?: string
    isCustomEmoji: boolean
    emojiImage: string
  }
  navigationEndpoint?: NavigationEndpoint
}[]

export interface Thumbnail {
  url: string
}

export interface Channel {
  simpleText: string
}

export interface Runs {
  text: string
}

export interface Title {
  runs: Runs[]
}

export interface Views {
  runs: Runs[]
}

export interface PublishDate {
  simpleText: string
}

export interface CommandMetadata {
  webCommandMetadata: {
    url: string
    webPageType: string
    rootVe: number
    apiUrl: string
  }
}

export interface BrowseEndpoint {
  browseId: string
  canonicalBaseUrl: string
}

export interface ChannelNavigationEndpoint {
  clickTrackingParams: string
  commandMetadata: CommandMetadata
  browseEndpoint: BrowseEndpoint
}

export interface ChannelThumbnail {
  thumbnails: Thumbnail[]
}

export interface VideoDescriptionHeaderRenderer {
  title: Title
  channel: Channel
  views: Views
  publishDate: PublishDate
  channelNavigationEndpoint: ChannelNavigationEndpoint
  channelThumbnail: ChannelThumbnail
}
export interface VideoPrimaryInfoRenderer {
  title: Title
  badges?: {
    metadataBadgeRenderer: {
      icon: {
        iconType: String | "SPONSORSHIP_STAR"
      },
      style: String | "BADGE_STYLE_TYPE_MEMBERS_ONLY",
      label: String | "Members only",
      iconSourceUrl: string
    }
  }[]
}