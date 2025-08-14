export interface YTChatBadges {
  sub?: {
    url: string
    alt: string
  },
  months?: number
  owner?: 0 | 1
  verified?: 0 | 1
  moderator?: 0 | 1,
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
     timestampUsec: string,
     inReplyTo?: {
       author: string
     }
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
    author: {
      channelName: string
    }

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
  liveChatAuthorBadgeRenderer: {
    customThumbnail: Images,
    tooltip: string,
    accessibility: Accessibility
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
  }

} 