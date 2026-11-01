import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMapboxSearchQueries,
  exploreSearchAliasPinSuggestion,
  resolveExploreSearchAlias,
} from '../../src/pages/Home/lib/exploreSearchAliases.js';
import { buildHybridSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';

// TourAPI searchKeyword 공식 좌표 (2026-11 조회).
const OFFICIAL = {
  닭머르해안: [33.5368, 126.6174],
  형제섬: [33.208, 126.3092],
  수월봉: [33.2948, 126.1634],
  차귀도: [33.3116, 126.1485],
  추자도: [33.9518, 126.3076],
  용눈이오름: [33.4588, 126.832],
  안면암: [36.5593, 126.375],
};

const VARIANTS = [
  ['닭머르', '닭머르해안'],
  ['닭머르해안길', '닭머르해안'],
  ['Dakmeoru Coast', '닭머르해안'],
  ['Hyeongjeseom', '형제섬'],
  ['Suwolbong', '수월봉'],
  ['Chagwido', '차귀도'],
  ['Chujado', '추자도'],
  ['추자군도', '추자도'],
  ['용눈이', '용눈이오름'],
  ['용눈이 오름', '용눈이오름'],
  ['Yongnuni Oreum', '용눈이오름'],
  ['태안 안면암', '안면암'],
  ['Anmyeonam', '안면암'],
];

test('alias table carries official coords for 7 domestic scenic names', () => {
  for (const [name, [lat, lng]] of Object.entries(OFFICIAL)) {
    const alias = resolveExploreSearchAlias(name);
    assert.equal(alias?.canonical, name, name);
    assert.ok(Math.abs(alias.pin.lat - lat) < 0.001, `${name} lat`);
    assert.ok(Math.abs(alias.pin.lng - lng) < 0.001, `${name} lng`);
    assert.equal(alias.romanized, undefined, `${name} must not send Mapbox a romanized query`);
  }
});

test('spacing, short, and romanized variants resolve to the Korean canonical', () => {
  for (const [query, canonical] of VARIANTS) {
    assert.equal(resolveExploreSearchAlias(query)?.canonical, canonical, query);
    const compact = buildMapboxSearchQueries(query).map((q) => q.replace(/\s+/g, ''));
    assert.ok(compact.includes(canonical), `${query} mapbox queries`);
  }
});

test('alias pin row looks like a mapbox attraction row', () => {
  const row = exploreSearchAliasPinSuggestion('닭머르');
  assert.equal(row?.name, '닭머르해안');
  assert.equal(row.badge, '명소');
  assert.equal(row.country, '대한민국');
  assert.equal(row.parentCity, '제주시');
  assert.equal(row.uiPlace, true);
  assert.equal(exploreSearchAliasPinSuggestion('광천성굴'), null, 'hub alias has no pin');
  assert.equal(exploreSearchAliasPinSuggestion('없는지명'), null);
});

function stubFetch(routes) {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(typeof input === 'string' ? input : input?.url || '');
    for (const [needle, body] of routes) {
      if (url.includes(needle)) {
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
    }
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return () => {
    globalThis.fetch = original;
  };
}

test('hybrid search shows the alias row when Mapbox and place_stats are empty', async () => {
  const restore = stubFetch([['/rest/v1/place_stats', []]]);
  try {
    for (const [query, canonical] of [
      ['수월봉', '수월봉'],
      ['차귀도', '차귀도'],
      ['닭머르해안', '닭머르해안'],
      ['Chujado', '추자도'],
    ]) {
      const rows = await buildHybridSearchSuggestions(query);
      const hit = rows.find((row) => row.name === canonical);
      assert.ok(hit, `${query} → ${canonical} row`);
      assert.equal(hit.source, 'alias', query);
    }
  } finally {
    restore();
  }
});

test('a visited place_stats row with the same name wins over the alias row', async () => {
  const restore = stubFetch([
    [
      '/rest/v1/place_stats',
      [{ place_id: '형제섬', name_ko: '형제섬', name_en: null, lat: 33.2080147675, lng: 126.3092288523 }],
    ],
  ]);
  try {
    const rows = await buildHybridSearchSuggestions('형제섬');
    const same = rows.filter((row) => row.name === '형제섬');
    assert.equal(same.length, 1);
    assert.equal(same[0].source, 'visited');
  } finally {
    restore();
  }
});
