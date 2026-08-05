import { supabase } from '../../../shared/api/supabase';
import {
  normalizeTourAttractionCat1,
  normalizeTourAttractionCat2,
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
 *   limit?: number,
 *   offset?: number,
 * }} [opts]
 */
export async function fetchKoreaTourAttractions(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 40, 1), 100);
  const offset = Math.max(Number(opts.offset) || 0, 0);
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
