import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parseMembershipMonths } from '../src/parsers/parseBadges';
import { convertSymbolCurrencies } from '../src/parsers/utilsParser';
import { buildAuthorization, isLoggedOutResponse, parseCookieString, throwIfServerToast, ModActionError } from '../src/auth';

describe('currency parsing', () => {
  const cases: [string, string, number][] = [
    ['$5.00', 'usd', 5],
    ['$1,000.00', 'usd', 1000],
    ['R$ 5,00', 'brl', 5],
    ['R$ 1.000,00', 'brl', 1000],
    ['CA$ 10.00', 'cad', 10],
    ['¥1,000', 'jpy', 1000],
    ['€12.50', 'eur', 12.5],
  ];
  for (const [input, currency, value] of cases) {
    it(`${input} -> ${value} ${currency}`, () => {
      const r = convertSymbolCurrencies(input);
      assert.equal(r.currency, currency);
      assert.equal(r.value, value);
    });
  }
  it('returns NaN for garbage', () => {
    assert.ok(Number.isNaN(convertSymbolCurrencies('???').value));
  });
});

describe('membership months', () => {
  const cases: [string, number | undefined][] = [
    ['Member (6 months)', 6],
    ['Member (1 year)', 12],
    ['Member (2 years)', 24],
    ['New member', 1],
    ['New Member', 1],
    ['Membro há 2 anos', 24],
    ['Membro (3 meses)', 3],
    ['Moderator', undefined],
    ['', undefined],
  ];
  for (const [input, expected] of cases) {
    it(`${JSON.stringify(input)} -> ${expected}`, () => {
      assert.equal(parseMembershipMonths(input), expected);
    });
  }
});

describe('auth helpers', () => {
  it('parses cookie strings', () => {
    assert.deepEqual(parseCookieString('SID=abc; SAPISID=def;EMPTY=; SPACED = x y '), {
      SID: 'abc', SAPISID: 'def', EMPTY: '', SPACED: 'x y',
    });
    assert.deepEqual(parseCookieString(''), {});
    assert.deepEqual(parseCookieString('Cookie: SID=abc; SAPISID=def'), { SID: 'abc', SAPISID: 'def' });
    assert.deepEqual(parseCookieString('"SID=abc; SAPISID=def"'), { SID: 'abc', SAPISID: 'def' });
  });

  it('matches node:crypto for the _u scheme', () => {
    const cookies = { SAPISID: 'S1', '__Secure-1PAPISID': 'S2', '__Secure-3PAPISID': 'S3' };
    const h = buildAuthorization(cookies, 'D123', 999);
    const expected = (sid: string) => `999_${createHash('sha1').update(`D123 999 ${sid} https://www.youtube.com`).digest('hex')}_u`;
    const [s1, v1, s2, v2, s3, v3] = h.split(' ');
    assert.equal(s1, 'SAPISIDHASH');
    assert.equal(v1, expected('S1'));
    assert.equal(s2, 'SAPISID1PHASH');
    assert.equal(v2, expected('S2'));
    assert.equal(s3, 'SAPISID3PHASH');
    assert.equal(v3, expected('S3'));
    assert.ok(/^(\S+ \d+_[a-f0-9]{40}_u ?){3}$/.test(h.trim()));
  });

  it('skips missing cookie variants', () => {
    const h = buildAuthorization({ SAPISID: 'S1' }, 'D', 1);
    assert.ok(h.startsWith('SAPISIDHASH 1_'));
    assert.ok(!h.includes('1PHASH'));
  });

  it('detects logged-out responses', () => {
    assert.equal(isLoggedOutResponse({ mainAppWebResponseContext: { loggedOut: true } }), true);
    assert.equal(isLoggedOutResponse({ responseContext: { serviceTrackingParams: [{ service: 'GFEEDBACK', params: [{ key: 'logged_in', value: '0' }] }] } }), true);
    assert.equal(isLoggedOutResponse({ responseContext: { serviceTrackingParams: [{ service: 'GFEEDBACK', params: [{ key: 'logged_in', value: '1' }] }] } }), false);
    assert.equal(isLoggedOutResponse(null), false);
    assert.equal(isLoggedOutResponse({}), false);
  });

  it('surfaces server toasts as ModActionError', () => {
    const data = { actions: [{ liveChatAddToToastAction: { item: { notificationTextRenderer: { successResponseText: { runs: [{ text: 'You cannot moderate yourself.' }] } } } } }] };
    assert.throws(() => throwIfServerToast(data), (e: any) => e instanceof ModActionError && /yourself/.test(e.message));
    assert.doesNotThrow(() => throwIfServerToast({ actions: [] }));
    assert.doesNotThrow(() => throwIfServerToast(null));
  });
});
