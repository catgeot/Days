/**
 * 결과 addr1에서만 뽑는 지역 색인 (고정 corridor bbox 금지 · 건수≥N만).
 * 대지역(시도) → 시/군. 구 단독 칩은 오탐 많아 제외.
 */

import koreaAreaCodes from '../Home/data/koreaAreaCodes.json' with { type: 'json' };
import { matchSido, matchSigungu, SIDO_ADDR_HINTS } from './koreaAreaFilter';

const MIN_COUNT = 2;

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
    // 광역시 본명과 동일 토큰 스킵 (부산시 등 비표준)
    if (/^(서울|부산|대구|인천|광주|대전|울산|세종)시$/u.test(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

/**
 * @param {object[]} items
 * @returns {{ id: string, label: string, count: number }[]}
 */
export function buildSidoTags(items) {
  /** @type {Map<string, { id: string, label: string, count: number }>} */
  const counts = new Map();
  for (const item of items || []) {
    const code = detectSidoCode(item?.addr1);
    if (!code) continue;
    const meta = SIDO_ORDER.find((s) => s.id === code);
    const label = meta?.label || SIDO_ADDR_HINTS[code]?.[0] || code;
    const prev = counts.get(code);
    if (prev) prev.count += 1;
    else counts.set(code, { id: code, label, count: 1 });
  }
  return SIDO_ORDER.map((s) => counts.get(s.id))
    .filter((t) => t && t.count >= MIN_COUNT);
}

/**
 * @param {object[]} items — 이미 시도로 줄어든 결과 권장
 * @returns {{ id: string, label: string, count: number }[]}
 */
export function buildCityTags(items) {
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
    .filter((t) => t.count >= MIN_COUNT)
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

export { MIN_COUNT as REGION_MIN_COUNT, SIDO_ORDER };
