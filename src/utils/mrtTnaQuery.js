/**
 * 국내 TNA(투어·티켓) 검색 키워드 SSOT — 해외 GYG와 분기용.
 */
import {
  isMrtDomesticLocation,
  stripKoAdminSuffix,
} from './mrtStayQuery.js';

export { isMrtDomesticLocation };

/** slug → keyword 하드 오버라이드 (QA 후 최소만) */
const MRT_TNA_KEYWORD_OVERRIDES = {
  // 예: 'seongsan-ilchulbong': { keyword: '성산일출봉', altKeywords: ['제주'] },
};

/** 상위(hub) 관련도 통과 건수가 이 값 이하면 인근 첫 키워드로 보강 */
export const MRT_TNA_NEARBY_EXPAND_MAX = 3;

/**
 * 희소 TNA hub → 인근 한글 키워드(순서=자동보강→더보기).
 * hubId + 한글명. Phase 0 A표 · n≈0 키워드 제외.
 */
const MRT_TNA_NEARBY_EXPAND = {
  mungyeong: ['안동', '단양', '상주'],
  문경: ['안동', '단양', '상주'],
  yanggu: ['춘천', '인제', '설악산', '속초'],
  양구: ['춘천', '인제', '설악산', '속초'],
  jecheon: ['단양', '영월', '충주'],
  제천: ['단양', '영월', '충주'],
  andong: ['영주', '의성', '문경'],
  안동: ['영주', '의성', '문경'],
  suncheon: ['여수', '광양', '구례', '보성'],
  순천: ['여수', '광양', '구례', '보성'],
  boseong: ['여수', '장흥', '순천'],
  보성: ['여수', '장흥', '순천'],
  gurye: ['하동', '남원', '지리산', '순천'],
  구례: ['하동', '남원', '지리산', '순천'],
  namwon: ['전주', '구례', '지리산'],
  남원: ['전주', '구례', '지리산'],
  muju: ['대전', '전주', '덕유산'],
  무주: ['대전', '전주', '덕유산'],
  jeongseon: ['평창', '영월', '강릉', '태백'],
  정선: ['평창', '영월', '강릉', '태백'],
  taebaek: ['영월', '삼척', '동해', '정선'],
  태백: ['영월', '삼척', '동해', '정선'],
  yangpyeong: ['가평', '남이섬', '이천', '여주'],
  양평: ['가평', '남이섬', '이천', '여주'],
  pocheon: ['가평', '남이섬', '연천', '동두천'],
  포천: ['가평', '남이섬', '연천', '동두천'],
  boryeong: ['부여', '태안', '대천', '서산'],
  보령: ['부여', '태안', '대천', '서산'],
  taean: ['보령', '당진', '서산'],
  태안: ['보령', '당진', '서산'],
  ulleung: ['울릉도', '독도', '포항', '경주'],
  울릉: ['울릉도', '독도', '포항', '경주'],
  wando: ['여수', '해남', '목포'],
  완도: ['여수', '해남', '목포'],
  hapcheon: ['대구', '산청', '해인사'],
  합천: ['대구', '산청', '해인사'],
  geochang: ['산청', '대구', '합천'],
  거창: ['산청', '대구', '합천'],
  hamyang: ['산청', '지리산', '남원'],
  함양: ['산청', '지리산', '남원'],
  wonju: ['제천', '횡성', '충주', '여주'],
  원주: ['제천', '횡성', '충주', '여주'],
  chungju: ['단양', '음성', '제천'],
  충주: ['단양', '음성', '제천'],
  hwacheon: ['춘천', '인제'],
  화천: ['춘천', '인제'],
  cheorwon: ['춘천', '포천', '연천', '화천'],
  철원: ['춘천', '포천', '연천', '화천'],
};

function pushUnique(list, seen, raw) {
  const k = String(raw || '').trim();
  if (!k || k.length > 100) return;
  const key = k.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(k);
}

/** 한글 hub명 긴 것 우선 — 「문경석탄박물관」→ 문경 */
const NEARBY_HUB_KO_NAMES = Object.keys(MRT_TNA_NEARBY_EXPAND)
  .filter((k) => /[가-힣]/.test(k))
  .sort((a, b) => b.length - a.length);

function inferHubKoFromText(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  for (const hub of NEARBY_HUB_KO_NAMES) {
    if (text === hub || text.startsWith(hub)) return hub;
  }
  return '';
}

function resolveNearbyExpand(location) {
  const hubId = String(location?.hubId || '').trim().toLowerCase();
  const parent = String(location?.parentCity || '').trim();
  const slug = String(location?.slug || '').trim().toLowerCase();
  const name = String(location?.name || '').trim();
  const nameKo = String(location?.name_ko || '').trim();
  const originalQuery = String(location?.originalQuery || '').trim();
  const inferred =
    inferHubKoFromText(parent) ||
    inferHubKoFromText(name) ||
    inferHubKoFromText(nameKo) ||
    inferHubKoFromText(originalQuery);
  return (
    MRT_TNA_NEARBY_EXPAND[hubId] ||
    MRT_TNA_NEARBY_EXPAND[slug] ||
    MRT_TNA_NEARBY_EXPAND[parent] ||
    MRT_TNA_NEARBY_EXPAND[name] ||
    (inferred ? MRT_TNA_NEARBY_EXPAND[inferred] : null) ||
    []
  );
}

/**
 * @param {object} location
 * @returns {{ keyword: string, altKeywords: string[], nearbyKeywords: string[] }}
 */
