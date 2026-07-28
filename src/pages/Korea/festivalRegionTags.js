/**
 * 결과 addr1에서만 뽑는 지역 색인 (고정 corridor bbox 금지).
 * 대지역(시도) ≥2 · 시/군은 시도 선택 후이므로 ≥1. 구 단독 칩은 오탐 많아 제외.
 */

import koreaAreaCodes from '../Home/data/koreaAreaCodes.json' with { type: 'json' };
import { matchSido, matchSigungu, SIDO_ADDR_HINTS } from './koreaAreaFilter.js';
const MIN_COUNT = 2;
/** 시·군 칩 — 시도로 이미 좁힌 뒤라 1건도 노출 */
const CITY_MIN_COUNT = 1;

/** @type {{ id: string, label: string }[]} */
const SIDO_ORDER = Object.entries(koreaAreaCodes?.areas || {}).map(([id, entry]) => ({
  id: String(id),
  label: String(entry?.name || id),
}));

const CITY_TOKEN_RE = /([가-힣]{2,12}(?:시|군))/gu;

/**
 * @param {string} addr
 * @returns {string | null} areaCode
 */
export function detectSidoCode(addr) {
  const a = String(addr || '');
  if (!a) return null;
  for (const { id } of SIDO_ORDER) {
    if (matchSido(a, id)) return id;
  }
  return null;
}

/**
 * @param {string} addr
 * @returns {string[]} 시/군 라벨 (구 제외)
 */
export function extractCityLabels(addr) {
  const a = String(addr || '');
  if (!a) return [];
  const out = [];
  const seen = new Set();
  for (const m of a.matchAll(CITY_TOKEN_RE)) {
    const name = String(m[1] || '').trim();
    if (!name || seen.has(name)) continue;
    // 광역 본명·공식 접미사 스킵 (서울시·서울특별시·부산광역시 등)
    if (
      /^(서울|부산|대구|인천|광주|대전|울산|세종)시$/u.test(name) ||
      /^(서울특별시|세종특별자치시|(?:부산|대구|인천|광주|대전|울산)광역시)$/u.test(name)
    ) {
      continue;
    }
    seen.add(name);
    out.push(name);
  }
  return out;
}

/**
 * @param {object[]} items
 * @param {{ minCount?: number }} [opts]
 * @returns {{ id: string, label: string, count: number }[]}
 */
export function buildSidoTags(items, opts = {}) {
  const minCount = opts.minCount ?? MIN_COUNT;
  /** @type {Map<string, { id: string, label: string, count: number }>} */
  const counts = new Map();
  for (const item of items || []) {
    const code =
      (item?.areaCode != null && String(item.areaCode)) ||
      detectSidoCode(item?.addr1);
    if (!code) continue;
    const meta = SIDO_ORDER.find((s) => s.id === code);
    const label = meta?.label || SIDO_ADDR_HINTS[code]?.[0] || code;
    const prev = counts.get(code);
    if (prev) prev.count += 1;
    else counts.set(code, { id: code, label, count: 1 });
  }
  return SIDO_ORDER.map((s) => counts.get(s.id))
    .filter((t) => t && t.count >= minCount);
}

/**
 * @param {object[]} items — 이미 시도로 줄어든 결과 권장
 * @param {{ minCount?: number }} [opts]
 * @returns {{ id: string, label: string, count: number }[]}
 */
export function buildCityTags(items, opts = {}) {
  const minCount = opts.minCount ?? CITY_MIN_COUNT;
  /** @type {Map<string, { id: string, label: string, count: number }>} */
  const counts = new Map();
  for (const item of items || []) {
    const cities = extractCityLabels(item?.addr1);
    for (const label of cities) {
      const prev = counts.get(label);
      if (prev) prev.count += 1;
      else counts.set(label, { id: label, label, count: 1 });
    }
  }
  return [...counts.values()]
    .filter((t) => t.count >= minCount)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'));
}

/**
 * @param {object[]} items
 * @param {{ areaCode?: string, cityName?: string }} filter
 */
