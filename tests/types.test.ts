import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TubeChat, parse,
  AuthRequiredError, SessionExpiredError, ModActionError,
  parseCookieString, buildAuthorization,
  Events,
} from '../src/index';
import type {
  AuthConfig, ClientOptions, ConnectionEvents, OtherEvents, ClientEvents,
  Videos, VideoData, FetchChat, StartConnectionErrors,
  TUBECHAT, EventTypeMap, ParseResult, CookieMap,
} from '../src/index';

function expectType<T>(v: T): void {
  assert.ok(v !== undefined || true);
}

/** Compile-time assertions over the public API surface (checked by `npm run test:types`). */
describe('public type surface', () => {
  it('constructor accepts ClientOptions, setAuth accepts AuthConfig', () => {
    const opts: ClientOptions = { useSignaler: false, maxRetries: 2, auth: { cookie: 'SID=x' } };
    const tube = new TubeChat(opts);
    const cfg: AuthConfig = { cookie: 'SID=x' };
    tube.setAuth(cfg);
    const map: CookieMap = parseCookieString('A=1');
    expectType<CookieMap>(map);
    assert.ok(tube instanceof TubeChat);
    void buildAuthorization;
  });

  it('events carry typed payloads', () => {
    const tube = new TubeChat({ useSignaler: false });
    tube.on('message', (msg, chatId, userChannel, videoData) => {
      expectType<TUBECHAT.Msg_Common>(msg);
      expectType<string>(chatId + userChannel + videoData.title);
      expectType<TUBECHAT.ModerationParams | undefined>(msg.moderation);
    });
    tube.on('superchat', (msg) => expectType<number>(msg.amount));
    tube.on('poll', (poll) => {
      expectType<string>(poll.question);
      expectType<string | undefined>(poll.choices[0]?.params);
    });
    tube.on('pinned', (msg) => expectType<string | undefined>(msg.pinnedBy));
    tube.on('notice', (n) => expectType<string>(n.message));
    tube.on('member', (m) => expectType<boolean>(m.isResub));
    tube.on('jewels', (j) => expectType<string>(j.content));
    tube.on('subgift', (s) => expectType<string>(s.gifter));
    tube.on('subgift_announce', (s) => expectType<number>(s.count));
    tube.on('system', (s) => expectType<TUBECHAT.SYSTEM.ChatMode>(s));
    tube.on('deletedMessage', (id) => expectType<string>(id));
    tube.on('deleteUserMessages', (cid) => expectType<string>(cid));
    tube.on('raw', (action) => expectType<any>(action));
    tube.on('join', (_id, _user, vd) => expectType<VideoData>(vd));
    const v = {} as Videos;
    const fc: () => FetchChat = v.fetchChat;
    const se: StartConnectionErrors = null as any;
    const ce: ConnectionEvents = null as any;
    const oe: OtherEvents = null as any;
    const all: ClientEvents = null as any;
    const etm: EventTypeMap['poll'] = null as any;
    expectType<() => FetchChat>(fc);
    const checkSe = () => expectType<string>(se.code);
    void checkSe;
    void [ce, oe, all, etm];
  });

  it('methods and parse have typed signatures', async () => {
    const tube = new TubeChat({ useSignaler: false, auth: { cookie: 'x' } });
    // Type-only: never invoked at runtime (would hit network/auth).
    const calls = () => {
      expectType<Promise<{ id: string }>>(tube.say('V', 'hi'));
      expectType<Promise<any[]>>(tube.getMenu('V', 'params'));
      expectType<Promise<true>>(tube.checkAuth('V'));
      const r: ParseResult | null = parse({});
      expectType<ParseResult | null>(r);
    };
    void calls;
    expectType<AuthRequiredError>(new AuthRequiredError('x'));
    expectType<SessionExpiredError>(new SessionExpiredError());
    expectType<ModActionError>(new ModActionError('x'));
  });

  it('event payloads infer reply() without manual annotations', () => {    const tube = new TubeChat({ useSignaler: false });
    const ownIds = new Set<string>();
    // NOTE: no param annotations below — inference must carry everything.
    tube.on('message', (m) => {
      if (m.isOwn || ownIds.has(m.id)) return;
      expectType<string>(m.author.channelName);
      expectType<string>(m.chatId);
      const run = () => m.reply(`hi ${m.author.channelName}`, { mention: false });
      void run;
    });
    tube.on('member', (m) => {
      const run = () => m.reply('welcome!');
      void run;
    });
  });

  it('Events const and once() keep full inference', () => {
    const tube = new TubeChat({ useSignaler: false });
    tube.once(Events.Join, (chatId) => {
      expectType<string>(chatId);
    });
    tube.on(Events.Poll, (poll) => {
      expectType<string>(poll.question);
    });
    tube.once(Events.Message, (m) => {
      const run = () => m.reply('hi');
      void run;
    });
  });
});
