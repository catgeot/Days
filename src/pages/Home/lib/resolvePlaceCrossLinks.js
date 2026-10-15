import manualFestivalEntries from '../../Korea/data/manualFestivalEntries.json' with { type: 'json' };
import festivalSeedJson from '../data/placeCrosslinkFestivalSeed.json' with { type: 'json' };
import hubsJson from '../data/cityAttractionHubs.json' with { type: 'json' };
import scenicJson from '../data/koreaScenicSpots.json' with { type: 'json' };
import { getWorldEventsForSlug, getWorldEventTitle } from '../../../utils/worldEvents.js';
import { isGateoPlaceCrosslinkEnabled } from '../../../shared/gateoFeatureFlags.js';
import { resolveCityAttractionHub, resolveHubPlaceFromSlug } from './cityAttractionHubs.js';
import { matchKoreaAdminRegionFromAddr } from './koreaAdminRegionMatch.js';
import { scenicHomePathForHubId } from './koreaThemeCrossLinks.js';
import { isScenicSpotHidden } from './koreaScenicSpotVisibility.js';
import { gateoKoreaFestivalDetailUrl } from '../../../shared/korea/mooniKoreaFestivalAssist.js';
import {
  crosslinkFestivalDisplayTitle,
  isCrosslinkFestivalActive,
  festivalPrimaryHubMatchesPlaceHub,
  crosslinkHubIdsForPlaceHub,
} from './placeCrosslinkFestivals.js';

const SCENIC_COLLECTION_SPOT_CAP = 6;

const SCENIC_SPOTS = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];
const MANUAL_FESTIVALS = Object.values(manualFestivalEntries || {});
const FESTIVAL_SEED = Array.isArray(festivalSeedJson?.items) ? festivalSeedJson.items : [];

/** @type {Array<{ hubId: string, name: string, lat: number, lng: number }> | null} */
let cachedKoreaHubList = null;

function koreaHubListForFestivals() {
  if (cachedKoreaHubList) return cachedKoreaHubList;
  cachedKoreaHubList = (Array.isArray(hubsJson) ? hubsJson : [])
    .filter(
      (hub) =>
        hub?.hubId && Number.isFinite(Number(hub.lat)) && Number.isFinite(Number(hub.lng)),
    )
    .map((hub) => ({
      hubId: String(hub.hubId).toLowerCase(),
      name: String(hub.name || hub.hubId),
      lat: Number(hub.lat),
      lng: Number(hub.lng),
    }));
  return cachedKoreaHubList;
}

function crosslinkFestivalCatalog() {
  const byId = new Map();
  for (const row of MANUAL_FESTIVALS) {
    const id = String(row.contentId || '').trim();
    if (id) byId.set(id, row);
  }
  for (const row of FESTIVAL_SEED) {
    const id = String(row.contentId || '').trim();
    if (id && !byId.has(id)) byId.set(id, row);
  }
  return [...byId.values()];
}

const KOREA_COUNTRY = new Set(['대한민국', '한국', 'south korea', 'korea', 'kr']);

/** Kyushu/Tsushima — inside the coarse Korea bbox but not domestic. */
const JAPAN_NEAR_KOREA_BOXES = [
  { minLat: 33.0, maxLat: 33.95, minLng: 130.0, maxLng: 131.3 },
  { minLat: 33.9, maxLat: 34.65, minLng: 128.6, maxLng: 129.75 },
];

function emptyBundle() {
  return { festivals: [], events: [], collections: [] };
}

function inJapanNearKoreaExclusion(lat, lng) {
  return JAPAN_NEAR_KOREA_BOXES.some(
    (box) => lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng,
  );
}

export function isDomesticKoreaForCrosslink(loc) {
  const c = String(loc?.country || loc?.country_en || '').trim().toLowerCase();
  if (c && !KOREA_COUNTRY.has(c)) return false;
  if (KOREA_COUNTRY.has(c)) return true;
  const lat = Number(loc?.lat);
  const lng = Number(loc?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (inJapanNearKoreaExclusion(lat, lng)) return false;
  return lat >= 33 && lat <= 38.9 && lng >= 124.5 && lng <= 132;
}

function isDomesticKorea(loc) {
  return isDomesticKoreaForCrosslink(loc);
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

function listFestivalsForHub(hubId, { now = new Date() } = {}) {
  const target = String(hubId || '').toLowerCase();
  if (!target) return [];
  const hubs = koreaHubListForFestivals();
  const out = [];
  for (const row of crosslinkFestivalCatalog()) {
    const contentId = String(row.contentId || '').trim();
    if (!contentId) continue;
    if (!isCrosslinkFestivalActive(row, now)) continue;
    if (!festivalPrimaryHubMatchesPlaceHub(row, target, hubs)) continue;
    out.push({
      id: `festival:${contentId}`,
      kind: 'festival',
      title: crosslinkFestivalDisplayTitle(row),
      href: gateoKoreaFestivalDetailUrl(contentId),
    });
  }
  return out;
}

function scenicSpotsForPlaceHub(targetHubId) {
  const hubIds = crosslinkHubIdsForPlaceHub(targetHubId);
  const seen = new Set();
  const ordered = [];
  for (const hubId of hubIds) {
    for (const spot of SCENIC_SPOTS) {
      if (String(spot?.hubId || '').toLowerCase() !== hubId) continue;
      if (isScenicSpotHidden(spot)) continue;
      const spotId = String(spot.id || '').trim();
      if (!spotId || seen.has(spotId)) continue;
      seen.add(spotId);
      ordered.push({ spot, spotHubId: hubId });
    }
  }
  return ordered;
}

function listScenicCollectionsForHub(hubId) {
  const target = String(hubId || '').toLowerCase();
  if (!target) return [];
  const hub = resolveCityAttractionHub(target);
  const hubName = hub?.name || target;
  const spots = scenicSpotsForPlaceHub(target);
  if (!spots.length) return [];
  const items = [
    {
      id: `scenic-hub:${target}`,
      kind: 'collection',
      title: `${hubName} 지역 명소 컬렉션`,
      href: scenicHomePathForHubId(target),
    },
  ];
  for (const { spot, spotHubId } of spots.slice(0, SCENIC_COLLECTION_SPOT_CAP)) {
    const spotId = String(spot.id || '').trim();
    if (!spotId) continue;
    const base = scenicHomePathForHubId(spotHubId);
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
export function resolvePlaceCrossLinks(location, options = {}) {
  if (!isGateoPlaceCrosslinkEnabled()) return emptyBundle();
  if (!location || typeof location !== 'object') return emptyBundle();

  const now = options.now instanceof Date ? options.now : new Date();
  const hubId = resolveHubIdForPlace(location);
  const slug = String(location.slug || location.canonical_slug || hubId || '').toLowerCase();
  const events = listEventsForSlug(slug);

  if (!isDomesticKorea(location)) {
    return { festivals: [], events, collections: [] };
  }

  const festivals = listFestivalsForHub(hubId, { now });
  const collections = listScenicCollectionsForHub(hubId);
  return { festivals, events, collections };
}
