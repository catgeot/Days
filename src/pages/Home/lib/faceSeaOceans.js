/**
 * 면별 상위 대양 칩 — 소권역 바에 나라 중분류와 배타로 노출.
 * 빈 대양(해당 면 coast 스팟 0)은 숨김.
 */
import coastJson from '../data/travelSpotCoast.json' with { type: 'json' };
import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { GLOBE_CATEGORY_IDS } from './globeCategoryFocus.js';
import { getFaceRegionsForCategory } from './globeFaceRegions.js';
import { resolveGlobeCountryIdFromLabel } from './globeCountryCatalog.js';
import { listChipSeaBasins } from './seaBasinResolve.js';
import { resolveTopOceanForBasin, SEA_BASIN_TOP_OCEANS } from './seaBasinRail.js';

const coastSpots = coastJson.spots || {};
const spotBySlug = new Map(TRAVEL_SPOTS.map((s) => [s.slug, s]));
const chipBasinById = new Map(listChipSeaBasins(1).map((b) => [b.id, b]));
const topOceanById = new Map(SEA_BASIN_TOP_OCEANS.map((o) => [o.id, o]));

/** @type {Map<string, { id: string, name: string }[]>} */
const cacheByCategory = new Map();

/**
 * @param {string | null | undefined} category
 * @returns {{ id: string, name: string }[]}
 */
export function getFaceSeaOceans(category) {
  if (!category || !GLOBE_CATEGORY_IDS.includes(category)) return [];
  if (cacheByCategory.has(category)) return cacheByCategory.get(category);

  const faceIds = new Set(getFaceRegionsForCategory(category).map((r) => r.id));
  const oceanIds = new Set();

  for (const [slug, coastEntry] of Object.entries(coastSpots)) {
    const spot = spotBySlug.get(slug);
    if (!spot) continue;
    const countryId = resolveGlobeCountryIdFromLabel(spot.country);
    if (!countryId || !faceIds.has(countryId)) continue;

    const basinIds = new Set(
      [coastEntry.seaPrimary, ...(coastEntry.seaIds || [])].filter(Boolean),
    );
    for (const basinId of basinIds) {
      const basin = chipBasinById.get(basinId);
      if (!basin) continue;
      const topId = resolveTopOceanForBasin(basin);
      if (topId) oceanIds.add(topId);
    }
  }

  const ordered = SEA_BASIN_TOP_OCEANS
    .filter((o) => oceanIds.has(o.id))
    .map((o) => ({ id: o.id, name: o.name }));

  cacheByCategory.set(category, ordered);
  return ordered;
}

/**
 * @param {string | null | undefined} category
 */
export function shouldShowFaceSeaOceanChips(category) {
  return getFaceSeaOceans(category).length > 0;
}
