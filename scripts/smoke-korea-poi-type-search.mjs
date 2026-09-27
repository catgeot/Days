#!/usr/bin/env node
/**
 * 향교·서원 검색 — 도시 prefix 스냅 금지 · TourAPI 다후보.
 * 네트워크 없음 (Tour 조회는 mock).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { matchCityAttractionHubsPrefix } from '../src/pages/Home/lib/cityAttractionHubs.js';
import {
  parseKoreaPoiTypeQuery,
  shouldExpandKoreaPoiTypeSearch,
  hubNameMatchesPrefixQuery,
  titleMatchesPoiType,
} from '../src/pages/Home/lib/koreaPoiTypeQuery.js';
import {
  collectKoreaPoiTypeSearchCandidates,
  tourAttractionToPoiSuggestion,
} from '../src/pages/Home/lib/koreaPoiTypeSearch.js';
import {
  SEARCH_DISAMBIGUATION_PAGE_SIZE,
  searchDisambiguationPageCount,
  sliceSearchDisambiguationPage,
} from '../src/pages/Home/lib/searchDisambiguationPaging.js';

const chuncheon = parseKoreaPoiTypeQuery('춘천 향교');
assert.equal(chuncheon?.type, '향교');
assert.equal(chuncheon?.cityPrefix, '춘천');
assert.equal(chuncheon?.isTypeOnly, false);
assert.equal(parseKoreaPoiTypeQuery('춘천향교')?.cityPrefix, '춘천');
assert.equal(parseKoreaPoiTypeQuery('향교')?.isTypeOnly, true);
assert.equal(shouldExpandKoreaPoiTypeSearch('향교'), true);
assert.equal(shouldExpandKoreaPoiTypeSearch('춘천 향교'), true);
assert.equal(shouldExpandKoreaPoiTypeSearch('목포'), false);
assert.equal(parseKoreaPoiTypeQuery('목포'), null);

assert.equal(hubNameMatchesPrefixQuery('춘천', '춘천'), true);
assert.equal(hubNameMatchesPrefixQuery('춘천', '춘'), true);
assert.equal(hubNameMatchesPrefixQuery('춘천', '춘천시'), true);
assert.equal(hubNameMatchesPrefixQuery('춘천', '춘천향교'), false);
assert.equal(titleMatchesPoiType('춘천향교', '향교'), true);
assert.equal(titleMatchesPoiType('향교골계곡', '향교'), false);

const { hubs } = matchCityAttractionHubsPrefix('춘천 향교', { limit: 8 });
assert.equal(
  hubs.some((h) => h.hubId === 'chuncheon'),
  false,
  'prefix matcher does not snap 춘천 향교 to city',
);
const { attractions: hyanggyoAttrs } = matchCityAttractionHubsPrefix('향교', { limit: 20 });
assert.ok(hyanggyoAttrs.some((a) => a.attraction.name === '나주향교'));
assert.equal(
  matchCityAttractionHubsPrefix('향교', { limit: 20 }).hubs.length,
  0,
  'type-only 향교 is not a city hub prefix',
);

const mocked = await collectKoreaPoiTypeSearchCandidates('춘천 향교', {
  lookupTourAttractions: async () => [
    {
      name: '춘천향교',
      title: '춘천향교',
      contentId: '125266',
      lat: 37.8813,
      lng: 127.7308,
      addr1: '강원특별자치도 춘천시 교동',
      firstImage: 'https://example.invalid/chuncheon-hyanggyo.jpg',
    },
    {
      name: '나주향교',
      title: '나주향교',
      contentId: '126412',
      lat: 35.03,
      lng: 126.71,
      addr1: '전라남도 나주시',
    },
  ],
});
assert.ok(
  mocked.some((item) => item.name === '춘천향교'),
  '춘천 향교 Tour 후보',
);
assert.equal(
  mocked.some((item) => item.name === '나주향교'),
  false,
  'city prefix drops other 향교',
);
assert.equal(
  mocked.some((item) => item.kind === 'city'),
  false,
  'POI type list has no city card',
);
assert.match(String(mocked.find((item) => item.name === '춘천향교')?.groupTitle || ''), /춘천/);

const typeOnly = await collectKoreaPoiTypeSearchCandidates('향교', {
  lookupTourAttractions: async () => [
    {
      name: '춘천향교',
      title: '춘천향교',
      contentId: '125266',
      lat: 37.8813,
      lng: 127.7308,
      addr1: '강원특별자치도 춘천시 교동',
    },
  ],
});
assert.ok(typeOnly.some((item) => item.name === '나주향교'), 'type-only keeps hub 나주향교');
assert.ok(typeOnly.some((item) => item.name === '춘천향교'), 'type-only adds Tour 춘천향교');
assert.ok(typeOnly.length >= 5, `type-only has more than curated four (${typeOnly.length})`);

const card = tourAttractionToPoiSuggestion({
  name: '춘천향교',
  contentId: '125266',
  lat: 37.8813,
  lng: 127.7308,
  addr1: '강원특별자치도 춘천시 교동',
});
assert.equal(card?.kind, 'attraction');
assert.equal(card?.parentCity, '춘천');
assert.equal(card?.hubId, 'chuncheon');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const handlerSrc = readFileSync(join(root, 'src/pages/Home/hooks/useHomeHandlers.js'), 'utf8');
assert.match(handlerSrc, /collectKoreaPoiTypeSearchCandidates/);
const curatedIdx = handlerSrc.indexOf('buildCuratedEnterDisambiguation');
const poiIdx = handlerSrc.indexOf('collectKoreaPoiTypeSearchCandidates');
const localIdx = handlerSrc.indexOf('buildLocalSearchSuggestions(query)');
assert.ok(poiIdx > curatedIdx && poiIdx < localIdx, 'POI type collect is after curated, before local city snap');
const geocodingSrc = readFileSync(join(root, 'src/pages/Home/lib/geocoding.js'), 'utf8');
assert.match(geocodingSrc, /사찰\|향교\|서원/);
const suggestionsSrc = readFileSync(join(root, 'src/pages/Home/lib/searchSuggestions.js'), 'utf8');
assert.match(suggestionsSrc, /if \(!poiType\) \{\s*for \(const hub of hubs\)/);
assert.match(suggestionsSrc, /shouldExpandKoreaPoiTypeSearch/);

assert.equal(SEARCH_DISAMBIGUATION_PAGE_SIZE, 10);
assert.equal(searchDisambiguationPageCount(1), 1);
assert.equal(searchDisambiguationPageCount(10), 1);
assert.equal(searchDisambiguationPageCount(11), 2);
assert.equal(searchDisambiguationPageCount(168), 17);
const paged = sliceSearchDisambiguationPage(
  Array.from({ length: 25 }, (_, i) => ({ name: `향교${i + 1}` })),
  3,
);
assert.equal(paged.totalPages, 3);
assert.equal(paged.page, 3);
assert.equal(paged.items.length, 5);
assert.equal(paged.items[0].name, '향교21');
assert.equal(sliceSearchDisambiguationPage(mocked, 1).totalPages, 1);

const cardsSrc = readFileSync(
  join(root, 'src/pages/Home/components/SearchDiscovery/SearchSuggestionList.jsx'),
  'utf8',
);
assert.match(cardsSrc, /sliceSearchDisambiguationPage/);
assert.match(cardsSrc, /DisambiguationPager/);
const modalSrc = readFileSync(
  join(root, 'src/pages/Home/components/SearchDiscoveryModal.jsx'),
  'utf8',
);
assert.match(modalSrc, /onPageChange/);

console.log('PASS smoke-korea-poi-type-search (춘천 향교 ≠ 춘천 · 향교 다후보 · 10개 페이지)');
