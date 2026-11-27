/** GATEO hand-registered tourapi_attraction rows (source gateo_manual), not KTO content ids. */
const GATEO_MANUAL_TOUR_CONTENT_ID_RE = /^9900000000\d{2}$/;

export function isGateoManualTourContentId(contentId) {
  return GATEO_MANUAL_TOUR_CONTENT_ID_RE.test(String(contentId || '').trim());
}

/** TourAPI detailImage/detailCommon — skip synthetic manual ids, keep real numeric ids. */
export function resolveTourGalleryContentId(contentId) {
  const id = String(contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(id)) return null;
  if (isGateoManualTourContentId(id)) return null;
  return id;
}