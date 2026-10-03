import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import EventEmitter from '../src/lib/EventEmitter';
import { Events, type EventName } from '../src/events';

const ALL_NAMES = [
  'message', 'superchat', 'subgift_announce', 'subgift', 'member', 'jewels',
  'donation', 'poll', 'notice', 'pinned', 'system', 'deletedMessage',
  'deleteUserMessages', 'cleared', 'dimmed', 'raw', 'error', 'join',
  'retry', 'joinError', 'disconnected', 'authExpired',
];

describe('Events const', () => {
  it('covers every event name exactly once', () => {
    const values = Object.values(Events);
    assert.equal(values.length, ALL_NAMES.length);
    assert.deepEqual([...values].sort(), [...ALL_NAMES].sort());
  });

  it('values are the plain strings (both styles interchangeable)', () => {
    assert.equal(Events.Message, 'message');
    assert.equal(Events.SubGiftAnnounce, 'subgift_announce');
    assert.equal(Events.DeleteUserMessages, 'deleteUserMessages');
    const n: EventName = Events.Poll;
    assert.equal(n, 'poll');
  });
});

describe('EventEmitter.once', () => {
  type M = { message: [text: string], ping: [] };
  it('fires once then auto-removes', () => {
    const em = new EventEmitter<M>();
    let n = 0;
    const ret = em.once('message', () => { n++; });
    assert.equal(ret, em, 'chainable');
    em.emit('message', 'a');
    em.emit('message', 'b');
    assert.equal(n, 1);
  });

  it('coexists with on() and off() still works', () => {
    const em = new EventEmitter<M>();
    let a = 0;
    let b = 0;
    const lb = () => { b++; };
    em.on('ping', lb);
    em.once('ping', () => { a++; });
    em.emit('ping');
    em.off('ping', lb);
    em.emit('ping');
    assert.deepEqual([a, b], [1, 1]);
  });
});
