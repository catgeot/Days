import assert from 'node:assert/strict';
import test from 'node:test';

import { GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';
import { resolveExploreSearchAlias } from '../../src/pages/Home/lib/exploreSearchAliases.js';
import { resolveExploreAliasTourPlaceParam } from '../../src/pages/Home/lib/koreaPlaceMatchDictionary.js';
import {
  resolveSiteSearchEnterSinglePoi,
  siteSearchExploreEnterCommit,
} from '../../src/pages/Home/lib/siteSearchOpen.js';
import { resolveHubAttraction, attractionToPlacePin } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  firstPassHitToUiPlace,
  resolveKoreaDestinationFirstPassSync,
} from '../../src/pages/Home/lib/resolveKoreaDestinationFirstPass.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import { normalizeExploreSelectionPin } from '../../src/pages/Home/lib/explorePlaceNav.js';
import { buildLocalSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';
import { rankSiteSearchExploreCandidates } from '../../src/pages/Home/lib/siteSearchOpen.js';
import {
  pickSeaBasinCurationSpot,
  resolveSeaBasinFromQuery,
} from '../../src/pages/Home/lib/seaBasinResolve.js';
import { LIVE_JEJU_DO_VISITED_CANDIDATE } from './explore-live-jeju-visited-pyongyang.test.mjs';
import { resolvePlaceTargetFromSlug } from '../../src/pages/Home/lib/placeRouteHydrate.js';
import { collectKoreaTourTitleSearchCandidates } from '../../src/pages/Home/lib/exploreKoreaTourTitleCandidates.js';

function withSiteSearchFlag(enabled, fn) {
  const key = GATEO_ENV_FLAG_NAMES.SITE_SEARCH;
  const prev = globalThis.__VITE_ENV__[key];
  globalThis.__VITE_ENV__[key] = enabled ? '1' : '';
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__[key] = prev;
  }
}

for (const query of ['한라산 백록담', '백록담', '화구벽']) {
  test(`${query} alias → tour-127635`, () => {
    assert.equal(resolveExploreSearchAlias(query)?.canonical, '한라산국립공원');
    assert.equal(resolveExploreSearchAlias(query)?.contentId, '127635');
    assert.equal(resolveExploreAliasTourPlaceParam(query), 'tour-127635');
    const hit = resolveKoreaDestinationFirstPassSync(query);
    assert.equal(hit?.contentId, '127635');
    assert.equal(hit?.source, 'tourapi');
    const pin = normalizeExploreSelectionPin(firstPassHitToUiPlace(hit, query));
    const decision = resolveSearchResultSelect(pin);
    assert.equal(decision?.type, 'place');
    assert.equal(decision?.param, 'tour-127635');
    const enter = siteSearchExploreEnterCommit(pin);
    assert.equal(enter.mode, 'place');
    assert.equal(enter.param, 'tour-127635');
  });
}

test('백록담 — 허브 scenic 핀(originalQuery)도 tour-127635', () => {
  const match = resolveHubAttraction('한라산국립공원');
  const hubPin = {
    ...attractionToPlacePin(match.hub, match.attraction),
    originalQuery: '백록담',
  };
  const decision = resolveSearchResultSelect(hubPin);
  assert.equal(decision?.param, 'tour-127635');
});

test('한라산 단독 — 허브 hallasan-national-park 유지', () => {
  const match = resolveHubAttraction('한라산국립공원');
  const hubPin = { ...attractionToPlacePin(match.hub, match.attraction), originalQuery: '한라산' };
  assert.equal(resolveExploreAliasTourPlaceParam('한라산'), '');
  assert.equal(
    resolveSearchResultSelect(normalizeExploreSelectionPin(hubPin))?.param,
    'hallasan-national-park',
  );
});

test('백록담 — site search Enter는 허브 후보 무시하고 tour 우선', () => {
  withSiteSearchFlag(true, () => {
    const match = resolveHubAttraction('한라산국립공원');
    const hubOnly = [attractionToPlacePin(match.hub, match.attraction)];
    const picked = resolveSiteSearchEnterSinglePoi('백록담', hubOnly);
    assert.equal(picked?.source, 'tourapi');
    assert.equal(normalizeExploreSelectionPin(picked).slug, 'tour-127635');
  });
});

