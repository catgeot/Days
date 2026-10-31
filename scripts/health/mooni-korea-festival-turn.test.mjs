import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  extractMooniFestivalLocationQueryText,
  isImplicitMooniKoreaFestivalQuery,
  isMooniKoreaFestivalQueryText,
  mooniKoreaFestivalQueryConflictsOverseasBound,
  resolveMooniFestivalBoundPlaceNameForHint,
  shouldOmitMooniGeminiHistoryForKoreaFestivalTurn,
} from '../../src/pages/Home/lib/mooniKoreaFestivalTurn.js';
import {
  selectMooniKoreaFestivalCandidates,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import { resolveMooniResumeTrip } from '../../src/pages/Home/lib/mooniChatResume.js';
import { isStaleGeneralMooniTrip } from '../../src/pages/Home/lib/tripChatUtils.js';
import { MOONI_GENERAL_CHAT_MAX_AGE_MS } from '../../src/pages/Home/lib/mooniChatScope.js';

const parisBound = {
  slug: 'paris',
  name: '프랑스 파리',
  displayLabel: '프랑스 파리',
  country: 'France',
  country_en: 'France',
  lat: 48.8566,
  lng: 2.3522,
};

const NOW = new Date('2026-10-31T12:00:00+09:00');

const gangwonWeekItems = [
  {
    contentId: '900001',
    title: '나오라쇼 2026',
    addr1: '강원특별자치도 원주시',
    eventStartDate: '20261028',
    eventEndDate: '20261031',
  },
  {
    contentId: '900002',
    title: '춘천 마임축제',
    addr1: '강원특별자치도 춘천시',
    eventStartDate: '20261029',
    eventEndDate: '20261102',
  },
];

test('implicit festival query — 이번주 강원 (축제 생략·오타)', () => {
  assert.equal(isMooniKoreaFestivalQueryText('이번주 강원 제 추'), true);
  assert.equal(isImplicitMooniKoreaFestivalQuery('이번week 강원'), false);
  assert.equal(isMooniKoreaFestivalQueryText('이번주 강원 축제'), true);
});

test('Paris bound — 강원 location does not fall back to Paris', () => {
  const userText = '이번주 강원 축제';
  assert.equal(
    mooniKoreaFestivalQueryConflictsOverseasBound(userText, parisBound, '프랑스 파리'),
    true,
  );
  assert.equal(
    extractMooniFestivalLocationQueryText(userText, '프랑스 파리', parisBound),
    '강원',
  );
  assert.equal(
    resolveMooniFestivalBoundPlaceNameForHint(userText, '프랑스 파리', parisBound),
    '강원',
  );
  assert.equal(shouldOmitMooniGeminiHistoryForKoreaFestivalTurn(userText, parisBound, '프랑스 파리'), true);
});

test('Paris bound — 강원 week picks 2 GATEO candidates', () => {
  const { candidates } = selectMooniKoreaFestivalCandidates(gangwonWeekItems, {
    userText: '이번주 강원 축제',
    boundPlaceName: '프랑스 파리',
    boundSpot: parisBound,
    now: NOW,
  });
  assert.equal(candidates.length, 2, JSON.stringify(candidates.map((c) => c.title)));
});

test('stale general MOONi trip is not resumed', async () => {
  const staleAt = Date.now() - MOONI_GENERAL_CHAT_MAX_AGE_MS - 60_000;
  const trip = {
    id: 'trip-stale',
    destination: 'MOONi',
    is_hidden: false,
    messages: [{ role: 'user', text: '안녕', mooniAt: staleAt }],
  };
  assert.equal(isStaleGeneralMooniTrip(trip), true);
  const resumed = await resolveMooniResumeTrip({
    savedTrips: [trip],
    userId: null,
    scopeOrContext: 'general',
  });
  assert.equal(resumed, null);
});

test('general MOONi trip with unreadable date is stale (no resume)', async () => {
  const trip = {
    id: 'trip-no-date',
    destination: 'MOONi',
    is_hidden: false,
    messages: [{ role: 'user', text: '안녕' }],
    date: 'not-a-date',
  };
  assert.equal(isStaleGeneralMooniTrip(trip), true);
  const resumed = await resolveMooniResumeTrip({
    savedTrips: [trip],
    userId: null,
    scopeOrContext: 'general',
  });
  assert.equal(resumed, null);
});

test('mooniLastChatScopeInput — boundSpot save matches wrapped read scope', async () => {
  globalThis.__VITE_ENV__ = { VITE_GATEO_MOONI_SCOPED_FESTIVAL: '1' };
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

  const { persistMooniLastChatId, readMooniLastChatId, mooniLastChatScopeInput } =
    await import('../../src/pages/Home/lib/tripChatUtils.js');
  const parisSpot = { slug: 'paris', name: '프랑스 파리', displayLabel: '프랑스 파리' };
  persistMooniLastChatId('trip-paris-resume', null, { mooniPlaceContext: parisSpot });
  assert.equal(
    readMooniLastChatId(null, mooniLastChatScopeInput(parisSpot)),
    'trip-paris-resume',
  );
  delete globalThis.__VITE_ENV__;
});

test('fresh draft session id replaces last chat and skips resume', async () => {
  globalThis.__VITE_ENV__ = { VITE_GATEO_MOONI_SCOPED_FESTIVAL: '1' };
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

  const { persistMooniLastChatId, persistMooniFreshDraftSession, readMooniLastChatId } =
    await import('../../src/pages/Home/lib/tripChatUtils.js');
  const scopeCtx = { mooniPlaceContext: { slug: 'paris', name: '파리' } };
  const oldTrip = {
    id: 'trip-paris-old',
    destination: '파리',
    is_hidden: false,
    messages: [{ role: 'user', text: '이전 질문', mooniAt: Date.now() }],
  };
  persistMooniLastChatId('trip-paris-old', null, scopeCtx);
  persistMooniFreshDraftSession(null, scopeCtx);
  const lastId = readMooniLastChatId(null, scopeCtx);
  assert.match(String(lastId), /^draft_/);
  const resumed = await resolveMooniResumeTrip({
    savedTrips: [oldTrip],
    userId: null,
    scopeOrContext: scopeCtx,
  });
  assert.equal(resumed, null);
  delete globalThis.__VITE_ENV__;
});
