import { resolveFestivalThemeCrossLinks } from '../../Home/lib/koreaThemeCrossLinks.js';
import { detectSidoCode } from '../festivalRegionTags.js';
import { festivalLngLat } from '../koreaFestivalCorridors.js';
import { worldEventFromTourApiFestival } from '../worldEventFromTourApiFestival.js';
import { tripWindowPresetsFromEvent } from '../../../utils/worldEventTripPresets.js';
import { canShowMrtStayStrip } from '../../../utils/mrtStayQuery.js';
import { canShowMrtTnaStrip } from '../../../utils/mrtTnaQuery.js';

export const FESTIVAL_DETAIL_SECTION_IDS = [
  'nearAttractions',
  'lodging',
  'packages',
  'nearFood',
  'nearLeports',
  'nearCulture',
  'nearCourses',
];

function festivalAreaCodeFromItem(item) {
  const code = item?.areaCode ?? item?.areacode ?? detectSidoCode(item?.addr1);
  return code != null ? String(code).trim() : '';
}

export function resolveFestivalCrossForItem(item, opts = {}) {
  const areaCode = festivalAreaCodeFromItem(item);
  return resolveFestivalThemeCrossLinks(item, {
    areaCode,
    region: opts.region,
    utmContentPrefix: 'korea-festival-section-scan',
  });
}

export function festivalStayHubId(festivalCross) {
  const loc = festivalCross?.stay?.location;
  return (
    String(loc?.hubId || loc?.slug || festivalCross?.nearbyHubs?.[0]?.hubId || '').trim() ||
    ''
  );
}

export function evaluateFestivalLodging(festivalCross, item, opts = {}) {
  const legacy = Boolean(opts.legacyCategoryInference);
  const location = festivalCross?.stay?.location;
  if (!location) {
    return { shell: 'hidden', strip: 'hidden', reason: 'no_stay_location' };
  }
  const event = worldEventFromTourApiFestival(item);
  if (!event) {
    return { shell: 'visible', strip: 'hidden', reason: 'no_event_adapter' };
  }
  const presets = tripWindowPresetsFromEvent(event);
  if (!presets?.tripWindow?.checkIn || !presets?.tripWindow?.checkOut) {
    return { shell: 'visible', strip: 'hidden', reason: 'no_trip_dates' };
  }
  if (!canShowMrtStayStrip(location, { legacyCategoryInference: legacy })) {
    return { shell: 'visible', strip: 'hidden', reason: 'canShowMrtStayStrip_false' };
  }
  return { shell: 'visible', strip: 'visible', reason: '' };
}

export function evaluateFestivalPackages(festivalCross) {
  const showTnaStrip =
    Boolean(
      (festivalCross?.tna?.location || festivalCross?.stay?.location) &&
        festivalCross?.tna?.keyword,
    );
  const tnaKw = String(festivalCross?.tna?.keyword || '').trim();
  const packageCta = festivalCross?.packageCta?.url;
  const shellVisible =
    showTnaStrip || ((!showTnaStrip && tnaKw) || Boolean(packageCta));
  if (!shellVisible) {
    return { shell: 'hidden', content: 'hidden', reason: 'no_tna_keyword_or_cta' };
  }
  if (showTnaStrip) {
    const location = festivalCross?.tna?.location || festivalCross?.stay?.location;
    if (!canShowMrtTnaStrip(location)) {
      return { shell: 'visible', content: 'hidden', reason: 'canShowMrtTnaStrip_false' };
    }
    return { shell: 'visible', content: 'visible', reason: 'tna_strip' };
  }
  if (packageCta) {
    return { shell: 'visible', content: 'visible', reason: 'package_cta' };
  }
  return { shell: 'visible', content: 'visible', reason: 'tna_search_link' };
}

