/** URL segment ↔ left-panel media mode (PlaceCard expanded). */

export const PLACE_URL_TAB_BY_MEDIA_MODE = {
  GALLERY: 'gallery',
  VIDEO: 'video',
  WIKI: 'wiki',
  REVIEWS: 'reviews',
  PLANNER: 'planner',
  WORLD_EVENTS: 'events',
};

export function placePathSuffixForMediaMode(mode) {
  const tab = PLACE_URL_TAB_BY_MEDIA_MODE[mode];
  if (!tab || tab === 'gallery') return '';
  return `/${tab}`;
}

/** @param {string | undefined} tab */
export function mediaModeFromUrlTab(tab) {
  const key = String(tab || 'gallery').trim().toLowerCase();
  for (const [mode, urlTab] of Object.entries(PLACE_URL_TAB_BY_MEDIA_MODE)) {
    if (urlTab === key) return mode;
  }
  return 'GALLERY';
}

export function expandedMediaModesIncludingWorldEvents(flagOn) {
  const modes = ['GALLERY', 'VIDEO', 'WIKI', 'REVIEWS', 'PLANNER'];
  if (flagOn) modes.push('WORLD_EVENTS');
  return modes;
}
