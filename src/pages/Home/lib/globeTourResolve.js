import globeLandmarks from '../data/globeLandmarks.json';
import travelSpotAirports from '../data/travelSpotAirports.json';
import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';

/** Category → default orbit when slug has no globeLandmarks entry (nature-first). */
export const CATEGORY_TOUR_TEMPLATE = {
  paradise: 'coastalOrbit',
  nature: 'mountainOrbit',
  adventure: 'mountainOrbit',
  urban: 'cityOrbit',
  culture: 'cityOrbit'
};

const ALPINE_SLUG_HINTS = new Set([
  'zermatt',
  'interlaken',
  'chamonix',
  'grindelwald',
  'lucerne',
  'innsbruck',
  'dolomites',
  'annecy'
]);

const ALPINE_KEYWORD_HINTS = /알프스|마테호른|matterhorn|alpine|체르마트|인터라켄|chamonix|grindelwald/i;

/** Paradise island tours — centroid overview + descent (see islandReveal). */
const ISLAND_TOUR_SLUGS = new Set([
  'maldives',
  'seychelles',
  'samoa',
  'zanzibar',
  'la-reunion',
  'rarotonga',
  'boracay',
  'bora-bora',
  'mauritius',
  'tahiti',
  'langkawi',
  'ibiza',
  'cebu',
  'komodo-island',
  'andaman-islands',
  'jeju',
  'hvar',
  'sicily',
  'canary-islands',
  'easter-island',
  'cocos-islands',
  'falkland-islands',
  'faroe-islands',
  'christmas-island',
  'similan-islands',
  'phi-phi-islands'
]);

const ISLAND_KEYWORD_HINTS =
  /섬|아일랜드|아톨|군도|island|islands|atoll|archipelago/i;

function hubForTravelSlug(slug) {
  const entry = travelSpotAirports[slug];
  const iata = entry?.preferredLinkIata || entry?.primaryIatas?.[0];
  if (!iata) return null;
  return RENTAL_AIRPORT_HUBS.find((h) => h.iata === iata) || null;
}

/** Inject CCK 등 공항 좌표를 final approach touchdown으로 (orbit.approachPoint 우선). */
function enrichIslandOrbit(slug, orbit = {}) {
  if (orbit.approachPoint) return orbit;
  const hub = slug ? hubForTravelSlug(slug) : null;
  if (!hub) return orbit;
  return {
    ...orbit,
    approachPoint: [hub.lng, hub.lat]
  };
}

/**
 * @returns {{
 *   center: [number, number],
 *   template: string,
 *   orbit: object,
 *   exaggeration: number,
 *   buildings: boolean,
 *   source: 'landmark' | 'category-fallback'
 * }}
 */
export function resolveGlobeTourConfig({ slug, lat, lng, location } = {}) {
  const key = slug ? String(slug).trim().toLowerCase() : '';
  const landmark = key ? globeLandmarks[key] : null;
  const fallbackLng = Number(lng);
  const fallbackLat = Number(lat);
  const fallbackCenter = [
    Number.isFinite(fallbackLng) ? fallbackLng : 0,
    Number.isFinite(fallbackLat) ? fallbackLat : 0
  ];

  if (landmark) {
    const template = landmark.template || 'mountainOrbit';
    const orbit =
      template === 'islandReveal'
        ? enrichIslandOrbit(key, landmark.orbit || {})
        : landmark.orbit || {};
    return {
      center: landmark.center || fallbackCenter,
      template,
      orbit,
      exaggeration: landmark.exaggeration ?? 1.35,
      buildings: Boolean(landmark.buildings),
      source: 'landmark'
    };
  }

  const category =
    location?.primaryCategory ||
    location?.category ||
    (Array.isArray(location?.categories) ? location.categories[0] : null) ||
    'nature';

  let template = CATEGORY_TOUR_TEMPLATE[category] || 'mountainOrbit';
  const slugHint = key || String(location?.slug || '').toLowerCase();
  const keywordBlob = [
    ...(location?.keywords || []),
    location?.name,
    location?.name_en,
    location?.desc
  ]
    .filter(Boolean)
    .join(' ');

  if (ALPINE_SLUG_HINTS.has(slugHint) || ALPINE_KEYWORD_HINTS.test(keywordBlob)) {
    template = 'alpineVillageOrbit';
  } else if (
    category === 'paradise' &&
    (ISLAND_TOUR_SLUGS.has(slugHint) || ISLAND_KEYWORD_HINTS.test(keywordBlob))
  ) {
    template = 'islandReveal';
  }

  const isUrbanLike = category === 'urban' || category === 'culture';
  const orbit =
    template === 'islandReveal' ? enrichIslandOrbit(slugHint, {}) : {};

  return {
    center: fallbackCenter,
    template,
    orbit,
    exaggeration: isUrbanLike ? 0.5 : 1.35,
    buildings: false,
    source: 'category-fallback'
  };
}
