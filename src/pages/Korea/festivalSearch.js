/**
 * /korea 축제 텍스트 검색 — title·addr1 부분 일치.
 * (호출측: 검색 활성 시 시간 탭을 넘어 롤링 12개월 풀에서 걸러야 겨울 축제 등이 잡힘)
 */

/**
 * @param {string} value
 */
export function normalizeFestivalQuery(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/**
 * @param {string} query
 * @returns {string[]}
 */
export function festivalSearchQueryTokens(query) {
  const raw = String(query || '').trim();
  if (!raw) return [];
  if (/\s/.test(raw)) {
    const spaced = raw.split(/\s+/).map((part) => normalizeFestivalQuery(part)).filter(Boolean);
    if (spaced.length > 1 && spaced.every((tok) => tok.length >= 2)) {
      return spaced;
    }
  }
  const single = normalizeFestivalQuery(raw);
  return single ? [single] : [];
}

/**
 * @param {object[]} items
 * @param {string} query
 */
export function filterBySearchQuery(items, query) {
  const tokens = festivalSearchQueryTokens(query);
  if (!tokens.length) return Array.isArray(items) ? items : [];
  return (items || []).filter((item) => {
    const title = normalizeFestivalQuery(item?.title);
    const addr = normalizeFestivalQuery(item?.addr1);
    return tokens.every(
      (tok) => title.includes(tok) || addr.includes(tok),
    );
  });
}
