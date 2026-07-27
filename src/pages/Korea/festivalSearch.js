/**
 * /korea 축제 텍스트 검색 — title·addr1 부분 일치.
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
 * @param {object[]} items
 * @param {string} query
 */
export function filterBySearchQuery(items, query) {
  const q = normalizeFestivalQuery(query);
  if (!q) return Array.isArray(items) ? items : [];
  return (items || []).filter((item) => {
    const title = normalizeFestivalQuery(item?.title);
    const addr = normalizeFestivalQuery(item?.addr1);
    return title.includes(q) || addr.includes(q);
  });
}
