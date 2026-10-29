export const LOGBOOK_FEED_VIEW_STORAGE_KEY = 'gateo:logbook-feed-view';
export const LOGBOOK_FEED_VIEW_URL_PARAM = 'feedView';

/** @typedef {'list' | 'column' | 'grid'} LogbookFeedViewMode */

/** @type {LogbookFeedViewMode[]} */
export const LOGBOOK_FEED_VIEW_MODES = ['list', 'column', 'grid'];

/**
 * @param {unknown} value
 * @returns {LogbookFeedViewMode | null}
 */
export function parseLogbookFeedView(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return LOGBOOK_FEED_VIEW_MODES.includes(normalized) ? normalized : null;
}

/**
 * @param {boolean} isLgUp — Tailwind `lg` (>=1024px)
 * @returns {LogbookFeedViewMode}
 */
export function defaultLogbookFeedViewForViewport(isLgUp) {
  return isLgUp ? 'grid' : 'column';
}

/**
 * Precedence: URL param → localStorage → viewport default.
 *
 * @param {{
 *   isLgUp: boolean;
 *   urlView?: string | null;
 *   storedView?: string | null;
 * }} input
 * @returns {{ mode: LogbookFeedViewMode; source: 'url' | 'storage' | 'viewport' }}
 */
export function resolveLogbookFeedViewMode({ isLgUp, urlView, storedView }) {
  const fromUrl = parseLogbookFeedView(urlView);
  if (fromUrl) return { mode: fromUrl, source: 'url' };

  const fromStore = parseLogbookFeedView(storedView);
  if (fromStore) return { mode: fromStore, source: 'storage' };

  return {
    mode: defaultLogbookFeedViewForViewport(isLgUp),
    source: 'viewport',
  };
}

/**
 * @returns {LogbookFeedViewMode | null}
 */
export function readStoredLogbookFeedView() {
  if (typeof window === 'undefined') return null;
  try {
    return parseLogbookFeedView(window.localStorage.getItem(LOGBOOK_FEED_VIEW_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * @param {LogbookFeedViewMode} mode
 */
export function writeStoredLogbookFeedView(mode) {
  if (typeof window === 'undefined') return;
  const parsed = parseLogbookFeedView(mode);
  if (!parsed) return;
  try {
    window.localStorage.setItem(LOGBOOK_FEED_VIEW_STORAGE_KEY, parsed);
  } catch {
    // ignore quota / private mode
  }
}
