import { supabase } from '../../../shared/api/supabase';
import {
  listTourAttractionCat2,
  normalizeTourAttractionCat1,
  normalizeTourAttractionCat2,
  TOUR_ATTRACTION_CAT1,
} from './koreaTourAttractionCategories';
import {
  labelScenicAreaCode,
  listScenicRegionAreas,
  mapTourAttractionRow,
  normalizeScenicAreaCode,
  SCENIC_REGION_AREA_CODES,
  SCENIC_REGION_ORDER,
  scenicAreaCodeForHubId,
  scenicRegionForAreaCode,
} from './koreaTourAttractionMap';

export {
  labelScenicAreaCode,
  listScenicRegionAreas,
  mapTourAttractionRow,
  normalizeScenicAreaCode,
  SCENIC_REGION_AREA_CODES,
  SCENIC_REGION_ORDER,
  scenicAreaCodeForHubId,
  scenicRegionForAreaCode,
};

const LIST_SELECT =
  'content_id, title, addr1, addr2, area_code, mapx, mapy, first_image, active, cat1, cat2, cat3';

/**
 * @param {{
 *   region?: string | null,
 *   areaCode?: string | null,
 *   areaCodes?: string[] | null,
 *   cat1?: string | null,
 *   cat2?: string | null,
 * }} [opts]
 */
function resolveAttractionFilters(opts = {}) {
  const region =
    opts.region && opts.region !== '전체' ? String(opts.region).trim() : null;
  const areaCode = normalizeScenicAreaCode(region, opts.areaCode);
  let areaCodes = Array.isArray(opts.areaCodes) ? opts.areaCodes.filter(Boolean) : null;
  if (areaCode) {
    areaCodes = [areaCode];
  } else if ((!areaCodes || !areaCodes.length) && region) {
    areaCodes = SCENIC_REGION_AREA_CODES[region] || null;
  }
  const cat1 = normalizeTourAttractionCat1(opts.cat1);
  const cat2 = normalizeTourAttractionCat2(cat1, opts.cat2);
  return { region, areaCode, areaCodes, cat1, cat2 };
}

/**
 * @param {{
 *   region?: string | null,
 *   areaCode?: string | null,
 *   areaCodes?: string[] | null,
 *   cat1?: string | null,
 *   cat2?: string | null,
 * }} [opts]
 * @returns {Promise<{ count: number, error: string | null }>}
 */
export async function countKoreaTourAttractions(opts = {}) {
  const { areaCodes, cat1, cat2 } = resolveAttractionFilters(opts);

  let q = supabase
    .from('tourapi_attraction')
    .select('content_id', { count: 'exact', head: true })
    .eq('active', true)
    .eq('content_type_id', '12');

  if (areaCodes?.length) {
    q = q.in('area_code', areaCodes);
  }
  if (cat2) {
    q = q.eq('cat2', cat2);
  } else if (cat1) {
    q = q.eq('cat1', cat1);
  }

  const { count, error } = await q;
  if (error) {
    console.warn('[koreaTourAttractions] count', error.message || error);
    return { count: 0, error: error.message || String(error) };
  }
  return { count: count ?? 0, error: null };
}

/**
 * 필터 칩용 건수 — 다른 차원은 현재 선택 유지, 해당 차원만 칩별로 집계.
 * @param {{
 *   region?: string | null,
 *   areaCode?: string | null,
 *   cat1?: string | null,
 *   cat2?: string | null,
 * }} [opts]
 * @returns {Promise<{
 *   regionCounts: Record<string, number>,
 *   areaCounts: Record<string, number>,
 *   cat1Counts: Record<string, number>,
 *   cat2Counts: Record<string, number>,
 *   error: string | null,
 * }>}
 */
export async function fetchScenicFilterChipCounts(opts = {}) {
  const region =
    opts.region && opts.region !== '전체' ? String(opts.region).trim() : null;
  const areaCode = normalizeScenicAreaCode(region, opts.areaCode);
  const cat1 = normalizeTourAttractionCat1(opts.cat1);
  const cat2 = normalizeTourAttractionCat2(cat1, opts.cat2);

  /** @type {Record<string, number>} */
  const regionCounts = {};
  /** @type {Record<string, number>} */
  const areaCounts = {};
  /** @type {Record<string, number>} */
  const cat1Counts = {};
  /** @type {Record<string, number>} */
  const cat2Counts = {};

  /** @type {string[]} */
  const errors = [];

  const jobs = [
    ...SCENIC_REGION_ORDER.map(async (r) => {
      const { count, error } = await countKoreaTourAttractions({
        region: r,
        cat1,
        cat2,
      });
      if (error) errors.push(error);
      regionCounts[r] = count;
    }),
    ...listScenicRegionAreas(region).map(async (a) => {
      const { count, error } = await countKoreaTourAttractions({
        region,
        areaCode: a.code,
        cat1,
        cat2,
      });
      if (error) errors.push(error);
      areaCounts[a.code] = count;
    }),
    ...TOUR_ATTRACTION_CAT1.map(async (c) => {
      const { count, error } = await countKoreaTourAttractions({
        region,
        areaCode,
        cat1: c.code,
      });
      if (error) errors.push(error);
      cat1Counts[c.code] = count;
    }),
    ...listTourAttractionCat2(cat1).map(async (c) => {
      const { count, error } = await countKoreaTourAttractions({
        region,
        areaCode,
        cat1,
        cat2: c.code,
      });
      if (error) errors.push(error);
      cat2Counts[c.code] = count;
    }),
  ];

  await Promise.all(jobs);
  return {
    regionCounts,
    areaCounts,
    cat1Counts,
    cat2Counts,
    error: errors[0] || null,
  };
}

/**
 * @param {{
 *   region?: string | null,
 *   areaCode?: string | null,
 *   areaCodes?: string[] | null,
 *   cat1?: string | null,
 *   cat2?: string | null,
 *   limit?: number,
 *   offset?: number,
 * }} [opts]
 */
export async function fetchKoreaTourAttractions(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 40, 1), 100);
  const offset = Math.max(Number(opts.offset) || 0, 0);
  const { areaCodes, cat1, cat2 } = resolveAttractionFilters(opts);

  let q = supabase
    .from('tourapi_attraction')
    .select(LIST_SELECT, { count: 'exact' })
    .eq('active', true)
    .eq('content_type_id', '12')
    .order('title', { ascending: true })
    .range(offset, offset + limit - 1);

  if (areaCodes?.length) {
    q = q.in('area_code', areaCodes);
  }
  if (cat2) {
    q = q.eq('cat2', cat2);
  } else if (cat1) {
    q = q.eq('cat1', cat1);
  }

  const { data, error, count } = await q;
  if (error) {
    console.warn('[koreaTourAttractions]', error.message || error);
    return { spots: [], count: 0, error: error.message || String(error) };
  }
  const spots = (data || []).map(mapTourAttractionRow).filter(Boolean);
  return { spots, count: count ?? spots.length, error: null };
}

/**
 * @param {string} contentId
 */
export async function fetchKoreaTourAttractionById(contentId) {
  const id = String(contentId || '').trim();
  if (!/^\d{1,32}$/.test(id)) return null;
  const { data, error } = await supabase
    .from('tourapi_attraction')
    .select(LIST_SELECT)
    .eq('content_id', id)
    .eq('active', true)
    .maybeSingle();
  if (error) {
    console.warn('[koreaTourAttractions] byId', error.message || error);
    return null;
  }
  return data ? mapTourAttractionRow(data) : null;
}
