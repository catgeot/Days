import { haversineKm } from '../../KoreaTheme/nearbyScenicRank.js';
import {
  isNearbyTourAttractionCandidate,
  isNonTouristFacilityCat3,
} from '../../Home/lib/koreaTourAttractionNearbyFilter.js';

/** 행사 장소로 볼 거리 — 이보다 가깝고 이름이 장소/주소에 있으면 행사장 자신 */
export const VENUE_EXCLUDE_KM = 0.5;

const COORD_IDENTICAL_EPS = 0.0001;

/** 이름이 달라도 이 거리 안이면 같은 장소 */
export const SAME_PLACE_KM = 0.3;

const FESTIVAL_EVENT_NAME_RE = /축제|군항제|문화제|페스티벌/;

const TOURIST_NAME_RE =
  /해수욕|해변|해안|향교|서원|오죽헌|사찰|폭포|계곡|전망대|박물관|고분|산성|등대|경포/;

const COMMERCIAL_NAME_RE =
  /마법|카페|체험관|체험학교|테마파크|아트센터|공연장|키즈/;

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

function contentIdKey(spot) {
  const id = String(spot?.contentId || '').trim();
  return /^\d{1,32}$/.test(id) ? id : '';
}

/**
 * Stable row key for append-only nearby list merges.
 * @param {object | null | undefined} spot
 */
export function nearbySightStableKey(spot) {
  const id = contentIdKey(spot);
  if (id) return `id:${id}`;
  const name = normalizeNearbySightName(spot?.name);
  if (name) return `n:${name}`;
  const listId = String(spot?.localScenicListId || '').trim();
  const rank = String(spot?.rankBlurb || '').trim();
  if (listId && rank) return `ls:${listId}:${rank}`;
  return '';
}

/**
 * Tour locationBasedList pages — keep prior order, append only new rows.
 * @param {object[]} prior
 * @param {object[]} incoming
 */
export function mergeNearbyTourAttractionSpots(prior, incoming) {
  /** @type {object[]} */
  const out = [];
  const seen = new Set();
  for (const spot of [...(prior || []), ...(incoming || [])]) {
    const key = nearbySightStableKey(spot);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(spot);
  }
  return out;
}

/**
 * @param {Array<{ kind: string, spot?: object, title?: string, listId?: string, venueNote?: string }>} blocks
 */
function parseNearbySightBlockSegments(blocks) {
  /** @type {object[]} */
  const general = [];
  /** @type {Array<{ heading: object, spots: object[] }>} */
  const groups = [];
  /** @type {{ heading: object, spots: object[] } | null} */
  let current = null;
  for (const block of blocks || []) {
    if (block?.kind === 'heading') {
      current = { heading: block, spots: [] };
      groups.push(current);
      continue;
    }
    if (block?.kind === 'spot' && block.spot) {
      if (current) current.spots.push(block.spot);
      else general.push(block.spot);
    }
  }
  return { general, groups };
}

function stabilizeNearbySpotList(priorSpots, nextSpots, nextSpotByKey, used) {
  /** @type {object[]} */
  const out = [];
  for (const spot of priorSpots || []) {
    const key = nearbySightStableKey(spot);
    if (!key || used.has(key)) continue;
    const fresh = nextSpotByKey.get(key) || spot;
    used.add(key);
    out.push(fresh);
  }
  for (const spot of nextSpots || []) {
    const key = nearbySightStableKey(spot);
    if (!key || used.has(key)) continue;
    used.add(key);
    out.push(spot);
  }
  return out;
}

/**
 * After load-more, keep visible block/spot order and append new rows only.
 * @param {ReturnType<typeof mergeFestivalNearbySights>} prior
 * @param {ReturnType<typeof mergeFestivalNearbySights>} next
 */
