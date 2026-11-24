import { getTravelAgencyById } from '../../../data/travelAgencies.js';
import { LOGBOOK_REVIEW_HUB_ROWS_STORAGE_KEY } from '../../../logbookOfficialReviews/logbookReviewHubListCache.js';
import { LOGBOOK_REVIEW_HUB_SESSION_KEY } from '../../../logbookOfficialReviews/logbookReviewHubSession.js';
import { normalizePersonaLabel } from '../../../utils/placeReviewEditorial.js';
import { matchTravelAgencyFromUrl, TRAVEL_AGENCY_VISITS_KEY } from '../../../utils/travelAgencyVisits.js';
import { RECENT_VISITED_KEY } from './exploreRecentHistory.js';
import { FAVORITES_KEY, VIEWED_KEY } from '../../Korea/festivalPersonalStore.js';

export const HOME_WATCH_CONTINUE_LIMIT = 3;

export const HOME_WATCH_SUBTITLE_KEY = {
  visited: 'home.watchCard.continueVisited',
  agency: 'home.watchCard.continueAgency',
  festivalViewed: 'home.watchCard.continueFestivalViewed',
  festivalFavorite: 'home.watchCard.continueFestivalFavorite',
  logbook: 'home.watchCard.continueReview',
};

/**
 * Recent destinations have no timestamp. Their list is already newest-first,
 * so index 0 is treated as `now` and each older row is 1ms earlier.
 * @param {number} now
 * @param {number} index
 */
export function homeWatchUntimedRecency(now, index) {
  const base = Number.isFinite(now) ? now : 0;
  const offset = Number.isFinite(index) && index > 0 ? index : 0;
  return base - offset;
}

function positiveTime(value) {
  const at = Number(value);
  return Number.isFinite(at) && at > 0 ? at : 0;
}

function visitedName(item) {
  if (typeof item === 'string') return item.trim();
  return String(item?.name || '').trim();
}

