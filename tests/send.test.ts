import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInnertubeContext, ensureSendParams, fetchMessageMenu, moderateWithParams,
  sendChatMessage, voteWithParams, youtubeiPost, type WriteState,
} from '../src/fetch/send';
import { fetchPopoutInitial, extractStableDatasync } from '../src/fetch/chat';
import { ModActionError, SessionExpiredError } from '../src/auth';

const STATE: WriteState = {
  videoId: 'VID123',
  clientName: 'WEB',
  clientVersion: '2.20260930.00.00',
  datasyncId: 'D123',
  cookie: 'SID=a; SAPISID=b; __Secure-1PAPISID=c; __Secure-3PAPISID=d',
};

const realFetch = globalThis.fetch;
let calls: { url: string, init: any }[] = [];
function stubFetch(handler: (url: string, init: any) => any) {
  calls = [];
  (globalThis as any).fetch = async (url: any, init: any) => {
    calls.push({ url: String(url), init });
    return handler(String(url), init);
  };
}
const json = (obj: any, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => { globalThis.fetch = realFetch; });

describe('youtubeiPost', () => {
  it('posts JSON with auth headers to the keyless endpoint', async () => {
    stubFetch(() => json({ ok: 1 }));
    const r = await youtubeiPost(STATE, 'live_chat/moderate', 'prettyPrint=false', { context: {}, params: 'P' });
    assert.equal(r.status, 200);
    assert.equal(calls.length, 1);
    assert.ok(calls[0]!.url.startsWith('https://www.youtube.com/youtubei/v1/live_chat/moderate?prettyPrint=false'));
    assert.ok(!calls[0]!.url.includes('key='));
    const headers = calls[0]!.init.headers;
    assert.match(headers['authorization'], /^SAPISIDHASH \d+_[a-f0-9]{40}_u /);
    assert.equal(headers['cookie'], STATE.cookie);
    assert.deepEqual(JSON.parse(calls[0]!.init.body), { context: {}, params: 'P' });
  });

  it('maps 401 and logged-out bodies to SessionExpiredError', async () => {
    stubFetch(() => new Response('x', { status: 401 }));
    await assert.rejects(() => youtubeiPost(STATE, 'live_chat/moderate', 'prettyPrint=false', {}), SessionExpiredError);
    stubFetch(() => json({ mainAppWebResponseContext: { loggedOut: true } }));
    await assert.rejects(() => youtubeiPost(STATE, 'live_chat/moderate', 'prettyPrint=false', {}), SessionExpiredError);
  });

  it('surfaces server toasts and API errors', async () => {
    stubFetch(() => json({ actions: [{ liveChatAddToToastAction: { item: { notificationTextRenderer: { successResponseText: { runs: [{ text: 'Nope.' }] } } } } }] }));
    await assert.rejects(() => youtubeiPost(STATE, 'live_chat/moderate', 'prettyPrint=false', {}), ModActionError);
    stubFetch(() => json({ error: { message: 'boom' } }, 400));
    await assert.rejects(() => youtubeiPost(STATE, 'live_chat/moderate', 'prettyPrint=false', {}), /boom/);
  });
});

