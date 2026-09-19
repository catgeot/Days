#!/usr/bin/env node
/**
 * 탐색창 검색 — 랑코(람코)·다카마스 SSOT·별칭 스모크
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveCityAttractionHub,
  resolveHubAttraction,
  matchCityAttractionHubsPrefix,
} from '../src/pages/Home/lib/cityAttractionHubs.js';
import {
  resolveExploreSearchAlias,
  buildMapboxSearchQueries,
  isIslandPlaceQuery,
} from '../src/pages/Home/lib/exploreSearchAliases.js';
import {
  searchBoxTypesForQuery,
  SEARCH_BOX_ISLAND_TYPES,
  SEARCH_BOX_PLACE_TYPES,
} from '../src/pages/Home/lib/mapboxSearchBox.js';
import {
  firstPassHitToGeocodeResult,
  firstPassHitToUiPlace,
  resolveKoreaDestinationFirstPass,
  resolveKoreaDestinationFirstPassSync,
} from '../src/pages/Home/lib/resolveKoreaDestinationFirstPass.js';
import { pickUniqueTourAttractionRowForTitle } from '../src/pages/Home/lib/koreaTourAttractionTitleMatch.js';
import { resolveGalleryStockQuery } from '../src/pages/Home/lib/uiPlaceAssetQuery.js';
import { resolveMrtStayQuery } from '../src/utils/mrtStayQuery.js';
import { resolveTourApiPlace } from '../src/utils/tourApiMatch.js';
import {
  resolveKoStationAlias,
  resolveKoUniversityAlias,
  resolveKoUniversitySatelliteAlias,
  resolveKoExploreSearchAlias,
  resolveKoGalleryQueryOverride,
  resolveKoreaPlaceMatch,
  KO_EXPLORE_SEARCH_ALIASES,
  KO_GALLERY_QUERY_OVERRIDES,
  KOREA_HOMONYM_GROUPS,
} from '../src/pages/Home/lib/koreaPlaceMatchDictionary.js';

const langCo = resolveHubAttraction('람코');
assert.ok(langCo, '람코 → 랑코 해변 attraction');
assert.equal(langCo.hub.hubId, 'danang');
assert.equal(langCo.attraction.name, '랑코 해변');

const langCoKo = resolveHubAttraction('랑코');
assert.ok(langCoKo, '랑코 exact');
assert.equal(langCoKo.attraction.name_en, 'Lang Co Beach');

const takamatsu = resolveCityAttractionHub('다카마스');
assert.ok(takamatsu, '다카마스 hub exact');
assert.equal(takamatsu.hubId, 'takamatsu');
assert.equal(takamatsu.name, '다카마스');
assert.equal(takamatsu.name_en, 'Takamatsu');

const takamatsuLegacy = resolveCityAttractionHub('다카맀');
assert.ok(takamatsuLegacy, '다카맀 alias → 다카마스 hub');
assert.equal(takamatsuLegacy.name, '다카마스');

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

const sabaAlias = resolveExploreSearchAlias('사바섬');
assert.ok(sabaAlias?.romanized?.includes('Sabah, Malaysia'), '사바섬 → Sabah Malaysia');
assert.ok(
  sabaAlias?.also?.some((q) => /Saba,\s*Caribbean Netherlands/i.test(q)),
  '사바섬 also → Caribbean Saba',
);
assert.equal(resolveExploreSearchAlias('사바'), null, 'bare 사바 is not a Mapbox alias');

const sabaQueries = buildMapboxSearchQueries('사바섬');
assert.ok(sabaQueries.includes('사바섬'), '사바섬 queries keep original');
assert.ok(
  sabaQueries.some((q) => /Sabah,\s*Malaysia/i.test(q)),
  '사바섬 mapbox queries include Sabah Malaysia',
);
assert.ok(
  sabaQueries.some((q) => /Saba,\s*Caribbean Netherlands/i.test(q)),
  '사바섬 mapbox queries include Caribbean Saba',
);

assert.equal(searchBoxTypesForQuery('사바섬'), SEARCH_BOX_ISLAND_TYPES);
assert.equal(searchBoxTypesForQuery('Saba Island'), SEARCH_BOX_ISLAND_TYPES);
assert.equal(searchBoxTypesForQuery('제주'), SEARCH_BOX_PLACE_TYPES);
assert.equal(searchBoxTypesForQuery('파리'), SEARCH_BOX_PLACE_TYPES);
assert.equal(searchBoxTypesForQuery('자킨토스'), SEARCH_BOX_PLACE_TYPES);
assert.equal(isIslandPlaceQuery('사바섬'), true);
assert.doesNotMatch(SEARCH_BOX_ISLAND_TYPES, /\bpoi\b/, 'island search box excludes poi');

for (const q of ['광천선굴', '광천성굴', '광천동굴', 'Gwangcheon Cave']) {
  const hit = resolveHubAttraction(q);
  assert.ok(hit, `${q} → 광천선굴 hub attraction`);
  assert.equal(hit.hub.hubId, 'pyeongchang', `${q} hub is 평창`);
  assert.equal(hit.attraction.name, '광천선굴', `${q} canonical name`);
}

const seongulAlias = resolveExploreSearchAlias('광천성굴');
assert.equal(seongulAlias?.canonical, '광천선굴', '광천성굴 explore alias');
const caveQueries = buildMapboxSearchQueries('광천동굴');
assert.ok(caveQueries.includes('광천선굴'), '광천동굴 mapbox queries include 광천선굴');
assert.ok(
  caveQueries.some((q) => /Pyeongchang|평창/i.test(q)),
  '광천동굴 mapbox queries include Pyeongchang',
);

const seongulFirst = resolveKoreaDestinationFirstPassSync('광천선굴');
assert.equal(seongulFirst?.source, 'hub', '광천선굴 First-Pass hub');
assert.equal(seongulFirst?.hubId, 'pyeongchang');
assert.equal(seongulFirst?.lat, 37.518306);
assert.equal(seongulFirst?.lng, 128.451361);
assert.equal(seongulFirst?.contentId, '2987914');
assert.equal(seongulFirst?.parentCity, '평창');
assert.equal(seongulFirst?.stayAdmin?.city, '평창');
assert.equal(seongulFirst?.placeCategory, 'NATURE_SCENIC', '광천선굴 kind=landmark여도 선굴→자연');
assert.equal(seongulFirst?.tourCategory, 'NATURE_SCENIC');

const seongulTypo = resolveKoreaDestinationFirstPassSync('광천성굴');
assert.equal(seongulTypo?.name, '광천선굴', '광천성굴 First-Pass → 광천선굴');
assert.equal(seongulTypo?.hubId, 'pyeongchang');

const jonggakFirst = resolveKoreaDestinationFirstPassSync('종각역');
assert.equal(jonggakFirst?.source, 'station', '종각역 First-Pass station');
assert.equal(jonggakFirst?.name, '종각역');
assert.equal(jonggakFirst?.lat, 37.5701);
assert.equal(jonggakFirst?.lng, 126.9829);
assert.equal(jonggakFirst?.stayAdmin?.district, '종로');
assert.equal(jonggakFirst?.tourCategory, 'STATION');
assert.equal(jonggakFirst?.placeCategory, 'STATION');
assert.equal(resolveKoreaDestinationFirstPassSync('종각')?.name, '종각역');

const jonggakPin = firstPassHitToUiPlace(jonggakFirst, '종각역');
assert.equal(jonggakPin?.uiPlace, true);
assert.equal(jonggakPin?.stayAdmin?.city, '서울');
assert.equal(jonggakPin?.placeCategory, 'STATION');
assert.notEqual(jonggakPin?.lat, 35.87, '종각역 is not Daegu');
const jonggakStay = resolveMrtStayQuery(jonggakPin);
assert.match(jonggakStay.keyword, /종로|서울/, `종각역 stay ${jonggakStay.keyword}`);
assert.doesNotMatch(jonggakStay.keyword, /대구/);

const seongulGeo = firstPassHitToGeocodeResult(seongulFirst);
assert.equal(seongulGeo?.source, 'korea-first-pass');
assert.ok(seongulGeo?.lat > 37.4 && seongulGeo?.lat < 37.7, '평창 위도');
assert.ok(seongulGeo?.lng > 128.3 && seongulGeo?.lng < 128.6, '평창 경도');
assert.equal(seongulGeo?.placeCategory, 'NATURE_SCENIC');

const seongulPin = firstPassHitToUiPlace(seongulFirst, '광천선굴');
const seongulStay = resolveMrtStayQuery(seongulPin);
assert.match(seongulStay.keyword, /평창/, `광천선굴 stay primary ${seongulStay.keyword}`);
assert.doesNotMatch(seongulStay.keyword, /광천|광주/);
assert.ok(
  !seongulStay.altKeywords.some((k) => /광주/.test(k)),
  `광천선굴 alts must not include 광주 (${seongulStay.altKeywords.join(',')})`,
);
const seongulTour = resolveTourApiPlace(seongulPin);
assert.equal(seongulTour?.contentId, '2987914');
assert.ok(
  seongulTour.photoKeywords.every((k) => !/야경/.test(k)),
  '자연명소 Tour 키워드에 야경(도심) 없음',
);
const seongulGallery = resolveGalleryStockQuery(seongulPin);
assert.match(seongulGallery.backupQuery, /landscape|Pyeongchang/i);

const saejaeFirst = resolveKoreaDestinationFirstPassSync('문경새재');
assert.equal(saejaeFirst?.placeCategory, 'NATURE_SCENIC');
assert.match(resolveMrtStayQuery(firstPassHitToUiPlace(saejaeFirst, '문경새재')).keyword, /문경/);

assert.equal(resolveKoreaDestinationFirstPassSync('람코'), null, '해외 랑코는 국내 First-Pass 아님');
assert.equal(resolveKoreaDestinationFirstPassSync('다카마스'), null, '다카마스 hub는 First-Pass attraction 아님');
assert.equal(resolveKoreaDestinationFirstPassSync('평창'), null, '도시 hub exact는 First-Pass 스킵');

const uniqueCave = pickUniqueTourAttractionRowForTitle(
  [
    {
      title: '광천선굴',
      contentId: '2987914',
      addr1: '강원특별자치도 평창군 대관령면',
      lat: 37.518306,
      lng: 128.451361,
    },
  ],
  '광천선굴',
);
assert.equal(uniqueCave?.contentId, '2987914');

const tiedCaves = pickUniqueTourAttractionRowForTitle(
  [
    { title: '광천선굴', contentId: '1', addr1: '평창군' },
    { title: '광천선굴', contentId: '2', addr1: '홍성군' },
  ],
  '광천선굴',
);
assert.equal(tiedCaves, null, '동점 TourAPI 제목은 First-Pass 미확정');

const mockedTour = await resolveKoreaDestinationFirstPass('테스트유일관광지', {
  lookupTourAttraction: async () => ({
    name: '테스트유일관광지',
    title: '테스트유일관광지',
    contentId: '125831',
    lat: 37.7319,
    lng: 128.592,
    addr1: '강원특별자치도 평창군 진부면 오대산로 374-8',
    cat1: 'A02',
    cat2: 'A0201',
  }),
});
assert.equal(mockedTour?.source, 'tourapi');
assert.equal(mockedTour?.contentId, '125831');
assert.equal(mockedTour?.tourCategory, 'HISTORY');
assert.match(String(mockedTour?.stayAdmin?.city || ''), /평창/);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const geocodingSrc = readFileSync(join(root, 'src/pages/Home/lib/geocoding.js'), 'utf8');
assert.match(geocodingSrc, /resolveKoreaDestinationFirstPass/);
const firstPassIdx = geocodingSrc.indexOf('resolveKoreaDestinationFirstPass');
const mapboxIdx = geocodingSrc.indexOf('tryMapboxBundle(cleanQuery)');
assert.ok(firstPassIdx > 0 && firstPassIdx < mapboxIdx, 'First-Pass is before primary Mapbox');

const handlerSrc = readFileSync(join(root, 'src/pages/Home/hooks/useHomeHandlers.js'), 'utf8');
assert.match(handlerSrc, /resolveKoreaDestinationFirstPassSync/);

// SSOT: koreaPlaceMatchDictionary 통합 검증
assert.equal(resolveKoStationAlias('종각')?.station, '종각역', 'SSOT resolveKoStationAlias 종각');
assert.equal(resolveKoUniversityAlias('강원대')?.campus, '강원대학교 춘천캠퍼스', 'SSOT resolveKoUniversityAlias 강원대');
assert.equal(resolveKoUniversitySatelliteAlias('강원대 동해수련원')?.city, '양양', 'SSOT satellite 양양');
assert.equal(resolveKoExploreSearchAlias('광천성굴')?.canonical, '광천선굴', 'SSOT explore alias 광천성굴');
assert.equal(resolveKoGalleryQueryOverride('gongjicheon')?.primary, 'Gongjicheon Chuncheon', 'SSOT gallery override 공지천');
assert.ok(Array.isArray(KO_EXPLORE_SEARCH_ALIASES), 'SSOT KO_EXPLORE_SEARCH_ALIASES is array');
assert.ok(typeof KO_GALLERY_QUERY_OVERRIDES === 'object', 'SSOT KO_GALLERY_QUERY_OVERRIDES is object');
assert.ok(Array.isArray(KOREA_HOMONYM_GROUPS) && KOREA_HOMONYM_GROUPS.length >= 6, 'SSOT KOREA_HOMONYM_GROUPS length');

const matchStation = resolveKoreaPlaceMatch('종각');
assert.equal(matchStation?.type, 'station', 'resolveKoreaPlaceMatch station');
const matchUni = resolveKoreaPlaceMatch('강원대');
assert.equal(matchUni?.type, 'university', 'resolveKoreaPlaceMatch university');
const matchSat = resolveKoreaPlaceMatch('강원대학교동해수련원');
assert.equal(matchSat?.type, 'university_satellite', 'resolveKoreaPlaceMatch satellite');
const matchHomonym = resolveKoreaPlaceMatch('광천');
assert.equal(matchHomonym?.type, 'homonym_group', 'resolveKoreaPlaceMatch homonym_group');

console.log('PASS explore-search-aliases (lang co + takamatsu + saba island types + 광천선굴 + korea first-pass + koreaPlaceMatchDictionary SSOT)');
