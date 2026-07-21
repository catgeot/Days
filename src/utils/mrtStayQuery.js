/**
 * MRT 숙소 검색 쿼리 해석 (순수) — Edge `fetch-mrt-stays` body 구성.
 * supabase 클라이언트 의존 없음 → Node 스모크·단위 테스트 가능.
 */
import { isPlaceholderCountry } from './travelSpotResolve.js';

/**
 * 동명·오탐이 심한 slug — 1차 키워드·대안 (Edge가 countryHint로도 재시도).
 * @type {Record<string, { keyword?: string, altKeywords?: string[] }>}
 */
const MRT_STAY_KEYWORD_OVERRIDES = {
  palau: { keyword: '코로르', altKeywords: ['Koror', '팔라우'] },
  /** MRT「괌」CITY(망길라오)는 재고 0 — 투몬·타무닝 호텔 밀집 */
  guam: { keyword: '투몬', altKeywords: ['Tumon', '괌', 'Guam', '타무닝'] },
  /** 인도「발리」(라자스탄) 동명 — 덴파사르·우붓으로 인도네시아 고정 */
  bali: { keyword: '덴파사르', altKeywords: ['Denpasar', '우붓', 'Ubud', '발리', 'Bali'] },
  /** 「파타고니아 박물관」POI 가로채기 → 바릴로체 CITY */
  patagonia: {
    keyword: '바릴로체',
    altKeywords: ['Bariloche', '산 카를로스 데 바릴로체', '파타고니아'],
  },
  hawaii: { keyword: '하와이', altKeywords: ['호놀룰루', 'Honolulu', 'Hawaii', '와이키키'] },
  honolulu: { keyword: '호놀룰루', altKeywords: ['Honolulu', '하와이', 'Hawaii', '와이키키'] },
  'la-reunion': {
    keyword: '레위니옹',
    altKeywords: ['La Reunion', 'Reunion', 'Réunion', '생드니', 'Saint-Denis'],
  },
  bermuda: { keyword: '버뮤다', altKeywords: ['Bermuda', '해밀턴', 'Hamilton'] },
  saipan: { keyword: '사이판', altKeywords: ['Saipan', '가란', 'Garapan'] },
};

/**
 * gateo 여행 표기(하와이·영토) → MRT subName head/세그먼트와 맞출 주권·별칭.
 * @type {Record<string, string[]>}
 */
const MRT_COUNTRY_HINT_ALTS = {
  하와이: ['미국', 'USA', 'United States', 'Hawaii'],
  hawaii: ['미국', 'USA', 'United States', '하와이'],
  괌: ['Guam'],
  guam: ['괌'],
  '북마리아나 제도': ['북마리아나제도', 'Northern Mariana Islands', 'Saipan', '사이판'],
  'northern mariana islands': ['북마리아나제도', '북마리아나 제도', 'Saipan'],
  '프랑스령 레위니옹': ['레위니옹', 'Reunion', 'La Reunion', 'Réunion'],
  'la reunion': ['레위니옹', 'Reunion', 'Réunion', '프랑스령 레위니옹'],
  reunion: ['레위니옹', 'La Reunion', 'Réunion'],
  '미크로네시아 연방': ['미크로네시아연방', 'Micronesia', 'Federated States of Micronesia', 'FSM'],
  'federated states of micronesia': ['미크로네시아 연방', '미크로네시아연방', 'Micronesia'],
  버뮤다: ['Bermuda'],
  bermuda: ['버뮤다'],
  '쿡 제도': ['Cook Islands', '쿡제도'],
  'cook islands': ['쿡 제도', '쿡제도'],
};

const OVERSEAS_PREFIX_RE = /^(프랑스령|영국령|미국령|네덜란드령|덴마크령|포르투갈령)\s+/u;

const KO_ADMIN_SUFFIX_RE =
  /(특별자치시|특별자치도|광역시|특별시|자치시|자치군|시|군|구|읍|면|동)$/;

/**
 * @param {object} location
 * @returns {boolean}
 */