export function filterByRegion(items, filter = {}) {
  const list = Array.isArray(items) ? items : [];
  const areaCode = filter.areaCode;
  const cityName = filter.cityName;

  if ((!areaCode || areaCode === 'all') && (!cityName || cityName === 'all')) {
    return list;
  }

  return list.filter((item) => {
    const addr = item?.addr1 || '';
    if (areaCode && areaCode !== 'all' && !matchSido(addr, areaCode)) {
      return false;
    }
    if (cityName && cityName !== 'all') {
      return matchSigungu(addr, cityName);
    }
    return true;
  });
}

/**
 * 육지 인접 시도 (TourAPI areaCode). 제주·고립은 빈 배열.
 * 인근 칩은 이 표 ∩ 현재 결과 sidoChips 만 표시.
 */
const SIDO_NEIGHBORS = {
  1: ['31', '2'],
  2: ['1', '31'],
  3: ['33', '34', '37'],
  4: ['35', '36', '7'],
  5: ['38', '37'],
  6: ['36', '7'],
  7: ['6', '35', '36'],
  31: ['1', '2', '32', '33', '34'],
  32: ['31', '1', '33', '35'],
  33: ['31', '32', '34', '3', '35', '37'],
  34: ['31', '33', '3', '37'],
  35: ['32', '33', '4', '7', '36'],
  36: ['35', '4', '7', '6', '38', '37'],
  37: ['34', '33', '3', '5', '38', '36'],
  38: ['37', '5', '36'],
  39: [],
};

/**
 * @param {string} areaCode
 * @param {{ id: string, label: string, count: number }[]} sidoChips
 */
export function neighborSidoTags(areaCode, sidoChips) {
  if (!areaCode || areaCode === 'all') return [];
  const neigh = SIDO_NEIGHBORS[String(areaCode)] || [];
  if (!neigh.length) return [];
  const byId = new Map((sidoChips || []).map((s) => [String(s.id), s]));
  return neigh.map((id) => byId.get(String(id))).filter(Boolean);
}

/**
 * 지도 선택 리스트용 교차 탐색 칩: 선택 건 시도 + 최다 시도의 인근(결과 ∩).
 * @param {object[]} focusItems
 * @param {{ id: string, label: string, count: number }[]} sidoChips
 * @returns {{ id: string, label: string, count: number }[]}
 */
export function buildMapFocusRegionChips(focusItems, sidoChips) {
  const present = buildSidoTags(focusItems, { minCount: 1 });
  if (!present.length) return [];
  const top = [...present].sort((a, b) => b.count - a.count)[0];
  const neighbors = neighborSidoTags(top?.id, sidoChips);
  const seen = new Set(present.map((s) => String(s.id)));
  const out = [...present];
  for (const n of neighbors) {
    if (seen.has(String(n.id))) continue;
    seen.add(String(n.id));
    out.push(n);
  }
  return out;
}

/**
 * @param {string} areaCode
 */
export function sidoLabel(areaCode) {
  if (!areaCode || areaCode === 'all') return '';
  const hit = SIDO_ORDER.find((s) => s.id === String(areaCode));
  return hit?.label || SIDO_ADDR_HINTS[areaCode]?.[0] || '';
}

/**
 * 리스트 안내 문구용 시도 (강원도·경기도 등).
 * @param {string} areaCode
 */
export function sidoListPhrase(areaCode) {
  if (!areaCode || areaCode === 'all') return '';
  const hints = SIDO_ADDR_HINTS[String(areaCode)] || [];
  const shortDo = hints.find(
    (h) => /도$/u.test(h) && !/특별자치도$/u.test(h),
  );
  if (shortDo) return shortDo;
  if (hints[0]) return hints[0];
  return sidoLabel(areaCode);
}

/**
 * 리스트 안내 문구용 시·군 (춘천시 → 춘천).
 * @param {string} cityName
 */
export function cityListPhrase(cityName) {
  if (!cityName || cityName === 'all') return '';
  return String(cityName).replace(/(시|군)$/u, '');
}

export {
  MIN_COUNT as REGION_MIN_COUNT,
  CITY_MIN_COUNT,
  SIDO_ORDER,
  SIDO_NEIGHBORS,
};
