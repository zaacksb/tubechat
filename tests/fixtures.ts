/** Hand-crafted fixtures mirroring real youtubei shapes (fake users/ids).
 *  Field names/structures verified against live captures; no real user data. */

const thumb = (url: string, w = 32, h = 32) => ({ url, width: w, height: h });

export const textBasic = {
  addChatItemAction: {
    item: {
      liveChatTextMessageRenderer: {
        message: { runs: [{ text: 'hello chat' }] },
        authorName: { simpleText: '@viewer1' },
        authorPhoto: { thumbnails: [thumb('https://a/s32', 32, 32), thumb('https://a/s64', 64, 64)] },
        contextMenuEndpoint: {
          commandMetadata: { webCommandMetadata: { ignoreNavigation: true } },
          liveChatItemContextMenuEndpoint: { params: 'CTX_PARAMS_VIEWER1' },
        },
        id: 'MSG_TEXT_1',
        timestampUsec: '1790000000000001',
        authorExternalChannelId: 'UCVIEWER1AAA',
        contextMenuAccessibility: { accessibilityData: { label: 'Chat actions' } },
      },
    },
    clientId: 'CLIENT_1',
  },
};

export const textModerator = {
  addChatItemAction: {
    item: {
      liveChatTextMessageRenderer: {
        message: { runs: [{ text: 'slow down please' }] },
        authorName: { simpleText: '@modchan' },
        authorPhoto: { thumbnails: [thumb('https://m/s32')] },
        authorBadges: [
          { liveChatAuthorBadgeRenderer: { icon: { iconType: 'MODERATOR' }, tooltip: 'Moderator', accessibility: { accessibilityData: { label: 'Moderator' } } } },
          { liveChatAuthorBadgeRenderer: { customThumbnail: { thumbnails: [thumb('https://m/sub16', 16, 16), thumb('https://m/sub32', 32, 32)] }, tooltip: 'Member (1 year)', accessibility: { accessibilityData: { label: 'Member (1 year)' } } } },
        ],
        contextMenuEndpoint: { liveChatItemContextMenuEndpoint: { params: 'CTX_PARAMS_MOD' } },
        id: 'MSG_MOD_1',
        timestampUsec: '1790000000000002',
        authorExternalChannelId: 'UCMODAAAAAAA',
        inlineActionButtons: [
          { buttonRenderer: { serviceEndpoint: { commandMetadata: { webCommandMetadata: { sendPost: true, apiUrl: '/youtubei/v1/live_chat/moderate' } }, moderateLiveChatEndpoint: { params: 'MOD_REMOVE_1' } }, icon: { iconType: 'DELETE' }, accessibility: { label: 'Remove' } } },
          { buttonRenderer: { serviceEndpoint: { moderateLiveChatEndpoint: { params: 'MOD_TIMEOUT_1' } }, icon: { iconType: 'HOURGLASS' }, accessibility: { label: 'Put user in timeout' } } },
          { buttonRenderer: { serviceEndpoint: { moderateLiveChatEndpoint: { params: 'MOD_HIDE_1' } }, icon: { iconType: 'REMOVE_CIRCLE' }, accessibility: { label: 'Hide user on this channel' } } },
        ],
        beforeContentButtons: [
          { buttonViewModel: { iconName: 'CROWN', title: '#2', accessibilityText: '#2' } },
        ],
      },
    },
  },
};

export const textEmoji = {
  addChatItemAction: {
    item: {
      liveChatTextMessageRenderer: {
        message: {
          runs: [
            { emoji: { emojiId: '💜', shortcuts: [':purple_heart:'], searchTerms: ['purple', 'heart'], image: { thumbnails: [{ url: 'https://fonts.gstatic.com/purple.png' }], accessibility: { accessibilityData: { label: '💜' } } } } },
            { text: ' hello ' },
            { emoji: { emojiId: 'UCcustom/abc', isCustomEmoji: true, shortcuts: [':party:'], searchTerms: ['party'], image: { thumbnails: [{ url: 'https://yt3/custom1' }, { url: 'https://yt3/custom2' }], accessibility: { accessibilityData: { label: ':party:' } } } } },
            { text: 'link', navigationEndpoint: { urlEndpoint: { url: 'https://example.com' } } },
          ],
        },
        authorName: { simpleText: '@emojifan' },
        authorPhoto: { thumbnails: [thumb('https://e/s32')] },
        id: 'MSG_EMOJI_1',
        timestampUsec: '1790000000000003',
        authorExternalChannelId: 'UCEMOJIAAAAA',
      },
    },
  },
};

