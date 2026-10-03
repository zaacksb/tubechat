import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parsers/index';
import * as F from './fixtures';

describe('dispatcher routing', () => {
  it('routes text message', () => {
    const r = parse(F.textBasic)!;
    assert.equal(r.event, 'message');
    assert.equal((r.data as any).id, 'MSG_TEXT_1');
    assert.equal((r.data as any).author.channelName, '@viewer1');
    assert.equal((r.data as any).message[0].text, 'hello chat');
    assert.equal((r.data as any).text, 'hello chat');
    assert.equal((r.data as any).timestamp, 1790000000000);
  });

  it('pinned banner emits pinned, never message', () => {
    const r = parse(F.bannerPinned)!;
    assert.equal(r.event, 'pinned');
    assert.equal((r.data as any).pinnedBy, 'Owner Name');
    assert.equal((r.data as any).author.channelName, '@owner');
  });

  it('replace resolves placeholder into message', () => {
    const r = parse(F.replacePlaceholder)!;
    assert.equal(r.event, 'message');
    assert.equal((r.data as any).id, 'MSG_LATE_1');
  });

  it('ignores placeholder, ticker, moderation-state and empty actions', () => {
    assert.equal(parse(F.placeholderItem), null);
    assert.equal(parse(F.tickerItem), null);
    assert.equal(parse(F.moderationState), null);
    assert.equal(parse(F.emptyAction), null);
    assert.equal(parse(null), null);
    assert.equal(parse('junk'), null);
  });

  it('parses old and new delete formats into the same events', () => {
    assert.deepEqual(parse(F.removeItem), { event: 'deletedMessage', data: 'MSG_GONE_1' });
    assert.deepEqual(parse(F.markDeleted), { event: 'deletedMessage', data: 'MSG_GONE_2' });
    assert.deepEqual(parse(F.removeByAuthor), { event: 'deleteUserMessages', data: 'UCBANNEDAAAA' });
    assert.deepEqual(parse(F.markByAuthor), { event: 'deleteUserMessages', data: 'UCTIMEDOUTAA' });
  });
});

describe('message content', () => {
  it('harvests moderation params + context menu', () => {
    const r = parse(F.textModerator)! as any;
    assert.equal(r.event, 'message');
    assert.deepEqual(Object.keys(r.data.moderation).sort(), ['contextMenu', 'hide', 'remove', 'timeout']);
    assert.equal(r.data.moderation.remove, 'MOD_REMOVE_1');
    assert.equal(r.data.author.badges.months, 12);
    assert.equal(r.data.author.badges.crown, '#2');
    assert.equal(r.data.author.isModerator, true);
    assert.equal(r.data.author.isMembership, true);
  });

  it('handles unicode + custom emoji without mutating thumbnails', () => {
    const item = (F.textEmoji as any).addChatItemAction.item.liveChatTextMessageRenderer;
    const before = JSON.stringify(item.message.runs[2].emoji.image.thumbnails);
    const r = parse(F.textEmoji)! as any;
    assert.equal(r.data.message[0].text, '💜');
    assert.equal(r.data.message[0].emoji.isCustomEmoji, false);
    assert.equal(r.data.message[2].text, ':party:');
    assert.equal(r.data.message[2].emoji.isCustomEmoji, true);
    assert.equal(r.data.text, '💜 hello :party:link');
    assert.equal(r.data.message[3].text, 'link');
    assert.ok(r.data.message[3].navigationEndpoint);
    assert.equal(JSON.stringify(item.message.runs[2].emoji.image.thumbnails), before);
  });

  it('reads authorName from runs and best photo thumb', () => {
    const r = parse(F.textAuthorRuns)! as any;
    assert.equal(r.data.author.channelName, '@runsuser');
    assert.equal(r.data.author.photo, 'https://r/s32');
    const basic = parse(F.textBasic)! as any;
    assert.equal(basic.data.author.photo, 'https://a/s64');
    assert.equal(basic.data.moderation.contextMenu, 'CTX_PARAMS_VIEWER1');
  });
});