export function stabilizeFestivalNearbySightPresentation(prior, next) {
  if (!prior?.blocks?.length) return next;

  const nextSpotByKey = new Map();
  for (const block of next.blocks || []) {
    if (block?.kind === 'spot' && block.spot) {
      const key = nearbySightStableKey(block.spot);
      if (key) nextSpotByKey.set(key, block.spot);
    }
  }

  const priorSeg = parseNearbySightBlockSegments(prior.blocks);
  const nextSeg = parseNearbySightBlockSegments(next.blocks);
  const used = new Set();
  /** @type {typeof next.blocks} */
  const blocks = [];

  for (const spot of stabilizeNearbySpotList(
    priorSeg.general,
    nextSeg.general,
    nextSpotByKey,
    used,
  )) {
    blocks.push({ kind: 'spot', spot });
  }

  const nextGroupById = new Map(
    nextSeg.groups.map((group) => [String(group.heading.listId || '').trim(), group]),
  );
  const seenHeadingIds = new Set();
  for (const group of priorSeg.groups) {
    const listId = String(group.heading.listId || '').trim();
    seenHeadingIds.add(listId);
    const nextGroup = nextGroupById.get(listId);
    const heading = nextGroup?.heading || group.heading;
    blocks.push({
      kind: 'heading',
      title: heading.title,
      listId,
      ...(heading.venueNote ? { venueNote: heading.venueNote } : {}),
    });
    for (const spot of stabilizeNearbySpotList(
      group.spots,
      nextGroup?.spots || [],
      nextSpotByKey,
      used,
    )) {
      blocks.push({ kind: 'spot', spot });
    }
  }

  for (const group of nextSeg.groups) {
    const listId = String(group.heading.listId || '').trim();
    if (seenHeadingIds.has(listId)) continue;
    blocks.push({
      kind: 'heading',
      title: group.heading.title,
      listId,
      ...(group.heading.venueNote ? { venueNote: group.heading.venueNote } : {}),
    });
    for (const spot of stabilizeNearbySpotList([], group.spots, nextSpotByKey, used)) {
      blocks.push({ kind: 'spot', spot });
    }
  }

  for (const spot of next.items || []) {
    const key = nearbySightStableKey(spot);
    if (!key || used.has(key)) continue;
    used.add(key);
    blocks.push({ kind: 'spot', spot });
  }

  const items = blocks
    .filter((block) => block.kind === 'spot' && block.spot)
    .map((block) => block.spot);
  return { ...next, blocks, items };
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

/**
 * 축제·행사 행은 주변 볼거리에서 뺀다. 팔경 멤버는 유지.
 * @param {object | null | undefined} spot
 */
export function isFestivalOrEventSight(spot) {
  if (!spot) return false;
  if (String(spot.localScenicListId || '').trim()) return false;
  const type = String(spot.contentTypeId || spot.contenttypeid || '').trim();
  if (type === '15') return true;
  return FESTIVAL_EVENT_NAME_RE.test(String(spot.name || ''));
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

function sharedPlaceStem(nameA, nameB) {
  const a = normalizeNearbySightName(nameA);
  const b = normalizeNearbySightName(nameB);
  if (!a || !b || a === b) return '';
  const maxLen = Math.min(a.length, b.length);
  for (let len = maxLen; len >= 5; len -= 1) {
    for (let i = 0; i + len <= a.length; i += 1) {
      const slice = a.slice(i, i + len);
      if (b.includes(slice)) return slice;
    }
  }
  return '';
}

function withinSamePlace(a, b) {
  if (sharedPlaceStem(a?.name, b?.name).length < 5) return false;
  if (a?.point && b?.point) {
    const km = haversineKm(a.point.lat, a.point.lng, b.point.lat, b.point.lng);
    return Number.isFinite(km) && km <= SAME_PLACE_KM;
  }
  const scenic = a?.localScenicListId ? a : b?.localScenicListId ? b : null;
  if (!scenic) return false;
  const other = scenic === a ? b : a;
  return Boolean(scenic.point) !== Boolean(other.point);
}

function mergeByProximity(pool) {
  /** @type {object[]} */
  const next = [];
  const used = new Set();
  for (let i = 0; i < pool.length; i += 1) {
    if (used.has(i)) continue;
    let row = pool[i];
    for (let j = i + 1; j < pool.length; j += 1) {
      if (used.has(j)) continue;
      if (!withinSamePlace(row, pool[j])) continue;
      row = mergeSight(row, pool[j]);
      used.add(j);
    }
    next.push(row);
  }
  pool.length = 0;
  for (const row of next) pool.push(row);
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

function hasBatchim(name) {
  const chars = [...String(name || '').trim()];
  const ch = chars[chars.length - 1];
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** «2경 함평엑스포공원은 축제장이에요» */
function venueExcludedNote(row) {
  const name = String(row?.name || '').trim();
  if (!name) return '';
  const n = rankNumber(row);
  const particle = hasBatchim(name) ? '은' : '는';
  const rank = n != null ? `${n}경 ` : '';
  return `${rank}${name}${particle} 축제장이에요`;
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

function byRank(a, b) {
  const ra = rankNumber(a);
  const rb = rankNumber(b);
  if (ra != null && rb != null && ra !== rb) return ra - rb;
  if (ra != null && rb == null) return -1;
  if (ra == null && rb != null) return 1;
  return byDistance(a, b);
}

/**
 * «용천사 함평» → «용천사». 앞쪽 시군 이름(«함안 연꽃테마파크»)은 둔다.
 * @param {unknown} name
 * @param {unknown} hubName
 */
export function stripTrailingHubName(name, hubName) {
  const text = String(name || '').trim();
  const hub = String(hubName || '').trim();
  if (!text || hub.length < 2) return text;
  const suffix = ` ${hub}`;
  if (!text.endsWith(suffix) || text.length <= suffix.length) return text;
  return text.slice(0, -suffix.length).trim() || text;
}

/** «용천사 함평» with hub «함평» or «함평군» → «용천사». A leading place name stays. */
export function stripTrailingRegionLabel(name, hubName) {
  const hub = String(hubName || '').trim();
  const once = stripTrailingHubName(name, hub);
  const bare = hub.replace(/(특별자치시|특별자치도|특별시|광역시|시|군)$/, '');
  if (!bare || bare === hub || bare.length < 2) return once;
  return stripTrailingHubName(once, bare);
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
 * 인근 명소는 거리순. 팔경이 2곳 이상이면 그 아래에 소제목과 경 번호순.
 * 다른 시·군 팔경이 1곳뿐이면 소제목 없이 일반 목록에 뱃지만 둔다.
 * 거리 없는 행·시군 중심 폴백·서로 다른 장소의 동일 좌표 묶음은 distKm 를 비운다.
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

  for (let i = pool.length - 1; i >= 0; i -= 1) {
    if (isFestivalOrEventSight(pool[i])) pool.splice(i, 1);
  }
  mergeByProximity(pool);
  hideIdenticalCoordClusters(pool);

  const kept = [];
  /** @type {Map<string, object[]>} */
  const venueExcludedByList = new Map();
  for (const row of pool) {
    if (isNonTouristNearbyFacility(row)) continue;
    if (isFestivalOrEventSight(row)) continue;
    const distKm = distOf(row, originPt);
    if (isFestivalVenueSight(row, venue, distKm)) {
      const listId = String(row.localScenicListId || '').trim();
      if (listId) {
        const list = venueExcludedByList.get(listId) || [];
        list.push(row);
        venueExcludedByList.set(listId, list);
      }
      continue;
    }
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
  const sectionGroups = [];
  for (const group of groupMap.values()) {
    group.items.sort(byRank);
    if (group.items.length >= 2) sectionGroups.push(group);
    else rest.push(...group.items);
  }
  rest.sort(byDistance);
  sectionGroups.sort((a, b) => {
    const ra = rankNumber(a.items[0]);
    const rb = rankNumber(b.items[0]);
    if (ra != null && rb != null && ra !== rb) return ra - rb;
    if (ra != null && rb == null) return -1;
    if (ra == null && rb != null) return 1;
    return String(a.title || '').localeCompare(String(b.title || ''), 'ko');
  });

  const blocks = rest.map((spot) => ({ kind: 'spot', spot }));
  for (const group of sectionGroups) {
    const venueNote = (venueExcludedByList.get(group.listId) || [])
      .map(venueExcludedNote)
      .filter(Boolean)
      .join('\n');
    blocks.push({
      kind: 'heading',
      title: group.title,
      listId: group.listId,
      ...(venueNote ? { venueNote } : {}),
    });
    for (const spot of group.items) blocks.push({ kind: 'spot', spot });
  }

  return { groups: sectionGroups, rest, items: kept, blocks };
}

/**
 * MOONi 「근처 볼 곳」우선순위. 0 팔경 · 1 관광 명소 · 2 그 외 · 3 체험·상업.
 * @param {object | null | undefined} spot
 */
export function mooniNearbySightTier(spot) {
  if (String(spot?.localScenicListId || '').trim() || String(spot?.rankBlurb || '').trim()) {
    return 0;
  }
  const cat1 = String(spot?.cat1 || '').toUpperCase();
  const cat2 = String(spot?.cat2 || '').toUpperCase();
  const cat3 = String(spot?.cat3 || '').toUpperCase();
  const name = String(spot?.name || '');
  const touristCat =
    cat1 === 'A01' ||
    cat2.startsWith('A0101') ||
    cat2.startsWith('A0102') ||
    cat2.startsWith('A0201') ||
    cat3 === 'A02020700';
  if (touristCat || TOURIST_NAME_RE.test(name)) return 1;
  const commercialCat =
    cat2.startsWith('A0203') ||
    cat2.startsWith('A0204') ||
    cat3 === 'A02020600' ||
    cat3 === 'A02050600';
  if (commercialCat || COMMERCIAL_NAME_RE.test(name)) return 3;
  return 2;
}

/**
 * 시트 거리순은 유지하고, MOONi에 넘기는 이름만 재정렬한다.
 * @param {object[]} items
 * @param {number} [limit]
 */
export function rankMooniNearbySights(items, limit = 6) {
  const cap = Math.max(0, Number(limit) || 0);
  return (Array.isArray(items) ? items : [])
    .map((spot, index) => ({ spot, index, tier: mooniNearbySightTier(spot) }))
    .sort((a, b) => a.tier - b.tier || a.index - b.index)
    .slice(0, cap)
    .map((row) => row.spot);
}
