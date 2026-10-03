export interface YTChatBadges {
  sub?: {
    url: string
    alt: string
  },
  months?: number
  owner?: 0 | 1
  verified?: 0 | 1
  moderator?: 0 | 1,
  /** XP leaderboard rank button (CROWN #N) with panel params. */
  leaderboard?: {
    rank?: string
    panelParams?: string
  },
}

export enum ChatModes {
  // Subscribers Only Mode: Only channel subscribers can send messages
  // Usually accompanied by a minimum subscription time requirement // subtext.runs[1]
  SubscribersOnly = 'subscribers-only',

  // Slow Mode: Viewers have a wait time between sending messages
  // Usually accompanied by a value in seconds/minutes
  SlowMode = 'Slow mode',

  // Selected Users Mode: Only specific viewers, previously selected
  // by the channel owner, can send messages
  SelectedUsers = 'Live commentary mode',

}

export namespace TUBECHAT {
   /** Server-minted action params harvested from incoming messages.
    *  Short-lived: harvest on receive, use promptly (re-fetch on 400). */
   export interface ModerationParams {
     /** Delete this single message (Remove button) */
     remove?: string
     /** Timeout the author (inline = default duration) */
     timeout?: string
     /** Ban the author from the channel (Hide user) */
     hide?: string
     /** Full context-menu params (get_item_context_menu) */
     contextMenu?: string
   }
  export interface ReplyOptions {
    /** Prefix with @author (default true). */
    mention?: boolean
    /** Auto-delete the reply after this many milliseconds (ephemeral). */
    deleteAfterMs?: number
  }
   /** Bound by TubeChat on emitted messages (absent on standalone parse()). */
   export type ReplyFn = (text: string, opts?: ReplyOptions) => Promise<{ id: string }>
   export interface AuthorMessage {
     author: {
       isMembership: boolean,
       isNewMember: boolean,
       isOwner: boolean,
       isVerified: boolean,
       isModerator: boolean,
       badges: YTChatBadges
       color: string,
       channelId: string
       channelName: string
       photo: string
     }
   }
   export interface Msg_Common extends AuthorMessage {
     id: string
     message: MessageData
     /** Plain text: message runs joined (emoji become :shortcut: / char). */
     text: string
     timestampUsec: string,
     /** Milliseconds since epoch (derived from timestampUsec, 0 if absent). */
     timestamp: number,
     /** True for the local echo of our own send (never set on poll items). */
     isOwn?: boolean,
     /** True when the message arrived held by AutoMod (autoModeratedItem). */
     heldForReview?: boolean,
     /** Video id this message was received on (set on emit). */
     chatId?: string
     /** Reply in context (no videoId needed). Bound on emit; absent on standalone parse(). */
     reply?: ReplyFn
     inReplyTo?: {
       author: string
     }
     moderation?: ModerationParams
   }
   export interface Msg_Sub extends Msg_Common {
     plan: string
     isResub: boolean
   }
   export interface Msg_Resub extends Msg_Sub {
   }
   export interface Msg_SubGift extends Msg_Sub {
     gifter: string
     count: number
   }
      export interface Msg_SuperChat extends Msg_Common {
      currency: string
      formatted: string
      amount: number
      isSticker: boolean,
      sticker?: {
        url: string
        alt: string
      }
      /** Entry point to open the reply thread panel (showEngagementPanelEndpoint params). */
      replyThread?: {
        params: string
      }
      /** Creator heart state (read-only; hearting requires the owner session). */
      creatorHeart?: {
        by: string
      }
    }
 
   export namespace SYSTEM {
     export interface ChatMode {
      type: ChatModes.SelectedUsers | ChatModes.SlowMode | ChatModes.SubscribersOnly
      id: string
      message: string
      timestampUsec: string
     }
     export interface Msg_SlowMode extends ChatMode {
      type: ChatModes.SlowMode
      enabled: boolean
      minutes: number
     }
    export interface Msg_SubscribersOnly extends ChatMode {
      type: ChatModes.SubscribersOnly
      enabled: boolean
      minutes: number
      user: string
     }
      export interface Msg_SelectedUsers extends ChatMode {
      type: ChatModes.SelectedUsers
      enabled: boolean
     }
    export interface Msg_deletedMessage {
      targetItemId: string
    }
    export interface Msg_deleteUserMessage {
      externalChannelId: string
    }
   }

