/**
 * /korea/theme/scenic 텍스트 검색 — name·addr·지역 부분 일치.
 * (호출측: 전국 풀에서 매칭한 뒤 권역·종목 칩으로 분해)
 */

/**
 * @param {string} value
 */
export function normalizeScenicQuery(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/**
 * PostgREST `.or()` / ilike 패턴용 — 특수문자 제거·길이 제한.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function sanitizeScenicDbSearchQuery(value) {
  return String(value || '')
    .trim()
    .replace(/[,.()%*_'"\\]/g, '')
    .slice(0, 40);
}

/**
 * @param {object} spot
 * @param {string} normalizedQuery
 */
function spotMatchesScenicQuery(spot, normalizedQuery) {
  if (!normalizedQuery) return true;
  const hay = [
    spot?.name,
    spot?.attractionName,
    spot?.attractionNameEn,
    spot?.addr1,
    spot?.addr2,
    spot?.blurb,
    spot?.region,
    spot?.locality,
    spot?.areaLabel,
    spot?.nameHanja,
  ]
    .map((v) => normalizeScenicQuery(v))
    .filter(Boolean)
    .join('');
  return hay.includes(normalizedQuery);
}

/**
 * @param {object[]} items
 * @param {string} query
 */
export function filterScenicSpotsByQuery(items, query) {
  const q = normalizeScenicQuery(query);
  if (!q) return Array.isArray(items) ? items : [];
  return (items || []).filter((item) => spotMatchesScenicQuery(item, q));
}

/**
 * TourAPI 권역 건수 → 최다 권역 (동점이면 regionOrder 앞쪽).
 * 부분일치 오탐(성주→보령 성주면, 함안로 등)보다 본 지역 건수를 고른다.
 *
 * @param {string[]} regionOrder
 * @param {Record<string, number> | null | undefined} regionCounts
 * @param {string} fallback
 */
export function pickBestRegionByCounts(regionOrder, regionCounts, fallback) {
  const order = Array.isArray(regionOrder) ? regionOrder : [];
  let best = null;
  let bestN = 0;
  for (const r of order) {
    const n = Number(regionCounts?.[r]) || 0;
    if (n > bestN) {
      bestN = n;
      best = r;
    }
  }
  return best || fallback;
}
