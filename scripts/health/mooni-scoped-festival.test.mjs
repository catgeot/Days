import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMooniKoreaFestivalSystemHint,
  buildMooniKoreaFestivalZeroCandidateUserReply,
  GATEO_KOREA_FESTIVAL_BASE,
  mergeMooniKoreaFestivalReply,
  parseMooniFestivalTimeWindow,
  selectMooniKoreaFestivalCandidates,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import {
  MOONI_GENERAL_CHAT_MAX_AGE_MS,
  resolveMooniChatScope,
} from '../../src/pages/Home/lib/mooniChatScope.js';
import {
  decodeMooniScopedLastChatEntry,
  persistMooniLastChatId,
  readMooniLastChatId,
} from '../../src/pages/Home/lib/tripChatUtils.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const weekFixture = JSON.parse(
  readFileSync(join(root, 'scripts/data/mooni-scoped-festival-week-fixture.json'), 'utf8'),
);

const FLAG = 'VITE_GATEO_MOONI_SCOPED_FESTIVAL';

function withFlag(on, fn) {
  const prev = globalThis.__VITE_ENV__?.[FLAG];
  globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), [FLAG]: on ? '1' : '' };
  try {
    return fn();
  } finally {
    if (prev === undefined) delete globalThis.__VITE_ENV__[FLAG];
    else globalThis.__VITE_ENV__[FLAG] = prev;
  }
}

function mockStorage() {
  const session = new Map();
  const local = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => session.get(k) ?? null,
    setItem: (k, v) => session.set(k, v),
    removeItem: (k) => session.delete(k),
  };
  globalThis.localStorage = {
    getItem: (k) => local.get(k) ?? null,
    setItem: (k, v) => local.set(k, v),
    removeItem: (k) => local.delete(k),
  };
  return { session, local };
}

const NOW = new Date('2026-10-29T12:00:00+09:00');

assert.equal(resolveMooniChatScope(null), 'general');
assert.equal(
  resolveMooniChatScope({ mooniPlaceContext: { slug: 'seoul', name: '서울' } }),
  'place:seoul',
);

const mondayKst = parseMooniFestivalTimeWindow(
  '서울 이번주 축제',
  new Date('2026-10-26T00:10:00+09:00'),
);
assert.equal(mondayKst.startYmd, '20261026');
assert.equal(mondayKst.endYmd, '20261101');

withFlag(true, () => {
  mockStorage();
  persistMooniLastChatId('trip-seoul', null, { mooniPlaceContext: { slug: 'seoul' } });
  persistMooniLastChatId('trip-general', null, 'general');
  assert.equal(
    readMooniLastChatId(null, { mooniPlaceContext: { slug: 'seoul' } }),
    'trip-seoul',
  );
  assert.equal(readMooniLastChatId(null, 'general'), 'trip-general');
});

withFlag(true, () => {
  mockStorage();
  globalThis.sessionStorage.setItem('gateo_mooni_last_chat_id', 'legacy-trip-99');
  const migrated = readMooniLastChatId(null, 'general');
  assert.equal(migrated, 'legacy-trip-99');
  assert.equal(globalThis.sessionStorage.getItem('gateo_mooni_last_chat_id'), null);
  assert.ok(globalThis.sessionStorage.getItem('gateo_mooni_last_chat_id:general'));
});

withFlag(true, () => {
  mockStorage();
  const savedAt = Date.now() - MOONI_GENERAL_CHAT_MAX_AGE_MS - 1000;
  globalThis.sessionStorage.setItem(
    'gateo_mooni_last_chat_id:general',
    JSON.stringify({ id: 'stale-general', savedAt }),
  );
  assert.equal(readMooniLastChatId(null, 'general'), null);
});

withFlag(true, () => {
  const items = weekFixture.items;
  assert.ok(Array.isArray(items) && items.length >= 5);

  const seoulPick = selectMooniKoreaFestivalCandidates(items, {
    userText: '서울 이번주 축제',
    now: NOW,
  });
  assert.ok(seoulPick.candidates.length > 0, '서울 이번 주(10.26–11.01) 후보 > 0');

  const sokchoPick = selectMooniKoreaFestivalCandidates(items, {
    userText: '속초 이번주 축제',
    now: NOW,
  });
  assert.equal(sokchoPick.candidates.length, 0, '속초 이번 주 후보 0');
  assert.equal(
    sokchoPick.candidates.some((c) => String(c.title).includes('설악')),
    false,
    '설악문화제 excluded for week 10.26–11.01',
  );

  const hint = buildMooniKoreaFestivalSystemHint({
    userText: '속초 이번주 축제',
    items: [],
    locale: 'ko',
    now: NOW,
    scopedFestivalEnabled: true,
  });
  assert.match(hint, /속초와/);
  assert.doesNotMatch(hint, /속초과/);

  const merged = mergeMooniKoreaFestivalReply('모델이 지어낸 축제 답변', {
    candidates: [],
    userText: '속초 이번주 축제',
    locale: 'ko',
    now: NOW,
    scopedFestivalEnabled: true,
  });
  assert.match(merged, /https:\/\/www\.gateo\.kr\/korea\//);
  assert.doesNotMatch(merged, /모델이 지어낸/);

  const mergedEn = mergeMooniKoreaFestivalReply('Model reply', {
    candidates: [],
    userText: '서울 이번주 축제',
    locale: 'en',
    now: NOW,
    scopedFestivalEnabled: true,
  });
  assert.match(mergedEn, /GATEO has no verified festivals overlapping/i);
  assert.match(mergedEn, /https:\/\/www\.gateo\.kr\/korea\//);
});

withFlag(false, () => {
  const merged = mergeMooniKoreaFestivalReply('keep me', {
    candidates: [],
    userText: '서울 이번주 축제',
    now: NOW,
    scopedFestivalEnabled: false,
  });
  assert.equal(merged, 'keep me');
});

assert.equal(GATEO_KOREA_FESTIVAL_BASE, 'https://www.gateo.kr/korea/');
assert.match(
  buildMooniKoreaFestivalZeroCandidateUserReply({
    locale: 'ko',
    userText: '속초 이번주 축제',
    window: { label: '이번 주' },
  }),
  /https:\/\/www\.gateo\.kr\/korea\//,
);

console.log('health/mooni-scoped-festival.test.mjs: OK');
