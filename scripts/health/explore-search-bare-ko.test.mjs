import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseBareKoreaExploreScope,
  parseExploreSearchScope,
  filterRegionalExploreHits,
  applyRegionalHubLabels,
  effectiveExploreSearchQuery,
} from '../../src/pages/Home/lib/exploreRegionalPlaceQuery.js';
import { buildExploreSearchLocationLine } from '../../src/components/PlaceCard/common/locationDisplay.js';
import { resolveKoreaDestinationFirstPassSync } from '../../src/pages/Home/lib/resolveKoreaDestinationFirstPass.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import { buildLocalSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';
import { collectKoreaTourTitleSearchCandidates } from '../../src/pages/Home/lib/exploreKoreaTourTitleCandidates.js';

test('parseBareKoreaExploreScope — 우do → jeju anchor', () => {
  const scope = parseBareKoreaExploreScope('\uC6B0\uB3C4');
  assert.ok(scope);
  assert.equal(scope.placeQuery, '\uC6B0\uB3C4');
  assert.equal(scope.hub?.hubId, 'jeju');
  assert.equal(parseExploreSearchScope('\uC6B0\uB3C4')?.hub?.hubId, 'jeju');
  assert.equal(effectiveExploreSearchQuery('\uB2ED\uBA38\uB974'), '\uB2ED\uBA38\uB974\uD574\uC548');
});

test('filterRegionalExploreHits — bare 우do drops 가우도·우do믈랴', () => {
  const scope = parseBareKoreaExploreScope('\uC6B0\uB3C4');
  assert.ok(scope);
  const filtered = filterRegionalExploreHits(scope, [
    { name: '\uAC00\uC6B0\uB3C4', country: '\uB300\uD55C\uBBFC\uAD6D', lat: 34.52, lng: 126.59 },
    { name: 'Udomlya', country: 'Russia', lat: 57.87, lng: 35.01 },
    {
      name: '\uC6B0\uB3C4',
      country: '\uB300\uD55C\uBBFC\uAD6D',
      addr1: '\uC81C\uC8FC\uD2B9\uBCC4\uC790\uCE58\uB3C4 \uC81C\uC8FC\uC2DC \uC6B0\uB3C4\uBA74',
      lat: 33.506,
      lng: 126.953,
    },
  ]);
  assert.deepEqual(
    filtered.map((h) => h.name),
    ['\uC6B0\uB3C4'],
  );
});

test('sync first-pass — 우do·닭머르 resolve jeju hub attractions', () => {
  const udo = resolveKoreaDestinationFirstPassSync('\uC6B0\uB3C4');
  assert.equal(udo?.name, '\uC6B0\uB3C4');
  assert.equal(udo?.hubId, 'jeju');
  const dak = resolveKoreaDestinationFirstPassSync('\uB2ED\uBA38\uB974');
  assert.equal(dak?.name, '\uB2ED\uBA38\uB974\uD574\uC548');
  assert.equal(dak?.hubId, 'jeju');
});

test('buildCuratedEnterDisambiguation — hub exact 일치 시 Tour Enter lookup 미호출', async (t) => {
  const tourMod = await import('../../src/pages/Home/lib/exploreKoreaTourTitleCandidates.js');
  const tourCalls = [];
  tourMod.__testSetTourEnterCallLog(tourCalls);
  t.after(() => tourMod.__testResetTourEnterCallLog());
  const { buildCuratedEnterDisambiguation } = await import('../../src/pages/Home/lib/searchSuggestions.js');

  for (const city of ['\uC81C\uC8FC', '\uAC15\uB989']) {
    const hubChoice = await buildCuratedEnterDisambiguation(city);
    assert.ok(hubChoice?.__disambiguation, city);
    assert.ok(
      hubChoice.candidates.some(
        (c) =>
          c.hubId === (city === '\uC81C\uC8FC' ? 'jeju' : 'gangneung') ||
          c.slug === (city === '\uC81C\uC8FC' ? 'jeju' : 'gangneung'),
      ),
      city,
    );
  }
  assert.equal(tourCalls.length, 0, 'hub short-circuit — tour lookup must not run');
});