test('개심사 — 서산 gaesimsa가 괴산 Tour보다 먼저', () => {
  withSiteSearchFlag(true, () => {
    const rows = rankSiteSearchExploreCandidates('개심사', [
      {
        name: '개심사',
        slug: 'tour-999001',
        contentId: '999001',
        source: 'tourapi',
        addr1: '충청북도 괴산군',
        parentCity: '괴산',
        lat: 36.8,
        lng: 127.79,
        uiPlace: true,
      },
      {
        name: '개심사',
        slug: 'gaesimsa',
        hubId: 'seosan',
        contentId: '125908',
        source: 'hub',
        parentCity: '서산',
        lat: 36.7468958,
        lng: 126.5902297,
        uiPlace: true,
      },
    ]);
    assert.equal(rows[0]?.slug, 'gaesimsa');
    assert.match(String(rows[0]?.parentCity || ''), /서산/);
  });
});

test('평양시 Mapbox — /place/pyongyang (홈 지구본만 금지)', () => {
  const pin = normalizeExploreSelectionPin({
    id: 'mapbox-pyongyang',
    name: '평양',
    name_en: 'Pyongyang',
    name_ko: '평양시',
    lat: 39.0392,
    lng: 125.7625,
    source: 'mapbox',
    country: '북한',
    country_en: 'North Korea',
    uiPlace: true,
  });
  const decision = resolveSearchResultSelect(pin);
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'pyongyang');
});

test('/place/pyongyang 직접 URL — resolvePlaceTargetFromSlug hydrate', () => {
  const target = resolvePlaceTargetFromSlug('pyongyang');
  assert.ok(target, 'pyongyang slug');
  assert.equal(target.slug, 'pyongyang');
  assert.match(String(target.name || ''), /평양/);
  assert.equal(Number(target.lat).toFixed(4), '39.0392');
  assert.equal(Number(target.lng).toFixed(4), '125.7625');
});

test('회귀 — 제주특별자치도 visited → /place/jeju', () => {
  assert.equal(resolveSearchResultSelect(LIVE_JEJU_DO_VISITED_CANDIDATE)?.param, 'jeju');
});

test('회귀 — 평양 해역 오탐 없음 · 남태평양 유지', () => {
  assert.equal(resolveSeaBasinFromQuery('평양'), null);
  assert.equal(pickSeaBasinCurationSpot('평양'), null);
  assert.equal(resolveSeaBasinFromQuery('남태평양')?.basin?.id, 'south-pacific');
});

test('회귀 — 대서양 north-atlantic', () => {
  assert.equal(resolveSeaBasinFromQuery('대서양')?.basin?.id, 'north-atlantic');
});

test('회귀 — 경기도 visited 홈 유지', () => {
  const pin = {
    ...LIVE_JEJU_DO_VISITED_CANDIDATE,
    id: 'visited-gyeonggi-do',
    slug: 'gyeonggi-do',
    name: '경기도',
    name_ko: '경기도',
    name_en: 'Gyeonggi-do',
    lat: 37.4138,
    lng: 127.5183,
  };
  assert.equal(resolveSearchResultSelect(pin)?.type, 'home');
});

test('회귀 — 우do local 첫 행 제주 라벨', async () => {
  const rows = buildLocalSearchSuggestions('우도');
  assert.ok(rows.length >= 1);
  assert.equal(rows[0]?.name, '우도');
  assert.equal(rows[0]?.hubId, 'jeju');
});

test('회귀 — 고산사(홍성) Tour 125901', async () => {
  const rows = await collectKoreaTourTitleSearchCandidates('고산사(홍성)', {
    lookupRows: async () => [
      {
        title: '고산사(홍성)',
        name: '고산사(홍성)',
        contentId: '125901',
        lat: 36.545,
        lng: 126.537,
        addr1: '충청남도 홍성군',
      },
      {
        title: '고산사(장흥)',
        name: '고산사(장흥)',
        contentId: '127937',
        lat: 34.64,
        lng: 126.78,
        addr1: '전라남도 장흥군',
      },
    ],
  });
  assert.equal(rows[0]?.contentId, '125901');
});
