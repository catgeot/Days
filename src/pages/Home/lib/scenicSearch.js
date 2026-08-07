/**
 * /korea/theme/scenic 텍스트 검색 — name·addr·지역 부분 일치.
 * (호출측: 검색 활성 시 권역·종목 칩을 넘어 전국 풀에서 걸러야 함)
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
