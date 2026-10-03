import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { TubeChat, type Videos } from '../src/TubeChat';
import { Events } from '../src/events';
import { AuthRequiredError, SessionExpiredError } from '../src/auth';
import { parseCookieString } from '../src/auth';
import { backoffMs } from '../src/utils';
import { parse } from '../src/parsers/index';
import { textModerator, pollUpdate, bannerPinned, textBasic, textWithClientId, donationBasic } from './fixtures';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });
const json = (obj: any, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

function joinedTube(cookie?: string): TubeChat {
  const tube = new TubeChat({ useSignaler: false, ...(cookie ? { auth: { cookie } } : {}) });
  const entry: Videos = {
    videoData: {
      videoId: 'VID123', user: '@owner', chatType: 'live', channelId: 'UCOWNER',
      title: 't', clientName: 'WEB', clientVersion: '2.20260930.00.00', datasyncId: 'D123',
    },
    fetchChat: async () => ({ code: 'fetch_error', error: 'stub' }),
    isJoined: true, firstFetch: false, skipFirstResults: false, interval: 1000,
  };
  tube.videos.set('VID123', entry);
  return tube;
}

const COOKIE = 'SID=a; SAPISID=b; __Secure-1PAPISID=c; __Secure-3PAPISID=d';

describe('auth gating (no network)', () => {
  it('write methods require login', async () => {
    const tube = new TubeChat({ useSignaler: false });
    await assert.rejects(() => tube.say('V', 'hi'), AuthRequiredError);
    await assert.rejects(() => tube.vote('V', 'p'), AuthRequiredError);
    await assert.rejects(() => tube.removeMessage('V', 'p'), AuthRequiredError);
    await assert.rejects(() => tube.timeoutUser('V', 'p'), AuthRequiredError);
    await assert.rejects(() => tube.banUser('V', 'p'), AuthRequiredError);
    await assert.rejects(() => tube.getMenu('V', 'p'), AuthRequiredError);
    await assert.rejects(() => tube.checkAuth('V'), AuthRequiredError);
  });

  it('requires join before writes', async () => {
    const tube = new TubeChat({ useSignaler: false, auth: { cookie: COOKIE } });
    await assert.rejects(() => tube.say('NOPE', 'hi'), /Not joined/);
  });

  it('leave unknown id is a no-op; setAuth stores cookie', async () => {
    const tube = new TubeChat({ useSignaler: false });
    await tube.leave('unknown');
    tube.setAuth({ cookie: COOKIE });
    await assert.rejects(() => tube.say('NOPE', 'hi'), /Not joined/);
  });

  it('join on existing entry short-circuits without network', async () => {
    const tube = joinedTube();
    let fetched = false;
    (globalThis as any).fetch = async () => { fetched = true; throw new Error('no network'); };
    const r = await tube.join('VID123');
    assert.equal((r as any).joined, true);
    assert.equal(fetched, false);
  });
});

describe('write wiring (stubbed fetch)', () => {
  const POPOUT = '<html>"sendLiveChatMessageEndpoint":{"params":"SEND_P"},"clientIdPrefix":"CP_"</html>';

  it('say posts and returns the echoed id', async () => {
    const seen: string[] = [];
    (globalThis as any).fetch = async (url: any) => {
      seen.push(String(url));
      if (String(url).includes('is_popout')) return new Response(POPOUT, { status: 200 });
      return json({ actions: [{ addChatItemAction: { item: { liveChatTextMessageRenderer: { id: 'ECHO_9' } } } }] });
    };
    const tube = joinedTube(COOKIE);
    const r = await tube.say('VID123', 'hello');
    assert.equal(r.id, 'ECHO_9');
    assert.ok(seen.some(u => u.includes('/live_chat/send_message?')));
  });

  it('remove/timeout/ban use harvested moderation params', async () => {
    const urls: string[] = [];
    (globalThis as any).fetch = async (url: any) => {
      urls.push(String(url));
      return json({ success: true });
    };
    const tube = joinedTube(COOKIE);
    const msg = parse(textModerator)!.data as any;
    await tube.removeMessage('VID123', msg);
    await tube.timeoutUser('VID123', msg);
    await tube.banUser('VID123', msg);
    assert.equal(urls.filter(u => u.includes('/live_chat/moderate?')).length, 3);
    await assert.rejects(() => tube.removeMessage('VID123', { id: 'x' } as any), /No remove params/);
  });

  it('vote uses choice params from poll events', async () => {
    (globalThis as any).fetch = async (url: any) => {
      assert.ok(String(url).includes('/live_chat/send_live_chat_vote?'));
      return json({ ok: 1 });
    };
    const tube = joinedTube(COOKIE);
    const poll = parse(pollUpdate)!.data as any;
    await tube.vote('VID123', poll.choices[0]);
    await tube.vote('VID123', 'RAW_PARAMS');
  });

  it('checkAuth passes with a valid session', async () => {
    (globalThis as any).fetch = async () => new Response(POPOUT, { status: 200 });
    const tube = joinedTube(COOKIE);
    assert.equal(await tube.checkAuth('VID123'), true);
  });

  it('pinned emits only pinned by default; legacy flag also emits message', async () => {
    async function run(legacy: boolean): Promise<string[]> {
      const tube = new TubeChat({ useSignaler: false, ...(legacy ? { legacyPinnedAsMessage: true as const } : {}) });
      const entry = {
        videoData: {
          videoId: 'VID123', user: '@owner', chatType: 'live', channelId: 'UCOWNER',
          title: 't', clientName: 'WEB', clientVersion: '2.20260930.00.00', datasyncId: 'D123',
        },
        fetchChat: async () => ({ code: 'success', videoData: (null as any), actions: [bannerPinned] }) as any,
        isJoined: true, firstFetch: false, skipFirstResults: false, interval: 1000,
      };
      tube.videos.set('VID123', entry as any);
      const got: string[] = [];
      tube.on('pinned', () => got.push('pinned'));
      tube.on('message', () => got.push('message'));
      await (tube as any).fetchChatAndUpdate('VID123');
      return got;
    }
    assert.deepEqual(await run(false), ['pinned']);
    assert.deepEqual(await run(true), ['pinned', 'message']);
  });
});

describe('backoff', () => {
  it('grows exponentially and caps at ~30s', () => {
    const b1 = backoffMs(1);
    const b2 = backoffMs(2);
    const b3 = backoffMs(3);
    assert.ok(b1 >= 1000 && b1 <= 1500, `b1=${b1}`);
    assert.ok(b2 >= 2000 && b2 <= 2500, `b2=${b2}`);
    assert.ok(b3 >= 4000 && b3 <= 4500, `b3=${b3}`);
    assert.ok(b1 < b2 && b2 < b3);
    const capped = backoffMs(100);
    assert.ok(capped >= 30000 && capped <= 30500, `capped=${capped}`);
  });
});

describe('uptime: never drop on transient errors', () => {
  const WATCH_HTML = '<html>{window.ytplayer={};\nytcfg.set({"DATASYNC_ID":"D123||","WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH":{"device":{"interfaceName":"WEB","interfaceVersion":"9.9"}}}); window.ytcfg<script>var ytInitialData = {"videoDescriptionHeaderRenderer":{"title":{"runs":[{"text":"t"}]},"channelNavigationEndpoint":{"browseEndpoint":{"browseId":"UCX","canonicalBaseUrl":"/chan"}}},"subMenuItems":[{},{"title":"Live chat"}]};</script></html>';
  const popoutHtml = (liveChatRenderer: any) =>
    `<html><script>window["ytInitialData"] = ${JSON.stringify({ contents: { liveChatRenderer } })};</script></html>`;

  function entryWith(fetchChat: any): Videos {
    return {
      videoData: {
        videoId: 'VID123', user: '@c', chatType: 'live', channelId: 'UCX',
        title: 't', clientName: 'WEB', clientVersion: '9.9', datasyncId: 'D123',
      },
      fetchChat,
      isJoined: true, firstFetch: false, skipFirstResults: false, interval: 1000,
    } as any;
  }

  it('fetch_error never disconnects and backs off', async () => {
    const tube = new TubeChat({ useSignaler: false });
    tube.videos.set('VID123', entryWith(async () => ({ code: 'fetch_error', error: 'boom' })));
    (tube as any).fetchGen.set('VID123', 1);
    const errors: string[] = [];
    let disconnected = 0;
    tube.on('error', (_id, m) => errors.push(m));
    tube.on('disconnected', () => disconnected++);
    const r1: any = await (tube as any).fetchChatAndUpdate('VID123', 1);
    const r2: any = await (tube as any).fetchChatAndUpdate('VID123', 1);
    const r3: any = await (tube as any).fetchChatAndUpdate('VID123', 1);
    assert.ok(tube.videos.has('VID123'), 'stays joined');
    assert.equal(disconnected, 0);
    assert.equal(errors.length, 3);
    assert.ok(/attempt 1/.test(errors[0]!));
    assert.ok(r1.retryInMs < r2.retryInMs && r2.retryInMs < r3.retryInMs, `${r1.retryInMs} ${r2.retryInMs} ${r3.retryInMs}`);
  });

  it('continuation_not_found re-bootstraps silently and catches up', async () => {
    const live = {
      continuations: [{ invalidationContinuationData: { continuation: 'NEW_TOK', timeoutMs: 5000 } }],
      actions: [textBasic],
    };
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('is_popout')) return new Response(popoutHtml(live), { status: 200 });
      if (u.includes('watch?v=')) return new Response(WATCH_HTML, { status: 200 });
      if (u.includes('get_live_chat')) {
        return new Response(JSON.stringify({
          continuationContents: { liveChatContinuation: { continuations: [{ invalidationContinuationData: { continuation: 'NEW_TOK2', timeoutMs: 1000 } }], actions: [] } },
        }), { status: 200 });
      }
      throw new Error('unexpected ' + u);
    };
    const tube = new TubeChat({ useSignaler: false });
    let calls = 0;
    tube.videos.set('VID123', entryWith(async () => {
      calls++;
      return { code: 'continuation_not_found', error: 'stale' };
    }));
    (tube as any).fetchGen.set('VID123', 1);
    const errors: string[] = [];
    const seen: string[] = [];
    let joins = 0;
    tube.on('error', (_id, m) => errors.push(m));
    tube.on('message', (m) => seen.push(m.text));
    tube.on('join', () => joins++);
    const r: any = await (tube as any).fetchChatAndUpdate('VID123', 1);
    assert.ok(tube.videos.has('VID123'), 'stays joined');
    assert.equal(joins, 0, 'no join spam on recovery');
    assert.equal(r.retryInMs, 1000);
    // Next poll uses the re-bootstrapped closure and emits the missed message.
    const r2: any = await (tube as any).fetchChatAndUpdate('VID123', 1);
    assert.deepEqual(seen, ['hello chat']);
    assert.equal(r2.timeoutMs, 5000);
    assert.ok(errors.length >= 1 && /reconnect attempt 1/.test(errors[0]!));
    void calls;
  });

  it('dead chat disconnects only after attempts (maxRetries=1)', async () => {    const ended = { contents: { messageRenderer: { text: { runs: [{ text: 'Stream ended' }] } } } };
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('is_popout')) return new Response(popoutHtml(ended.contents), { status: 200 });
      if (u.includes('watch?v=')) return new Response(WATCH_HTML, { status: 200 });
      throw new Error('unexpected ' + u);
    };
    const tube = new TubeChat({ useSignaler: false, maxRetries: 1 });
    tube.videos.set('VID123', entryWith(async () => ({ code: 'continuation_not_found', error: 'stale' })));
    (tube as any).fetchGen.set('VID123', 1);
    const errors: string[] = [];
    let disconnected = 0;
    tube.on('error', (_id, m) => errors.push(m));
    tube.on('disconnected', () => disconnected++);
    await (tube as any).fetchChatAndUpdate('VID123', 1);
    assert.ok(tube.videos.has('VID123'), 'first dead round keeps polling');
    assert.equal(disconnected, 0);
    await (tube as any).fetchChatAndUpdate('VID123', 1);
    assert.ok(!tube.videos.has('VID123'), 'disconnects after exhausted attempts');
    assert.equal(disconnected, 1);
    assert.ok(errors.some((m) => /giving up/.test(m)));
  });

    it('join stores the live videoData reference so poll harvests stick', async () => {    const watchHtml = '<html>{window.ytplayer={};\nytcfg.set({"DATASYNC_ID":"SHORT01||","WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH":{"device":{"interfaceName":"WEB","interfaceVersion":"9.9"}}}); window.ytcfg<script>var ytInitialData = {"videoDescriptionHeaderRenderer":{"title":{"runs":[{"text":"t"}]},"channelNavigationEndpoint":{"browseEndpoint":{"browseId":"UCX","canonicalBaseUrl":"/c"}}},"subMenuItems":[{},{}]};</script></html>';
    const popout = (renderer: any) =>
      `<html><script>window["ytInitialData"] = ${JSON.stringify({ contents: { liveChatRenderer: renderer } })};</script></html>`;
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('is_popout')) {
        return new Response(popout({
          continuations: [{ invalidationContinuationData: { continuation: 'TOK0', timeoutMs: 1000 } }],
          actions: [],
        }), { status: 200 });
      }
      if (u.includes('watch?v=')) return new Response(watchHtml, { status: 200 });
      if (u.includes('get_live_chat')) {
        return new Response(JSON.stringify({
          mainAppWebResponseContext: { datasyncId: '123456789012345678901||' },
          continuationContents: { liveChatContinuation: { continuations: [{ invalidationContinuationData: { continuation: 'TOK1', timeoutMs: 1000 } }], actions: [] } },
        }), { status: 200 });
      }
      throw new Error('unexpected ' + u);
    };
    const tube = new TubeChat({ useSignaler: false, maxRetries: 1 });
    const res: any = await tube.join('VID123');
    assert.equal(res.joined, true);
    assert.equal(tube.videos.get('VID123')!.videoData.datasyncId, 'SHORT01');
    const gen = (tube as any).fetchGen.get('VID123');
    await (tube as any).fetchChatAndUpdate('VID123', gen);
    // Harvest from the poll response landed on the STORED entry (same reference).
    assert.equal(tube.videos.get('VID123')!.videoData.datasyncId, '123456789012345678901');
    await tube.leave('VID123');
  });

  it('join succeeds when the watch page omits chat metadata (popout decides)', async () => {
    const bareWatch = '<html>{window.ytplayer={};\nytcfg.set({"DATASYNC_ID":"SHORT01||","WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH":{"device":{"interfaceName":"WEB","interfaceVersion":"9.9"}}}); window.ytcfg<script>var ytInitialData = {};</script></html>';
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('is_popout')) {
        return new Response(`<html><script>window["ytInitialData"] = ${JSON.stringify({ contents: { liveChatRenderer: { continuations: [{ invalidationContinuationData: { continuation: 'TOKX', timeoutMs: 1000 } }], actions: [] } } })};</script></html>`, { status: 200 });
      }
      if (u.includes('watch?v=')) return new Response(bareWatch, { status: 200 });
      throw new Error('unexpected ' + u);
    };
    const tube = new TubeChat({ useSignaler: false, maxRetries: 1 });
    const res: any = await tube.join('VID123');
    assert.equal(res.joined, true);
    assert.equal(tube.videos.get('VID123')!.videoData.chatType, 'live');
    await tube.leave('VID123');
  });

  it('say refreshes short datasync via a poll before writing', async () => {
    const STABLE = '123456789012345678901';
    const order: string[] = [];
    let sendAuth = '';
    (globalThis as any).fetch = async (url: any, init: any) => {
      const u = String(url);
      if (u.includes('is_popout')) {
        return new Response('<html>"sendLiveChatMessageEndpoint":{"params":"SEND_P"},"clientIdPrefix":"C_"</html>', { status: 200 });
      }
      if (u.includes('/live_chat/send_message?')) {
        order.push('send');
        sendAuth = (init.headers as any).authorization || (init.headers as any).Authorization || '';
        return new Response(JSON.stringify({ actions: [{ addChatItemAction: { item: { liveChatTextMessageRenderer: { id: 'ECHO_X' } } } }] }), { status: 200 });
      }
      throw new Error('unexpected ' + u);
    };
    const tube = new TubeChat({ useSignaler: false, auth: { cookie: COOKIE } });
    const entry = {
      videoData: {
        videoId: 'VID123', user: '@c', chatType: 'live', channelId: 'UCX',
        title: 't', clientName: 'WEB', clientVersion: '9.9', datasyncId: 'Vshort01',
      },
      fetchChat: async () => {
        order.push('poll');
        // Simulate the harvest the real closure performs.
        tube.videos.get('VID123')!.videoData.datasyncId = STABLE;
        return { code: 'success', videoData: tube.videos.get('VID123')!.videoData, actions: [], timeoutMs: 100 };
      },
      isJoined: true, firstFetch: false, skipFirstResults: false, interval: 1000,
    };
    tube.videos.set('VID123', entry as any);
    (tube as any).fetchGen.set('VID123', 1);
    const r = await tube.say('VID123', 'hi');
    assert.equal(r.id, 'ECHO_X');
    assert.deepEqual(order, ['poll', 'send']);
    const m = sendAuth.match(/SAPISIDHASH (\d+)_([a-f0-9]{40})_u/);
    assert.ok(m, 'auth header present, got: ' + sendAuth.slice(0, 40));
    const expected = createHash('sha1').update(`${STABLE} ${m![1]} ${parseCookieString(COOKIE).SAPISID} https://www.youtube.com`).digest('hex');
    assert.equal(m![2], expected, 'hash uses the harvested stable datasync');
    await tube.leave('VID123');
  });

  it('say emits a local isOwn echo and later polls do not duplicate it', async () => {
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('is_popout')) {
        return new Response('<html>"sendLiveChatMessageEndpoint":{"params":"SEND_P"},"clientIdPrefix":"C_"</html>', { status: 200 });
      }
      if (u.includes('/live_chat/send_message?')) {
        return new Response(JSON.stringify({ actions: [textBasic] }), { status: 200 });
      }
      throw new Error('unexpected ' + u);
    };
    const tube = new TubeChat({ useSignaler: false, auth: { cookie: COOKIE } });
    const entry = {
      videoData: {
        videoId: 'VID123', user: '@c', chatType: 'live', channelId: 'UCX',
        title: 't', clientName: 'WEB', clientVersion: '9.9', datasyncId: '123456789012345678901',
      },
      fetchChat: async () => ({ code: 'success', videoData: tube.videos.get('VID123')!.videoData, actions: [textBasic], timeoutMs: 100 }),
      isJoined: true, firstFetch: false, skipFirstResults: false, interval: 1000,
    };
    tube.videos.set('VID123', entry as any);
    (tube as any).fetchGen.set('VID123', 1);
    const got: any[] = [];
    tube.on('message', (m) => got.push(m));
    const r = await tube.say('VID123', 'hello chat');
    assert.equal(r.id, 'MSG_TEXT_1');
    assert.equal(got.length, 1);
    assert.equal(got[0].isOwn, true);
    assert.equal(got[0].text, 'hello chat');
    // Same message arriving later via poll is dropped by id dedup.
    await (tube as any).fetchChatAndUpdate('VID123', 1);
    assert.equal(got.length, 1);
    await tube.leave('VID123');
  });

  it('emits donation/cleared and resolves dim clientIds', async () => {    const tube = new TubeChat({ useSignaler: false });
    let currentActions: any[] = [];
    const entry = {
      videoData: {
        videoId: 'VID123', user: '@c', chatType: 'live', channelId: 'UCX',
        title: 't', clientName: 'WEB', clientVersion: '9.9', datasyncId: '123456789012345678901',
      },
      fetchChat: async () => ({ code: 'success', videoData: tube.videos.get('VID123')!.videoData, actions: currentActions, timeoutMs: 100 }),
      isJoined: true, firstFetch: false, skipFirstResults: false, interval: 1000,
    };
    tube.videos.set('VID123', entry as any);
    (tube as any).fetchGen.set('VID123', 1);
    const got: string[] = [];
    let dimmedId = '';
    tube.on('donation', () => got.push('donation'));
    tube.on('cleared', () => got.push('cleared'));
    tube.on('dimmed', (id) => { dimmedId = id; got.push('dimmed'); });
    currentActions = [textWithClientId];
    await (tube as any).fetchChatAndUpdate('VID123', 1);
    currentActions = [donationBasic, { dimChatItemAction: { clientAssignedId: 'CLIENT_X' } }, { clearChatWindowAction: {} }];
    await (tube as any).fetchChatAndUpdate('VID123', 1);
    assert.deepEqual(got, ['donation', 'dimmed', 'cleared']);
    assert.equal(dimmedId, 'MSG_X_1');
    await tube.leave('VID123');
  });

  it('binds chatId + reply() on emitted messages', async () => {
    const sent: string[] = [];
    (globalThis as any).fetch = async (url: any, init: any) => {
      const u = String(url);
      if (u.includes('is_popout')) {
        return new Response('<html>"sendLiveChatMessageEndpoint":{"params":"SEND_P"},"clientIdPrefix":"C_"</html>', { status: 200 });
      }
      if (u.includes('/live_chat/send_message?')) {
        sent.push(JSON.parse(init.body).richMessage.textSegments[0].text);
        return new Response(JSON.stringify({ actions: [{ addChatItemAction: { item: { liveChatTextMessageRenderer: { id: 'ECHO_R' } } } }] }), { status: 200 });
      }
      throw new Error('unexpected ' + u);
    };
    const tube = new TubeChat({ useSignaler: false, auth: { cookie: COOKIE } });
    const entry = {
      videoData: {
        videoId: 'VID123', user: '@c', chatType: 'live', channelId: 'UCX',
        title: 't', clientName: 'WEB', clientVersion: '9.9', datasyncId: '123456789012345678901',
      },
      fetchChat: async () => ({ code: 'success', videoData: tube.videos.get('VID123')!.videoData, actions: [textBasic], timeoutMs: 100 }),
      isJoined: true, firstFetch: false, skipFirstResults: false, interval: 1000,
    };
    tube.videos.set('VID123', entry as any);
    (tube as any).fetchGen.set('VID123', 1);
    let msg: any = null;
    tube.on('message', (m) => { msg = m; });
    await (tube as any).fetchChatAndUpdate('VID123', 1);
    assert.ok(msg, 'message emitted');
    assert.equal(msg.chatId, 'VID123');
    assert.equal(typeof msg.reply, 'function');
    const r1 = await msg.reply('hello');
    assert.equal(r1.id, 'ECHO_R');
    assert.deepEqual(sent, ['@viewer1 hello']);
    await msg.reply('plain', { mention: false });
    assert.deepEqual(sent, ['@viewer1 hello', 'plain']);
    await tube.leave('VID123');
  });

  it('emits authExpired when a write finds a dead session', async () => {
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('is_popout')) {
        return new Response('<html>"sendLiveChatMessageEndpoint":{"params":"SEND_P"},"clientIdPrefix":"C_"</html>', { status: 200 });
      }
      return new Response('x', { status: 401 });
    };
    const tube = joinedTube(COOKIE);
    let expired = 0;
    tube.on('authExpired', () => { expired++; });
    await assert.rejects(() => tube.say('VID123', 'hi'), SessionExpiredError);
    assert.equal(expired, 1);
    await tube.leave('VID123');
  });

  it('once() + Events const work through the emit path', async () => {
    const tube = new TubeChat({ useSignaler: false });
    let currentActions: any[] = [];
    const entry = {
      videoData: {
        videoId: 'VID123', user: '@c', chatType: 'live', channelId: 'UCX',
        title: 't', clientName: 'WEB', clientVersion: '9.9', datasyncId: '123456789012345678901',
      },
      fetchChat: async () => ({ code: 'success', videoData: tube.videos.get('VID123')!.videoData, actions: currentActions, timeoutMs: 100 }),
      isJoined: true, firstFetch: false, skipFirstResults: false, interval: 1000,
    };
    tube.videos.set('VID123', entry as any);
    (tube as any).fetchGen.set('VID123', 1);
    let onceCount = 0;
    let onCount = 0;
    tube.once(Events.Message, () => { onceCount++; });
    tube.on(Events.Message, () => { onCount++; });
    currentActions = [{ ...textBasic }];
    await (tube as any).fetchChatAndUpdate('VID123', 1);
    currentActions = [{ ...textBasic, addChatItemAction: { item: { liveChatTextMessageRenderer: { message: { runs: [{ text: 'again' }] }, authorName: { simpleText: '@b' }, authorPhoto: { thumbnails: [] }, id: 'MSG_OTHER', timestampUsec: '2', authorExternalChannelId: 'UCB' } } } }];
    await (tube as any).fetchChatAndUpdate('VID123', 1);
    assert.deepEqual([onceCount, onCount], [1, 2]);
    await tube.leave('VID123');
  });
});

