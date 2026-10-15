import manualFestivalEntries from '../../Korea/data/manualFestivalEntries.json' with { type: 'json' };
import scenicJson from '../data/koreaScenicSpots.json' with { type: 'json' };
import { getWorldEventsForSlug, getWorldEventTitle } from '../../../utils/worldEvents.js';
import { isGateoPlaceCrosslinkEnabled } from '../../../shared/gateoFeatureFlags.js';
import { resolveCityAttractionHub, resolveHubPlaceFromSlug } from './cityAttractionHubs.js';
import { matchKoreaAdminRegionFromAddr } from './koreaAdminRegionMatch.js';
import { scenicHomePathForHubId } from './koreaThemeCrossLinks.js';
import { isScenicSpotHidden } from './koreaScenicSpotVisibility.js';
import { gateoKoreaFestivalDetailUrl } from '../../../shared/korea/mooniKoreaFestivalAssist.js';

const SCENIC_SPOTS = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];
const MANUAL_FESTIVALS = Object.values(manualFestivalEntries || {});

const KOREA_COUNTRY = new Set(['대한민국', '한국', 'south korea', 'korea', 'kr']);

function emptyBundle() {
  return { festivals: [], events: [], collections: [] };
}

function isDomesticKorea(loc) {
  const c = String(loc?.country || loc?.country_en || '').trim().toLowerCase();
  if (KOREA_COUNTRY.has(c)) return true;
  const lat = Number(loc?.lat);
  const lng = Number(loc?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 33 && lat <= 39 && lng >= 124.5 && lng <= 132;
}

function resolveEventHref(event) {
  const slug = String(event?.slug || '').trim();
  if (!slug) return '/world-events';
  const id = String(event?.id || '').trim();
  return id ? `/world-events/${slug}/${id}` : `/world-events/${slug}`;
}

function resolveHubIdForPlace(loc) {
  if (!loc || typeof loc !== 'object') return '';
  const slug = String(loc.slug || loc.canonical_slug || '').trim().toLowerCase();
  const hubFromSlug = slug ? resolveHubPlaceFromSlug(slug) : null;
  if (hubFromSlug?.hubId) return String(hubFromSlug.hubId).toLowerCase();
  const explicit = String(loc.hubId || '').trim().toLowerCase();
  if (explicit && resolveCityAttractionHub(explicit)) return explicit;
  const byName = resolveCityAttractionHub(loc.name || loc.name_ko || loc.parentCity);
  if (byName?.hubId) return String(byName.hubId).toLowerCase();
  if (loc.addr1) {
    const region = matchKoreaAdminRegionFromAddr(loc.addr1);
    if (region?.hubId) return region.hubId;
  }
  return slug;
}

function listEventsForSlug(slug) {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return [];
  return getWorldEventsForSlug(key).map((event) => ({
    id: String(event.id || ''),
    kind: 'event',
    title: getWorldEventTitle(event, 'ko'),
    href: resolveEventHref(event),
  }));
}

function listFestivalsForHub(hubId) {
  const target = String(hubId || '').toLowerCase();
  if (!target) return [];
  const out = [];
  for (const row of MANUAL_FESTIVALS) {
    const region = matchKoreaAdminRegionFromAddr(row?.addr1);
    if (!region || region.hubId !== target) continue;
    const contentId = String(row.contentId || '').trim();
    if (!contentId) continue;
    out.push({
      id: `festival:${contentId}`,
      kind: 'festival',
      title: String(row.title || row.titleEn || '').trim(),
      href: gateoKoreaFestivalDetailUrl(contentId),
    });
  }
  return out;
}

function listScenicCollectionsForHub(hubId) {
  const target = String(hubId || '').toLowerCase();
  if (!target) return [];
  const hub = resolveCityAttractionHub(target);
  const hubName = hub?.name || target;
  const spots = SCENIC_SPOTS.filter(
    (spot) => String(spot?.hubId || '').toLowerCase() === target && !isScenicSpotHidden(spot),
  );
  if (!spots.length) return [];
  const items = [
    {
      id: `scenic-hub:${target}`,
      kind: 'collection',
      title: `${hubName} 지역 명소 컬렉션`,
      href: scenicHomePathForHubId(target),
    },
  ];
  for (const spot of spots.slice(0, 6)) {
    const spotId = String(spot.id || '').trim();
    if (!spotId) continue;
    const base = scenicHomePathForHubId(target);
    items.push({
      id: `scenic:${spotId}`,
      kind: 'collection',
      title: String(spot.name || spot.attractionName || '').trim(),
      href: `${base}&spot=${encodeURIComponent(spotId)}`,
    });
  }
  return items;
}

/**
 * @param {object | null | undefined} location
 * @returns {{ festivals: object[], events: object[], collections: object[] }}
 */
export function resolvePlaceCrossLinks(location) {
  if (!isGateoPlaceCrosslinkEnabled()) return emptyBundle();
  if (!location || typeof location !== 'object') return emptyBundle();

  const hubId = resolveHubIdForPlace(location);
  const slug = String(location.slug || location.canonical_slug || hubId || '').toLowerCase();
  const events = listEventsForSlug(slug);

  if (!isDomesticKorea(location)) {
    return { festivals: [], events, collections: [] };
  }

  const festivals = listFestivalsForHub(hubId);
  const collections = listScenicCollectionsForHub(hubId);
  return { festivals, events, collections };
}
