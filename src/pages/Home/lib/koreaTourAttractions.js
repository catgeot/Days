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
  'content_id, title, addr1, addr2, area_code, mapx, mapy, first_image, active, cat1, cat2, cat3, modified_time';

/**
 * hub 시·군명 → addr1 ilike 패턴 (보령 / 보령시 / 보령군).
 * PostgREST `.or()` 특수문자 제거.
 * @param {string | null | undefined} hubName
 * @returns {string | null}
 */
export function scenicLocalityQueryForHubName(hubName) {
  const raw = String(hubName || '').trim();
  if (!raw) return null;
  const bare = raw
    .replace(/(특별자치시|광역시|특별시|자치시|시|군|구)$/u, '')
    .replace(/[,.()%]/g, '')
    .trim();
  return bare.length >= 2 ? bare : null;
}

/**
 * @param {{
 *   region?: string | null,
 *   areaCode?: string | null,
 *   areaCodes?: string[] | null,
 *   cat1?: string | null,
 *   cat2?: string | null,
 *   localityQuery?: string | null,
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
  const localityQuery = scenicLocalityQueryForHubName(opts.localityQuery);
  return { region, areaCode, areaCodes, cat1, cat2, localityQuery };
}

/**
 * @param {*} q
 * @param {{
 *   areaCodes?: string[] | null,
 *   cat1?: string | null,
 *   cat2?: string | null,
 *   localityQuery?: string | null,
 * }} filters
 */
function applyAttractionListFilters(q, filters) {
  let next = q;
  if (filters.areaCodes?.length) {
    next = next.in('area_code', filters.areaCodes);
  }
  if (filters.localityQuery) {
    const qLoc = filters.localityQuery;
    next = next.or(
      `addr1.ilike.%${qLoc}%,addr1.ilike.%${qLoc}시%,addr1.ilike.%${qLoc}군%`,
    );
  }
  if (filters.cat2) {
    next = next.eq('cat2', filters.cat2);
  } else if (filters.cat1) {
    next = next.eq('cat1', filters.cat1);
  }
  return next;
}

/** 수정일 내림차순 · 동률은 제목순 (TourAPI modifiedtime=YYYYMMDDHHMMSS 텍스트 정렬) */
function applyAttractionListOrder(q) {
  return q
    .order('modified_time', { ascending: false, nullsFirst: false })
    .order('title', { ascending: true });
}

/** 대표 이미지 있음 */
function applyHasImageFilter(q) {
  return q.not('first_image', 'is', null).neq('first_image', '');
}

/** 대표 이미지 없음 */
function applyNoImageFilter(q) {
  return q.or('first_image.is.null,first_image.eq.');
}

/**
 * @param {{
 *   region?: string | null,
 *   areaCode?: string | null,
 *   areaCodes?: string[] | null,
 *   cat1?: string | null,
 *   cat2?: string | null,
 *   localityQuery?: string | null,
 * }} [opts]
 * @returns {Promise<{ count: number, error: string | null }>}
 */
export async function countKoreaTourAttractions(opts = {}) {
  const filters = resolveAttractionFilters(opts);

  let q = supabase
    .from('tourapi_attraction')
    .select('content_id', { count: 'exact', head: true })
    .eq('active', true)
    .eq('content_type_id', '12');
  q = applyAttractionListFilters(q, filters);

  const { count, error } = await q;
  if (error) {
    console.warn('[koreaTourAttractions] count', error.message || error);
    return { count: 0, error: error.message || String(error) };
  }
  return { count: count ?? 0, error: null };
}

/**
 * 필터 칩용 건수.
 * - 권역(최상단 대분류)·시도: 종목 무관 **지역 전체** 수량
 * - 종목 대·소분류: 현재 권역·시도(·시군 hub) 아래 해당 종목 수량
 * @param {{
 *   region?: string | null,
 *   areaCode?: string | null,
 *   cat1?: string | null,
 *   cat2?: string | null,
 *   localityQuery?: string | null,
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
  const localityQuery = scenicLocalityQueryForHubName(opts.localityQuery);

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
      const { count, error } = await countKoreaTourAttractions({ region: r });
      if (error) errors.push(error);
      regionCounts[r] = count;
    }),
    ...listScenicRegionAreas(region).map(async (a) => {
      const { count, error } = await countKoreaTourAttractions({
        region,
        areaCode: a.code,
      });
      if (error) errors.push(error);
      areaCounts[a.code] = count;
    }),
    ...TOUR_ATTRACTION_CAT1.map(async (c) => {
      const { count, error } = await countKoreaTourAttractions({
        region,
        areaCode,
        cat1: c.code,
        localityQuery,
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
        localityQuery,
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
 *   localityQuery?: string | null,
 *   limit?: number,
 *   offset?: number,
 * }} [opts]
 */
export async function fetchKoreaTourAttractions(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 40, 1), 100);
  const offset = Math.max(Number(opts.offset) || 0, 0);
  const filters = resolveAttractionFilters(opts);

  const baseCount = () =>
    applyAttractionListFilters(
      supabase
        .from('tourapi_attraction')
        .select('content_id', { count: 'exact', head: true })
        .eq('active', true)
        .eq('content_type_id', '12'),
      filters,
    );

  const baseList = () =>
    applyAttractionListOrder(
      applyAttractionListFilters(
        supabase
          .from('tourapi_attraction')
          .select(LIST_SELECT)
          .eq('active', true)
          .eq('content_type_id', '12'),
        filters,
      ),
    );

  const { count: totalCount, error: totalErr } = await baseCount();
  if (totalErr) {
    console.warn('[koreaTourAttractions]', totalErr.message || totalErr);
    return { spots: [], count: 0, error: totalErr.message || String(totalErr) };
  }

  const { count: withImageCountRaw, error: withErr } = await applyHasImageFilter(
    baseCount(),
  );
  if (withErr) {
    console.warn('[koreaTourAttractions] with-image count', withErr.message || withErr);
    return { spots: [], count: 0, error: withErr.message || String(withErr) };
  }

  const withImageCount = withImageCountRaw ?? 0;
  /** @type {Record<string, unknown>[]} */
  const rows = [];

  if (offset < withImageCount) {
    const take = Math.min(limit, withImageCount - offset);
    const { data, error } = await applyHasImageFilter(baseList()).range(
      offset,
      offset + take - 1,
    );
    if (error) {
      console.warn('[koreaTourAttractions]', error.message || error);
      return { spots: [], count: 0, error: error.message || String(error) };
    }
    rows.push(...(data || []));
  }

  if (rows.length < limit) {
    const withoutOffset = Math.max(0, offset - withImageCount);
    const take = limit - rows.length;
    const { data, error } = await applyNoImageFilter(baseList()).range(
      withoutOffset,
      withoutOffset + take - 1,
    );
    if (error) {
      console.warn('[koreaTourAttractions]', error.message || error);
      return { spots: [], count: 0, error: error.message || String(error) };
    }
    rows.push(...(data || []));
  }

  const spots = rows.map(mapTourAttractionRow).filter(Boolean);
  return { spots, count: totalCount ?? spots.length, error: null };
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
