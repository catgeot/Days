import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMapboxSearchQueries,
  resolveExploreSearchAlias,
} from '../../src/pages/Home/lib/exploreSearchAliases.js';
import { KO_EXPLORE_SEARCH_ALIASES } from '../../src/pages/Home/lib/koreaPlaceMatchDictionary.js';
import { buildHybridSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';

const VARIANTS = [
  ['Hyeongjeseom', '형제섬'],
  ['Chujado', '추자도'],
  ['추자군도', '추자도'],
  ['용눈이', '용눈이오름'],
  ['Yongnuni Oreum', '용눈이오름'],
  ['태안 안면암', '안면암'],
  ['Anmyeonam', '안면암'],
];

test('spacing, short, and romanized variants resolve to the Korean canonical', () => {
  for (const [query, canonical] of VARIANTS) {
    assert.equal(resolveExploreSearchAlias(query)?.canonical, canonical, query);
    const compact = buildMapboxSearchQueries(query).map((q) => q.replace(/\s+/g, ''));
    assert.ok(compact.includes(canonical), `${query} mapbox queries`);
  }
});

test('alias table adds no places: no coords, no entries for names without a source', () => {
  for (const [key, value] of KO_EXPLORE_SEARCH_ALIASES) {
    assert.equal(value.pin, undefined, key);
    assert.equal(value.lat, undefined, key);
  }
  for (const name of ['닭머르해안', '수월봉', '차귀도']) {
    assert.equal(resolveExploreSearchAlias(name), null, name);
  }
});

function stubFetch() {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = decodeURIComponent(String(typeof input === 'string' ? input : input?.url || ''));
    const body =
      url.includes('/rest/v1/place_stats') && url.includes('추자도')
        ? [{ place_id: '추자도', name_ko: '추자도', name_en: null, lat: 33.95, lng: 126.31 }]
        : url.includes('/rest/v1/')
          ? []
          : {};
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return () => {
    globalThis.fetch = original;
  };
}

test('romanized query finds the visited place_stats row via the canonical name', async () => {
  const restore = stubFetch();
  try {
    const rows = await buildHybridSearchSuggestions('Chujado');
    const hit = rows.find((row) => row.name === '추자도');
    assert.ok(hit, 'Chujado → 추자도 visited row');
    assert.equal(hit.source, 'visited');
  } finally {
    restore();
  }
});
