import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { TubeChat } from '../src/TubeChat';
import { fetchReplayPage, splitRanges, bootstrapReplayChat, type ReplayBootstrap } from '../src/fetch/replay';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function txt(id: string, text: string, author = '@a', usec = '1') {
  return {
    addChatItemAction: {
      item: {
        liveChatTextMessageRenderer: {
          message: { runs: [{ text }] },
          authorName: { simpleText: author },
          authorPhoto: { thumbnails: [] },
          id,
          timestampUsec: usec,
          authorExternalChannelId: 'UCA',
        },
      },
    },
  };
}

const VOD_WATCH = '<html>{window.ytplayer={};\nytcfg.set({"DATASYNC_ID":"D||","WEB_PLAYER_CONTEXT_CONFIG_ID_KEVLAR_WATCH":{"device":{"interfaceName":"WEB","interfaceVersion":"9.9"}}}); window.ytcfg<script>var ytInitialData = {"videoDescriptionHeaderRenderer":{"title":{"runs":[{"text":"VOD title"}]},"channelNavigationEndpoint":{"browseEndpoint":{"browseId":"UCX","canonicalBaseUrl":"/chan"}}},"dateText":{"simpleText":"Streamed live on Sep 26, 2026"},"conversationBar":{"liveChatRenderer":{"continuations":[{"reloadContinuationData":{"continuation":"REPLAY0"}}]}}};</script></html>';

function replayPage(actions: any[], next?: string) {
  return {
    continuationContents: {
      liveChatContinuation: {
        continuations: next ? [{ liveChatReplayContinuationData: { continuation: next } }] : [],
        actions,
      },
    },
  };
}