describe('paid / membership / gifts / jewels', () => {
  it('parses superchat with amount + currency', () => {
    const r = parse(F.paidBasic)! as any;
    assert.equal(r.event, 'superchat');
    assert.equal(r.data.amount, 5);
    assert.equal(r.data.currency, 'usd');
    assert.equal(r.data.formatted, '$5.00');
    assert.equal(r.data.isSticker, false);
  });

  it('parses runs-shaped amounts (R$ 10,00)', () => {
    const r = parse(F.paidRunsAmount)! as any;
    assert.equal(r.data.amount, 10);
    assert.equal(r.data.currency, 'brl');
  });

  it('parses sticker without corrupting URLs', () => {
    const r = parse(F.paidSticker)! as any;
    assert.equal(r.data.isSticker, true);
    assert.equal(r.data.sticker.url, 'https://stick/big');
    assert.equal(r.data.currency, 'cad');
  });

  it('distinguishes new member vs resub with months', () => {
    const n = parse(F.memberNew)! as any;
    assert.equal(n.event, 'member');
    assert.equal(n.data.isResub, false);
    const re = parse(F.memberResub)! as any;
    assert.equal(re.data.isResub, true);
    assert.equal(re.data.plan, 'Gold');
    assert.equal(re.data.author.badges.months, 6);
    assert.equal(re.data.message[0].text, 'half a year!');
  });

  it('parses gift purchase count + redemption gifter', () => {
    const a = parse(F.giftPurchase)! as any;
    assert.equal(a.event, 'subgift_announce');
    assert.equal(a.data.count, 5);
    assert.equal(a.data.gifter, '@gifter');
    assert.equal(a.data.author.channelId, 'UCGIFTERAAAA');
    const b = parse(F.giftRedemption)! as any;
    assert.equal(b.event, 'subgift');
    assert.equal(b.data.gifter, '@lucky');
  });

  it('parses full jewels payload', () => {
    const r = parse(F.jewelsFull)! as any;
    assert.equal(r.event, 'jewels');
    assert.equal(r.data.author.channelName, '@jewelfan');
    assert.equal(r.data.author.channelId, 'UCJEWELAAAAA');
    assert.equal(r.data.author.photo, 'https://av/64');
    assert.equal(r.data.content, 'sent Star');
    assert.equal(r.data.giftLabel, '@jewelfan sent a gift, Star');
    assert.equal(r.data.giftImage, 'https://gifts/star640');
  });
});

describe('system / notice / poll', () => {
  it('parses slow mode with minutes', () => {
    const r = parse(F.modeSlow)! as any;
    assert.equal(r.event, 'system');
    assert.equal(r.data.enabled, true);
    assert.equal(r.data.minutes, 30);
  });

  it('parses subscribers-only from simpleText subtext', () => {
    const r = parse(F.modeSubs)! as any;
    assert.equal(r.data.user, '@owner');
    assert.equal(r.data.message, 'Only subscribers can chat');
  });

  it('parses viewer engagement as notice', () => {
    const r = parse(F.viewerEngagement)! as any;
    assert.equal(r.event, 'notice');
    assert.ok(r.data.message.startsWith('Subscribers-only mode'));
    assert.equal(r.data.timestamp, 1790000000000);
  });

  it('parses poll updates with vote params', () => {    const r = parse(F.pollUpdate)! as any;
    assert.equal(r.event, 'poll');
    assert.equal(r.data.question, 'Like yet?');
    assert.equal(r.data.totalVotes, 456);
    assert.equal(r.data.choices[0].votePercentage, '80%');
    assert.equal(r.data.choices[0].params, 'VOTE_YES');
    assert.equal(r.data.thumbnail, 'https://t/64');
    const p = parse(F.pollPanel)! as any;
    assert.equal(p.event, 'poll');
    assert.equal(p.data.question, 'Q?');
  });
});

