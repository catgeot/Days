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

function pushUnique(list, seen, raw) {
  const k = String(raw || '').trim();
  if (!k || k.length > 100) return;
  const key = k.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(k);
}

/**
 * @param {object} location
 * @returns {{ keyword: string, altKeywords: string[] }}
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

  if (override?.keyword) pushUnique(ladder, seen, override.keyword);
  for (const k of override?.altKeywords || []) pushUnique(ladder, seen, k);

  if (location?.uiPlace) {
    pushUnique(ladder, seen, String(location.originalQuery || '').trim());
  }

  const fineGrain =
    /[동읍면]$/.test(name) || /[동읍면]$/.test(admin.neighbourhood || '');

  const pushPlace = () => {
    pushUnique(ladder, seen, name);
    pushUnique(ladder, seen, nameKo);
  };

  const pushCity = () => {
    pushUnique(ladder, seen, parentCity);
    pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
    pushUnique(ladder, seen, admin.city);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.city));
    pushUnique(ladder, seen, admin.county);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.county));
  };

  // 국내 hub 명소·동읍면: 상위 시·군 우선 (문경새재→문경)
  if (parentCity && !fineGrain) {
    pushUnique(ladder, seen, parentCity);
    pushUnique(ladder, seen, stripKoAdminSuffix(parentCity));
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

  pushUnique(ladder, seen, nameEn);
  pushUnique(ladder, seen, admin.state);
  pushUnique(ladder, seen, stripKoAdminSuffix(admin.state));

  const keyword = String(ladder[0] || '').trim();
  const altKeywords = ladder.slice(1, 10);
  return { keyword, altKeywords };
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