   export interface Msg_Jewels {
    id: string
    content: string
    giftLabel?: string
    author: {
      channelName: string
      channelId?: string
      photo?: string
    }
    giftImage?: string
    moderation?: ModerationParams
    /** Video id this message was received on (set on emit). */
    chatId?: string
    /** Reply in context (no videoId needed). Bound on emit; absent on standalone parse(). */
    reply?: ReplyFn
   }

   export interface PollChoice {
     text: string
     voteRatio?: number
     votePercentage?: string
     /** params for send_live_chat_vote */
     params?: string
   }
   export interface Msg_Poll {
     id: string
     question: string
     author?: string
     thumbnail?: string
     metadata?: string
     totalVotes?: number
     choices: PollChoice[]
   }
   export interface Msg_Notice {
     id: string
     message: string
     timestampUsec: string
     /** Milliseconds since epoch (derived from timestampUsec, 0 if absent). */
     timestamp: number
     /** Renderer that produced this notice (e.g. liveChatAutoModMessageRenderer). */
     kind?: string
   }
   export interface Msg_Donation extends AuthorMessage {
     id: string
     message: MessageData
     /** Plain text: message runs joined. */
     text: string
     amount?: number
     currency?: string
     formatted?: string
     timestampUsec: string
     /** Milliseconds since epoch (derived from timestampUsec, 0 if absent). */
     timestamp: number
     moderation?: ModerationParams
     /** Video id this message was received on (set on emit). */
     chatId?: string
     /** Reply in context (no videoId needed). Bound on emit; absent on standalone parse(). */
     reply?: ReplyFn
   }
   export interface Msg_Pinned extends Msg_Common {
     pinnedBy?: string
   }
}


type Emoji = {
  emojiId: string;
  isCustomEmoji: boolean;
  searchTerms: string[];
  shortcuts: string[];
  image: {
    thumbnails: {
      url: string;
    }[];
    accessibility: Accessibility;
  }

};

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

export interface RunWithText {
  text: string;
  navigationEndpoint?: NavigationEndpoint;
}

export interface RunWithEmoji {
  emoji: Emoji; // Tipagem do emoji depende da estrutura do objeto real
}

export type MessageRun = RunWithText | RunWithEmoji;



export type Message = {
  runs?: MessageRun[];
}
export type NavigationEndpoint = {
    urlEndpoint: {
      url: string;
    };
  }
  

export interface Images {
  thumbnails: Thumbnails[];
}


export type Thumbnails = {
  url: string
  width: number
  height: number
}

type Accessibility = {
  accessibilityData: {
    label: string
  }
}


export interface AuthorBadges {
  liveChatAuthorBadgeRenderer?: {
    customThumbnail: Images,
    tooltip: string,
    accessibility: Accessibility
    icon?: {
      iconType: 'VERIFIED' | 'OWNER' | 'MODERATOR' | 'CROWN' | String
    };
  }
  liveChatAuthorBadgeViewModel?: {
    customThumbnail?: Images,
    tooltip?: string,
    accessibility?: Accessibility
    iconType?: 'VERIFIED' | 'OWNER' | 'MODERATOR' | 'CROWN' | String
    icon?: {
      iconType: 'VERIFIED' | 'OWNER' | 'MODERATOR' | 'CROWN' | String
    };
  }
}


export type LeaderboardBadge = {
  buttonViewModel: {
    iconName: "CROWN" | String,
    title: `#${number}` | String
    accessibilityText: `#${number}` | String,
    onTap?: {
      innertubeCommand?: {
        showEngagementPanelEndpoint?: {
          identifier?: { tag?: string }
          globalConfiguration?: { params?: string }
        }
      }
    }
  }

} 