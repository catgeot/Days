import {
  getKindLabel,
  placeUrlSlug,
  resolveCityAttractionHub,
} from '../pages/Home/lib/cityAttractionHubs.js';
import { getWorldEventTitle, getWorldEventPlaceMeta } from './worldEvents.js';

/** Wave1.5 pilot — shared with D2 chips / D3 media. */
export const WORLD_EVENT_WAVE15_PILOT_EVENT_IDS = [
  'edinburgh-fringe-2026',
  'munich-oktoberfest-2026',
  'bali-galungan-season-2026',
];

export const WORLD_EVENT_D3_ATTRACTION_LIMIT = 5;

/**
 * @param {string | null | undefined} eventId
 */
export function hasWorldEventD3Media(eventId) {
  const id = String(eventId ?? '').trim();
  return WORLD_EVENT_WAVE15_PILOT_EVENT_IDS.includes(id);
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 */
export function buildWorldEventSearchQuery(event, locale = 'ko') {
  if (!event) return '';
  const title = getWorldEventTitle(event, locale);
  if (locale === 'en') {
    const venue = event.venue?.name ? String(event.venue.name).trim() : '';
    return [title, venue].filter(Boolean).join(' ');
  }
  const placeMeta = getWorldEventPlaceMeta(event.slug, locale);
  const placeLabel = placeMeta?.label ? String(placeMeta.label).trim() : '';
  return [title, placeLabel].filter(Boolean).join(' ');
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 */
export function getWorldEventYoutubeVideos(event, locale = 'ko') {
  if (!event?.youtubeVideos?.length) return [];
  return event.youtubeVideos.map((video) => ({
    id: video.id,
    title:
      locale === 'en' && video.titleEn
        ? video.titleEn
        : video.titleKo || video.titleEn || video.id,
  }));
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {{ limit?: number, locale?: string }} [options]
 */
export function getWorldEventHubAttractions(event, options = {}) {
  const limit = options.limit ?? WORLD_EVENT_D3_ATTRACTION_LIMIT;
  const locale = options.locale ?? 'ko';
  const hubId = String(event?.hubId || event?.slug || '').trim();
  if (!hubId) return { hub: null, attractions: [] };

  const hub = resolveCityAttractionHub(hubId);
  if (!hub) return { hub: null, attractions: [] };

  const hubLabel =
    locale === 'en' && hub.name_en ? hub.name_en : hub.name || hub.name_en || hubId;

  const attractions = (hub.attractions || []).slice(0, limit).map((attraction) => {
    const name =
      locale === 'en' && attraction.name_en ? attraction.name_en : attraction.name;
    const slug = placeUrlSlug(attraction.name_en, attraction.name);
    return {
      id: `${hub.hubId}-${slug}`,
      name,
      slug,
      kindLabel: getKindLabel(attraction.kind),
      href: slug ? `/place/${slug}` : '',
    };
  });

  return {
    hub: {
      hubId: hub.hubId,
      label: hubLabel,
      href: `/place/${hub.hubId}`,
    },
    attractions: attractions.filter((item) => item.href),
  };
}
