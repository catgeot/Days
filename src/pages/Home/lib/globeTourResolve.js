import globeLandmarks from '../data/globeLandmarks.json';

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
    return {
      center: landmark.center || fallbackCenter,
      template: landmark.template || 'mountainOrbit',
      orbit: landmark.orbit || {},
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
  }

  const isUrbanLike = category === 'urban' || category === 'culture';

  return {
    center: fallbackCenter,
    template,
    orbit: {},
    exaggeration: isUrbanLike ? 0.5 : 1.35,
    buildings: false,
    source: 'category-fallback'
  };
}
