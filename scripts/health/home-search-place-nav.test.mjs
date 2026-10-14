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

test('mapbox and geocode hits stay on the home summary', () => {
  const hallstatt = resolveSearchResultSelect({
    id: 'mapbox-dXJuOm1ieHBsYzphYWxsc3RhdHQ',
    name: 'Hallstatt',
    name_en: 'Hallstatt',
    slug: 'hallstatt',
    lat: 47.5622,
    lng: 13.6493,
    source: 'mapbox',
    uiPlace: true,
  });
  assert.equal(hallstatt?.type, 'home');

  const see = resolveSearchResultSelect({
    id: 'geocode-place.hallstattersee',
    name: 'Hallstätter See',
    name_en: 'Hallstätter See',
    slug: 'hallstatter-see',
    lat: 47.55,
    lng: 13.65,
    source: 'mapbox-geocode',
    uiPlace: true,
  });
  assert.equal(see?.type, 'home');

  const nameDerived = resolveSearchResultSelect({
    id: 'mapbox-hallstatt-unnamed-slug',
    name: 'Hallstatt',
    name_en: 'Hallstatt',
    lat: 47.5622,
    lng: 13.6493,
    source: 'mapbox',
    uiPlace: true,
  });
  assert.equal(nameDerived?.type, 'home');
});

test('mapbox id does not reuse a catalog slug', () => {
  const decision = resolveSearchResultSelect({
    id: 'mapbox-sapa-poi',
    name: 'Sapa',
    name_en: 'Sapa',
    slug: 'sapa',
    lat: 22.3364,
    lng: 103.8438,
    source: 'mapbox',
    uiPlace: true,
  });
  assert.equal(decision?.type, 'home');
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