export const textAuthorRuns = {
  addChatItemAction: {
    item: {
      liveChatTextMessageRenderer: {
        message: { runs: [{ text: 'hi' }] },
        authorName: { runs: [{ text: '@runsuser' }] },
        authorPhoto: { thumbnails: [thumb('https://r/s32')] },
        id: 'MSG_RUNS_1',
        timestampUsec: '1790000000000004',
        authorExternalChannelId: 'UCRUNSAAAAAA',
      },
    },
  },
};

export const paidBasic = {
  addChatItemAction: {
    item: {
      liveChatPaidMessageRenderer: {
        message: { runs: [{ text: 'great stream!' }] },
        authorName: { simpleText: '@donor' },
        authorPhoto: { thumbnails: [thumb('https://d/s32')] },
        id: 'MSG_PAID_1',
        timestampUsec: '1790000000000005',
        authorExternalChannelId: 'UCDONORAAAAA',
        purchaseAmountText: { simpleText: '$5.00' },
      },
    },
  },
};

export const paidRunsAmount = {
  addChatItemAction: {
    item: {
      liveChatPaidMessageRenderer: {
        authorName: { simpleText: '@donorbr' },
        authorPhoto: { thumbnails: [thumb('https://d/s32')] },
        id: 'MSG_PAID_2',
        timestampUsec: '1790000000000006',
        authorExternalChannelId: 'UCDONORBRAAA',
        purchaseAmountText: { runs: [{ text: 'R$' }, { text: ' 10,00' }] },
      },
    },
  },
};

export const paidSticker = {
  addChatItemAction: {
    item: {
      liveChatPaidStickerRenderer: {
        authorName: { simpleText: '@stickfan' },
        authorPhoto: { thumbnails: [thumb('https://s/s32')] },
        id: 'MSG_STICKER_1',
        timestampUsec: '1790000000000007',
        authorExternalChannelId: 'UCSTICKAAAAA',
        purchaseAmountText: { simpleText: 'CA$ 10.00' },
        sticker: {
          thumbnails: [{ url: '//stick/small' }, { url: '//stick/big' }],
          accessibility: { accessibilityData: { label: 'Cool sticker' } },
        },
      },
    },
  },
};

export const memberNew = {
  addChatItemAction: {
    item: {
      liveChatMembershipItemRenderer: {
        authorName: { simpleText: '@newsub' },
        authorPhoto: { thumbnails: [thumb('https://n/s32')] },
        id: 'MSG_MEMBER_NEW',
        timestampUsec: '1790000000000008',
        authorExternalChannelId: 'UCNEWSUBAAAA',
        headerSubtext: { simpleText: 'New member' },
      },
    },
  },
};

export const memberResub = {
  addChatItemAction: {
    item: {
      liveChatMembershipItemRenderer: {
        authorName: { simpleText: '@loyal' },
        authorPhoto: { thumbnails: [thumb('https://l/s32')] },
        id: 'MSG_MEMBER_RESUB',
        timestampUsec: '1790000000000009',
        authorExternalChannelId: 'UCLOYALAAAAA',
        authorBadges: [
          { liveChatAuthorBadgeRenderer: { customThumbnail: { thumbnails: [thumb('https://l/sub')] }, tooltip: 'Member (6 months)', accessibility: { accessibilityData: { label: 'Member (6 months)' } } } },
        ],
        headerPrimaryText: { runs: [{ text: 'Member for ' }, { text: '6' }, { text: ' months' }] },
        headerSubtext: { simpleText: 'Gold' },
        message: { runs: [{ text: 'half a year!' }] },
      },
    },
  },
};

export const giftPurchase = {
  addChatItemAction: {
    item: {
      liveChatSponsorshipsGiftPurchaseAnnouncementRenderer: {
        id: 'MSG_GIFT_BUY',
        timestampUsec: '1790000000000010',
        header: {
          liveChatSponsorshipsHeaderRenderer: {
            authorName: { simpleText: '@gifter' },
            authorPhoto: { thumbnails: [thumb('https://g/s32')] },
            authorExternalChannelId: 'UCGIFTERAAAA',
            primaryText: { runs: [{ text: '@gifter gifted ' }, { text: '5' }, { text: ' Gold memberships' }] },
          },
        },
      },
    },
  },
};

export const giftRedemption = {
  addChatItemAction: {
    item: {
      liveChatSponsorshipsGiftRedemptionAnnouncementRenderer: {
        authorName: { simpleText: '@lucky' },
        authorPhoto: { thumbnails: [thumb('https://k/s32')] },
        id: 'MSG_GIFT_GOT',
        timestampUsec: '1790000000000011',
        authorExternalChannelId: 'UCLUCKYAAAAA',
        message: { runs: [{ text: 'Welcome ' }, { text: '@lucky', navigationEndpoint: { urlEndpoint: { url: 'https://youtube.com/@lucky' } } }, { text: '! Gift from @gifter' }] },
      },
    },
  },
};

