import { invokeTourApiProxy } from './tourApiProxy.js';
import { resolveTourApiPlace } from './tourApiMatch.js';

function compactTitle(value) {
  return String(value || '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function contentIdOf(item) {
  const id = String(item?.contentId || item?.contentid || '').trim();
  return /^\d{1,32}$/.test(id) ? id : '';
}

/**
 * searchKeyword 결과에서 장소명과 같은 제목을 고른다.
 * 더 긴 시설명(흥정계곡오토캠핑장)보다 완전 일치를 쓰고,
 * 시군 허브 id는 여기서 다루지 않는다.
 * @param {Array<Record<string, unknown>> | null | undefined} items
 * @param {string} placeName
 * @returns {string}
 */
export function pickTourKeywordContentId(items, placeName) {
  const want = compactTitle(placeName);
  if (want.length < 2) return '';
  let bestId = '';
  let bestScore = 0;
  for (const item of items || []) {
    const title = compactTitle(item?.title);
    const id = contentIdOf(item);
    if (!title || !id) continue;
    let score = 0;
    if (title === want) score = 1000;
    else if (title.startsWith(want) || want.startsWith(title) || want.includes(title)) {
      const shared = Math.min(title.length, want.length);
      if (shared < 3) continue;
      score = 400 + shared - Math.abs(title.length - want.length);
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }
  return bestId;
}

/**
 * @param {string} placeName
 * @returns {Promise<string>}
 */
export async function lookupTourContentIdByName(placeName) {
  const name = String(placeName || '').trim();
  if (name.length < 2) return '';
  const queries = [name];
  const parts = name.split(/\s+/).filter(Boolean);
  const tail = parts.length > 1 ? parts[parts.length - 1] : '';
  if (tail.length >= 3 && tail !== name) queries.push(tail);

  for (const keyword of queries) {
    try {
      const res = await invokeTourApiProxy('searchKeyword', {
        keyword,
        numOfRows: 8,
        pageNo: 1,
      });
      const id = pickTourKeywordContentId(res?.items, name);
      if (id) return id;
    } catch {
      /* 다음 검색어 */
    }
  }
  return '';
}

function plainOverview(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string | { slug?: string, name?: string, contentId?: string }} locationOrName
 * @returns {string}
 */
export function resolveTourContentIdForLocation(locationOrName) {
  if (locationOrName == null) return '';
  if (typeof locationOrName === 'string') {
    const mapping = resolveTourApiPlace(locationOrName);
    const id = String(mapping?.contentId || '').trim();
    return /^\d{1,32}$/.test(id) ? id : '';
  }
  const mapping = resolveTourApiPlace(locationOrName);
  const fromMapping = String(mapping?.contentId || '').trim();
  if (/^\d{1,32}$/.test(fromMapping)) return fromMapping;
  const explicit = String(locationOrName.contentId || '').trim();
  return /^\d{1,32}$/.test(explicit) ? explicit : '';
}

/**
 * @param {string | Record<string, unknown>} locationOrName
 * @returns {Promise<string>}
 */
export async function fetchDomesticTourOverviewForLocation(locationOrName) {
  let contentId = resolveTourContentIdForLocation(locationOrName);
  if (!contentId) {
    const name =
      typeof locationOrName === 'string'
        ? locationOrName
        : String(locationOrName?.name || resolveTourApiPlace(locationOrName)?.title || '').trim();
    contentId = await lookupTourContentIdByName(name);
  }
  if (!contentId) return '';
  try {
    const common = await invokeTourApiProxy('detailCommon', { contentId });
    const text = plainOverview(common?.items?.[0]?.overview);
    return text.length >= 40 ? text : '';
  } catch {
    return '';
  }
}

/**
 * 국내 미등록 명소 — place_chat_intro가 없을 때 Tour 본문 (main: searchKeyword → detailCommon).
 * @param {string} placeName
 * @returns {Promise<string>}
 */
export async function fetchDomesticTourOverview(placeName) {
  const contentId = await lookupTourContentIdByName(placeName);
  if (!contentId) return '';
  try {
    const common = await invokeTourApiProxy('detailCommon', { contentId });
    const text = plainOverview(common?.items?.[0]?.overview);
    return text.length >= 40 ? text : '';
  } catch {
    return '';
  }
}