function visitedHref(item) {
  if (!item || typeof item !== 'object') return '';
  const slug = String(item.slug || '').trim();
  if (!slug || /[\s/?#]/.test(slug)) return '';
  return `/place/${slug}`;
}

/**
 * @param {object} input
 * @returns {object[]}
 */
export function mergeHomeWatchContinueItems({
  visited = [],
  agencyVisits = [],
  festivalViewed = [],
  festivalFavorites = [],
  logbookSession = null,
  logbookRows = [],
  now = Date.now(),
} = {}) {
  /** @type {object[]} */
  const rows = [];

  (Array.isArray(visited) ? visited : []).forEach((item, index) => {
    const name = visitedName(item);
    const href = visitedHref(item);
    if (!name || !href) return;
    rows.push({
      source: 'visited',
      name,
      subtitleKey: HOME_WATCH_SUBTITLE_KEY.visited,
      href,
      at: homeWatchUntimedRecency(now, index),
      reviewer: '',
      dedupeKey: `visited:${href}`,
    });
  });

  (Array.isArray(agencyVisits) ? agencyVisits : []).forEach((item) => {
    const href = String(item?.href || '').trim();
    const agency = getTravelAgencyById(item?.agencyId) || matchTravelAgencyFromUrl(href);
    if (!agency || !href) return;
    const placeLabel = String(item?.placeLabel || '').trim();
    const name = placeLabel || agency.nameKo || agency.nameEn || '';
    if (!name) return;
    rows.push({
      source: 'agency',
      name,
      subtitleKey: HOME_WATCH_SUBTITLE_KEY.agency,
      href,
      at: positiveTime(item?.visitedAt),
      reviewer: '',
      dedupeKey: `agency:${agency.id}:${href}`,
      external: true,
    });
  });

  const pushFestival = (item, source, subtitleKey, atField) => {
    const title = String(item?.title || '').trim();
    const contentId = String(item?.contentId || '').trim();
    if (!title && !contentId) return;
    const href = contentId
      ? `/korea?festival=${encodeURIComponent(contentId)}`
      : '/korea';
    rows.push({
      source,
      name: title || contentId,
      subtitleKey,
      href,
      at: positiveTime(item?.[atField]),
      reviewer: '',
      dedupeKey: `festival:${contentId || title}`,
    });
  };

  (Array.isArray(festivalViewed) ? festivalViewed : []).forEach((item) => {
    pushFestival(item, 'festivalViewed', HOME_WATCH_SUBTITLE_KEY.festivalViewed, 'viewedAt');
  });
  (Array.isArray(festivalFavorites) ? festivalFavorites : []).forEach((item) => {
    pushFestival(item, 'festivalFavorite', HOME_WATCH_SUBTITLE_KEY.festivalFavorite, 'savedAt');
  });

  if (logbookSession && typeof logbookSession === 'object') {
    const savedAt = positiveTime(logbookSession.savedAt);
    const returnTo = String(logbookSession.returnTo || '').trim();
    const anchorId = String(logbookSession.anchorReviewId || '').trim();
    if (savedAt || returnTo || anchorId) {
      const row = (Array.isArray(logbookRows) ? logbookRows : []).find(
        (entry) => anchorId && String(entry?.id || '') === anchorId,
      );
      const placeName = String(row?.place_name || '').trim();
      const href = returnTo.startsWith('/') ? returnTo : '/blog';
      rows.push({
        source: 'logbook',
        name: placeName,
        nameKey: placeName ? '' : 'home.watchCard.continueReviewFallback',
        subtitleKey: HOME_WATCH_SUBTITLE_KEY.logbook,
        href,
        at: savedAt,
        reviewer: normalizePersonaLabel(row?.persona_label),
        dedupeKey: `logbook:${anchorId || href}`,
      });
    }
  }

  rows.sort((a, b) => b.at - a.at);
  const seen = new Set();
  const merged = [];
  for (const row of rows) {
    if (seen.has(row.dedupeKey)) continue;
    seen.add(row.dedupeKey);
    merged.push({
      source: row.source,
      name: row.name,
      nameKey: row.nameKey || '',
      subtitleKey: row.subtitleKey,
      href: row.href,
      at: row.at,
      reviewer: row.reviewer || '',
      external: Boolean(row.external),
    });
    if (merged.length >= HOME_WATCH_CONTINUE_LIMIT) break;
  }
  return merged;
}

function readJson(storage, key) {
  if (!storage || typeof storage.getItem !== 'function') return null;
  try {
    return JSON.parse(storage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function readArray(storage, key) {
  const parsed = readJson(storage, key);
  return Array.isArray(parsed) ? parsed : [];
}

function browserStorages() {
  return {
    localStorage: typeof localStorage === 'undefined' ? null : localStorage,
    sessionStorage: typeof sessionStorage === 'undefined' ? null : sessionStorage,
  };
}

/**
 * Read-only. Uses the existing local stores and does not write them.
 * @param {number} [now]
 * @param {{ localStorage?: Storage | null, sessionStorage?: Storage | null }} [env]
 */
export function readHomeWatchContinueItems(now = Date.now(), env = browserStorages()) {
  const session = readJson(env.sessionStorage, LOGBOOK_REVIEW_HUB_SESSION_KEY);
  return mergeHomeWatchContinueItems({
    visited: readArray(env.localStorage, RECENT_VISITED_KEY),
    agencyVisits: readArray(env.localStorage, TRAVEL_AGENCY_VISITS_KEY),
    festivalViewed: readArray(env.localStorage, VIEWED_KEY),
    festivalFavorites: readArray(env.localStorage, FAVORITES_KEY),
    logbookSession: session && typeof session === 'object' ? session : null,
    logbookRows: readArray(env.sessionStorage, LOGBOOK_REVIEW_HUB_ROWS_STORAGE_KEY),
    now,
  });
}
