import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildLocalSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';

function placeRow(query, name) {
  const items = buildLocalSearchSuggestions(query);
  const hit = items.find((item) => item?.name === name);
  assert.ok(hit, `${query} suggestion missing ${name}`);
  return hit;
}

test('overseas home search rows open /place/<slug>', () => {
  const cases = [
    ['사파', '사파', 'sapa'],
    ['Sapa', '사파', 'sapa'],
    ['카이로', '카이로', 'cairo'],
    ['Cairo', '카이로', 'cairo'],
  ];
  for (const [query, name, slug] of cases) {
    const decision = resolveSearchResultSelect(placeRow(query, name));
    assert.equal(decision?.type, 'place', query);
    assert.equal(decision?.param, slug, query);
  }
});

test('domestic home search rows still resolve a stable place slug', () => {
  const cases = [
    ['속초', '속초', 'sokcho'],
    ['제주', '제주', 'jeju'],
  ];
  for (const [query, name, slug] of cases) {
    const decision = resolveSearchResultSelect(placeRow(query, name));
    assert.equal(decision?.type, 'place', query);
    assert.equal(decision?.param, slug, query);
  }
});

test('coord-only search pins stay on the home summary', () => {
  const decision = resolveSearchResultSelect({
    name: '이름없는 핀',
    lat: 10.5,
    lng: 20.25,
    slug: 'search-10.5-20.25',
    id: 'search-10.5-20.25',
    uiPlace: true,
  });
  assert.equal(decision?.type, 'home');
});

test('missing coords do not navigate', () => {
  assert.equal(resolveSearchResultSelect({ name: '사파', slug: 'sapa' }), null);
  assert.equal(resolveSearchResultSelect(null), null);
});

test('search result click handler uses resolveSearchResultSelect', () => {
  const src = fs.readFileSync(
    new URL('../../src/pages/Home/index.jsx', import.meta.url),
    'utf8',
  );
  assert.match(src, /resolveSearchResultSelect\(spot\)/);
  assert.match(src, /decision\.type === 'place'/);
  assert.match(src, /navigateToPlace\(decision\.spot\)/);
});
