/**
 * /korea · /korea/theme/scenic 최근 검색어 (localStorage).
 * 지구본 홈 exploreRecentHistory 와 키 분리.
 */

export const FESTIVAL_RECENT_SEARCH_KEY =
  'gateo:korea-festivals:v1:recent-searches';
export const SCENIC_RECENT_SEARCH_KEY = 'gateo:korea-scenic:v1:recent-searches';
export const MAX_RECENT_SEARCHES = 12;

/**
 * @param {string} key
 * @returns {string[]}
 */
export function loadRecentSearches(key) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/**
 * @param {string} key
 * @param {string[]} list
 */
function saveRecentSearches(key, list) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, MAX_RECENT_SEARCHES)));
  } catch {
    /* quota */
  }
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {string[]}
 */
export function pushRecentSearch(key, value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return loadRecentSearches(key);
  const next = [
    trimmed,
    ...loadRecentSearches(key).filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase(),
    ),
  ].slice(0, MAX_RECENT_SEARCHES);
  saveRecentSearches(key, next);
  return next;
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {string[]}
 */
export function removeRecentSearch(key, value) {
  const target = String(value || '').trim().toLowerCase();
  const next = loadRecentSearches(key).filter(
    (item) => item.toLowerCase() !== target,
  );
  saveRecentSearches(key, next);
  return next;
}

/**
 * @param {string} key
 * @returns {string[]}
 */
export function clearRecentSearches(key) {
  saveRecentSearches(key, []);
  return [];
}

/**
 * 입력어가 없으면 전체, 있으면 부분 일치(대소문자 무시).
 * @param {string[]} list
 * @param {string} draft
 * @returns {string[]}
 */
export function filterRecentSearches(list, draft) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const q = String(draft || '').trim().toLowerCase();
  if (!q) return list;
  return list.filter((item) => item.toLowerCase().includes(q));
}