export const jewelsFull = {
  addChatItemAction: {
    item: {
      giftMessageViewModel: {
        text: { content: 'sent Star' },
        authorName: { content: '@jewelfan ' },
        id: 'MSG_JEWEL_1',
        authorExternalChannelId: 'UCJEWELAAAAA',
        authorAvatar: { avatarViewModel: { image: { sources: [{ url: 'https://av/32', width: 32, height: 32 }, { url: 'https://av/64', width: 64, height: 64 }] } } },
        giftImage: { sources: [{ url: '//gifts/star480', width: 480, height: 480 }, { url: '//gifts/star640', width: 640, height: 640 }] },
        giftImageA11yLabel: '@jewelfan sent a gift, Star',
      },
    },
    clientId: 'CLIENT_J1',
  },
};

export const modeSlow = {
  addChatItemAction: {
    item: {
      liveChatModeChangeMessageRenderer: {
        id: 'MODE_SLOW',
        timestampUsec: '1790000000000012',
        text: { runs: [{ text: 'Slow mode is on' }] },
        subtext: { runs: [{ text: 'Messages send every ' }, { text: '30 seconds' }] },
      },
    },
  },
};

export const modeSubs = {
  addChatItemAction: {
    item: {
      liveChatModeChangeMessageRenderer: {
        id: 'MODE_SUBS',
        timestampUsec: '1790000000000013',
        text: { runs: [{ text: '@owner' }, { text: ' turned on subscribers-only mode' }] },
        subtext: { simpleText: 'Only subscribers can chat' },
      },
    },
  },
};

export const viewerEngagement = {
  addChatItemAction: {
    item: {
      liveChatViewerEngagementMessageRenderer: {
        id: 'NOTICE_1',
        timestampUsec: '1790000000000014',
        icon: { iconType: 'YOUTUBE_ROUND' },
        message: { runs: [{ text: 'Subscribers-only mode. Messages that appear are from people who subscribe to this channel.' }] },
      },
    },
  },
};

export const pollUpdate = {
  updateLiveChatPollAction: {
    pollToUpdate: {
      pollRenderer: {
        liveChatPollId: 'POLL_1',
        header: {
          pollHeaderRenderer: {
            pollQuestion: { runs: [{ text: 'Like yet?' }] },
            thumbnail: { thumbnails: [thumb('https://t/32', 32, 32), thumb('https://t/64', 64, 64)] },
            metadataText: { runs: [{ text: '@owner' }, { text: '  ' }, { text: '10 min ago' }, { text: '  ' }, { text: '456 votes' }] },
            liveChatPollType: 'LIVE_CHAT_POLL_TYPE_CREATOR',
          },
        },
        choices: [
          { text: { runs: [{ text: 'YES' }] }, selected: false, voteRatio: 0.8, votePercentage: { simpleText: '80%' }, selectServiceEndpoint: { sendLiveChatVoteEndpoint: { params: 'VOTE_YES' } } },
          { text: { runs: [{ text: 'NO' }] }, selected: false, voteRatio: 0.2, votePercentage: { simpleText: '20%' }, selectServiceEndpoint: { sendLiveChatVoteEndpoint: { params: 'VOTE_NO' } } },
        ],
      },
    },
  },
};

export const pollPanel = {
  showLiveChatActionPanelAction: {
    panelToShow: {
      liveChatActionPanelRenderer: {
        contents: {
          pollRenderer: {
            liveChatPollId: 'POLL_2',
            header: { pollHeaderRenderer: { pollQuestion: { runs: [{ text: 'Q?' }] }, metadataText: { runs: [{ text: '3 votes' }] } } },
            choices: [{ text: { runs: [{ text: 'A' }] } }],
          },
        },
      },
    },
  },
};

export const bannerPinned = {
  addBannerToLiveChatCommand: {
    bannerRenderer: {
      liveChatBannerRenderer: {
        header: { liveChatBannerHeaderRenderer: { text: { runs: [{ text: 'Pinned by ' }, { text: 'Owner Name' }] } } },
        contents: {
          liveChatTextMessageRenderer: {
            message: { runs: [{ text: 'read the rules' }] },
            authorName: { simpleText: '@owner' },
            authorPhoto: { thumbnails: [thumb('https://o/s32')] },
            id: 'MSG_PINNED_1',
            timestampUsec: '1790000000000015',
            authorExternalChannelId: 'UCOWNERAAAAA',
          },
        },
      },
    },
  },
};

