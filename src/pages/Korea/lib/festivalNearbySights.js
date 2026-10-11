import { haversineKm } from '../../KoreaTheme/nearbyScenicRank.js';
import {
  isNearbyTourAttractionCandidate,
  isNonTouristFacilityCat3,
} from '../../Home/lib/koreaTourAttractionNearbyFilter.js';

/** 행사 장소로 볼 거리 — 이보다 가깝고 이름이 장소/주소에 있으면 행사장 자신 */
export const VENUE_EXCLUDE_KM = 0.5;

const COORD_IDENTICAL_EPS = 0.0001;

/**
 * @param {unknown} name
 */
export function normalizeNearbySightName(name) {
  return String(name || '')
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[()（）[\]【】]/g, '')
    .toLowerCase();
}

/**
 * @param {object | null | undefined} spot
 */
export function isNonTouristNearbyFacility(spot) {
  if (!spot) return false;
  if (isNonTouristFacilityCat3(spot.cat3)) return true;
  return !isNearbyTourAttractionCandidate(spot);
}

function contentIdOf(spot) {
  const id = String(spot?.contentId || '').trim();
  return /^\d{1,32}$/.test(id) ? id : '';
}

function finitePoint(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < 32 || la > 44 || ln < 123 || ln > 133) return null;
  return { lat: la, lng: ln };
}

function samePoint(a, b, eps = COORD_IDENTICAL_EPS) {
  if (!a || !b) return false;
  return Math.abs(a.lat - b.lat) <= eps && Math.abs(a.lng - b.lng) <= eps;
}

function namesMatchVenue(nameKey, placeKey) {
  if (!nameKey || !placeKey) return false;
  if (nameKey === placeKey) return true;
  const shorter = nameKey.length <= placeKey.length ? nameKey : placeKey;
  const longer = nameKey.length <= placeKey.length ? placeKey : nameKey;
  return shorter.length >= 4 && longer.includes(shorter);
}

/**
 * @param {object} spot
 * @param {{ ids: Set<string>, eventPlace: string, addr: string }} venue
 * @param {number | null} distKm
 */
export function isFestivalVenueSight(spot, venue, distKm) {
  const id = contentIdOf(spot);
  if (id && venue.ids.has(id)) return true;
  const nameKey = normalizeNearbySightName(spot?.name);
  const placeKey = normalizeNearbySightName(venue.eventPlace);
  if (namesMatchVenue(nameKey, placeKey)) return true;
  if (distKm != null && distKm < VENUE_EXCLUDE_KM) {
    const hay = normalizeNearbySightName(`${venue.eventPlace || ''} ${venue.addr || ''}`);
    if (nameKey && nameKey.length >= 2 && hay.includes(nameKey)) return true;
  }
  return false;
}

function pointForSpot(spot, fallbackCenters) {
  const pt = finitePoint(spot?.lat, spot?.lng);
  if (!pt) return null;
  for (const center of fallbackCenters) {
    if (samePoint(pt, center)) return null;
  }
  return pt;
}

function mergeSight(a, b) {
  const primary = a.localScenicListId ? a : b.localScenicListId ? b : a;
  const other = primary === a ? b : a;
  const point = a.point || b.point || null;
  return {
    ...other,
    ...primary,
    name: primary.name || other.name,
    contentId: contentIdOf(primary) || contentIdOf(other),
    point,
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    firstImage: primary.firstImage || other.firstImage || null,
    imageUrl:
      primary.imageUrl ||
      other.imageUrl ||
      primary.firstImage ||
      other.firstImage ||
      null,
    rankBlurb: primary.rankBlurb || other.rankBlurb || '',
    groupTitle: primary.groupTitle || other.groupTitle || '',
    localScenicListId: primary.localScenicListId || other.localScenicListId || '',
    blurb: other.blurb && !primary.localScenicListId ? other.blurb : primary.blurb || other.blurb || '',
    locality: primary.locality || other.locality || '',
    region: primary.region || other.region || '',
    placeSlug: primary.placeSlug || other.placeSlug || null,
    hubId: primary.hubId || other.hubId || null,
    overview: primary.overview || other.overview || null,
    galleryUrls: primary.galleryUrls || other.galleryUrls || null,
    addr1: primary.addr1 || other.addr1 || null,
    homepage: primary.homepage || other.homepage || null,
    contentTypeId: primary.contentTypeId || other.contentTypeId || null,
    cat1: primary.cat1 || other.cat1 || null,
    cat2: primary.cat2 || other.cat2 || null,
    cat3: primary.cat3 || other.cat3 || null,
    id: primary.id || other.id || primary.contentId || other.contentId,
    source: primary.source || other.source || '',
  };
}

function asRecord(spot, fallbackCenters) {
  if (!spot || typeof spot !== 'object') return null;
  const name = String(spot.name || '').trim();
  if (!name) return null;
  const point = pointForSpot(spot, fallbackCenters);
  return {
    ...spot,
    name,
    contentId: contentIdOf(spot),
    point,
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    rankBlurb: String(spot.rankBlurb || '').trim(),
    groupTitle: String(spot.groupTitle || '').trim(),
    localScenicListId: String(spot.localScenicListId || '').trim(),
  };
}