function evaluateCoordsGatedSection(status, spotCount, { emptyNeedsNoLocalScenic = false, hasLocalScenic = false } = {}) {
  if (status === 'idle' || status === 'nocoords') {
    return { shell: 'hidden', content: 'n/a', reason: status };
  }
  if (status === 'loading') {
    return { shell: 'visible', content: 'loading', reason: 'fetch_pending' };
  }
  if (status === 'error' && !spotCount) {
    return { shell: 'visible', content: 'empty', reason: 'fetch_error' };
  }
  if (status === 'empty') {
    if (emptyNeedsNoLocalScenic && hasLocalScenic) {
      return { shell: 'visible', content: 'visible', reason: 'local_scenic_only' };
    }
    return { shell: 'visible', content: 'empty', reason: 'no_data' };
  }
  if (spotCount > 0) {
    return { shell: 'visible', content: 'visible', reason: 'has_items' };
  }
  return { shell: 'visible', content: 'empty', reason: 'no_data' };
}

export function evaluateFestivalCourses(areaCode, status, spotCount) {
  if (!areaCode) {
    return { shell: 'hidden', content: 'n/a', reason: 'noarea' };
  }
  if (status === 'loading') {
    return { shell: 'visible', content: 'loading', reason: 'fetch_pending' };
  }
  if (status === 'error' && !spotCount) {
    return { shell: 'visible', content: 'empty', reason: 'fetch_error' };
  }
  if (status === 'empty' || !spotCount) {
    return { shell: 'visible', content: 'empty', reason: 'no_data' };
  }
  return { shell: 'visible', content: 'visible', reason: 'has_items' };
}

/**
 * @param {Record<string, unknown>} item
 * @param {{
 *   festivalCross?: ReturnType<typeof resolveFestivalThemeCrossLinks>,
 *   legacyCategoryInference?: boolean,
 *   nearby?: {
 *     attractions?: { status: string, count: number, hasLocalScenic?: boolean },
 *     food?: { status: string, count: number },
 *     leports?: { status: string, count: number },
 *     culture?: { status: string, count: number },
 *     courses?: { status: string, count: number },
 *   },
 * }} [opts]
 */
export function evaluateFestivalDetailSections(item, opts = {}) {
  const pt = festivalLngLat(item?.mapx, item?.mapy);
  const areaCode = festivalAreaCodeFromItem(item);
  const festivalCross = opts.festivalCross || resolveFestivalCrossForItem(item);
  const hubId = festivalStayHubId(festivalCross);
  const hubName =
    festivalCross?.nearbyHubs?.[0]?.name ||
    festivalCross?.stay?.location?.name ||
    hubId;

  const lodging = evaluateFestivalLodging(festivalCross, item, {
    legacyCategoryInference: opts.legacyCategoryInference,
  });
  const packages = evaluateFestivalPackages(festivalCross);

  const nb = opts.nearby || {};
  const coordsStatus = pt ? 'awaiting_fetch' : 'nocoords';
  const nearAttractions = evaluateCoordsGatedSection(
    nb.attractions?.status ?? (pt ? coordsStatus : 'nocoords'),
    nb.attractions?.count ?? 0,
    {
      emptyNeedsNoLocalScenic: true,
      hasLocalScenic: Boolean(nb.attractions?.hasLocalScenic),
    },
  );
  const nearFood = evaluateCoordsGatedSection(
    nb.food?.status ?? (pt ? coordsStatus : 'nocoords'),
    nb.food?.count ?? 0,
  );
  const nearLeports = evaluateCoordsGatedSection(
    nb.leports?.status ?? (pt ? coordsStatus : 'nocoords'),
    nb.leports?.count ?? 0,
  );
  const nearCulture = evaluateCoordsGatedSection(
    nb.culture?.status ?? (pt ? coordsStatus : 'nocoords'),
    nb.culture?.count ?? 0,
  );
  const nearCourses = evaluateFestivalCourses(
    areaCode,
    nb.courses?.status ?? (areaCode ? coordsStatus : 'noarea'),
    nb.courses?.count ?? 0,
  );

  return {
    contentId: String(item?.contentId || '').trim(),
    title: String(item?.title || '').trim(),
    hubId,
    hubName,
    areaCode,
    sections: {
      nearAttractions,
      lodging,
      packages,
      nearFood,
      nearLeports,
      nearCulture,
      nearCourses,
    },
  };
}

export function sectionIsHiddenByGating(sectionEval) {
  if (!sectionEval) return false;
  if (sectionEval.shell === 'hidden') return true;
  if (sectionEval.strip === 'hidden' && sectionEval.shell === 'visible') return true;
  if (sectionEval.content === 'hidden') return true;
  return false;
}
