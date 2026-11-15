/**
 * Hub list order: created_at DESC NULLS FIRST, then id ASC (UTF-16 code units).
 * Same rule as PostgREST `.order('created_at', { ascending: false, nullsFirst: true }).order('id', { ascending: true })`.
 */

export const LOGBOOK_REVIEW_HUB_E2E_TIE_SHUFFLE_KEY = 'gateo:e2e-logbook-hub-tie-shuffle';

/** Same instant, insertion order is not id order. E2E shuffles these ahead of the fixture. */
export const LOGBOOK_REVIEW_HUB_E2E_TIE_ROWS = [
  {
    id: 'tie-c',
    place_slug: 'osaka',
    place_name: '오사카',
    place_name_en: 'Osaka',
    persona_label: '미식갑니다',
    content: '같은 날짜 순서 고정 픽스처 C',
    images: [],
    created_at: '2026-11-09T08:00:00.000Z',
    is_public: true,
  },
  {
    id: 'tie-a',
    place_slug: 'rome',
    place_name: '로마',
    place_name_en: 'Rome',
    persona_label: '야경렌즈',
    content: '같은 날짜 순서 고정 픽스처 A',
    images: [],
    created_at: '2026-11-09T08:00:00.000Z',
    is_public: true,
  },
  {
    id: 'tie-b',
    place_slug: 'barcelona',
    place_name: '바르셀로나',
    place_name_en: 'Barcelona',
    persona_label: '로컬하루',
    content: '같은 날짜 순서 고정 픽스처 B',
    images: [],
    created_at: '2026-11-09T08:00:00.000Z',
    is_public: true,
  },
];

/** @param {unknown} row */
export function logbookOfficialReviewSortTime(row) {
  if (!row || typeof row !== 'object') return null;
  const raw = /** @type {{ created_at?: unknown }} */ (row).created_at;
  if (raw == null || raw === '') return null;
  const time = new Date(/** @type {string | number | Date} */ (raw)).getTime();
  return Number.isFinite(time) ? time : null;
}

/** @param {unknown} id */
export function compareLogbookOfficialReviewId(idA, idB) {
  const sa = idA == null ? '' : String(idA);
  const sb = idB == null ? '' : String(idB);
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

/** @param {unknown} a @param {unknown} b */
export function compareLogbookOfficialReviewRows(a, b) {
  const ta = logbookOfficialReviewSortTime(a);
  const tb = logbookOfficialReviewSortTime(b);
  if (ta !== tb) {
    if (ta == null) return -1;
    if (tb == null) return 1;
    return tb - ta;
  }
  const idA = a && typeof a === 'object' ? /** @type {{ id?: unknown }} */ (a).id : '';
  const idB = b && typeof b === 'object' ? /** @type {{ id?: unknown }} */ (b).id : '';
  return compareLogbookOfficialReviewId(idA, idB);
}

/** @param {unknown} rows */
export function sortLogbookOfficialReviewRows(rows) {
  const list = Array.isArray(rows) ? [...rows] : [];
  list.sort(compareLogbookOfficialReviewRows);
  return list;
}

/**
 * Union by id (later groups overwrite fields) then the shared sort.
 * Offset pages that repeat a tied id collapse; the sort puts each id in one place.
 * @param {...unknown} groups
 */
export function mergeLogbookOfficialReviewRows(...groups) {
  /** @type {Map<string, Record<string, unknown>>} */
  const byId = new Map();
  /** @type {unknown[]} */
  const anonymous = [];
  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const row of group) {
      if (!row || typeof row !== 'object') continue;
      const id = /** @type {{ id?: unknown }} */ (row).id;
      const key = id == null || id === '' ? '' : String(id);
      if (!key) {
        anonymous.push(row);
        continue;
      }
      const prev = byId.get(key);
      byId.set(key, prev ? { ...prev, .../** @type {Record<string, unknown>} */ (row) } : /** @type {Record<string, unknown>} */ (row));
    }
  }
  return sortLogbookOfficialReviewRows([...byId.values(), ...anonymous]);
}

/**
 * One sorted sequence, then a half-open slice. Adjacent pages do not overlap or skip.
 * @param {unknown} rows
 * @param {number} [offset]
 * @param {number} [limit]
 */
export function pageLogbookOfficialReviewRows(rows, offset = 0, limit = Number.POSITIVE_INFINITY) {
  const sorted = sortLogbookOfficialReviewRows(rows);
  const start = Number.isFinite(offset) ? Math.max(0, Math.trunc(offset)) : 0;
  const size = Number.isFinite(limit) ? Math.max(0, Math.trunc(limit)) : sorted.length;
  return sorted.slice(start, start + size);
}

/** @param {unknown} [mode] */
export function readLogbookReviewHubE2eTieShuffleMode(mode) {
  if (mode === 'forward' || mode === 'reverse' || mode === '') return mode;
  if (typeof window === 'undefined') return '';
  try {
    const stored = window.sessionStorage.getItem(LOGBOOK_REVIEW_HUB_E2E_TIE_SHUFFLE_KEY) || '';
    return stored === 'forward' || stored === 'reverse' ? stored : '';
  } catch {
    return '';
  }
}

/**
 * @param {unknown} baseRows
 * @param {'forward' | 'reverse' | '' | unknown} [mode]
 */
export function logbookReviewHubE2eRows(baseRows, mode = readLogbookReviewHubE2eTieShuffleMode()) {
  const base = Array.isArray(baseRows) ? baseRows.map((row) => ({ .../** @type {Record<string, unknown>} */ (row) })) : [];
  const shuffle = readLogbookReviewHubE2eTieShuffleMode(mode);
  if (shuffle !== 'forward' && shuffle !== 'reverse') return base;
  const ties = LOGBOOK_REVIEW_HUB_E2E_TIE_ROWS.map((row) => ({ ...row }));
  if (shuffle === 'reverse') return [...ties].reverse().concat([...base].reverse());
  return [...ties, ...base];
}
