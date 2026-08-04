import koreaAreaCodes from '../data/koreaAreaCodes.json' with { type: 'json' };
import koreaThemeRegionTour from '../data/koreaThemeRegionTour.json' with { type: 'json' };
import {
  getKindLabel,
  placeUrlSlug,
  resolveCityAttractionHub,
} from './cityAttractionHubs.js';
import { hubIdsForArea } from '../../Korea/koreaHubSeeds.js';
import { resolveTourApiPlace } from '../../../utils/tourApiMatch.js';

function resolveRegionAttractionContentId(attractionId, placeSlug, name) {
  const fromTheme = koreaThemeRegionTour?.byAttractionId?.[attractionId];
  const themeId = String(fromTheme?.contentId || '').trim();
  if (/^\d{1,32}$/.test(themeId)) return themeId;

  const bySlug = resolveTourApiPlace(placeSlug);
  const slugId = String(bySlug?.contentId || '').trim();
  if (/^\d{1,32}$/.test(slugId)) return slugId;

  const byName = resolveTourApiPlace(name);
  const nameId = String(byName?.contentId || '').trim();
  if (/^\d{1,32}$/.test(nameId)) return nameId;

  return null;
}

/**
 * @typedef {{
 *   areaCode: string,
 *   name: string,
 *   hubIds: string[],
 * }} KoreaThemeArea
 */

/**
 * @typedef {{
 *   hubId: string,
 *   name: string,
 *   nameEn: string,
 *   placeSlug: string,
 *   attractionCount: number,
 *   areaCode: string,
 *   areaName: string,
 * }} KoreaThemeRegionHub
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   nameEn: string,
 *   kindLabel: string,
 *   placeSlug: string,
 *   hubId: string,
 *   hubName: string,
 *   areaCode: string,
 *   areaName: string,
 *   contentId: string | null,
 *   blurb: string,
 * }} KoreaThemeRegionAttraction
 */

/** @returns {KoreaThemeArea[]} */
export function listKoreaThemeAreas() {
  const areas = koreaAreaCodes?.areas || {};
  return Object.entries(areas).map(([id, entry]) => ({
    areaCode: String(id),
    name: String(entry?.name || id),
    hubIds: Array.isArray(entry?.hubIds)
      ? entry.hubIds.map((h) => String(h).toLowerCase())
      : [],
  }));
}

/**
 * @param {string | number | null | undefined} areaCode
 * @returns {KoreaThemeRegionHub[]}
 */
export function listKoreaThemeRegionHubs(areaCode) {
  if (areaCode == null || areaCode === '' || areaCode === 'all') return [];
  const code = String(areaCode);
  const areaName =
    String(koreaAreaCodes?.areas?.[code]?.name || '') || code;
  const ids = hubIdsForArea(code);
  /** @type {KoreaThemeRegionHub[]} */
  const out = [];
  for (const rawId of ids) {
    const hubId = String(rawId || '').toLowerCase();
    if (!hubId) continue;
    const hub = resolveCityAttractionHub(hubId);
    if (!hub) continue;
    out.push({
      hubId,
      name: String(hub.name || hubId),
      nameEn: String(hub.name_en || ''),
      placeSlug: hubId,
      attractionCount: Array.isArray(hub.attractions) ? hub.attractions.length : 0,
      areaCode: code,
      areaName,
    });
  }
  return out;
}

/**
 * 시도에 연결된 hub들의 큐레이션 명소 평탄 목록.
 * @param {string | number | null | undefined} areaCode
 * @returns {KoreaThemeRegionAttraction[]}
 */
export function listKoreaThemeRegionAttractions(areaCode) {
  if (areaCode == null || areaCode === '' || areaCode === 'all') return [];
  const code = String(areaCode);
  const areaName =
    String(koreaAreaCodes?.areas?.[code]?.name || '') || code;
  const ids = hubIdsForArea(code);
  /** @type {KoreaThemeRegionAttraction[]} */
  const out = [];
  const seen = new Set();

  for (const rawId of ids) {
    const hubId = String(rawId || '').toLowerCase();
    if (!hubId) continue;
    const hub = resolveCityAttractionHub(hubId);
    if (!hub) continue;
    const hubName = String(hub.name || hubId);
    for (const attraction of hub.attractions || []) {
      if (!attraction?.name) continue;
      const placeSlug = placeUrlSlug(attraction.name_en, attraction.name);
      if (!placeSlug) continue;
      const id = `${hubId}:${placeSlug}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const name = String(attraction.name);
      const nameEn = String(attraction.name_en || '');
      const kindLabel = getKindLabel(attraction.kind);
      out.push({
        id,
        name,
        nameEn,
        kindLabel,
        placeSlug,
        hubId,
        hubName,
        areaCode: code,
        areaName,
        contentId: resolveRegionAttractionContentId(id, placeSlug, name),
        blurb: [kindLabel, nameEn || areaName].filter(Boolean).join(' · '),
      });
    }
  }
  return out;
}
