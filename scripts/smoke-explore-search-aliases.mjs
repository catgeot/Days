#!/usr/bin/env node
/**
 * 탐색창 검색 — 랑코(람코)·다카맀(다카마스) SSOT·별칭 스모크
 */
import assert from 'node:assert/strict';
import {
  resolveCityAttractionHub,
  resolveHubAttraction,
  matchCityAttractionHubsPrefix,
} from '../src/pages/Home/lib/cityAttractionHubs.js';
import {
  resolveExploreSearchAlias,
  buildMapboxSearchQueries,
} from '../src/pages/Home/lib/exploreSearchAliases.js';

const langCo = resolveHubAttraction('람코');
assert.ok(langCo, '람코 → 랑코 해변 attraction');
assert.equal(langCo.hub.hubId, 'danang');
assert.equal(langCo.attraction.name, '랑코 해변');

const langCoKo = resolveHubAttraction('랑코');
assert.ok(langCoKo, '랑코 exact');
assert.equal(langCoKo.attraction.name_en, 'Lang Co Beach');

const takamatsu = resolveCityAttractionHub('다카마스');
assert.ok(takamatsu, '다카마스 → 다카맀 hub');
assert.equal(takamatsu.hubId, 'takamatsu');
assert.equal(takamatsu.name_en, 'Takamatsu');

const takamatsuEn = resolveCityAttractionHub('takamatsu');
assert.ok(takamatsuEn, 'takamatsu exact hub');

const { hubs: takPrefix } = matchCityAttractionHubsPrefix('다카마', { limit: 4 });
assert.ok(
  takPrefix.some((h) => h.hubId === 'takamatsu'),
  '다카마 prefix → takamatsu hub',
);

const { attractions: langPrefix } = matchCityAttractionHubsPrefix('람코', { limit: 4 });
assert.ok(
  langPrefix.some((a) => a.attraction.name === '랑코 해변'),
  '람코 prefix → 랑코 해변',
);

for (const q of ['람코', '다카마스', 'takamatsu']) {
  const hubHit = resolveCityAttractionHub(q);
  const attractionHit = resolveHubAttraction(q);
  assert.ok(hubHit || attractionHit, `${q} resolves via hub/attraction SSOT`);
}

const alias = resolveExploreSearchAlias('다카마스');
assert.ok(alias?.romanized?.includes('Takamatsu'), '다카마스 romanized hint');

const mapboxQueries = buildMapboxSearchQueries('람코');
assert.ok(mapboxQueries.includes('랑코 해변'), '람코 mapbox queries include canonical');
assert.ok(
  mapboxQueries.some((q) => /lang co/i.test(q)),
  '람코 mapbox queries include romanized',
);

console.log('PASS explore-search-aliases (lang co + takamatsu)');