function absorb(pool, record) {
  const id = contentIdOf(record);
  const nameKey = normalizeNearbySightName(record.name);
  let idx = -1;
  if (id) idx = pool.findIndex((row) => contentIdOf(row) === id);
  if (idx < 0 && nameKey) {
    idx = pool.findIndex((row) => normalizeNearbySightName(row.name) === nameKey);
  }
  if (idx < 0) pool.push(record);
  else pool[idx] = mergeSight(pool[idx], record);
}

function hideIdenticalCoordClusters(records) {
  /** @type {Map<string, object[]>} */
  const buckets = new Map();
  for (const row of records) {
    if (!row.point) continue;
    const key = `${row.point.lat.toFixed(4)},${row.point.lng.toFixed(4)}`;
    const list = buckets.get(key);
    if (list) list.push(row);
    else buckets.set(key, [row]);
  }
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    for (const row of list) {
      row.point = null;
      row.lat = null;
      row.lng = null;
    }
  }
}

function distOf(row, origin) {
  if (!row.point || !origin) return null;
  const km = haversineKm(origin.lat, origin.lng, row.point.lat, row.point.lng);
  return Number.isFinite(km) ? km : null;
}

function rankNumber(spot) {
  const match = String(spot?.rankBlurb || '').match(/(\d+)\s*경/);
  return match ? Number(match[1]) : null;
}

function byDistance(a, b) {
  const da = Number.isFinite(a.distKm) ? a.distKm : Infinity;
  const db = Number.isFinite(b.distKm) ? b.distKm : Infinity;
  if (da !== db) return da - db;
  const ra = rankNumber(a);
  const rb = rankNumber(b);
  if (ra != null && rb != null && ra !== rb) return ra - rb;
  return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
}

function toOutput(row, distKm) {
  const { point, ...rest } = row;
  return {
    ...rest,
    distKm: Number.isFinite(distKm) ? distKm : null,
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
  };
}

/**
 * 인근 명소 · 주변 관광지(팔경) · 가까운 곳을 한 목록으로.
 * 거리 없는 행·시군 중심 폴백·동일 좌표 묶음은 distKm 를 비운다.
 *
 * @param {{
 *   scenicSpots?: object[],
 *   grouped?: { groups?: { title?: string, listId?: string, items?: object[] }[], rest?: object[] },
 *   origin?: { lat?: number, lng?: number } | null,
 *   venue?: { contentIds?: string[], eventPlace?: string, addr?: string },
 *   fallbackCenters?: { lat?: number, lng?: number }[],
 * }} input
 */
export function mergeFestivalNearbySights(input = {}) {
  const fallbackCenters = [];
  for (const center of input.fallbackCenters || []) {
    const pt = finitePoint(center?.lat, center?.lng);
    if (pt) fallbackCenters.push(pt);
  }
  const originPt = finitePoint(input.origin?.lat, input.origin?.lng);
  const venue = {
    ids: new Set(
      (input.venue?.contentIds || [])
        .map((id) => String(id || '').trim())
        .filter((id) => /^\d{1,32}$/.test(id)),
    ),
    eventPlace: String(input.venue?.eventPlace || ''),
    addr: String(input.venue?.addr || ''),
  };

  /** @type {object[]} */
  const pool = [];
  for (const spot of input.scenicSpots || []) {
    const row = asRecord(spot, fallbackCenters);
    if (row) absorb(pool, row);
  }
  for (const group of input.grouped?.groups || []) {
    for (const spot of group.items || []) {
      const row = asRecord(
        {
          ...spot,
          groupTitle: spot.groupTitle || group.title || '',
          localScenicListId: spot.localScenicListId || group.listId || '',
        },
        fallbackCenters,
      );
      if (row) absorb(pool, row);
    }
  }
  for (const spot of input.grouped?.rest || []) {
    const row = asRecord(spot, fallbackCenters);
    if (row) absorb(pool, row);
  }

  hideIdenticalCoordClusters(pool);

  const kept = [];
  for (const row of pool) {
    if (isNonTouristNearbyFacility(row)) continue;
    const distKm = distOf(row, originPt);
    if (isFestivalVenueSight(row, venue, distKm)) continue;
    kept.push(toOutput(row, distKm));
  }
  kept.sort(byDistance);

  /** @type {Map<string, { title: string, listId: string, items: object[] }>} */
  const groupMap = new Map();
  const rest = [];
  for (const spot of kept) {
    const listId = String(spot.localScenicListId || '').trim();
    if (!listId) {
      rest.push(spot);
      continue;
    }
    let group = groupMap.get(listId);
    if (!group) {
      group = {
        title: String(spot.groupTitle || '').trim() || listId,
        listId,
        items: [],
      };
      groupMap.set(listId, group);
    }
    group.items.push(spot);
  }
  const groups = [...groupMap.values()];
  for (const group of groups) group.items.sort(byDistance);

  const blocks = [];
  const seenGroups = new Set();
  for (const spot of kept) {
    const listId = String(spot.localScenicListId || '').trim();
    if (listId && !seenGroups.has(listId)) {
      seenGroups.add(listId);
      blocks.push({
        kind: 'heading',
        title: String(spot.groupTitle || '').trim() || listId,
        listId,
      });
    }
    blocks.push({ kind: 'spot', spot });
  }

  return { groups, rest, items: kept, blocks };
}
