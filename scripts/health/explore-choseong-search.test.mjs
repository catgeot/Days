import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hangulChoseong } from '../../src/utils/hangulSearch.js';
import { isGateoExploreChoseongEnabled } from '../../src/shared/gateoFeatureFlags.js';
import {
  appendChoseongSuggestions,
  exploreChoseongIndexBuildCount,
  exploreTextIncludes,
  matchChoseongCatalog,
  matchExploreChoseongSuggestions,
  resetExploreChoseongIndexForTests,
} from '../../src/pages/Home/lib/exploreChoseongMatch.js';
import { buildLocalSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';
import { resolveExploreSearchRepresentativeThumbUrl } from '../../src/pages/Home/lib/placeSeoOg.js';
import { hubToSuggestion } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import { resolveCityAttractionHub } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  buildExploreFestivalSuggestionsFromPool,
  exploreFestivalChoseongIndexBuildCount,
  filterExploreFestivalSearchQuery,
  resetExploreFestivalChoseongIndexForTests,
} from '../../src/pages/Home/lib/exploreFestivalSearchSuggestions.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLAG = 'VITE_GATEO_EXPLORE_CHOSEONG';

function withChoseongFlag(value, fn) {
  const prev = globalThis.__VITE_ENV__?.[FLAG];
  globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), [FLAG]: value };
  try {
    return fn();
  } finally {
    if (prev === undefined) delete globalThis.__VITE_ENV__[FLAG];
    else globalThis.__VITE_ENV__[FLAG] = prev;
  }
}

function signature(list) {
  return (list || []).map((item) =>
    [item?.id, item?.name, item?.kind, item?.slug, item?.badge].join('|'),
  );
}

const BAD_RECORDS = [
  { id: 'seoul', name: '서울', name_en: null },
  { id: 'busan', name: '부산', name_en: undefined },
  { id: 'blank', name: '', name_en: '' },
  { id: 'space', name: '   ', name_en: '   ' },
  { id: 'jeju', name: '제주', name_en: 'Jeju' },
];

test('explore choseong flag defaults on and only "0" disables', () => {
  assert.equal(withChoseongFlag(undefined, () => isGateoExploreChoseongEnabled()), true);
  assert.equal(withChoseongFlag('', () => isGateoExploreChoseongEnabled()), true);
  assert.equal(withChoseongFlag('1', () => isGateoExploreChoseongEnabled()), true);
  assert.equal(withChoseongFlag('false', () => isGateoExploreChoseongEnabled()), true);
  assert.equal(withChoseongFlag('0', () => isGateoExploreChoseongEnabled()), false);
});

test('null name_en does not throw and an empty needle does not match every place', () => {
  assert.equal(exploreTextIncludes('서울', ''), false);
  assert.equal(exploreTextIncludes('서울', '   '), false);
  assert.equal(exploreTextIncludes(null, '서울'), false);
  assert.equal(exploreTextIncludes(undefined, 'seoul'), false);
  assert.doesNotThrow(() => {
    exploreTextIncludes(null, null);
    matchChoseongCatalog(BAD_RECORDS, '');
    matchChoseongCatalog(BAD_RECORDS, '   ');
    matchChoseongCatalog(BAD_RECORDS, 'ㅅ');
    matchChoseongCatalog(BAD_RECORDS, 'ㅅㅇ');
    matchExploreChoseongSuggestions('ㅅ');
  });
  assert.deepEqual(matchChoseongCatalog(BAD_RECORDS, ''), []);
  assert.deepEqual(matchChoseongCatalog(BAD_RECORDS, '   '), []);
  assert.deepEqual(matchChoseongCatalog(BAD_RECORDS, 'ㅅ'), []);
  assert.deepEqual(
    matchChoseongCatalog(BAD_RECORDS, 'ㅅㅇ').map((row) => row.id),
    ['seoul'],
  );
  assert.deepEqual(
    matchChoseongCatalog(BAD_RECORDS, 'ㅈㅈ').map((row) => row.id),
    ['jeju'],
  );
});

