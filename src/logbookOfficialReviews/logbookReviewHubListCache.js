const ROWS_KEY = 'gateo:logbook-review-hub-rows';
const MAX_ROWS = 500;
const MAX_JSON = 1_800_000;

/** @type {Array<Record<string, unknown>> | null} */
let memoryRows = null;

function storage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** @param {Record<string, unknown>} row */
function slimRow(row) {
  const images = Array.isArray(row.images) ? row.images.slice(0, 1) : row.images;
  const content = typeof row.content === 'string' ? row.content.slice(0, 480) : row.content;
  return {
    id: row.id,
    place_slug: row.place_slug,
    place_name: row.place_name,
    place_name_en: row.place_name_en,
    persona_label: row.persona_label,
    content,
    images,
    created_at: row.created_at,
    is_public: row.is_public,
  };
}

/** @param {unknown} value */
function asRows(value) {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value.filter((row) => row && typeof row === 'object').slice(0, MAX_ROWS);
}

function writeStored(rows) {
  const store = storage();
  if (!store) return;
  try {
    const json = JSON.stringify(rows);
    if (json.length > MAX_JSON) return;
    store.setItem(ROWS_KEY, json);
  } catch {
    /* quota or private mode */
  }
}

/** @param {unknown} rows */
export function rememberLogbookReviewHubRows(rows) {
  const list = asRows(rows);
  if (!list) return;
  memoryRows = list;
  writeStored(list.map((row) => slimRow(/** @type {Record<string, unknown>} */ (row))));
}

/** @returns {Array<Record<string, unknown>> | null} */
export function readLogbookReviewHubRows() {
  if (Array.isArray(memoryRows) && memoryRows.length > 0) return memoryRows;
  const store = storage();
  if (!store) return null;
  try {
    const parsed = asRows(JSON.parse(store.getItem(ROWS_KEY) || 'null'));
    if (!parsed) return null;
    memoryRows = parsed;
    return parsed;
  } catch {
    return null;
  }
}

/** Simulates a full reload: session copy remains, module memory does not. */
export function dropLogbookReviewHubRowsMemory() {
  memoryRows = null;
}

export function clearLogbookReviewHubListCache() {
  memoryRows = null;
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(ROWS_KEY);
  } catch {
    /* ignore */
  }
}
