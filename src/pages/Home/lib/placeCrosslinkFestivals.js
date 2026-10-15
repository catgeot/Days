import { isFestivalEnded } from '../../Korea/festivalDeepLinkItem.js';
import { nearbyHubsForFestival } from '../../Korea/nearbyFestivalHubs.js';

/** Traveler-facing place slugs that aggregate multiple festival hubs. */
export const PLACE_CROSSLINK_FESTIVAL_HUB_GROUPS = {
  jeju: ['jeju', 'seogwipo'],
};

export function hasHangul(text) {
  return /[\uAC00-\uD7A3]/.test(String(text || ''));
}

/**
 * Prefer Korean display title; falls back to Latin title when TourAPI has no KO name.
 * @param {{ title?: string, titleKo?: string, titleEn?: string }} row
 */
export function crosslinkFestivalDisplayTitle(row) {
  const titleKo = String(row?.titleKo || '').trim();
  if (titleKo) return titleKo;
  const title = String(row?.title || '').trim();
  if (hasHangul(title)) return title;
  const titleEn = String(row?.titleEn || '').trim();
  return title || titleEn;
}

/**
 * @param {string} hubId
 * @returns {string[]}
 */
export function festivalHubIdsForPlaceHub(hubId) {
  const key = String(hubId || '').trim().toLowerCase();
  if (!key) return [];
  const group = PLACE_CROSSLINK_FESTIVAL_HUB_GROUPS[key];
  return group ? [...group] : [key];
}

/**
 * @param {object} row
 * @param {Date} [now]
 */
export function isCrosslinkFestivalActive(row, now = new Date()) {
  const end = row?.eventEndDate || row?.eventenddate;
  if (!end) return true;
  return !isFestivalEnded(end, now);
}

/**
 * @param {object} row
 * @param {string} targetHubId
 * @param {Array<{ hubId: string, name: string, lat: number, lng: number }>} hubs
 */
export function festivalPrimaryHubMatchesPlaceHub(row, targetHubId, hubs) {
  const allowed = new Set(festivalHubIdsForPlaceHub(targetHubId));
  if (!allowed.size) return false;
  const primary = nearbyHubsForFestival(row, hubs, { limit: 1 })[0];
  const primaryId = String(primary?.hubId || '').toLowerCase();
  return allowed.has(primaryId);
}
