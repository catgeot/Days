/** Left-panel related chips keep the current place tab. Gallery is the URL default when omitted. */
export const RELATED_PLACE_TAB_BY_MODE = {
  GALLERY: 'gallery',
  REVIEWS: 'reviews',
};

export function relatedPlaceTabForMediaMode(mediaMode) {
  return RELATED_PLACE_TAB_BY_MODE[mediaMode] || null;
}

export function relatedPlacePathSuffix(mediaMode) {
  const tab = relatedPlaceTabForMediaMode(mediaMode);
  return tab ? `/${tab}` : '';
}
