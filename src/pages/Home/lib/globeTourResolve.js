import globeLandmarks from '../data/globeLandmarks.json';
import travelSpotAirports from '../data/travelSpotAirports.json';
import { RENTAL_AIRPORT_HUBS } from '../../../utils/rentalAirportHubs.js';

/** Category → default orbit when slug has no globeLandmarks entry. */
export const CATEGORY_TOUR_TEMPLATE = {
  paradise: 'coastalOrbit',
  nature: 'regionCinematic',
  adventure: 'regionCinematic',
  urban: 'regionCinematic',
  culture: 'regionCinematic'
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

/** Paradise island tours — 5-stage aerial cinematic (see buildIslandCinematicKeyframes). */
export const ISLAND_TOUR_SLUGS = new Set([
  'maldives',
  'seychelles',
  'samoa',
  'zanzibar',
  'la-reunion',
  'rarotonga',
  'aitutaki',
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
  'cocos-islands',
  'falkland-islands',
  'faroe-islands',
  'christmas-island',
  'similan-islands',
  'phi-phi-islands',
  'bali',
  'santorini',
  'phuket',
  'madeira',
  'crete',
  'lombok',
  'hawaii',
  'palawan',
  'bohol',
  'gili-meno',
  'phu-quoc',
  'el-nido',
  'honolulu',
  'kiribati',
  'cape-verde',
  'bermuda',
  'azores',
  'corsica',
  'miyakojima',
  'ishigaki',
  'bahamas',
  'guam',
  'fernando-de-noronha'
]);

const ISLAND_KEYWORD_HINTS =
  /섬|아일랜드|아톨|군도|island|islands|atoll|archipelago/i;

function hubForTravelSlug(slug) {
  const entry = travelSpotAirports.spots?.[slug];
  const iata = entry?.preferredLinkIata || entry?.primaryIatas?.[0];
  if (!iata) return null;
  return RENTAL_AIRPORT_HUBS.find((h) => h.iata === iata) || null;
}

/** Inject airport coords as final approach only (never overview). approachPoint wins. */
function enrichIslandOrbit(slug, orbit = {}) {
  if (orbit.approachPoint) return orbit;
  const hub = slug ? hubForTravelSlug(slug) : null;
  if (!hub) return orbit;
  return {
    ...orbit,
    approachPoint: [hub.lng, hub.lat]
  };
}

function regionOrbitForFallback(center, profile) {
  return {
    profile,
    overviewCenter: center,
    approachPoint: center,
    scale: profile === 'urban' ? 'medium' : 'medium'
  };
}

function resolveLandmarkOrbit(key, landmark, template) {
  const base = landmark.orbit || {};
  const center = landmark.center;
  let orbit = { ...base };

  if (
    template === 'islandReveal' ||
    template === 'islandCinematic' ||
    template === 'regionCinematic'
  ) {
    if (!orbit.overviewCenter && center) {
      orbit = { ...orbit, overviewCenter: center };
    }
    if (template === 'islandReveal' || template === 'islandCinematic') {
      orbit = enrichIslandOrbit(key, orbit);
    }
    if (template === 'regionCinematic' && !orbit.profile) {
      orbit = { ...orbit, profile: 'nature' };
    }
    if (!orbit.approachPoint && center) {
      orbit = { ...orbit, approachPoint: center };
    }
  }

  return orbit;
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
    let template = landmark.template || 'mountainOrbit';
    if (
      !landmark.keyframes?.length &&
      !landmark.template &&
      landmark.orbit?.overviewCenter
    ) {
      template = 'regionCinematic';
    }

    const orbit = resolveLandmarkOrbit(key, landmark, template);
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

  let template = CATEGORY_TOUR_TEMPLATE[category] || 'regionCinematic';
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
    template = 'islandCinematic';
  } else if (category === 'paradise') {
    template = 'regionCinematic';
  }

  const isUrbanLike = category === 'urban' || category === 'culture';
  let orbit = {};

  if (template === 'islandCinematic' || template === 'islandReveal') {
    orbit = enrichIslandOrbit(slugHint, {
      overviewCenter: fallbackCenter,
      profile: 'island'
    });
  } else if (template === 'regionCinematic') {
    const profile = isUrbanLike ? 'urban' : 'nature';
    orbit = regionOrbitForFallback(fallbackCenter, profile);
  }

  return {
    center: fallbackCenter,
    template,
    orbit,
    exaggeration: isUrbanLike ? 0.5 : 1.35,
    buildings: false,
    source: 'category-fallback'
  };
}