describe('context + send params', () => {
  it('builds a full innertube context', () => {
    const ctx = buildInnertubeContext({ ...STATE, visitorData: 'V' }) as any;
    assert.equal(ctx.client.clientName, 'WEB');
    assert.equal(ctx.client.visitorData, 'V');
    assert.ok(ctx.client.originalUrl.includes('VID123'));
    assert.ok(Array.isArray(ctx.adSignalsInfo.params));
    assert.equal(ctx.user.lockedSafetyMode, false);
  });

  it('harvests send params from popout HTML', async () => {
    stubFetch((url) => {
      assert.ok(url.includes('/live_chat?is_popout=1&v=VID123'));
      return new Response('<html>"sendLiveChatMessageEndpoint":{"params":"SEND_P"},"clientIdPrefix":"CP_"</html>', { status: 200 });
    });
    const st = { ...STATE };
    const r = await ensureSendParams(st);
    assert.equal(r.params, 'SEND_P');
    assert.equal(r.clientIdPrefix, 'CP_');
    assert.equal(st.sendParams, 'SEND_P'); // cached on state
  });

  it('maps logged-out popout to SessionExpiredError', async () => {
    stubFetch(() => new Response('<html>"loggedOut":true</html>', { status: 200 }));
    await assert.rejects(() => ensureSendParams({ ...STATE }), SessionExpiredError);
  });

  it('does not mistake restricted chats for dead sessions', async () => {
    stubFetch(() => new Response('<html>ServiceLogin liveChatMessageInputRenderer "loggedOut":false</html>', { status: 200 }));
    await assert.rejects(
      () => ensureSendParams({ ...STATE }),
      (e: any) => !(e instanceof SessionExpiredError) && /unavailable/.test(e.message)
    );
  });

  it('reuses cached popout HTML instead of fetching', async () => {
    let fetched = 0;
    stubFetch(() => {
      fetched++;
      return new Response('nope', { status: 200 });
    });
    const cached = '<html>"sendLiveChatMessageEndpoint":{"params":"CACHED_P"},"clientIdPrefix":"C_"</html>';
    const r = await ensureSendParams({ ...STATE, popoutHtml: cached });
    assert.equal(r.params, 'CACHED_P');
    assert.equal(fetched, 0);
  });
});

describe('popout bootstrap', () => {
  const initial = {
    contents: {
      liveChatRenderer: {
        continuations: [{ invalidationContinuationData: { continuation: 'LONG_TOK', timeoutMs: 10000 } }],
        actions: [{ addChatItemAction: { item: {} } }, { updateLiveChatPollAction: {} }],
      },
    },
  };
  const htmlOf = (data: any) => `<html><script>window["ytInitialData"] = ${JSON.stringify(data)};</script></html>`;

  it('extracts continuation + actions from popout HTML', async () => {
    let requested = '';
    stubFetch((url) => {
      requested = url;
      return new Response(htmlOf(initial), { status: 200 });
    });
    const r = await fetchPopoutInitial('VID123', undefined, undefined);
    assert.equal(r.ended, false);
    assert.equal(r.continuation, 'LONG_TOK');
    assert.equal(r.timeoutMs, 10000);
    assert.equal(r.actions.length, 2);
    assert.ok(requested.includes('hl=en'), 'forces English titles, got: ' + requested);
  });

  it('extracts the stable session datasync (escaped and plain forms)', () => {
    assert.equal(extractStableDatasync('x\\"DATASYNC_ID\\":\\"110457479998139483407||\\"y'), '110457479998139483407');
    assert.equal(extractStableDatasync('x"datasyncId":"110457479998139483407||"y'), '110457479998139483407');
    assert.equal(extractStableDatasync('x\\"syncId\\":\\"110457479998139483407||\\"y'), '110457479998139483407');
    assert.equal(extractStableDatasync('"DATASYNC_ID":"Vabc1234||"'), '');
    assert.equal(extractStableDatasync('nothing here'), '');
  });

  it('supports timed continuations', async () => {
    const data = { contents: { liveChatRenderer: { continuations: [{ timedContinuationData: { continuation: 'TIMED_TOK', timeoutMs: 9976 } }], actions: [] } } };
    stubFetch(() => new Response(htmlOf(data), { status: 200 }));
    const r = await fetchPopoutInitial('VID123', undefined, undefined);
    assert.equal(r.continuation, 'TIMED_TOK');
    assert.equal(r.timeoutMs, 9976);
  });

  it('detects ended streams and missing chat', async () => {
    const ended = { contents: { messageRenderer: { text: { runs: [{ text: 'Stream ended' }] } } } };
    stubFetch(() => new Response(htmlOf(ended), { status: 200 }));
    const r = await fetchPopoutInitial('VID123', undefined, undefined);
    assert.equal(r.ended, true);
    assert.equal(r.endedMessage, 'Stream ended');
    stubFetch(() => new Response('<html>no data</html>', { status: 200 }));
    const r2 = await fetchPopoutInitial('VID123', undefined, undefined);
    assert.equal(r2.ended, true);
  });
});