export const replacePlaceholder = {
  replaceChatItemAction: {
    targetItemId: 'PLACEHOLDER_9',
    replacementItem: {
      liveChatTextMessageRenderer: {
        message: { runs: [{ text: 'resolved late' }] },
        authorName: { simpleText: '@late' },
        authorPhoto: { thumbnails: [thumb('https://z/s32')] },
        id: 'MSG_LATE_1',
        timestampUsec: '1790000000000016',
        authorExternalChannelId: 'UCLATEAAAAAA',
      },
    },
  },
};

export const removeItem = { removeChatItemAction: { targetItemId: 'MSG_GONE_1' } };
export const removeByAuthor = { removeChatItemByAuthorAction: { externalChannelId: 'UCBANNEDAAAA' } };
export const markDeleted = {
  markChatItemAsDeletedAction: {
    targetItemId: 'MSG_GONE_2',
    deletedStateMessage: { runs: [{ text: '[message retracted]' }] },
  },
};
export const markByAuthor = { markChatItemsByAuthorAsDeletedAction: { externalChannelId: 'UCTIMEDOUTAA' } };

export const placeholderItem = {
  addChatItemAction: { item: { liveChatPlaceholderItemRenderer: { id: 'PLACEHOLDER_1', timestampUsec: '1790000000000017' } }, clientId: 'C1' },
};export const tickerItem = {
  addLiveChatTickerItemAction: { item: { liveChatTickerPaidMessageItemRenderer: { id: 'TICKER_1' } } },
};
export const moderationState = { liveChatReportModerationStateCommand: {} };
export const emptyAction = { clickTrackingParams: 'XXX' };

export const donationBasic = {
  addChatItemAction: {
    item: {
      liveChatDonationAnnouncementRenderer: {
        id: 'MSG_DON_1',
        timestampUsec: '1790000000000020',
        authorName: { simpleText: '@donor2' },
        authorPhoto: { thumbnails: [{ url: 'https://d2/s32', width: 32, height: 32 }] },
        authorExternalChannelId: 'UCDONOR2AAA',
        purchaseAmountText: { simpleText: '$10.00' },
        message: { runs: [{ text: 'for the cause' }] },
      },
    },
  },
};

export const legacyPaid = {
  addChatItemAction: {
    item: {
      liveChatLegacyPaidMessageRenderer: {
        id: 'MSG_LEGACY_1',
        timestampUsec: '1790000000000021',
        authorName: { simpleText: '@oldfan' },
        authorPhoto: { thumbnails: [{ url: 'https://o/s32', width: 32, height: 32 }] },
        authorExternalChannelId: 'UCOLDFAAAAN',
        purchaseAmountText: { simpleText: '€5.00' },
        message: { runs: [{ text: 'old school' }] },
      },
    },
  },
};

export const automodWrapped = {
  addChatItemAction: {
    item: {
      liveChatAutoModMessageRenderer: {
        headerText: { simpleText: 'Held for review' },
        autoModeratedItem: {
          liveChatTextMessageRenderer: {
            message: { runs: [{ text: 'suspicious link http://x' }] },
            authorName: { simpleText: '@spammer' },
            authorPhoto: { thumbnails: [{ url: 'https://sp/s32', width: 32, height: 32 }] },
            id: 'MSG_AM_1',
            timestampUsec: '1790000000000022',
            authorExternalChannelId: 'UCSPAMAAAAA',
          },
        },
      },
    },
  },
};

export const bannerPollAction = {
  addBannerToLiveChatCommand: {
    bannerRenderer: {
      liveChatBannerPollRenderer: {
        header: { liveChatBannerHeaderRenderer: { text: { runs: [{ text: 'Poll: ' }, { text: 'Best?' }] } } },
        contents: {
          pollRenderer: {
            liveChatPollId: 'POLL_B1',
            header: { pollHeaderRenderer: { pollQuestion: { runs: [{ text: 'Best?' }] }, metadataText: { runs: [{ text: '10 votes' }] } } },
            choices: [{ text: { runs: [{ text: 'A' }] }, votePercentage: { simpleText: '60%' } }],
          },
        },
      },
    },
  },
};

export const qnaCall = {
  addChatItemAction: {
    item: {
      liveChatCallForQuestionsRenderer: {
        id: 'QNA_1',
        timestampUsec: '1790000000000023',
        creatorAuthorName: { simpleText: '@owner' },
        content: { runs: [{ text: 'Ask me anything' }] },
      },
    },
  },
};