test('syllable hits stay ahead of choseong hits with the same name dropped', () => {
  const merged = appendChoseongSuggestions(
    [{ id: 'lit', name: 'ㅅㅇ랜드' }],
    [
      { id: 'seoul', name: '서울', matchKind: 'choseong' },
      { id: 'dup', name: 'ㅅㅇ랜드', matchKind: 'choseong' },
    ],
  );
  assert.deepEqual(merged.map((item) => item.name), ['ㅅㅇ랜드', '서울']);
});

test('choseong queries suggest 서울·제주·경복궁 and the place index is built once', () => {
  resetExploreChoseongIndexForTests();
  const seoul = withChoseongFlag('', () => buildLocalSearchSuggestions('ㅅㅇ'));
  const builds = exploreChoseongIndexBuildCount();
  const jeju = withChoseongFlag('1', () => buildLocalSearchSuggestions('ㅈㅈ'));
  const gyeongbok = withChoseongFlag(undefined, () => matchExploreChoseongSuggestions('ㄱㅂ', { limit: 80 }));
  assert.equal(exploreChoseongIndexBuildCount(), builds);
  assert.equal(builds, 1);
  assert.equal(seoul[0]?.name, '서울');
  assert.ok(seoul.some((item) => item.name === '수원'));
  assert.equal(jeju[0]?.name, '제주');
  assert.ok(gyeongbok.some((item) => item.name === '경복궁'));
  assert.ok(seoul.every((item) => hangulChoseong(item.name).startsWith('ㅅㅇ')));
  assert.ok(jeju.every((item) => hangulChoseong(item.name).startsWith('ㅈㅈ')));
});

test('choseong ㅅㅇ travel-spot rows with a city hub reuse hub scenic thumb', () => {
  resetExploreChoseongIndexForTests();
  const items = withChoseongFlag('', () => buildLocalSearchSuggestions('ㅅㅇ'));
  const seoul = items.find((item) => item.name === '서울' && item.kind === 'spot');
  assert.ok(seoul, '서울 choseong spot row');
  const thumb = String(seoul.thumbUrl || seoul.imageUrl || '').trim();
  assert.ok(thumb, '서울 choseong card must carry a representative photo');
  assert.equal(String(seoul.contentId || ''), '126508');
  const withoutThumb = items.filter(
    (item) => !String(item.thumbUrl || item.imageUrl || '').trim(),
  );
  assert.ok(withoutThumb.length < items.length, 'at least one choseong row has a scenic thumb');
});

test('choseong ㅅㅇ 시애틀 keeps icon when slug OG is generic pool only', () => {
  resetExploreChoseongIndexForTests();
  const items = withChoseongFlag('', () => buildLocalSearchSuggestions('ㅅㅇ'));
  const seattle = items.find((item) => item.name === '시애틀' && item.kind === 'spot');
  assert.ok(seattle);
  assert.equal(String(seattle.thumbUrl || seattle.imageUrl || '').trim(), '');
  assert.equal(resolveExploreSearchRepresentativeThumbUrl({ slug: 'seattle', kind: 'spot' }), null);
});

test('choseong ㅅㅇ 산야 hub has no site-wide static representative (icon fallback)', () => {
  resetExploreChoseongIndexForTests();
  const hub = resolveCityAttractionHub('sanya');
  const row = hubToSuggestion(hub);
  assert.equal(resolveExploreSearchRepresentativeThumbUrl(row), null);
  const items = withChoseongFlag('', () => buildLocalSearchSuggestions('ㅅㅇ'));
  const sanya = items.find((item) => item.name === '산야' && item.source === 'hub');
  assert.ok(sanya);
  assert.equal(String(sanya.thumbUrl || sanya.imageUrl || '').trim(), '');
});

test('choseong ㅅㅇ 수영 district hub has no static representative (icon fallback)', () => {
  resetExploreChoseongIndexForTests();
  const hub = resolveCityAttractionHub('suyeong');
  const row = hubToSuggestion(hub);
  assert.equal(resolveExploreSearchRepresentativeThumbUrl(row), null);
  const items = withChoseongFlag('', () => buildLocalSearchSuggestions('ㅅㅇ'));
  const suyeong = items.find((item) => item.name === '수영' && item.source === 'hub');
  assert.ok(suyeong);
  assert.equal(String(suyeong.thumbUrl || suyeong.imageUrl || '').trim(), '');
});