describe('write methods', () => {
  const POPOUT = '<html>"sendLiveChatMessageEndpoint":{"params":"SEND_P"},"clientIdPrefix":"CP_"</html>';
  const ECHO = { actions: [{ addChatItemAction: { item: { liveChatTextMessageRenderer: { id: 'ECHO_1' } } } }] };

  it('sendChatMessage truncates to 200 chars and echoes id', async () => {    stubFetch((url) => url.includes('is_popout')
      ? new Response(POPOUT, { status: 200 })
      : json(ECHO));
    const r = await sendChatMessage({ ...STATE }, 'x'.repeat(250));
    assert.equal(r.id, 'ECHO_1');
    const post = calls.find(c => c.url.includes('send_message'))!;
    const body = JSON.parse(post.init.body);
    assert.equal(body.params, 'SEND_P');
    assert.equal(body.richMessage.textSegments[0].text.length, 200);
    assert.ok(String(body.clientMessageId).startsWith('CP_'));
  });

  it('moderate/vote/menu hit the right endpoints with params', async () => {
    stubFetch(() => json({ success: true }));
    await moderateWithParams(STATE, 'MOD_P');
    assert.ok(calls[0]!.url.includes('/live_chat/moderate?'));
    assert.equal(JSON.parse(calls[0]!.init.body).params, 'MOD_P');
    await assert.rejects(() => moderateWithParams(STATE, ''), /Missing moderation params/);

    stubFetch(() => json({ ok: 1 }));
    await voteWithParams(STATE, 'VOTE_P');
    assert.ok(calls[0]!.url.includes('/live_chat/send_live_chat_vote?'));
    await assert.rejects(() => voteWithParams(STATE, ''), /Missing vote params/);

    stubFetch(() => json({ liveChatItemContextMenuSupportedRenderers: { menuRenderer: { items: [{ a: 1 }, { b: 2 }] } } }));
    const items = await fetchMessageMenu(STATE, 'CTX_P');
    assert.equal(items.length, 2);
    assert.ok(calls[0]!.url.includes('/live_chat/get_item_context_menu?'));
    assert.ok(calls[0]!.url.includes(encodeURIComponent('CTX_P')));
  });

  it('send surfaces slow-mode cooldown and server error text', async () => {
    stubFetch((url) => url.includes('is_popout')
      ? new Response(POPOUT, { status: 200 })
      : json({ actions: [{ addChatItemAction: { item: { liveChatTextMessageRenderer: { id: 'ECHO_S' } } } }], timeoutDurationUsec: '30000000' }));
    const r = await sendChatMessage({ ...STATE }, 'hi');
    assert.equal(r.id, 'ECHO_S');
    assert.equal(r.timeoutMs, 30000);
  });

  it('send throws ModActionError when nothing is echoed with error text', async () => {
    stubFetch((url) => url.includes('is_popout')
      ? new Response(POPOUT, { status: 200 })
      : json({ errorMessage: { simpleText: 'Slow mode is on' } }));
    await assert.rejects(() => sendChatMessage({ ...STATE }, 'hi'), (e: any) => e instanceof ModActionError && /Slow mode/.test(e.message));
  });

  it('notifies onAuthExpired on 401 and on logged-out popout', async () => {
    let calls = 0;
    const state = { ...STATE, onAuthExpired: () => { calls++; } };
    stubFetch(() => new Response('x', { status: 401 }));
    await assert.rejects(() => youtubeiPost(state, 'live_chat/moderate', 'prettyPrint=false', {}), SessionExpiredError);
    stubFetch(() => new Response('<html>"loggedOut":true</html>', { status: 200 }));
    await assert.rejects(() => ensureSendParams({ ...state, sendParams: undefined }), SessionExpiredError);
    assert.equal(calls, 2);
  });
});
