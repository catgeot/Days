/**
 * /korea/theme/scenic 개인 목록 — 즐겨찾기·본 항목 (localStorage).
 * 축제 festivalPersonalStore와 분리. spot.id 기준.
 */

export const SCENIC_FAVORITES_KEY = 'gateo:korea-scenic:v1:favorites';
export const SCENIC_VIEWED_KEY = 'gateo:korea-scenic:v1:viewed';
export const MAX_SCENIC_FAVORITES = 80;
export const MAX_SCENIC_VIEWED = 40;

/**
 * @param {Record<string, unknown> | null | undefined} spot
 * @returns {Record<string, unknown> | null}
 */
export function toScenicRef(spot) {
  if (!spot || typeof spot !== 'object') return null;
  const id = String(spot.id || '').trim();
  const name = String(spot.name || '').trim();
  if (!id || !name) return null;
  /** @type {Record<string, unknown>} */
  const ref = { id, name };
  const contentId = String(spot.contentId || '').trim();
  if (contentId) ref.contentId = contentId;
  const region = String(spot.region || '').trim();
  if (region) ref.region = region;
  const areaLabel = String(spot.areaLabel || '').trim();
  if (areaLabel) ref.areaLabel = areaLabel;
  const locality = String(spot.locality || '').trim();
  if (locality) ref.locality = locality;
  const hubId = String(spot.hubId || '').trim();
  if (hubId) ref.hubId = hubId;
  const blurb = String(spot.blurb || '').trim();
  if (blurb) ref.blurb = blurb.slice(0, 160);
  const imageUrl = String(
    spot.imageUrl || spot.firstImage || spot.thumbUrl || '',
  ).trim();
  if (imageUrl) ref.imageUrl = imageUrl;
  const source = String(spot.source || '').trim();
  if (source) ref.source = source;
  if (spot.lat != null && Number.isFinite(Number(spot.lat))) {
    ref.lat = Number(spot.lat);
  }
  if (spot.lng != null && Number.isFinite(Number(spot.lng))) {
    ref.lng = Number(spot.lng);
  }
  const placeSlug = String(spot.placeSlug || '').trim();
  if (placeSlug) ref.placeSlug = placeSlug;
  return ref;
}

function safeLoadList(key) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => toScenicRef(row)).filter(Boolean);
  } catch {
    return [];
  }
}

function safeSaveList(key, list) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

function sameId(a, b) {
  return String(a?.id || '') === String(b?.id || '');
}

/** @returns {Record<string, unknown>[]} */
export function loadScenicFavorites() {
  return safeLoadList(SCENIC_FAVORITES_KEY);
}

/**
 * @param {string | null | undefined} id
 */
export function isScenicFavorite(id) {
  const key = id != null ? String(id).trim() : '';
  if (!key) return false;
  return loadScenicFavorites().some((row) => String(row.id) === key);
}

/**
 * @param {Record<string, unknown>} spot
 * @returns {{ list: Record<string, unknown>[], added: boolean }}
 */
export function toggleScenicFavorite(spot) {
  const ref = toScenicRef(spot);
  if (!ref) return { list: loadScenicFavorites(), added: false };
  const prev = loadScenicFavorites();
  const exists = prev.some((row) => sameId(row, ref));
  let list;
  let added;
  if (exists) {
    list = prev.filter((row) => !sameId(row, ref));
    added = false;
  } else {
    list = [
      { ...ref, savedAt: Date.now() },
      ...prev.filter((row) => !sameId(row, ref)),
    ].slice(0, MAX_SCENIC_FAVORITES);
    added = true;
  }
  safeSaveList(SCENIC_FAVORITES_KEY, list);
  return { list, added };
}

/** @returns {Record<string, unknown>[]} */
export function loadScenicViewed() {
  return safeLoadList(SCENIC_VIEWED_KEY);
}

/**
 * @param {Record<string, unknown>} spot
 * @returns {Record<string, unknown>[]}
 */
export function pushScenicViewed(spot) {
  const ref = toScenicRef(spot);
  if (!ref) return loadScenicViewed();
  const next = [
    { ...ref, viewedAt: Date.now() },
    ...loadScenicViewed().filter((row) => !sameId(row, ref)),
  ].slice(0, MAX_SCENIC_VIEWED);
  safeSaveList(SCENIC_VIEWED_KEY, next);
  return next;
}

/**
 * SSOT/LIVE로 목록 행 hydrate — id 일치 시 live 필드 우선.
 * @param {Record<string, unknown>[]} refs
 * @param {Map<string, Record<string, unknown>>} byId
 */
export function hydrateScenicRefs(refs, byId) {
  return (refs || []).map((ref) => {
    const live = byId?.get(String(ref.id));
    if (!live) return ref;
    return { ...ref, ...live };
  });
}

/**
 * 권역별 그룹 (표시용). 미분류는 맨 아래.
 * @param {Record<string, unknown>[]} spots
 * @returns {{ id: string, label: string, items: Record<string, unknown>[] }[]}
 */
export function groupScenicByRegion(spots) {
  /** @type {Map<string, { id: string, label: string, items: Record<string, unknown>[] }>} */
  const groups = new Map();
  const unknown = [];
  for (const spot of spots || []) {
    const region = String(spot?.region || '').trim();
    if (!region) {
      unknown.push(spot);
      continue;
    }
    let g = groups.get(region);
    if (!g) {
      g = { id: region, label: region, items: [] };
      groups.set(region, g);
    }
    g.items.push(spot);
  }
  const ordered = [...groups.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'ko'),
  );
  if (unknown.length) {
    ordered.push({ id: 'unknown', label: '기타', items: unknown });
  }
  return ordered;
}