test('completed and english explore results stay the same when choseong is on', () => {
  const queries = ['서울', 'Seoul', '제주', 'jeju', '부산', '속초', 'ㄱ'];
  for (const query of queries) {
    const off = withChoseongFlag('0', () => signature(buildLocalSearchSuggestions(query)));
    const on = withChoseongFlag('', () => signature(buildLocalSearchSuggestions(query)));
    assert.deepEqual(on, off, query);
  }
  const choseongOff = withChoseongFlag('0', () => buildLocalSearchSuggestions('ㅅㅇ').map((item) => item.name));
  assert.equal(choseongOff.includes('서울'), false);
});

test('festival titles match choseong without a new decomposition per key and without throwing', () => {
  resetExploreFestivalChoseongIndexForTests();
  const pool = [
    {
      contentId: '1',
      title: '서울빛초롱축제',
      titleEn: null,
      eventStartDate: '20261101',
      eventEndDate: '20261201',
    },
    {
      contentId: '2',
      title: '부산불꽃축제',
      titleEn: undefined,
      eventStartDate: '20261120',
      eventEndDate: '20261121',
    },
    {
      contentId: '3',
      title: '',
      titleEn: null,
      eventStartDate: '20261101',
      eventEndDate: '20261201',
    },
  ];
  assert.doesNotThrow(() => {
    filterExploreFestivalSearchQuery(pool, '');
    filterExploreFestivalSearchQuery(pool, ' ');
    filterExploreFestivalSearchQuery(pool, 'ㅅ');
    filterExploreFestivalSearchQuery(pool, 'ㅅㅇ');
  });
  assert.deepEqual(filterExploreFestivalSearchQuery(pool, ''), []);
  assert.deepEqual(filterExploreFestivalSearchQuery(pool, 'ㅅ'), []);
  const first = filterExploreFestivalSearchQuery(pool, 'ㅅㅇ');
  const builds = exploreFestivalChoseongIndexBuildCount();
  const second = filterExploreFestivalSearchQuery(pool, 'ㅂㅅ');
  assert.equal(exploreFestivalChoseongIndexBuildCount(), builds);
  assert.equal(builds, 1);
  assert.deepEqual(first.map((item) => item.contentId), ['1']);
  assert.deepEqual(second.map((item) => item.contentId), ['2']);

  const completedOn = withChoseongFlag('', () =>
    filterExploreFestivalSearchQuery(pool, '서울').map((item) => item.contentId),
  );
  const completedOff = withChoseongFlag('0', () =>
    filterExploreFestivalSearchQuery(pool, '서울').map((item) => item.contentId),
  );
  assert.deepEqual(completedOn, completedOff);
  assert.deepEqual(completedOn, ['1']);

  const prevSite = globalThis.__VITE_ENV__?.VITE_GATEO_SITE_SEARCH;
  globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), VITE_GATEO_SITE_SEARCH: '1' };
  try {
    const suggestions = buildExploreFestivalSuggestionsFromPool(pool, 'ㅅㅇ', {
      now: new Date('2026-11-15T00:00:00+09:00'),
    });
    assert.ok(suggestions.some((item) => item.name.includes('서울')));
    assert.equal(suggestions.some((item) => String(item.name).includes('부산')), false);
  } finally {
    if (prevSite === undefined) delete globalThis.__VITE_ENV__.VITE_GATEO_SITE_SEARCH;
    else globalThis.__VITE_ENV__.VITE_GATEO_SITE_SEARCH = prevSite;
  }
});

test('useSearchEngine still does not import the shared hangul module', () => {
  const source = readFileSync(join(root, 'src/pages/Home/hooks/useSearchEngine.js'), 'utf8');
  assert.match(source, /초성 검색 기능 완전 폐기/);
  assert.doesNotMatch(source, /hangulSearch/);
  assert.doesNotMatch(source, /0xac00/i);
});
