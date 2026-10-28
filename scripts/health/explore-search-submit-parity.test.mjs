import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoExploreSearchSubmitParityEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import {
  mergeHubAliasSuggestions,
  normalizeSearchSuggestions,
  resolveSearchSuggestionGroup,
  suggestionDedupeKey,
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
  const cityBefore = raw.filter((row) => resolveSearchSuggestionGroup(row) === 'city');
  const destBefore = raw.filter((row) => resolveSearchSuggestionGroup(row) === 'destination');
  assert.ok(cityBefore.length >= 1);
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
  assert.match(String(hubCity.searchOverlayDesc || ''), /빈/);
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

test('normalizeSearchSuggestions orders festivals before attractions', () => {
  const fest = {
    id: 'fest-2',
    name: '빈티지 페스티벌',
    kind: 'festival',
    source: 'korea-festival',
    lat: 37.5,
    lng: 127.0,
  };
  const hub = hubToSuggestion(resolveCityAttractionHub('vienna'));
  const attraction = {
    id: 'hub-attr-vienna-test',
    kind: 'attraction',
    badge: '명소',
    name: '테스트 명소',
    hubId: 'vienna',
    lat: 48.2,
    lng: 16.3,
  };
  const normalized = normalizeSearchSuggestions('빈', [attraction, fest, hub]);
  const groups = normalized.map((row) => row.suggestionGroup);
  assert.ok(groups.indexOf('festival') < groups.indexOf('attraction'));
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
  assert.equal(suggestionDedupeKey(merged[0]), suggestionDedupeKey(hubToSuggestion(hub)));
});
