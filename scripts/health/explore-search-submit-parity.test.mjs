import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoExploreSearchSubmitParityEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import { buildHybridSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';
import { runExploreHybridSuggestUpdate } from '../../src/pages/Home/lib/exploreHybridSuggestUpdate.js';
import {
  mergeHubAliasSuggestions,
  normalizeSearchSuggestions,
  resolveSearchSuggestionGroup,
} from '../../src/pages/Home/lib/normalizeSearchSuggestions.js';
import { buildLocalSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';
import { pickEnterSuggestionMatches } from '../../src/pages/Home/lib/searchEnterMatch.js';
import { hubToSuggestion } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import { resolveCityAttractionHub } from '../../src/pages/Home/lib/cityAttractionHubs.js';

function withSubmitParityFlag(enabled, fn) {
  const key = GATEO_ENV_FLAG_NAMES.EXPLORE_SEARCH_SUBMIT_PARITY;
  const prev = globalThis.__VITE_ENV__[key];
  globalThis.__VITE_ENV__[key] = enabled ? '1' : '';
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__[key] = prev;
  }
}

test('VITE_GATEO_EXPLORE_SEARCH_SUBMIT_PARITY defaults off', () => {
  withSubmitParityFlag(false, () => {
    assert.equal(isGateoExploreSearchSubmitParityEnabled(), false);
  });
  withSubmitParityFlag(true, () => {
    assert.equal(isGateoExploreSearchSubmitParityEnabled(), true);
  });
});

test('normalizeSearchSuggestions — vienna alias «빈» merges destination + city', () => {
  const hub = resolveCityAttractionHub('vienna');
  assert.ok(hub);
  const raw = buildLocalSearchSuggestions('빈');
  const destBefore = raw.filter((row) => resolveSearchSuggestionGroup(row) === 'destination');
  assert.ok(destBefore.length >= 1);

  const normalized = normalizeSearchSuggestions('빈', raw);
  const hubCity = normalized.find((row) => row.id === 'hub-vienna');
  assert.ok(hubCity);
  assert.equal(
    normalized.some(
      (row) => row.id === 'spot-vienna' && resolveSearchSuggestionGroup(row) === 'destination',
    ),
    false,
  );
  assert.equal(hubCity.searchOverlayDesc, '빈');
});

test('hub exact «빈» drops weak substring festivals and puts Vienna city first', () => {
  const hub = hubToSuggestion(resolveCityAttractionHub('vienna'));
  const weakFest = {
    id: 'fest-vintage',
    name: '오슬로우 빈티지 크리스마스 마켓',
    kind: 'festival',
    source: 'korea-festival',
    lat: 37.5,
    lng: 127.0,
  };
  const strongFest = {
    id: 'fest-sancheoneo',
    name: '화천산천어축제',
    kind: 'festival',
    source: 'korea-festival',
    lat: 38.1,
    lng: 127.7,
  };
  const attraction = {
    id: 'hub-attr-vienna-test',
    kind: 'attraction',
    badge: '명소',
    name: '쇤브룬 궁전',
    hubId: 'vienna',
    lat: 48.2,
    lng: 16.3,
  };
  const normalized = normalizeSearchSuggestions('빈', [weakFest, strongFest, attraction, hub], {
    hub: resolveCityAttractionHub('vienna'),
  });
  assert.equal(normalized[0]?.id, 'hub-vienna');
  assert.equal(normalized.some((row) => row.id === 'fest-vintage'), false);
  assert.equal(normalized.some((row) => row.id === 'fest-sancheoneo'), false);
  const attrIdx = normalized.findIndex((row) => row.id === 'hub-attr-vienna-test');
  assert.ok(attrIdx > 0);
});

test('«산천어» keeps festival matches and lists them before generic cities', () => {
  const fest = {
    id: 'fest-sancheoneo',
    name: '화천산천어축제',
    kind: 'festival',
    source: 'korea-festival',
    lat: 38.1,
    lng: 127.7,
  };
  const city = {
    id: 'city-other',
    kind: 'city',
    badge: '도시',
    name: '기타',
    lat: 37,
    lng: 127,
  };
  const normalized = normalizeSearchSuggestions('산천어', [city, fest]);
  assert.ok(normalized.some((row) => row.id === 'fest-sancheoneo'));
  assert.ok(
    normalized.findIndex((row) => row.id === 'fest-sancheoneo') <
      normalized.findIndex((row) => row.id === 'city-other'),
  );
});

test('pickEnterSuggestionMatches still drops festivals from auto-nav', () => {
  const fest = {
    id: 'fest-1',
    name: '빈티지 마켓',
    kind: 'festival',
    source: 'korea-festival',
    lat: 37.5,
    lng: 127.0,
  };
  const place = hubToSuggestion(resolveCityAttractionHub('vienna'));
  const matches = pickEnterSuggestionMatches('비엔나', [fest, place]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].hubId, 'vienna');
});

test('mergeHubAliasSuggestions fixture — single canonical hub row', () => {
  const hub = resolveCityAttractionHub('vienna');
  const merged = mergeHubAliasSuggestions([
    hubToSuggestion(hub),
    {
      id: 'spot-vienna',
      kind: 'spot',
      badge: '여행지',
      name: '빈',
      name_en: 'Vienna',
      slug: 'vienna',
      lat: 48.2,
      lng: 16.3,
      source: 'ssot',
    },
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].searchOverlayDesc, '빈');
});

async function hybridPaintIds(query, parityOn) {
  /** @type {object[][]} */
  const painted = [];
  await runExploreHybridSuggestUpdate(
    query,
    1,
    () => 1,
    { onPaint: (items) => painted.push(items) },
    {
      isSiteSearchEnabled: () => false,
      isSubmitParityEnabled: () => parityOn,
      buildHybrid: (q) => buildHybridSearchSuggestions(q),
    },
  );
  return painted[0]?.map((row) => row.id) ?? [];
}

test('autocomplete paint flag OFF matches main raw hybrid order (빈 · 방콕)', async () => {
  for (const query of ['빈', '방콕']) {
    const rawIds = (await buildHybridSearchSuggestions(query)).map((row) => row.id);
    const paintedIds = await hybridPaintIds(query, false);
    assert.deepEqual(
      paintedIds,
      rawIds,
      `flag OFF paint must match main hybrid for «${query}»`,
    );
  }
});

test('autocomplete paint flag ON applies normalize (빈 hub city before spot-vienna)', async () => {
  const paintedIds = await hybridPaintIds('빈', true);
  assert.equal(paintedIds[0], 'hub-vienna');
  assert.equal(paintedIds.includes('spot-vienna'), false);
});
