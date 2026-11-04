/** @typedef {'tourapi' | 'gateo_manual'} TourAttractionRowSource */

export const TOUR_ATTRACTION_SOURCE_TOURAPI = 'tourapi';
export const TOUR_ATTRACTION_SOURCE_MANUAL = 'gateo_manual';

/**
 * 주간 sync(deactivate·TourAPI upsert)가 건드려도 되는 행인지.
 * @param {string | null | undefined} source
 */
export function isTourapiSyncManagedSource(source) {
  const s = String(source ?? TOUR_ATTRACTION_SOURCE_TOURAPI).trim();
  return s === TOUR_ATTRACTION_SOURCE_TOURAPI;
}

/**
 * @param {{ content_id?: string, source?: string }[]} activeRows
 * @param {string[]} keepIds
 */
export function contentIdsToDeactivateMissing(activeRows, keepIds) {
  const keep = new Set(keepIds);
  return (activeRows || [])
    .filter((r) => isTourapiSyncManagedSource(r?.source))
    .map((r) => r.content_id)
    .filter((id) => id && !keep.has(id));
}

/**
 * @param {{ content_id?: string }[]} chunk
 * @param {string[]} manualContentIds
 */
export function filterTourapiUpsertChunkSkippingManual(chunk, manualContentIds) {
  const skip = new Set(manualContentIds || []);
  return (chunk || []).filter((r) => r?.content_id && !skip.has(r.content_id));
}