export function resolveMrtTnaQuery(location) {
  const slug = String(location?.slug || '').trim().toLowerCase();
  const override = MRT_TNA_KEYWORD_OVERRIDES[slug];
  const name = String(location?.name || '').trim();
  const nameEn = String(location?.name_en || '').trim();
  const nameKo = String(location?.name_ko || '').trim();
  const parentCity = String(location?.parentCity || '').trim();
  const admin =
    location?.stayAdmin && typeof location.stayAdmin === 'object'
      ? location.stayAdmin
      : {};

  const ladder = [];
  const seen = new Set();
  const originalQuery = String(location?.originalQuery || '').trim();
  const inferredHubKo =
    inferHubKoFromText(parentCity) ||
    inferHubKoFromText(name) ||
    inferHubKoFromText(nameKo) ||
    inferHubKoFromText(originalQuery);

  if (override?.keyword) pushUnique(ladder, seen, override.keyword);
  for (const k of override?.altKeywords || []) pushUnique(ladder, seen, k);

  const fineGrain =
    /[동읍면]$/.test(name) || /[동읍면]$/.test(admin.neighbourhood || '');

  const pushPlace = () => {
    pushUnique(ladder, seen, name);
    pushUnique(ladder, seen, nameKo);
  };

  const pushCity = () => {
    pushUnique(ladder, seen, parentCity);
    pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
    pushUnique(ladder, seen, inferredHubKo);
    pushUnique(ladder, seen, admin.city);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.city));
    pushUnique(ladder, seen, admin.county);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.county));
  };

  // 국내 hub 명소·동읍면: 상위 시·군 우선 (문경석탄박물관→문경). originalQuery는 뒤로.
  if ((parentCity || inferredHubKo) && !fineGrain) {
    pushUnique(ladder, seen, parentCity);
    pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
    pushUnique(ladder, seen, inferredHubKo);
    pushPlace();
    pushCity();
  } else if (fineGrain) {
    pushCity();
    pushPlace();
    pushUnique(ladder, seen, admin.neighbourhood);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.neighbourhood || name));
  } else {
    pushPlace();
    pushCity();
  }

  if (location?.uiPlace) {
    pushUnique(ladder, seen, originalQuery);
  }

  // 국내 TNA는 한글 키워드 우선 — 영문 name_en(Valley 등)은 해외 와인투어 오탐
  const isDomestic = isMrtDomesticLocation(location);
  if (!isDomestic) {
    pushUnique(ladder, seen, nameEn);
  }
  pushUnique(ladder, seen, admin.state);
  pushUnique(ladder, seen, stripKoAdminSuffix(admin.state));

  // 인근은 상위 래더와 분리 — Edge가 ≤3일 때만 첫 인근으로 보강(Phase 2 더보기)
  const nearbyKeywords = isDomestic ? resolveNearbyExpand(location) : [];

  const keyword = String(ladder[0] || '').trim();
  const altKeywords = ladder.slice(1, 12);
  return { keyword, altKeywords, nearbyKeywords };
}

/**
 * keywordUsed가 인근 확장 키워드인지 (UI 안내 문구용).
 * @param {object} location
 * @param {string} keywordUsed
 */
export function isMrtTnaNearbyKeyword(location, keywordUsed) {
  const used = String(keywordUsed || '').trim();
  if (!used) return false;
  const nearby = resolveNearbyExpand(location);
  return nearby.some((k) => k === used);
}

/**
 * Phase 2: Edge가 nearbyKeywords[0] 자동보강한 뒤 다음 더보기 인덱스.
 * @param {string[]} nearbyKeywords
 * @param {string} keywordUsed
 * @returns {number}
 */
export function nextNearbyExpandIndex(nearbyKeywords, keywordUsed) {
  const list = Array.isArray(nearbyKeywords) ? nearbyKeywords : [];
  const used = String(keywordUsed || '').trim();
  if (!used || list.length === 0) return 0;
  const idx = list.findIndex((k) => k === used);
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * @param {string[]} nearbyKeywords
 * @param {number} nextIndex
 */
export function hasMoreNearbyExpand(nearbyKeywords, nextIndex) {
  const list = Array.isArray(nearbyKeywords) ? nearbyKeywords : [];
  const i = Math.max(0, Number(nextIndex) || 0);
  return i < list.length;
}

/**
 * Phase 3: 인근 칩 — Edge 보강 후 SSOT 길이 ≥2일 때만.
 * @param {string[]} nearbyKeywords
 * @param {boolean} nearbyExpanded
 */
export function canShowNearbyChips(nearbyKeywords, nearbyExpanded) {
  if (!nearbyExpanded) return false;
  const list = Array.isArray(nearbyKeywords) ? nearbyKeywords : [];
  return list.length >= 2;
}

/**
 * SSOT 순서상 아직 섹션에 없는 다음 인근 키워드 (더보기·칩 공통).
 * @param {string[]} nearbyKeywords
 * @param {Iterable<string>|string[]} loadedKeywords
 * @returns {string|null}
 */
export function nextUnloadedNearbyKeyword(nearbyKeywords, loadedKeywords) {
  const list = Array.isArray(nearbyKeywords) ? nearbyKeywords : [];
  const loaded = new Set(
    [...(loadedKeywords || [])].map((k) => String(k || '').trim()).filter(Boolean),
  );
  for (const kw of list) {
    const k = String(kw || '').trim();
    if (k && !loaded.has(k)) return k;
  }
  return null;
}

/**
 * 국내 「투어 찾기」탭 — 키워드 있을 때.
 * @param {object} location
 * @param {{ hidden?: boolean }} [opts]
 */
export function canShowMrtTnaStrip(location, opts = {}) {
  if (opts.hidden || !location || location.isScanning) return false;
  if (!isMrtDomesticLocation(location)) return false;
  const query = resolveMrtTnaQuery(location);
  return Boolean(query.keyword);
}