export function isMrtDomesticLocation(location) {
  const country = String(location?.country || '').trim();
  const countryEn = String(location?.country_en || '').trim().toLowerCase();
  if (!country && !countryEn) return false;
  if (country === '한국' || country === '대한민국' || country.includes('한국')) return true;
  return (
    countryEn === 'korea' ||
    countryEn === 'south korea' ||
    countryEn === 'republic of korea' ||
    countryEn.includes('korea')
  );
}

/** MRT subName head는 「한국」— Nominatim「대한민국」을 맞춰 보냄 */
export function normalizeMrtCountryHint(country, isDomestic = false) {
  const c = String(country || '').trim();
  if (isDomestic) return '한국';
  if (c === '대한민국' || c.includes('한국')) return '한국';
  return c;
}

/**
 * Edge countryHints용 — 공백 제거·해외령 접두 제거·영토→주권 별칭.
 * @param {string} countryHint
 * @param {string[]} [extraAlts]
 * @param {{ isDomestic?: boolean }} [opts]
 * @returns {string[]}
 */
export function expandMrtCountryHintAlts(countryHint, extraAlts = [], opts = {}) {
  const isDomestic = Boolean(opts.isDomestic);
  const primary = normalizeMrtCountryHint(countryHint, isDomestic);
  const out = [];
  const seen = new Set();
  const push = (raw) => {
    const k = String(raw || '').trim();
    if (!k || k.length > 80) return;
    // 공백 유무는 별도 힌트로 유지 — MRT head「북마리아나제도」↔ gateo「북마리아나 제도」
    const key = k.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(k);
  };

  push(primary);
  const stripped = primary.replace(OVERSEAS_PREFIX_RE, '').trim();
  if (stripped && stripped !== primary) push(stripped);
  const noSpace = primary.replace(/\s+/g, '');
  if (noSpace && noSpace !== primary) push(noSpace);
  if (stripped) {
    const strippedNoSpace = stripped.replace(/\s+/g, '');
    if (strippedNoSpace && strippedNoSpace !== stripped) push(strippedNoSpace);
  }

  const mapKeys = [primary, stripped, String(countryHint || '').trim()];
  for (const mk of mapKeys) {
    if (!mk) continue;
    for (const alt of MRT_COUNTRY_HINT_ALTS[mk] || []) push(alt);
    for (const alt of MRT_COUNTRY_HINT_ALTS[mk.toLowerCase()] || []) push(alt);
  }

  for (const raw of extraAlts || []) {
    push(raw);
    const s = String(raw || '').trim();
    if (!s) continue;
    const t = s.replace(OVERSEAS_PREFIX_RE, '').trim();
    if (t && t !== s) push(t);
    const ns = s.replace(/\s+/g, '');
    if (ns && ns !== s) push(ns);
    for (const alt of MRT_COUNTRY_HINT_ALTS[s] || []) push(alt);
    for (const alt of MRT_COUNTRY_HINT_ALTS[s.toLowerCase()] || []) push(alt);
  }

  // primary는 countryHint로 따로 보내므로 alts만 반환
  return out.filter((c) => c.toLowerCase() !== primary.toLowerCase()).slice(0, 8);
}

function pushUnique(list, seen, raw) {
  const k = String(raw || '').trim().slice(0, 100);
  if (!k) return;
  const key = k.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(k);
}

/** 춘천시 → 춘천 등 — MRT CITY 매칭용 */
export function stripKoAdminSuffix(name) {
  const s = String(name || '').trim();
  if (!s || s.length < 3) return '';
  const stripped = s.replace(KO_ADMIN_SUFFIX_RE, '').trim();
  if (!stripped || stripped === s || stripped.length < 2) return '';
  return stripped;
}

/**
 * Edge cityHint용 — 동명 동(퇴계동→안동) 거부.
 * 해외는 state(Western Division 등)를 넣지 않음 — MRT blob에 없어 탈락 유발.
 * @param {object} admin
 * @param {{ isDomestic?: boolean }} [opts]
 * @returns {string[]}
 */
