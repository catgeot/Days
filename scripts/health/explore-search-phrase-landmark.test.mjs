import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveHubAttraction } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import { resolveExploreSearchAlias } from '../../src/pages/Home/lib/exploreSearchAliases.js';
import { parseKoreaRegionalExploreQuery } from '../../src/pages/Home/lib/exploreRegionalPlaceQuery.js';
import {
  buildCuratedEnterDisambiguation,
  buildLocalSearchSuggestions,
} from '../../src/pages/Home/lib/searchSuggestions.js';

const FORTRESS_QUERIES = ['수원 화성', '수원화성', '수원 화성 ', '수원  화성'];

function assertFortressFirst(list, query) {
  assert.ok(list?.length, `${query} has results`);
  assert.equal(list[0].name, '수원화성', query);
  assert.equal(list[0].slug, 'hwaseong-fortress', query);
  assert.equal(list[0].hubId, 'suwon', query);
}

test('수원 화성 / 수원화성 aliases resolve to the fortress name', () => {
  assert.equal(resolveExploreSearchAlias('수원 화성')?.canonical, '수원화성');
  assert.equal(resolveExploreSearchAlias('수원화성')?.canonical, '수원화성');
  assert.equal(resolveHubAttraction('수원 화성')?.attraction?.name, '수원화성');
  assert.equal(resolveHubAttraction('수원  화성')?.attraction?.name, '수원화성');
});

test('full-phrase fortress match is not split into the Hwaseong city token', () => {
  for (const query of FORTRESS_QUERIES) {
    assert.equal(parseKoreaRegionalExploreQuery(query), null, query);
  }
  assert.equal(parseKoreaRegionalExploreQuery('화성행궁'), null);
});

test('region + landmark queries still split', () => {
  assert.equal(parseKoreaRegionalExploreQuery('경주 불국사')?.placeQuery, '불국사');
  assert.equal(parseKoreaRegionalExploreQuery('경주 불국사')?.hub?.hubId, 'gyeongju');
  assert.equal(parseKoreaRegionalExploreQuery('강릉 경포대')?.placeQuery, '경포대');
  assert.equal(parseKoreaRegionalExploreQuery('강릉 경포대')?.hub?.hubId, 'gangneung');
  assert.equal(parseKoreaRegionalExploreQuery('부산 해운대')?.placeQuery, '해운대');
  assert.equal(parseKoreaRegionalExploreQuery('부산 해운대')?.hub?.hubId, 'busan');
  assert.equal(parseKoreaRegionalExploreQuery('제주 우도')?.placeQuery, '우도');
  assert.equal(parseKoreaRegionalExploreQuery('태안 안면암')?.placeQuery, '안면암');
});

test('Enter and local search put Suwon Hwaseong Fortress first', async () => {
  for (const query of FORTRESS_QUERIES) {
    const choice = await buildCuratedEnterDisambiguation(query);
    assert.equal(choice?.__disambiguation, true, query);
    assert.match(choice.title, /수원화성/, query);
    assert.doesNotMatch(choice.title, /도시와 명소를 골라주세요/, query);
    assertFortressFirst(choice.candidates, query);
    assertFortressFirst(buildLocalSearchSuggestions(query), query);
  }
});

test('plain 화성 keeps the city picker and includes the fortress', async () => {
  const choice = await buildCuratedEnterDisambiguation('화성');
  assert.match(choice.title, /'화성' → 도시와 명소를 골라주세요/);
  assert.equal(choice.candidates[0].name, '화성');
  assert.equal(choice.candidates[0].kind, 'city');
  assert.equal(choice.candidates[0].slug, 'hwaseong');
  const fortress = choice.candidates.find((item) => item.slug === 'hwaseong-fortress');
  assert.ok(fortress, 'Hwaseong Fortress is a choice');
  assert.equal(fortress.name, '수원화성');
  assert.equal(fortress.hubId, 'suwon');
  const local = buildLocalSearchSuggestions('화성');
  assert.equal(local[0].slug, 'hwaseong');
  assert.ok(local.some((item) => item.slug === 'hwaseong-fortress'));
});

test('화성행궁 stays the palace, not the city or the fortress', async () => {
  const choice = await buildCuratedEnterDisambiguation('화성행궁');
  assert.equal(choice.candidates[0].name, '화성행궁');
  assert.equal(choice.candidates[0].slug, 'hwaseong-haenggung');
  assert.equal(choice.candidates[0].hubId, 'suwon');
  assert.match(choice.title, /화성행궁/);
  assert.doesNotMatch(choice.title, /도시와 명소를 골라주세요/);
  const local = buildLocalSearchSuggestions('화성행궁');
  assert.equal(local[0].slug, 'suwon');
  assert.ok(local.some((item) => item.slug === 'hwaseong-haenggung'));
  assert.equal(local.find((item) => item.slug === 'hwaseong-haenggung').name, '화성행궁');
});

test('other region + landmark queries keep their landmark first', async () => {
  const cases = [
    ['경주 불국사', '불국사', 'bulguksa', 'gyeongju'],
    ['강릉 경포대', '경포대', 'gyeongpodae', 'gangneung'],
  ];
  for (const [query, name, slug, hubId] of cases) {
    const choice = await buildCuratedEnterDisambiguation(query);
    assert.equal(choice.candidates[0].name, name, query);
    assert.equal(choice.candidates[0].slug, slug, query);
    assert.equal(choice.candidates[0].hubId, hubId, query);
    const local = buildLocalSearchSuggestions(query);
    assert.equal(local[0].hubId, hubId, query);
    assert.ok(local.some((item) => item.slug === slug), query);
  }

  const haeundae = await buildCuratedEnterDisambiguation('부산 해운대');
  assert.match(haeundae.title, /'해운대' → 도시와 명소를 골라주세요/);
  assert.equal(haeundae.candidates[0].name, '해운대');
  assert.equal(haeundae.candidates[0].slug, 'haeundae');
  assert.equal(haeundae.candidates[0].hubId, 'haeundae');
  assert.equal(buildLocalSearchSuggestions('부산 해운대')[0].slug, 'haeundae');
});

test('spaced foreign homonyms are not pulled into a Korean city picker', async () => {
  const choice = await buildCuratedEnterDisambiguation('고성');
  const names = (choice?.candidates || []).map((item) => item.name);
  assert.ok(!names.some((name) => name.includes('리장')), names.join(','));
});
