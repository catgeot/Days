/**
 * 국내 동명 리/읍/면/동 검색 다후보 스모크
 * 기본: 픽스처(오프라인) · LIVE: KO_HOMONYM_RI_LIVE=1 (Nominatim)
 */
import {
  buildKoHomonymRiCandidatesFromRows,
  collectKoHomonymPlaceCandidates,
  collectKoHomonymRiCandidates,
  formatKoHomonymRiRegionLabel,
  getKoHomonymBareWhitelist,
  isKoHomonymBareWhitelistQuery,
  isKoHomonymPlaceSearchQuery,
  isKoHomonymRiSearchQuery,
} from '../src/pages/Home/lib/koHomonymRiSearch.js';

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL: ${msg}`);
    return;
  }
  console.log(`PASS: ${msg}`);
}

const FIXTURE_DAEHWA = [
  {
    name: '대화리',
    lat: '36.8',
    lon: '127.1',
    display_name: '대화리, 천안시, 충청남도, 대한민국',
    address: { village: '대화리', city: '천안시', country_code: 'kr', state: '충청남도' },
  },
  {
    name: '대화리',
    lat: '36.9',
    lon: '127.9',
    display_name: '대화리, 충주시, 충청북도, 대한민국',
    address: { village: '대화리', city: '충주시', country_code: 'kr', state: '충청북도' },
  },
  {
    name: '대화리',
    lat: '35.8',
    lon: '126.9',
    display_name: '대화리, 김제시, 전북특별자치도, 대한민국',
    address: { village: '대화리', city: '김제시', country_code: 'kr', state: '전북특별자치도' },
  },
  {
    name: '대화리',
    lat: '37.5',
    lon: '128.4',
    display_name: '대화리, 대화면, 평창군, 강원특별자치도, 대한민국',
    address: {
      village: '대화리',
      town: '대화면',
      county: '평창군',
      country_code: 'kr',
      state: '강원특별자치도',
    },
  },
];

const FIXTURE_DAEHWA_DONG = [
  {
    name: '대화동',
    lat: '36.35',
    lon: '127.38',
    display_name: '대화동, 대전광역시, 대한민국',
    address: { suburb: '대화동', city: '대전광역시', country_code: 'kr', state: '대전광역시' },
  },
  {
    name: '대화동',
    lat: '37.68',
    lon: '126.75',
    display_name: '대화동, 고양시, 경기도, 대한민국',
    address: { suburb: '대화동', city: '고양시', country_code: 'kr', state: '경기도' },
  },
];

const FIXTURE_NAMYANG = [
  {
    name: '남양',
    lat: '34.9',
    lon: '128.1',
    display_name: '남양, 사천시, 경상남도, 대한민국',
    address: { suburb: '남양', city: '사천시', country_code: 'kr', state: '경상남도' },
  },
  {
    name: '남양',
    lat: '36.6',
    lon: '126.7',
    display_name: '남양, 홍성읍, 홍성군, 충청남도, 대한민국',
    address: { town: '홍성읍', county: '홍성군', country_code: 'kr', state: '충청남도' },
  },
  {
    name: '남양',
    lat: '37.5',
    lon: '130.9',
    display_name: '남양, 서면, 울릉군, 경상북도, 대한민국',
    address: { town: '서면', county: '울릉군', country_code: 'kr', state: '경상북도' },
  },
];

const FIXTURE_SINCHON = [
  {
    name: '신촌',
    lat: '37.56',
    lon: '126.94',
    display_name: '신촌, 서울특별시, 대한민국',
    address: { suburb: '신촌동', city: '서울특별시', country_code: 'kr', state: '서울특별시' },
  },
  {
    name: '신촌',
    lat: '35.3',
    lon: '126.4',
    display_name: '신촌, 홍농읍, 영광군, 전라남도, 대한민국',
    address: { town: '홍농읍', county: '영광군', country_code: 'kr', state: '전라남도' },
  },
];

assert(isKoHomonymRiSearchQuery('대화리'), '대화리 is ri homonym query');
assert(isKoHomonymRiSearchQuery('대화면'), '대화면 is ri homonym query');
assert(!isKoHomonymRiSearchQuery('대화동'), '대화동 is not ri-only query');
assert(!isKoHomonymRiSearchQuery('대화리 평창'), 'spaced query excluded');
assert(!isKoHomonymRiSearchQuery('제주'), 'bare excluded from ri');
assert(!isKoHomonymRiSearchQuery('남양'), 'bare whitelist excluded from ri-only');

assert(isKoHomonymPlaceSearchQuery('대화리'), '대화리 is place homonym');
assert(isKoHomonymPlaceSearchQuery('대화동'), '대화동 is place homonym (Phase 0 expand)');
assert(isKoHomonymPlaceSearchQuery('남양'), '남양 bare whitelist is place path');
assert(isKoHomonymPlaceSearchQuery('신촌'), '신촌 bare whitelist is place path');
assert(isKoHomonymBareWhitelistQuery('남양'), '남양 is bare whitelist');
assert(isKoHomonymBareWhitelistQuery('신촌'), '신촌 is bare whitelist');
assert(!isKoHomonymBareWhitelistQuery('대화동'), '동 suffix not bare whitelist');
assert(!isKoHomonymPlaceSearchQuery('제주'), 'hub bare 제주 excluded from place path');
assert(!isKoHomonymPlaceSearchQuery('고성'), 'hub bare 고성 excluded (not whitelist)');
assert(!isKoHomonymPlaceSearchQuery('광주'), 'hub bare 광주 excluded');
assert(!isKoHomonymPlaceSearchQuery('강북'), 'hub bare 강북 excluded (hub exact)');
assert(!getKoHomonymBareWhitelist().includes('고성'), 'whitelist must not include hub 고성');
assert(getKoHomonymBareWhitelist().includes('남양'), 'whitelist includes 남양');
assert(getKoHomonymBareWhitelist().includes('신촌'), 'whitelist includes 신촌');
// Enter(requireChoice)는 prefix 남양주보다 place 다후보 우선 — handler에서 보장
assert(
  isKoHomonymPlaceSearchQuery('남양') && !isKoHomonymBareWhitelistQuery('남양주'),
  '남양 whitelist ≠ 남양주 hub exact',
);

assert(
  formatKoHomonymRiRegionLabel({ county: '평창군', town: '대화면' }) === '평창군',
  'label prefers 군',
);
assert(
  formatKoHomonymRiRegionLabel({ city: '천안시' }) === '천안시',
  'label uses 시 when no 군',
);
assert(
  formatKoHomonymRiRegionLabel({ city: '대전광역시' }) === '대전광역시',
  'label uses 광역시',
);

const cards = buildKoHomonymRiCandidatesFromRows('대화리', FIXTURE_DAEHWA);
assert(cards.length >= 2, `fixture candidates ≥2 (got ${cards.length})`);
const names = cards.map((c) => c.name);
assert(names.includes('대화리 · 평창군'), `has 평창군 card: ${names.join(' | ')}`);
assert(names.includes('대화리 · 천안시'), `has 천안시 card: ${names.join(' | ')}`);
assert(
  cards.every((c) => c.originalQuery === '대화리' && c.uiPlace === true && c.stayAdmin),
  'cards carry originalQuery + stayAdmin',
);
assert(
  cards.find((c) => c.name === '대화리 · 평창군')?.stayAdmin?.county === '평창군',
  '평창 card stayAdmin.county',
);
assert(
  cards.find((c) => c.name === '대화리 · 천안시')?.stayAdmin?.city === '천안시',
  '천안 card stayAdmin.city',
);

const dongCards = buildKoHomonymRiCandidatesFromRows('대화동', FIXTURE_DAEHWA_DONG);
assert(dongCards.length >= 2, `dong fixture ≥2 (got ${dongCards.length})`);
const dongNames = dongCards.map((c) => c.name);
assert(
  dongNames.some((n) => n.includes('대전')),
  `dong has 대전: ${dongNames.join(' | ')}`,
);
assert(
  dongNames.some((n) => n.includes('고양')),
  `dong has 고양: ${dongNames.join(' | ')}`,
);
assert(
  dongCards.every((c) => c.originalQuery === '대화동' && c.parentCity),
  'dong cards labeled with region',
);

const namyangCards = buildKoHomonymRiCandidatesFromRows('남양', FIXTURE_NAMYANG);
assert(namyangCards.length >= 2, `남양 fixture ≥2 (got ${namyangCards.length})`);
const namyangNames = namyangCards.map((c) => c.name);
assert(
  namyangNames.some((n) => n.includes('사천')),
  `남양 has 사천: ${namyangNames.join(' | ')}`,
);
assert(
  namyangNames.some((n) => n.includes('홍성') || n.includes('울릉')),
  `남양 has 홍성|울릉: ${namyangNames.join(' | ')}`,
);

const sinchonCards = buildKoHomonymRiCandidatesFromRows('신촌', FIXTURE_SINCHON);
assert(sinchonCards.length >= 2, `신촌 fixture ≥2 (got ${sinchonCards.length})`);
const sinchonNames = sinchonCards.map((c) => c.name);
assert(
  sinchonNames.some((n) => n.includes('서울')),
  `신촌 has 서울: ${sinchonNames.join(' | ')}`,
);
assert(
  sinchonNames.some((n) => n.includes('영광')),
  `신촌 has 영광: ${sinchonNames.join(' | ')}`,
);

if (process.env.KO_HOMONYM_RI_LIVE === '1') {
  console.log('LIVE: Nominatim collectKoHomonymRiCandidates(대화리)…');
  const live = await collectKoHomonymRiCandidates('대화리');
  assert(live.length >= 2, `LIVE 대화리 ≥2 (got ${live.length})`);
  const liveNames = live.map((c) => c.name);
  assert(
    liveNames.some((n) => n.includes('평창군')),
    `LIVE has 평창군: ${liveNames.join(' | ')}`,
  );
  assert(
    liveNames.some((n) => n.includes('천안시')),
    `LIVE has 천안시: ${liveNames.join(' | ')}`,
  );
  console.log('LIVE 대화리:', liveNames.join(' · '));

  console.log('LIVE: Nominatim collectKoHomonymPlaceCandidates(대화동)…');
  const liveDong = await collectKoHomonymPlaceCandidates('대화동');
  assert(liveDong.length >= 2, `LIVE 대화동 ≥2 (got ${liveDong.length})`);
  const liveDongNames = liveDong.map((c) => c.name);
  assert(
    liveDongNames.some((n) => /대전|고양/.test(n)),
    `LIVE 대화동 has 대전|고양: ${liveDongNames.join(' | ')}`,
  );
  console.log('LIVE 대화동:', liveDongNames.join(' · '));

  console.log('LIVE: Nominatim collectKoHomonymPlaceCandidates(남양)…');
  const liveNamyang = await collectKoHomonymPlaceCandidates('남양');
  assert(liveNamyang.length >= 2, `LIVE 남양 ≥2 (got ${liveNamyang.length})`);
  console.log('LIVE 남양:', liveNamyang.map((c) => c.name).join(' · '));

  console.log('LIVE: Nominatim collectKoHomonymPlaceCandidates(신촌)…');
  const liveSinchon = await collectKoHomonymPlaceCandidates('신촌');
  assert(liveSinchon.length >= 2, `LIVE 신촌 ≥2 (got ${liveSinchon.length})`);
  console.log('LIVE 신촌:', liveSinchon.map((c) => c.name).join(' · '));

  console.log('LIVE: hub bare 고성 must not enter place collector…');
  const liveGoseong = await collectKoHomonymPlaceCandidates('고성');
  assert(liveGoseong.length === 0, `LIVE 고성 place path empty (got ${liveGoseong.length})`);
} else {
  console.log('SKIP LIVE (set KO_HOMONYM_RI_LIVE=1 to enable)');
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nAll smoke checks passed');