test('buildCuratedEnterDisambiguation — hub 없을 때 Tour Enter lookup 호출', async (t) => {
  const tourMod = await import('../../src/pages/Home/lib/exploreKoreaTourTitleCandidates.js');
  const tourCalls = [];
  tourMod.__testSetTourEnterCallLog(tourCalls);
  t.after(() => tourMod.__testResetTourEnterCallLog());
  const { buildCuratedEnterDisambiguation } = await import('../../src/pages/Home/lib/searchSuggestions.js');
  await buildCuratedEnterDisambiguation('\uACE0\uC0B0\uC0AC');
  assert.deepEqual(tourCalls, ['\uACE0\uC0B0\uC0AC']);
});

test('buildCuratedEnterDisambiguation — Tour title 분기는 hub·명소 분기 뒤(소스 순서)', async () => {
  const { readFile } = await import('node:fs/promises');
  const src = await readFile(new URL('../../src/pages/Home/lib/searchSuggestions.js', import.meta.url), 'utf8');
  const start = src.indexOf('export async function buildCuratedEnterDisambiguation');
  assert.ok(start >= 0);
  const body = src.slice(start);
  const tourAt = body.indexOf('buildKoreaTourTitleEnterDisambiguation');
  assert.ok(tourAt > 0);
  for (const needle of ['resolveExploreCityHubExact', 'resolveHubAttraction', 'resolveSettlement']) {
    const at = body.indexOf(needle);
    if (at >= 0) assert.ok(at < tourAt, needle);
  }
});

test('local suggestions — 우do exact row labeled 제주 first', () => {
  const rows = buildLocalSearchSuggestions('\uC6B0\uB3C4');
  assert.ok(rows.length >= 1);
  assert.equal(rows[0]?.name, '\uC6B0\uB3C4');
  const line = buildExploreSearchLocationLine(rows[0], 'ko');
  assert.match(line, /\uC81C\uC8FC/);
  assert.doesNotMatch(line, /\uC11C\uC6B8/);
});

test('tourapi search rows open /place even when slug overlaps catalog', () => {
  const decision = resolveSearchResultSelect({
    id: 'tour-1234567',
    name: '\uACE0\uC0B0\uC0AC',
    name_en: 'Gosansa Temple',
    lat: 36.6,
    lng: 126.66,
    slug: 'sejong',
    source: 'tourapi',
    contentId: '1234567',
    uiPlace: true,
    country: '\uB300\uD55C\uBBFC\uAD6D',
    country_en: 'South Korea',
  });
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'tour-1234567');
});

test('catalog contentId without tourapi source keeps county-safe home routing', () => {
  const decision = resolveSearchResultSelect({
    id: 'spot-jeju',
    name: '\uC81C\uC8FC',
    slug: 'jeju',
    source: 'ssot',
    contentId: '9999999',
    lat: 33.4996,
    lng: 126.5312,
    uiPlace: false,
  });
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'jeju');
});

test('collectKoreaTourTitleSearchCandidates — exact·suffix title filter (고산사 동명)', async () => {
  const rows = await collectKoreaTourTitleSearchCandidates('\uACE0\uC0B0\uC0AC', {
    lookupRows: async () => [
      {
        title: '\uACE0\uC0B0\uC0AC(\uD64D\uC131)',
        name: '\uACE0\uC0B0\uC0AC(\uD64D\uC131)',
        addr1: '\uCD98\uCCAD\uB0A8\uB3C4 \uD64D\uC131\uAD70',
        lat: 36.55,
        lng: 126.54,
        contentId: '125901',
      },
      {
        title: '\uACE0\uC0B0\uC0AC',
        name: '\uACE0\uC0B0\uC0AC',
        addr1: '\uCD98\uCCAD\uBCD1\uCC28\uB3C4 \uC81C\uCC9C\uC2DC',
        lat: 37.14,
        lng: 128.21,
        contentId: '111',
      },
      {
        title: '\uD64D\uC131 \uACE0\uC0B0\uC0AC \uB300\uC6C5\uC804',
        name: '\uD64D\uC131 \uACE0\uC0B0\uC0AC \uB300\uC6C5\uC804',
        addr1: '\uCD98\uCCAD\uB0A8\uB3C4 \uD64D\uC131\uAD70',
        lat: 36.6,
        lng: 126.66,
        contentId: '222',
      },
    ],
  });
  assert.equal(rows.length, 3);
  assert.ok(rows.some((r) => r.contentId === '125901'));
  assert.equal(rows[0]?.source, 'tourapi');
});
