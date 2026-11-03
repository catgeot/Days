import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import {
  attachKoreaTourContentToExplorePin,
  normalizeExploreSelectionPin,
  resolveDomesticProvinceNameHub,
} from '../../src/pages/Home/lib/explorePlaceNav.js';
import {
  collectKoreaTourTitleSearchCandidates,
  splitParentheticalRegionTitle,
} from '../../src/pages/Home/lib/exploreKoreaTourTitleCandidates.js';
import {
  pickSeaBasinCurationSpot,
  resolveSeaBasinFromQuery,
} from '../../src/pages/Home/lib/seaBasinResolve.js';

/** LIVE gateo.kr index-DleevuGD «제주특별자치도» Enter — SearchDisambiguationCards candidates[5] (React fiber 캡처) */
export const LIVE_JEJU_DO_VISITED_CANDIDATE = {
  id: 'visited-jeju-do',
  slug: 'jeju-do',
  kind: 'city',
  badge: '장소',
  name: '제주특별자치도',
  name_en: 'Jeju-do',
  name_ko: '제주특별자치도',
  country: '대한민국',
  country_en: 'South Korea',
  lat: 33.499829,
  lng: 126.53139,
  source: 'visited',
  uiPlace: true,
  image_url: '',
};

function visitedProvince(id, name, nameEn, lat, lng) {
  return {
    ...LIVE_JEJU_DO_VISITED_CANDIDATE,
    id: `visited-${id}`,
    slug: id,
    name,
    name_ko: name,
    name_en: nameEn,
    lat,
    lng,
  };
}

test('LIVE visited-jeju-do 카드 — /place/jeju (홈 지구본 금지)', () => {
  assert.equal(resolveDomesticProvinceNameHub(LIVE_JEJU_DO_VISITED_CANDIDATE)?.hubId, 'jeju');
  const decision = resolveSearchResultSelect(LIVE_JEJU_DO_VISITED_CANDIDATE);
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'jeju');
  assert.equal(decision?.spot?.slug, 'jeju');
});

test('LIVE visited-jeju-do — handleSuggestionSelect 체인(attach·normalize·resolve)', async () => {
  let pin = await attachKoreaTourContentToExplorePin(LIVE_JEJU_DO_VISITED_CANDIDATE);
  pin = normalizeExploreSelectionPin(pin);
  const decision = resolveSearchResultSelect(pin);
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'jeju');
});

test('visited 경기도·강원도 — 허브 없음 → 홈 유지', () => {
  for (const pin of [
    visitedProvince('gyeonggi-do', '경기도', 'Gyeonggi-do', 37.4138, 127.5183),
    visitedProvince('gangwon-do', '강원도', 'Gangwon-do', 37.8228, 128.1555),
  ]) {
    assert.equal(resolveDomesticProvinceNameHub(pin), null, pin.name);
    assert.equal(resolveSearchResultSelect(pin)?.type, 'home', pin.name);
  }
});

test('visited 해외 도시(단둥) — 홈 유지', () => {
  const pin = {
    ...visitedProvince('dandong', '단둥', 'Dandong', 40.1292, 124.3947),
    country: '중국',
    country_en: 'China',
  };
  assert.equal(resolveDomesticProvinceNameHub(pin), null);
  assert.equal(resolveSearchResultSelect(pin)?.type, 'home');
});

test('splitParentheticalRegionTitle — 고산사(홍성)', () => {
  assert.deepEqual(splitParentheticalRegionTitle('고산사(홍성)'), { base: '고산사', region: '홍성' });
  assert.equal(splitParentheticalRegionTitle('고산사'), null);
});

