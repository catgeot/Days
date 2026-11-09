/**
 * TourAPI searchKeyword 부분일치 — 음식점(39·cat1 A05)만 탐색 제안에 붙인다.
 */
import { invokeTourApiProxy, TOUR_API_BODY_LOCALE } from '../../../utils/tourApiProxy.js';
import { mapTourAttractionRow } from './koreaTourAttractionMap.js';
import { tourRowTitleMatchesCompactQuery } from './koreaTourAttractionTitleMatch.js';
import { enrichSearchCandidateScenicMedia } from './koreaLocalScenicLists.js';
import { isExploreRestaurantItem } from '../../../shared/search/tourRestaurantDetect.js';
import { tourRestaurantToExploreSuggestion } from './tourRestaurantExploreSuggestion.js';

const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;

function mapSearchKeywordRestaurantRow(item) {
  const contentId = String(item?.contentId || item?.contentid || '').trim();
  const title = String(item?.title || '').trim();
  if (!contentId || !title) return null;
  return {
    content_id: contentId,
    content_type_id: String(
      item?.contentTypeId || item?.contenttypeid || item?.content_type_id || '39',
    ).trim(),
    title,
    addr1: item?.addr1 != null ? String(item.addr1) : '',
    addr2: item?.addr2 != null ? String(item.addr2) : '',
    area_code: item?.areaCode != null ? String(item.areaCode) : item?.areacode,
    sigungu_code: item?.sigunguCode != null ? String(item.sigunguCode) : item?.sigungucode,
    mapx: item?.mapx,
    mapy: item?.mapy,
    first_image: item?.firstimage || item?.firstImage || item?.imageUrl || '',
    active: true,
    cat1: item?.cat1,
    cat2: item?.cat2,
    cat3: item?.cat3,
  };
}

function isRestaurantKeywordItem(item) {
  const type = String(item?.contentTypeId || item?.contenttypeid || item?.content_type_id || '').trim();
  if (type === '39') return true;
  const cat1 = String(item?.cat1 || '').trim().toUpperCase();
  if (cat1 === 'A05' || cat1.startsWith('A05')) return true;
  const cat3 = String(item?.cat3 || '').trim().toUpperCase();
  return cat3.startsWith('A0502');
}

function titlePartiallyMatchesQuery(query, title) {
  const q = String(query || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  const t = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  if (q.length < 2 || t.length < 2) return false;
  if (t === q) return true;
  return t.includes(q);
}

/**
 * @param {string} query
 * @param {{ lookupItems?: (keyword: string) => Promise<object[]>, max?: number }} [opts]
 * @returns {Promise<object[]>}
 */
export async function collectExploreRestaurantKeywordMatches(query, opts = {}) {
  const q = String(query || '').trim();
  if (!q || !HAS_HANGUL_RE.test(q)) return [];

  let items = [];
  if (typeof opts.lookupItems === 'function') {
    items = await opts.lookupItems(q);
  } else {
    try {
      const res = await invokeTourApiProxy(
        'searchKeyword',
        { keyword: q, numOfRows: 24, pageNo: 1 },
        { locale: TOUR_API_BODY_LOCALE },
      );
      items = Array.isArray(res?.items) ? res.items : [];
    } catch {
      return [];
    }
  }

  const max = Math.min(Math.max(Number(opts.max) || 12, 1), 24);
  const out = [];
  const seen = new Set();

  for (const raw of items) {
    if (!isRestaurantKeywordItem(raw)) continue;
    if (!titlePartiallyMatchesQuery(q, raw?.title)) continue;
    const row = mapSearchKeywordRestaurantRow(raw);
    if (!row) continue;
    let spot = mapTourAttractionRow({ ...row, content_type_id: row.content_type_id });
    if (!spot) continue;
    spot = { ...spot, contentTypeId: row.content_type_id, content_type_id: row.content_type_id };
    if (!isExploreRestaurantItem(spot) && !isExploreRestaurantItem(raw)) continue;
    if (
      !tourRowTitleMatchesCompactQuery(spot, q) &&
      !titlePartiallyMatchesQuery(q, spot.name)
    ) {
      continue;
    }
    const key = String(spot.contentId || spot.name || '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const suggestion = tourRestaurantToExploreSuggestion(spot, { query: q });
    if (suggestion) out.push(enrichSearchCandidateScenicMedia(suggestion));
    if (out.length >= max) break;
  }
  return out;
}
