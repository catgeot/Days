/**
 * /korea 개인 목록 — 즐겨찾기·본 항목 (localStorage).
 * D 도로루트 경유 후보 SSOT. Supabase saved_trips와 분리.
 */

import { detectSidoCode, sidoLabel } from './festivalRegionTags.js';

export const FAVORITES_KEY = 'gateo:korea-festivals:v1:favorites';
export const VIEWED_KEY = 'gateo:korea-festivals:v1:viewed';
export const MAX_FAVORITES = 80;
export const MAX_VIEWED = 40;

/**
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {Record<string, unknown> | null}
 */
export function toFestivalRef(item) {
  if (!item || typeof item !== 'object') return null;
  const contentId = item.contentId != null ? String(item.contentId).trim() : '';
  const title = String(item.title || '').trim();
  if (!contentId && !title) return null;
  const ref = {
    contentId: contentId || `title:${title}`,
    title,
  };
  const addr1 = String(item.addr1 || '').trim();
  if (addr1) ref.addr1 = addr1;
  const eventStartDate = String(item.eventStartDate || '').trim();
  if (eventStartDate) ref.eventStartDate = eventStartDate;
  const eventEndDate = String(item.eventEndDate || '').trim();
  if (eventEndDate) ref.eventEndDate = eventEndDate;
  const firstimage = String(
    item.firstimage || item.imageUrl || item.firstimage2 || '',
  ).trim();
  if (firstimage) ref.firstimage = firstimage;
  if (item.mapx != null && item.mapx !== '') ref.mapx = item.mapx;
  if (item.mapy != null && item.mapy !== '') ref.mapy = item.mapy;
  if (item.areaCode != null && item.areaCode !== '') {
    ref.areaCode = String(item.areaCode);
  } else {
    const detected = detectSidoCode(addr1);
    if (detected) ref.areaCode = detected;
  }
  if (item.contentTypeId != null && item.contentTypeId !== '') {
    ref.contentTypeId = String(item.contentTypeId);
  }
  return ref;
}

function safeLoadList(key) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => toFestivalRef(row))
      .filter(Boolean);
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
  return String(a?.contentId || '') === String(b?.contentId || '');
}

/**
 * @returns {Record<string, unknown>[]}
 */
export function loadFavorites() {
  return safeLoadList(FAVORITES_KEY);
}

/**
 * @param {string | number | null | undefined} contentId
 */
export function isFavorite(contentId) {
  const id = contentId != null ? String(contentId) : '';
  if (!id) return false;
  return loadFavorites().some((row) => String(row.contentId) === id);
}

/**
 * @param {Record<string, unknown>} item
 * @returns {{ list: Record<string, unknown>[], added: boolean }}
 */
export function toggleFavorite(item) {
  const ref = toFestivalRef(item);
  if (!ref) return { list: loadFavorites(), added: false };
  const prev = loadFavorites();
  const exists = prev.some((row) => sameId(row, ref));
  let list;
  let added;
  if (exists) {
    list = prev.filter((row) => !sameId(row, ref));
    added = false;
  } else {
    list = [{ ...ref, savedAt: Date.now() }, ...prev.filter((row) => !sameId(row, ref))].slice(
      0,
      MAX_FAVORITES,
    );
    added = true;
  }
  safeSaveList(FAVORITES_KEY, list);
  return { list, added };
}

/**
 * @returns {Record<string, unknown>[]}
 */
export function loadViewed() {
  return safeLoadList(VIEWED_KEY);
}

/**
 * @param {Record<string, unknown>} item
 * @returns {Record<string, unknown>[]}
 */
export function pushViewed(item) {
  const ref = toFestivalRef(item);
  if (!ref) return loadViewed();
  const next = [
    { ...ref, viewedAt: Date.now() },
    ...loadViewed().filter((row) => !sameId(row, ref)),
  ].slice(0, MAX_VIEWED);
  safeSaveList(VIEWED_KEY, next);
  return next;
}

/**
 * LIVE 목록과 병합 — contentId 일치 시 LIVE 필드 우선.
 * @param {Record<string, unknown>[]} refs
 * @param {Map<string, Record<string, unknown>>} byContentId
 */
export function hydrateFestivalRefs(refs, byContentId) {
  return (refs || []).map((ref) => {
    const live = byContentId?.get(String(ref.contentId));
    if (!live) return ref;
    return { ...ref, ...live };
  });
}

/**
 * 시도별 그룹 (표시용). 미분류는 맨 아래.
 * @param {Record<string, unknown>[]} items
 * @returns {{ id: string, label: string, items: Record<string, unknown>[] }[]}
 */
export function groupFestivalsBySido(items) {
  /** @type {Map<string, { id: string, label: string, items: Record<string, unknown>[] }>} */
  const groups = new Map();
  const unknown = [];
  for (const item of items || []) {
    const code =
      (item?.areaCode != null && String(item.areaCode)) ||
      detectSidoCode(item?.addr1) ||
      '';
    if (!code) {
      unknown.push(item);
      continue;
    }
    const id = String(code);
    let g = groups.get(id);
    if (!g) {
      g = { id, label: sidoLabel(id) || id, items: [] };
      groups.set(id, g);
    }
    g.items.push(item);
  }
  const ordered = [...groups.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'ko'),
  );
  if (unknown.length) {
    ordered.push({ id: 'unknown', label: '기타', items: unknown });
  }
  return ordered;
}