describe('downloadChat (VOD replay)', () => {
  it('downloads all pages, unwraps replay items and emits events', async () => {
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('watch?v=')) return new Response(VOD_WATCH, { status: 200 });
      if (u.includes('get_live_chat_replay')) {
        const pages: Record<string, any> = {
          REPLAY0: replayPage(
            [{ replayChatItemAction: { actions: [txt('R1', 'r1'), txt('R2', 'r2')] } }, txt('R3', 'r3')],
            'REPLAY1',
          ),
          REPLAY1: replayPage([{ replayChatItemAction: { actions: [txt('R4', 'r4')] } }]),
        };
        // NOTE: tests run sequentially; read body via init is complex here,
        // so route by call order instead.
        (globalThis as any).__calls = ((globalThis as any).__calls || 0) + 1;
        const key = (globalThis as any).__calls === 1 ? 'REPLAY0' : 'REPLAY1';
        return new Response(JSON.stringify(pages[key]), { status: 200 });
      }
      throw new Error('unexpected ' + u);
    };
    const tube = new TubeChat({ useSignaler: false });
    const texts: string[] = [];
    const progresses: number[] = [];
    tube.on('message', (m) => texts.push(m.text));
    const res: any = await tube.downloadChat('VOD123', {
      delayMs: 0,
      onProgress: (p) => progresses.push(p.pages),
    });
    assert.equal(res.completed, true);
    assert.equal(res.videoData.title, 'VOD title');
    assert.deepEqual(texts, ['r1', 'r2', 'r3', 'r4']);
    assert.equal(res.messages.length, 4);
    assert.equal(res.actions, 4);
    assert.equal(res.pages, 2);
    assert.deepEqual(progresses, [1, 2]);
    // No polling state touched.
    assert.equal(tube.videos.has('VOD123'), false);
  });

  it('returns completed:false when the video has no replay chat', async () => {
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('watch?v=')) {
        return new Response('<html>{window.ytplayer={};\nytcfg.set({}); window.ytcfg<script>var ytInitialData = {};</script></html>', { status: 200 });
      }
      throw new Error('unexpected ' + u);
    };
    const tube = new TubeChat({ useSignaler: false });
    const res: any = await tube.downloadChat('NOVOD');
    assert.equal(res.completed, false);
    assert.equal(res.error.code, 'chat_not_found');
    assert.deepEqual(res.messages, []);
  });
  it('respects limit', async () => {
    let n = 0;
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('watch?v=')) return new Response(VOD_WATCH, { status: 200 });
      n++;
      return new Response(JSON.stringify({
        continuationContents: { liveChatContinuation: { continuations: [{ liveChatReplayContinuationData: { continuation: 'NEXT' + n } }], actions: [txt('R' + n, 'r' + n)] } },
      }), { status: 200 });
    };
    const tube = new TubeChat({ useSignaler: false });
    const res: any = await tube.downloadChat('VOD123', { limit: 2, delayMs: 0 });
    assert.equal(res.completed, true);
    assert.equal(res.messages.length, 2);
  });

  it('forwards the session cookie on watch + replay calls', async () => {
    const seen: Record<string, string> = {};
    (globalThis as any).fetch = async (url: any, init: any) => {
      const u = String(url);
      const headers = (init?.headers || {}) as Record<string, string>;
      if (u.includes('watch?v=')) {
        seen.watch = headers.cookie || headers.Cookie || '';
        return new Response(VOD_WATCH, { status: 200 });
      }
      seen.replay = headers.cookie || headers.Cookie || '';
      return new Response(JSON.stringify({
        continuationContents: { liveChatContinuation: { continuations: [], actions: [txt('R1', 'r1')] } },
      }), { status: 200 });
    };
    const tube = new TubeChat({ useSignaler: false, auth: { cookie: 'SID=a; SAPISID=b' } });
    const res: any = await tube.downloadChat('VOD123', { delayMs: 0 });
    assert.equal(res.completed, true);
    assert.ok(seen.watch.includes('SID=a'), 'watch carries cookie');
    assert.ok(seen.replay.includes('SID=a'), 'replay carries cookie');
  });

  it('breaks server continuation cycles instead of looping forever', async () => {
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      if (u.includes('watch?v=')) return new Response(VOD_WATCH, { status: 200 });
      return new Response(JSON.stringify({
        continuationContents: { liveChatContinuation: { continuations: [{ liveChatReplayContinuationData: { continuation: 'SAME' } }], actions: [txt('R1', 'r1')] } },
      }), { status: 200 });
    };
    const tube = new TubeChat({ useSignaler: false });
    const res: any = await tube.downloadChat('VOD123', { delayMs: 0 });
    assert.equal(res.completed, true);
    assert.ok(res.messages.length <= 2);
  });
});

/** VOD mock with a 2h duration. The decoy overlay wrapper (same `videoDetails`
 *  key, no lengthSeconds) comes FIRST, mirroring the real watch page. */
function vodWatchLong(): string {
  const start = 'var ytInitialData = ';
  const i = VOD_WATCH.indexOf(start);
  const j = VOD_WATCH.indexOf(';</script>', i);
  const init: any = JSON.parse(VOD_WATCH.slice(i + start.length, j));
  const long: any = { playerOverlayRenderer: { videoDetails: { playerOverlayVideoDetailsRenderer: {} } } };
  for (const [k, v] of Object.entries(init)) long[k] = v;
  long.videoDetails = { videoId: 'VOD123', lengthSeconds: '7200' };
  return VOD_WATCH.slice(0, i + start.length) + JSON.stringify(long) + VOD_WATCH.slice(j);
}
const VOD_WATCH_LONG = vodWatchLong();