export function resolveMrtCityHints(admin, opts = {}) {
  const a = admin && typeof admin === 'object' ? admin : {};
  const isDomestic = Boolean(opts.isDomestic);
  const hints = [];
  const seen = new Set();
  pushUnique(hints, seen, a.city);
  pushUnique(hints, seen, stripKoAdminSuffix(a.city));
  pushUnique(hints, seen, a.cityEn);
  pushUnique(hints, seen, a.county);
  pushUnique(hints, seen, stripKoAdminSuffix(a.county));
  if (isDomestic) {
    pushUnique(hints, seen, a.state);
    pushUnique(hints, seen, stripKoAdminSuffix(a.state));
  }
  return hints.slice(0, 8);
}

/**
 * @param {object} location
 * @returns {{ keyword: string, altKeywords: string[], countryHint: string, countryHintAlts: string[], nameEn: string, cityHints: string[] }}
 */
export function resolveMrtStayQuery(location) {
  const slug = String(location?.slug || '').trim().toLowerCase();
  const override = MRT_STAY_KEYWORD_OVERRIDES[slug];
  const name = String(location?.name || '').trim();
  const nameEn = String(location?.name_en || '').trim();
  const nameKo = String(location?.name_ko || '').trim();
  const isDomestic = isMrtDomesticLocation(location);
  const countryHint = normalizeMrtCountryHint(location?.country, isDomestic);
  const countryEn = String(location?.country_en || '').trim();
  const admin = location?.stayAdmin && typeof location.stayAdmin === 'object'
    ? location.stayAdmin
    : {};

  const ladder = [];
  const seen = new Set();

  if (override?.keyword) pushUnique(ladder, seen, override.keyword);
  for (const k of override?.altKeywords || []) pushUnique(ladder, seen, k);

  const fineGrain = /[동읍면]$/.test(name) || /[동읍면]$/.test(admin.neighbourhood || '');

  const pushCityLadder = () => {
    pushUnique(ladder, seen, admin.city);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.city));
    pushUnique(ladder, seen, admin.cityEn);
    pushUnique(ladder, seen, admin.county);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.county));
  };

  const pushFineLadder = () => {
    pushUnique(ladder, seen, name);
    pushUnique(ladder, seen, nameKo);
    pushUnique(ladder, seen, admin.neighbourhood);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.neighbourhood || name));
    pushUnique(ladder, seen, admin.district);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.district));
  };

  // 국내 동·읍·면: 시·군 우선 — 「퇴계동」이 안동에 먼저 매칭되던 오탐 방지
  // 해외·비세밀: 세밀 키워드 우선
  if (fineGrain && isDomestic) {
    pushCityLadder();
    pushFineLadder();
  } else if (fineGrain) {
    pushFineLadder();
    pushCityLadder();
  } else {
    pushFineLadder();
    pushUnique(ladder, seen, admin.district);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.district));
    pushCityLadder();
  }

  pushUnique(ladder, seen, nameEn);
  if (isDomestic) {
    pushUnique(ladder, seen, admin.state);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.state));
  }

  const keyword = String(ladder[0] || '').trim();
  const altKeywords = ladder.slice(1, 10);
  const cityHints = resolveMrtCityHints(admin, { isDomestic });

  /** MRT subName 한·영·공백·영토 별칭 — Edge countryMatches(compact·세그먼트) */
  const countryHintAlts = expandMrtCountryHintAlts(
    countryHint,
    [countryEn, admin.country],
    { isDomestic },
  );

  return { keyword, altKeywords, countryHint, countryHintAlts, nameEn, cityHints };
}

/**
 * 숙소 토글 노출 — slug SSOT + uiPlace(국가·키워드 있을 때).
 * @param {object} location
 * @param {{ hidden?: boolean }} [opts]
 */
export function canShowMrtStayStrip(location, opts = {}) {
  if (opts.hidden || !location || location.isScanning) return false;
  if (isPlaceholderCountry(location.country) && isPlaceholderCountry(location.country_en)) {
    return false;
  }
  const query = resolveMrtStayQuery(location);
  return Boolean(query.keyword);
}
