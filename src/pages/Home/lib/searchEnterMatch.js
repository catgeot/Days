/**
 * 탐색창 Enter — 타이핑 제안에 이미 보이는 장소를 AI 교정(화암동굴 등)보다 우선.
 * 지오코딩 실패 캐시·무드 폴백은 제안 이름과 쿼리가 맞을 때만.
 */
import { resolveCityAttractionHub, resolveHubAttraction } from './cityAttractionHubs.js';
import { resolveExploreSearchAlias } from './exploreSearchAliases.js';
import {
  isKoreaHomonymChoiceSet,
  shouldOfferKoreaHomonymDisambiguation,
} from './detectHomonymLocation.js';

export const normalizeSearchName = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

function levenshtein(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const prev = new Array(right.length + 1);
  const next = new Array(right.length + 1);
  for (let j = 0; j <= right.length; j += 1) prev[j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    next[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= right.length; j += 1) prev[j] = next[j];
  }
  return prev[right.length];
}

/**
 * 허브 명소·탐색 별칭이 있으면 공식명.
 * @param {string} query
 */
export function resolveEnterSearchCanonical(query) {
  const q = String(query || '').trim();
  if (!q) return '';
  const attraction = resolveHubAttraction(q);
  if (attraction?.attraction?.name) return attraction.attraction.name;
  const alias = resolveExploreSearchAlias(q);
  if (alias?.canonical) return alias.canonical;
  return q;
}

function itemSearchNames(item) {
  return [item?.name, item?.name_en, ...(item?.aliases || [])]
    .map(normalizeSearchName)
    .filter(Boolean);
}

/**
 * 쿼리가 장소명·별칭과 같은지. 짧은 prefix 스냅은 하지 않음.
 * 광천성굴↔광천선굴처럼 4자 이상 1글자 오타만 허용.
 * @param {string} query
 * @param {object} item
 */
export function placeNameMatchesSearchQuery(query, item) {
  const q = normalizeSearchName(query);
  if (!q || q.length < 2 || !item) return false;
  const canonical = normalizeSearchName(resolveEnterSearchCanonical(query));
  const names = itemSearchNames(item);
  for (const name of names) {
    if (name === q || (canonical && name === canonical)) return true;
    if (q.length >= 4 && name.length >= 4) {
      const lenDiff = Math.abs(q.length - name.length);
      if (lenDiff <= 1 && levenshtein(q, name) <= 1) return true;
    }
  }
  return false;
}

function hasUsableCoords(item) {
  const lat = Number(item?.lat);
  const lng = Number(item?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/**
 * @param {string} query
 * @param {object[]} suggestions
 */
export function pickEnterSuggestionMatches(query, suggestions) {
  return (suggestions || []).filter((item) => {
    if (!item?.name || item.source === 'mood') return false;
    if (!hasUsableCoords(item)) return false;
    return placeNameMatchesSearchQuery(query, item);
  });
}

/**
 * Enter가 고를 한 곳. 공식명 exact를 오타 매칭보다 앞세움.
 * @param {string} query
 * @param {object[]} suggestions
 */
export function preferEnterSuggestion(query, suggestions) {
  if (shouldOfferKoreaHomonymDisambiguation(query) || isKoreaHomonymChoiceSet(suggestions)) {
    return null;
  }
  // 도시 허브 exact(목포·속초) — 드롭다운에 도시 카드가 있어도 Enter는 선택 리스트
  if (resolveCityAttractionHub(query)) {
    return null;
  }
  const matches = pickEnterSuggestionMatches(query, suggestions);
  if (!matches.length) return null;
  const canonical = normalizeSearchName(resolveEnterSearchCanonical(query));
  const exact = matches.find((item) => normalizeSearchName(item.name) === canonical);
  return exact || matches[0];
}