describe('replay concurrency', () => {
  it('bootstrapReplayChat reads duration from ytInitialPlayerResponse', async () => {
    (globalThis as any).fetch = async () => new Response(
      VOD_WATCH.replace(
        ';</script></html>',
        ';</script><script>var ytInitialPlayerResponse = {"videoDetails":{"videoId":"VOD123","lengthSeconds":"33899"}};</script></html>',
      ),
      { status: 200 },
    );
    const res = await bootstrapReplayChat('VOD123');
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.bootstrap.durationSec, 33899);
  });
  it('splitRanges partitions duration into [startMs, endMs) ranges', () => {
    assert.deepEqual(splitRanges(7200000, 2), [
      { startMs: null, endMs: 3600000 },
      { startMs: 3600000, endMs: null },
    ]);
    assert.deepEqual(splitRanges(9000, 4), [
      { startMs: null, endMs: 2250 },
      { startMs: 2250, endMs: 4500 },
      { startMs: 4500, endMs: 6750 },
      { startMs: 6750, endMs: null },
    ]);
    assert.deepEqual(splitRanges(7200000, 1), [{ startMs: null, endMs: null }]);
    assert.deepEqual(splitRanges(0, 4), [{ startMs: null, endMs: null }]);
  });

  it('fetchReplayPage sends currentPlayerState only when an offset is given', async () => {
    const bodies: any[] = [];
    (globalThis as any).fetch = async (_url: any, init: any) => {
      bodies.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({
        continuationContents: { liveChatContinuation: { continuations: [], actions: [] } },
      }), { status: 200 });
    };
    const boot: ReplayBootstrap = {
      videoData: { videoId: 'V' } as any,
      clientName: 'WEB',
      clientVersion: '9.9',
      datasyncId: '',
      continuation: 'C',
    };
    await fetchReplayPage(boot, 'C', undefined, undefined, undefined, 3540000);
    await fetchReplayPage(boot, 'C');
    assert.equal(bodies[0].currentPlayerState.playerOffsetMs, '3540000');
    assert.equal(bodies[0].currentPlayerState.videoId, 'V');
    assert.equal('currentPlayerState' in bodies[1], false);
  });

  it('downloadChat({ concurrency }) seeks segments, dedups overlap and sorts', async () => {
    const wrap = (offsetMs: number, items: any[]) => ({
      replayChatItemAction: { videoOffsetTimeMsec: String(offsetMs), actions: items },
    });
    const offsets: (string | undefined)[] = [];
    (globalThis as any).fetch = async (url: any, init: any) => {
      const u = String(url);
      if (u.includes('watch?v=')) return new Response(VOD_WATCH_LONG, { status: 200 });
      const body = JSON.parse(String(init.body));
      offsets.push(body.currentPlayerState?.playerOffsetMs);
      const off = body.currentPlayerState?.playerOffsetMs !== undefined;
      const cont = body.continuation;
      let actions: any[] = [];
      let next: string | undefined;
      if (!off && cont === 'REPLAY0') {
        actions = [wrap(1000000, [txt('A', 'early', '@a', '1000000000')])]; // 1000s
        next = 'C0';
      } else if (!off && cont === 'C0') {
        actions = [wrap(3700000, [txt('B', 'late', '@a', '3700000000')])]; // 3700s (past segment end)
      } else if (off && cont === 'REPLAY0') {
        actions = [wrap(3700000, [txt('B', 'late', '@a', '3700000000')]), wrap(5000000, [txt('C', 'later', '@a', '5000000000')])];
      } else {
        throw new Error(`unexpected replay call cont=${cont} off=${off}`);
      }
      return new Response(JSON.stringify(replayPage(actions, next)), { status: 200 });
    };
    const tube = new TubeChat({ useSignaler: false });
    const res: any = await tube.downloadChat('VOD123', { delayMs: 0, concurrency: 2 });
    assert.equal(res.completed, true);
    // Worker 1 seeks to segment start minus the 60s overlap margin.
    assert.ok(offsets.includes('3540000'), `offsets seen: ${JSON.stringify(offsets)}`);
    // 3 unique messages (B seen by both workers, deduped), timestamp-sorted.
    assert.equal(res.messages.length, 3);
    assert.deepEqual(
      res.messages.map((m: any) => m.data.timestamp),
      [1000000, 3700000, 5000000],
    );
  });
});