describe('chat filter (top vs live)', () => {
  const BARE_WATCH = '<html>{window.ytplayer={};\nytcfg.set({"DATASYNC_ID":"SHORT01||","WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH":{"device":{"interfaceName":"WEB","interfaceVersion":"9.9"}}}); window.ytcfg<script>var ytInitialData = {};</script></html>';
  const submenu = (topTitle: string, liveTitle: string) => ([
    { title: topTitle, selected: true, continuation: { reloadContinuationData: { continuation: 'RT_TOP' } } },
    { title: liveTitle, selected: false, continuation: { reloadContinuationData: { continuation: 'RT_LIVE' } } },
  ]);
  function popoutHtml(submenuItems: any[]) {
    return `<html><script>window["ytInitialData"] = ${JSON.stringify({ contents: { liveChatRenderer: { continuations: [{ invalidationContinuationData: { continuation: 'EMB', timeoutMs: 1000 } }], actions: [], header: { liveChatHeaderRenderer: { viewSelector: { sortFilterSubMenuRenderer: { subMenuItems: submenuItems } } } } } } })};</script></html>`;
  }
  function stubNetwork(exchanged: string[]) {
    (globalThis as any).fetch = async (url: any, init: any) => {
      const u = String(url);
      if (u.includes('is_popout')) return new Response(popoutHtml(submenu('Top chat', 'Live chat')), { status: 200 });
      if (u.includes('watch?v=')) return new Response(BARE_WATCH, { status: 200 });
      if (u.includes('get_live_chat')) {
        const body = JSON.parse(init.body);
        exchanged.push(body.continuation);
        return new Response(JSON.stringify({
          continuationContents: { liveChatContinuation: { continuations: [{ invalidationContinuationData: { continuation: 'POLL_' + body.continuation.slice(0, 6), timeoutMs: 1000 } }], actions: [] } },
        }), { status: 200 });
      }
      throw new Error('unexpected ' + u);
    };
  }

  it('extractFilterTokens handles EN + PT titles', async () => {
    const { extractFilterTokens } = await import('../src/fetch/chat');
    const en = extractFilterTokens({ header: { liveChatHeaderRenderer: { viewSelector: { sortFilterSubMenuRenderer: { subMenuItems: submenu('Top chat', 'Live chat') } } } } });
    assert.deepEqual(en, { live: 'RT_LIVE', top: 'RT_TOP' });
    const pt = extractFilterTokens({ header: { liveChatHeaderRenderer: { viewSelector: { sortFilterSubMenuRenderer: { subMenuItems: submenu('Principais mensagens', 'Chat ao vivo') } } } } });
    assert.deepEqual(pt, { live: 'RT_LIVE', top: 'RT_TOP' });
    assert.equal(extractFilterTokens({}), undefined);
    assert.equal(extractFilterTokens({ header: {} }), undefined);
  });

  it('default join uses the live (unfiltered) token', async () => {
    const exchanged: string[] = [];
    stubNetwork(exchanged);
    const tube = new TubeChat({ useSignaler: false, maxRetries: 1 });
    const res: any = await tube.join('VID123');
    assert.equal(res.joined, true);
    assert.ok(exchanged.includes('RT_LIVE'), 'exchanged live token, got: ' + exchanged.join(','));
    assert.ok(!exchanged.includes('RT_TOP'));
    await tube.leave('VID123');
  });

  it('join with chatFilter top uses the top token', async () => {
    const exchanged: string[] = [];
    stubNetwork(exchanged);
    const tube = new TubeChat({ useSignaler: false, maxRetries: 1 });
    const res: any = await tube.join('VID123', false, { headers: undefined, interval: 1000, chatFilter: 'top' });
    assert.equal(res.joined, true);
    assert.ok(exchanged.includes('RT_TOP'), 'exchanged top token, got: ' + exchanged.join(','));
    await tube.leave('VID123');
  });

  it('setChatFilter switches the polling chain', async () => {
    const exchanged: string[] = [];
    stubNetwork(exchanged);
    const tube = new TubeChat({ useSignaler: false, maxRetries: 1 });
    const res: any = await tube.join('VID123');
    assert.equal(res.joined, true);
    exchanged.length = 0;
    assert.equal(await tube.setChatFilter('VID123', 'top'), true);
    assert.ok(exchanged.includes('RT_TOP'), 're-exchanged top token, got: ' + exchanged.join(','));
    assert.equal(tube.videos.get('VID123')!.chatFilter, 'top');
    await assert.rejects(() => tube.setChatFilter('NOPE', 'live'), /Not joined/);
    await tube.leave('VID123');
  });
});