describe('js-mapped coverage (live_chat_polymer)', () => {
  it('parses donation announcements', () => {
    const r = parse(F.donationBasic)! as any;
    assert.equal(r.event, 'donation');
    assert.equal(r.data.amount, 10);
    assert.equal(r.data.currency, 'usd');
    assert.equal(r.data.text, 'for the cause');
    assert.equal(r.data.author.channelName, '@donor2');
  });

  it('normalizes legacy paid messages into superchat', () => {
    const r = parse(F.legacyPaid)! as any;
    assert.equal(r.event, 'superchat');
    assert.equal(r.data.amount, 5);
    assert.equal(r.data.currency, 'eur');
    assert.equal(r.data.isSticker, false);
  });

  it('unwraps automod-held messages with heldForReview', () => {
    const r = parse(F.automodWrapped)! as any;
    assert.equal(r.event, 'message');
    assert.equal(r.data.text, 'suspicious link http://x');
    assert.equal(r.data.heldForReview, true);
    assert.equal(r.data.id, 'MSG_AM_1');
  });

  it('routes banner polls to poll', () => {
    const r = parse(F.bannerPollAction)! as any;
    assert.equal(r.event, 'poll');
    assert.equal(r.data.question, 'Best?');
    assert.equal(r.data.choices[0].votePercentage, '60%');
  });

  it('survives malformed runs without dropping the message', () => {
    const r = parse(F.textMalformedRuns)! as any;
    assert.equal(r.event, 'message');
    assert.equal(r.data.text, 'ok123:x:');
    assert.equal(r.data.author.channelName, '@plainstring');
    assert.equal(r.data.author.photo, '');
  });

  it('kind-tags unknown renderers instead of dropping them', () => {
    const q = parse(F.qnaCall)! as any;
    assert.equal(q.event, 'notice');
    assert.equal(q.data.kind, 'liveChatCallForQuestionsRenderer');
    assert.equal(q.data.message, 'Ask me anything');
    const g = parse(F.giftItemUnknown)! as any;
    assert.equal(g.event, 'notice');
    assert.equal(g.data.kind, 'giftItemViewModel');
  });

  it('handles dim, clear and server errors', () => {
    assert.deepEqual(parse(F.dimAction), { event: 'dimmed', data: 'CLIENT_X' });
    assert.deepEqual(parse(F.clearAction), { event: 'cleared', data: null });
    const s = parse(F.serverError)! as any;
    assert.equal(s.event, 'notice');
    assert.equal(s.data.kind, 'serverErrorMessage');
    assert.equal(s.data.message, 'Slow mode is on');
  });

  it('still ignores pure UI chrome', () => {
    assert.equal(parse(F.placeholderItem), null);
    assert.equal(parse(F.tickerItem), null);
    assert.equal(parse({ addChatItemAction: { item: { liveChatParticipantsListRenderer: {} } } }), null);
    assert.equal(parse({ addChatItemAction: { item: { liveChatProductPickerRenderer: {} } } }), null);
    assert.equal(parse({ showLiveChatDialogAction: {} }), null);
    assert.equal(parse({ addLiveChatTextMessageFromTemplateAction: { template: {} } }), null);
  });

  it('harvests superchat reply-thread params and creator heart', () => {
    const r = parse(F.superchatEngaged)! as any;
    assert.equal(r.event, 'superchat');
    assert.equal(r.data.replyThread.params, 'THREAD_P');
    assert.equal(r.data.creatorHeart.by, '@ownerchan');
    assert.equal(r.data.moderation.contextMenu, 'CTX_SC');
  });

  it('parses nested ticker superchats (dedup-safe)', () => {
    const r = parse(F.tickerNested)! as any;
    assert.equal(r.event, 'superchat');
    assert.equal(r.data.id, 'TICK_MSG_1');
    assert.equal(r.data.text, 'ticker copy');
  });

  it('harvests XP leaderboard rank + panel params', () => {
    const r = parse(F.textLeaderboard)! as any;
    assert.equal(r.event, 'message');
    assert.equal(r.data.author.badges.crown, '#1');
    assert.equal(r.data.author.badges.leaderboard.rank, '#1');
    assert.equal(r.data.author.badges.leaderboard.panelParams, 'PANEL_P');
  });
});
