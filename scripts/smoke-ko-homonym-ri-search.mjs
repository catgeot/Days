/**
 * 국내 동명 리 검색 다후보 스모크
 * 기본: 픽스처(오프라인) · LIVE: KO_HOMONYM_RI_LIVE=1 (Nominatim)
 */
import {
  buildKoHomonymRiCandidatesFromRows,
  collectKoHomonymRiCandidates,
  formatKoHomonymRiRegionLabel,
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

assert(isKoHomonymRiSearchQuery('대화리'), '대화리 is homonym query');
assert(isKoHomonymRiSearchQuery('대화면'), '대화면 is homonym query');
assert(!isKoHomonymRiSearchQuery('대화리 평창'), 'spaced query excluded');
assert(!isKoHomonymRiSearchQuery('제주'), 'non ri/읍/면 excluded');

assert(
  formatKoHomonymRiRegionLabel({ county: '평창군', town: '대화면' }) === '평창군',
  'label prefers 군',
);
assert(
  formatKoHomonymRiRegionLabel({ city: '천안시' }) === '천안시',
  'label uses 시 when no 군',
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

if (process.env.KO_HOMONYM_RI_LIVE === '1') {
  console.log('LIVE: Nominatim collectKoHomonymRiCandidates(대화리)…');
  const live = await collectKoHomonymRiCandidates('대화리');
  assert(live.length >= 2, `LIVE candidates ≥2 (got ${live.length})`);
  const liveNames = live.map((c) => c.name);
  assert(
    liveNames.some((n) => n.includes('평창군')),
    `LIVE has 평창군: ${liveNames.join(' | ')}`,
  );
  assert(
    liveNames.some((n) => n.includes('천안시')),
    `LIVE has 천안시: ${liveNames.join(' | ')}`,
  );
  console.log('LIVE cards:', liveNames.join(' · '));
} else {
  console.log('SKIP LIVE (set KO_HOMONYM_RI_LIVE=1 to enable)');
}

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nAll smoke checks passed');