export const giftItemUnknown = {
  addChatItemAction: {
    item: {
      giftItemViewModel: {
        id: 'GIFT_X_1',
        timestampUsec: '1790000000000024',
        title: { simpleText: 'Mystery gift' },
      },
    },
  },
};

export const dimAction = { dimChatItemAction: { clientAssignedId: 'CLIENT_X' } };
export const clearAction = { clearChatWindowAction: {} };
export const serverError = {
  serverErrorMessage: { message: { runs: [{ text: 'Slow mode is on' }] }, timestampUsec: '1790000000000025' },
};

export const textWithClientId = {  addChatItemAction: {
    clientId: 'CLIENT_X',
    item: {
      liveChatTextMessageRenderer: {
        message: { runs: [{ text: 'mine' }] },
        authorName: { simpleText: '@me' },
        authorPhoto: { thumbnails: [{ url: 'https://me/s32', width: 32, height: 32 }] },
        id: 'MSG_X_1',
        timestampUsec: '1790000000000026',
        authorExternalChannelId: 'UCMEAAAAAAAA',
      },
    },
  },
};

export const textMalformedRuns = {
  addChatItemAction: {
    item: {
      liveChatTextMessageRenderer: {
        message: {
          runs: [
            { text: 'ok' },
            { emoji: null },
            {},
            { text: 123 },
            { emoji: { shortcuts: [':x:'] } },
          ],
        },
        authorName: '@plainstring',
        authorPhoto: { thumbnails: [] },
        id: 'MSG_MAL_1',
        timestampUsec: '1790000000000027',
        authorExternalChannelId: 'UCMALAAAAAA',
      },
    },
  },
};

export const superchatEngaged = {
  addChatItemAction: {
    item: {
      liveChatPaidMessageRenderer: {
        message: { runs: [{ text: 'take my money' }] },
        authorName: { simpleText: '@bigfan' },
        authorPhoto: { thumbnails: [{ url: 'https://bf/s32', width: 32, height: 32 }] },
        id: 'MSG_SC_ENG',
        timestampUsec: '1790000000000030',
        authorExternalChannelId: 'UCBIGFANAAA',
        purchaseAmountText: { simpleText: '$20.00' },
        contextMenuEndpoint: { liveChatItemContextMenuEndpoint: { params: 'CTX_SC' } },
        replyButton: {
          pdgReplyButtonViewModel: {
            replyButton: {
              buttonViewModel: {
                iconName: 'CHAT',
                onTap: {
                  innertubeCommand: {
                    showEngagementPanelEndpoint: {
                      identifier: { surface: 'ENGAGEMENT_PANEL_SURFACE_LIVE_CHAT', tag: 'PAreply_thread' },
                      globalConfiguration: { params: 'THREAD_P' },
                    },
                  },
                },
              },
            },
          },
        },
        creatorHeartButton: {
          creatorHeartViewModel: {
            heartedHoverText: '❤ by @ownerchan',
            engagementStateKey: 'ENG_KEY',
          },
        },
      },
    },
  },
};

export const tickerNested = {
  addLiveChatTickerItemAction: {
    item: {
      showItemEndpoint: {
        renderer: {
          liveChatPaidMessageRenderer: {
            message: { runs: [{ text: 'ticker copy' }] },
            authorName: { simpleText: '@tickfan' },
            authorPhoto: { thumbnails: [{ url: 'https://t/s32', width: 32, height: 32 }] },
            id: 'TICK_MSG_1',
            timestampUsec: '1790000000000031',
            authorExternalChannelId: 'UCTICKAAAAA',
            purchaseAmountText: { simpleText: '$2.00' },
          },
        },
      },
    },
  },
};

export const textLeaderboard = {
  addChatItemAction: {
    item: {
      liveChatTextMessageRenderer: {
        message: { runs: [{ text: 'grinding xp' }] },
        authorName: { simpleText: '@grinder' },
        authorPhoto: { thumbnails: [{ url: 'https://g/s32', width: 32, height: 32 }] },
        id: 'MSG_LB_1',
        timestampUsec: '1790000000000032',
        authorExternalChannelId: 'UCGRINDAAAA',
        beforeContentButtons: [
          {
            buttonViewModel: {
              iconName: 'CROWN',
              title: '#1',
              accessibilityText: '#1',
              onTap: {
                innertubeCommand: {
                  showEngagementPanelEndpoint: {
                    identifier: { surface: 'ENGAGEMENT_PANEL_SURFACE_LIVE_CHAT', tag: 'PAlive_viewer_leaderboard' },
                    globalConfiguration: { params: 'PANEL_P' },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
};