/** LIVE tourapi_attraction(type 12) «고산사» ilike — 괄호 sanitize 시 «고산사홍성» 0건 */
const LIVE_GOSANSA_BASE_ROWS = [
  {
    title: '고산사(장흥)',
    name: '고산사(장흥)',
    contentId: '127937',
    lat: 34.6415,
    lng: 126.7842,
    addr1: '전라남도 장흥군 회진면',
  },
  {
    title: '고산사(홍성)',
    name: '고산사(홍성)',
    contentId: '125901',
    lat: 36.5450325186,
    lng: 126.5373285055,
    addr1: '충청남도 홍성군 결성면',
  },
  {
    title: '대한불교조계종 고산사',
    name: '대한불교조계종 고산사',
    contentId: '128421',
    lat: 37.1423456,
    lng: 128.2134567,
    addr1: '충청북도 제천시 화산면',
  },
];

test('고산사(홍성) — «고산사»로 조회 후 홍성 필터 → 125901', async () => {
  const asked = [];
  const rows = await collectKoreaTourTitleSearchCandidates('고산사(홍성)', {
    lookupRows: async (title) => {
      asked.push(title);
      return title === '고산사' ? LIVE_GOSANSA_BASE_ROWS : [];
    },
  });
  assert.deepEqual(asked, ['고산사']);
  assert.deepEqual(
    rows.map((r) => r.contentId),
    ['125901'],
  );
  assert.equal(rows[0]?.slug, 'tour-125901');
});

test('고산사(홍성) — DB title이 «고산사»뿐이어도 주소 홍성으로 125901', async () => {
  const rows = await collectKoreaTourTitleSearchCandidates('고산사(홍성)', {
    lookupRows: async () => [
      { ...LIVE_GOSANSA_BASE_ROWS[1], title: '고산사', name: '고산사' },
      { ...LIVE_GOSANSA_BASE_ROWS[0], title: '고산사', name: '고산사' },
    ],
  });
  assert.deepEqual(
    rows.map((r) => r.contentId),
    ['125901'],
  );
});

test('고산사(장흥) — 127937 · bare 고산사 다건 유지', async () => {
  const jangheung = await collectKoreaTourTitleSearchCandidates('고산사(장흥)', {
    lookupRows: async () => LIVE_GOSANSA_BASE_ROWS,
  });
  assert.deepEqual(
    jangheung.map((r) => r.contentId),
    ['127937'],
  );
  const bare = await collectKoreaTourTitleSearchCandidates('고산사', {
    lookupRows: async () => LIVE_GOSANSA_BASE_ROWS,
  });
  assert.ok(bare.some((r) => r.contentId === '125901'));
  assert.ok(bare.some((r) => r.contentId === '127937'));
});

test('평양 — 남태평양 부분 일치 금지(해역 큐레이션 없음)', () => {
  assert.equal(resolveSeaBasinFromQuery('평양'), null);
  assert.equal(pickSeaBasinCurationSpot('평양'), null);
  assert.equal(resolveSeaBasinFromQuery('남태평양')?.basin?.id, 'south-pacific');
  assert.equal(resolveSeaBasinFromQuery('멕시코')?.basin?.id, 'gulf-of-mexico');
});

test('대서양 — 완전 일치 north-atlantic (앞부분 «대서양 화산섬» macaronesia 금지)', () => {
  assert.equal(resolveSeaBasinFromQuery('대서양')?.basin?.id, 'north-atlantic');
  assert.equal(resolveSeaBasinFromQuery('대서양 화산섬')?.basin?.id, 'macaronesia');
  assert.equal(resolveSeaBasinFromQuery('멕시코만')?.basin?.id, 'gulf-of-mexico');
  for (const typo of ['산호헤', '맥시코']) {
    assert.equal(resolveSeaBasinFromQuery(typo)?.typoCorrected, true, typo);
  }
});

test('고산사 (홍성) 띄어 쓴 괄호 — 고산사(홍성)과 같게 125901', async () => {
  const asked = [];
  const rows = await collectKoreaTourTitleSearchCandidates('고산사 (홍성)', {
    lookupRows: async (title) => {
      asked.push(title);
      return LIVE_GOSANSA_BASE_ROWS;
    },
  });
  assert.deepEqual(asked, ['고산사']);
  assert.deepEqual(
    rows.map((r) => r.contentId),
    ['125901'],
  );
});
