import assert from 'node:assert/strict';
import {
  buildMooniKoreaFestivalSystemHint,
  buildMooniKoreaFestivalZeroCandidateUserReply,
  mergeMooniKoreaFestivalReply,
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

assert.equal(resolveMooniChatScope(null), 'general');
assert.equal(
  resolveMooniChatScope({ mooniPlaceContext: { slug: 'seoul', name: '서울' } }),
  'place:seoul',
);
assert.equal(
  resolveMooniChatScope({ mooniPlaceContext: { festivalContext: { contentId: '638576' } } }),
  'festival:638576',
);

withFlag(true, () => {
  mockStorage();
  persistMooniLastChatId('trip-seoul', null, { mooniPlaceContext: { slug: 'seoul' } });
  persistMooniLastChatId('trip-general', null, 'general');
  assert.equal(
    readMooniLastChatId(null, { mooniPlaceContext: { slug: 'seoul' } }),
    'trip-seoul',
  );
  assert.equal(readMooniLastChatId(null, 'general'), 'trip-general');
  assert.equal(readMooniLastChatId(null, { mooniPlaceContext: { slug: 'sokcho' } }), null);
});

withFlag(true, () => {
  mockStorage();
  const savedAt = Date.now() - MOONI_GENERAL_CHAT_MAX_AGE_MS - 1000;
  globalThis.sessionStorage.setItem(
    'gateo_mooni_last_chat_id:general',
    JSON.stringify({ id: 'stale-general', savedAt }),
  );
  assert.equal(readMooniLastChatId(null, 'general'), null);
  assert.equal(
    decodeMooniScopedLastChatEntry(
      JSON.stringify({ id: 'ok', savedAt: Date.now() }),
      'general',
    ),
    'ok',
  );
});

withFlag(true, () => {
  const NOW = new Date(2026, 9, 26, 12, 0, 0);
  const items = [
    {
      contentId: '1718491',
      title: '설악문화제',
      eventStartDate: '20261002',
      eventEndDate: '20261004',
      addr1: '강원특별자치도 속초시',
    },
    {
      contentId: '999001',
      title: '속초 미래축제',
      eventStartDate: '20261105',
      eventEndDate: '20261107',
      addr1: '강원특별자치도 속초시',
    },
  ];
  const { candidates } = selectMooniKoreaFestivalCandidates(items, {
    userText: '속초 이번주 축제',
    now: NOW,
  });
  assert.equal(
    candidates.some((c) => c.title.includes('설악')),
    false,
    '설악문화제 excluded for week 10.26–11.01',
  );

  const hint = buildMooniKoreaFestivalSystemHint({
    userText: '서울 이번주 축제',
    items: [],
    locale: 'ko',
    now: NOW,
  });
  assert.match(hint, /GATEO가 확인한 축제 중에는/);
  assert.match(hint, /실제로 갈 수 있는/);

  const merged = mergeMooniKoreaFestivalReply('모델이 지어낸 축제 답변', {
    candidates: [],
    userText: '서울 이번주 축제',
    locale: 'ko',
    now: NOW,
  });
  assert.match(merged, /gateo\.kr\/korea/);
  assert.doesNotMatch(merged, /모델이 지어낸/);

  const mergedEn = mergeMooniKoreaFestivalReply('Model reply', {
    candidates: [],
    userText: '서울 이번주 축제',
    locale: 'en',
    now: NOW,
  });
  assert.match(mergedEn, /GATEO has no verified festivals/i);
  assert.match(mergedEn, /gateo\.kr\/korea/i);
});

withFlag(false, () => {
  const NOW = new Date(2026, 9, 26, 12, 0, 0);
  const merged = mergeMooniKoreaFestivalReply('keep me', { candidates: [], userText: '서울 이번주 축제', now: NOW });
  assert.equal(merged, 'keep me');
});

withFlag(true, () => {
  const reply = buildMooniKoreaFestivalZeroCandidateUserReply({
    locale: 'ko',
    userText: '서울 이번주 축제',
    window: { label: '이번 주' },
    upcoming: [
      {
        title: '다가오는 축제',
        periodLabel: '11.5–11.7',
        url: 'https://www.gateo.kr/korea/?festival=1',
      },
    ],
  });
  assert.match(reply, /가까운 날짜/);
  assert.match(reply, /다가오는 축제/);
});

console.log('health/mooni-scoped-festival.test.mjs: OK');
