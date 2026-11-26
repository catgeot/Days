import { buildLogbookReviewerFilterHref } from '../../../logbookOfficialReviews/logbookReviewFilterUrl.js';
import { normalizePersonaLabel } from '../../../utils/placeReviewEditorial.js';
import { MONTHLY_PICKS } from '../data/spotTraits.js';
import {
  buildVisibleMonthlyPickCards,
  monthlyPickDisplayName,
  partitionExploreMonthlyPickCardsByHero,
  resolveExploreCurrentMonthPickKey,
  resolveExploreV2MonthlyPickKey,
  seoulExploreCalendarParts,
} from './exploreMonthlyPicks.js';
import { getPlaceUrlParam } from './formatUrlName.js';

export const HOME_WATCH_DISMISS_KEY = 'gateo:home-watch-card:dismissed-until';
export const HOME_WATCH_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export const HOME_WATCH_CARD_LAYOUT = {
  /** 390: above the category bar, footer links, and the MOONi intro bubble. */
  mobile: { bottom: 228, height: 96, side: 12, slots: 3, maxWidth: 1279 },
  desktop: { left: 300, bottom: 110, height: 85, minWidth: 1280, slots: 4 },
};

/** Mobile-only globe nudge when the default home watch bar is on screen (clears bottom crowding). */
export const HOME_WATCH_MOBILE_GLOBE_LIFT_PX = 52;
export const HOME_WATCH_GLOBE_LIFT_DATA_ATTR = 'homeWatchGlobeLift';
export const HOME_WATCH_GLOBE_LIFT_CSS_VAR = '--home-watch-globe-lift';

export function shouldApplyHomeWatchGlobeLift(viewportWidth, shown) {
  if (!shown) return false;
  return Number(viewportWidth) < HOME_WATCH_CARD_LAYOUT.desktop.minWidth;
}

export function syncHomeWatchGlobeLift({
  shown = false,
  viewportWidth = typeof window === 'undefined' ? 390 : window.innerWidth,
  doc = typeof document === 'undefined' ? null : document,
} = {}) {
  if (!doc?.documentElement) return;
  const root = doc.documentElement;
  if (shouldApplyHomeWatchGlobeLift(viewportWidth, shown)) {
    root.dataset[HOME_WATCH_GLOBE_LIFT_DATA_ATTR] = '1';
    root.style.setProperty(HOME_WATCH_GLOBE_LIFT_CSS_VAR, `${HOME_WATCH_MOBILE_GLOBE_LIFT_PX}px`);
    return;
  }
  delete root.dataset[HOME_WATCH_GLOBE_LIFT_DATA_ATTR];
  root.style.removeProperty(HOME_WATCH_GLOBE_LIFT_CSS_VAR);
}

/**
 * Opaque color behind each caption line (label, name, taste chip, subtitle).
 * The line hugs the text. A full-width slab covered more than half of the 85px tile.
 * 0.86 black stays ≥4.5:1 for white, white/80, and amber-100 even on a white photo.
 */
export const HOME_WATCH_CAPTION_BAND = 'rgba(0,0,0,0.86)';

/**
 * KST day-of-month when next month's home card opens (inclusive).
 * 1 = the 1st, so the preview of next month is available all month
 * (December from Nov 1; January from Dec 1). Retune with the January data PR.
 * /explore keeps its own 15/20-day rule.
 */
export const HOME_MONTHLY_PREVIEW_START_DAY = 1;
export const HOME_MONTHLY_PREVIEW_START_QUERY = 'home_monthly_preview_start';
export const HOME_MONTHLY_CARD_GAP = 8;
/** Mobile matches `left` inset (full width); desktop clears the docked MOONi. */
export const HOME_MONTHLY_CARD_RIGHT = {
  mobile: HOME_WATCH_CARD_LAYOUT.mobile.side,
  desktop: 120,
};

/** @param {string | null | undefined} search */
export function resolveHomeMonthlyPreviewStartDay(
  search,
  fallback = HOME_MONTHLY_PREVIEW_START_DAY,
) {
  try {
    const raw = new URLSearchParams(String(search || '').replace(/^\?/, '')).get(
      HOME_MONTHLY_PREVIEW_START_QUERY,
    );
    const day = Number(raw);
    if (Number.isInteger(day) && day >= 1 && day <= 28) return day;
  } catch {
    /* ignore malformed search */
  }
  return fallback;
}

/**
 * @param {Date} [now]
 * @param {number} [startDay]
 * @param {Record<string, unknown[]>} [picks]
 */
export function homeMonthlySwitchState(
  now = new Date(),
  startDay = HOME_MONTHLY_PREVIEW_START_DAY,
  picks = MONTHLY_PICKS,
) {
  const parts = seoulExploreCalendarParts(now);
  const nextMonth = parts.month === 12 ? 1 : parts.month + 1;
  const windowOpen = parts.day >= startDay;
  const nextEntries = picks?.[parts.nextMonthKey];
  const nextHasPicks = Array.isArray(nextEntries) && nextEntries.length > 0;
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    nextMonth,
    currentMonthKey: parts.monthKey,
    nextMonthKey: parts.nextMonthKey,
    windowOpen,
    previewOpen: windowOpen && nextHasPicks,
  };
}

/**
 * Flag-on placement: sit just above the bottom About row / nav / chat.
 * Width stays on the fixed inset. `obstacles` are viewport rects.
 * `mooni` is accepted and ignored so a dragged button cannot reflow the card.
 */
export function layoutHomeMonthlyCard({
  viewportWidth,
  viewportHeight,
  safeBottom = 0,
  obstacles = [],
  gap = HOME_MONTHLY_CARD_GAP,
} = {}) {
  const width = Number(viewportWidth) || 0;
  const height = Number(viewportHeight) || 0;
  const desktop = width >= HOME_WATCH_CARD_LAYOUT.desktop.minWidth;
  const left = desktop
    ? HOME_WATCH_CARD_LAYOUT.desktop.left
    : HOME_WATCH_CARD_LAYOUT.mobile.side;
  const right = desktop ? HOME_MONTHLY_CARD_RIGHT.desktop : HOME_MONTHLY_CARD_RIGHT.mobile;
  const cardLeft = left;
  const cardRight = width - right;
  let bottom = Math.max(0, Number(safeBottom) || 0) + gap;
  for (const rect of obstacles) {
    if (!rect || rect.width < 1 || rect.height < 1) continue;
    if (rect.top < height * 0.45) continue;
    const overlapsX = cardLeft < rect.right - 0.5 && cardRight > rect.left + 0.5;
    if (!overlapsX) continue;
    bottom = Math.max(bottom, height - rect.top + gap);
  }
  const cardHeight = desktop
    ? HOME_WATCH_CARD_LAYOUT.desktop.height
    : HOME_WATCH_CARD_LAYOUT.mobile.height;
  return {
    left,
    right,
    bottom,
    height: cardHeight,
    top: height - bottom - cardHeight,
  };
}

export function homeWatchCardHeightForWidth(width) {
  return Number(width) >= HOME_WATCH_CARD_LAYOUT.desktop.minWidth
    ? HOME_WATCH_CARD_LAYOUT.desktop.height
    : HOME_WATCH_CARD_LAYOUT.mobile.height;
}

export function homeWatchSlotCountForWidth(width) {
  return Number(width) >= HOME_WATCH_CARD_LAYOUT.desktop.minWidth
    ? HOME_WATCH_CARD_LAYOUT.desktop.slots
    : HOME_WATCH_CARD_LAYOUT.mobile.slots;
}

export function rectsOverlap(a, b, padding = 0) {
  if (!a || !b) return false;
  const pad = Number(padding) || 0;
  return (
    a.left < b.right - pad &&
    a.right > b.left + pad &&
    a.top < b.bottom - pad &&
    a.bottom > b.top + pad
  );
}

export const MOONI_FAB_HINT_BASE_GAP = 8;
export const MOONI_FAB_HINT_MAX_WIDTH = 220;

/**
 * Margin below the MOONi hint (above the FAB) so the hint box clears `obstacles`.
 * `hintOnRight` mirrors MooniAgentFab placement relative to the FAB.
 */
export function mooniFabHintMarginBottom({
  fabRect,
  hintWidth = MOONI_FAB_HINT_MAX_WIDTH,
  hintHeight,
  hintOnRight = false,
  baseGap = MOONI_FAB_HINT_BASE_GAP,
  obstacles = [],
  clearanceGap = HOME_MONTHLY_CARD_GAP,
} = {}) {
  const fab = fabRect;
  const height = Number(hintHeight) || 0;
  if (!fab || fab.width < 1 || fab.height < 1 || height < 1) return baseGap;
  const width = Math.min(Math.max(1, Number(hintWidth) || MOONI_FAB_HINT_MAX_WIDTH), MOONI_FAB_HINT_MAX_WIDTH);
  let marginBottom = Math.max(0, Number(baseGap) || 0);
  const pad = Number(clearanceGap) || 0;

  const computeHint = () => {
    const hintLeft = hintOnRight ? fab.left : fab.right - width;
    const hintRight = hintOnRight ? fab.left + width : fab.right;
    const hintBottom = fab.top - marginBottom;
    return {
      left: hintLeft,
      right: hintRight,
      top: hintBottom - height,
      bottom: hintBottom,
      width,
      height,
    };
  };

  let changed = true;
  while (changed) {
    changed = false;
    const hint = computeHint();
    for (const obs of obstacles) {
      if (!obs || obs.width < 1 || obs.height < 1) continue;
      if (!rectsOverlap(hint, obs)) continue;
      const shift = hint.bottom - obs.top + pad;
      if (shift > 0.5) {
        marginBottom += shift;
        changed = true;
        break;
      }
    }
  }

  return marginBottom;
}

/** Pixels to add beyond `baseGap` (Tailwind mb-2) for inline style. */
export function mooniFabHintExtraMarginBottom(options) {
  const baseGap = Math.max(0, Number(options?.baseGap) || MOONI_FAB_HINT_BASE_GAP);
  const total = mooniFabHintMarginBottom(options);
  return Math.max(0, total - baseGap);
}

export const MOONI_FAB_MOBILE_CHROME_SELECTORS = [
  '[data-testid="home-category-bar"]',
  '[data-testid="home-about-row"]',
  '[data-testid="home-globe-country-menu"]',
];

/**
 * When the FAB overlaps any obstacle, raise `bottom` so the FAB rests `gap` px above it.
 * `right` stays put. No overlap returns `pos`.
 */
export function mooniFabPositionAboveObstacles({
  pos,
  fabRect,
  obstacles = [],
  viewportHeight,
  gap = HOME_MONTHLY_CARD_GAP,
} = {}) {
  if (!pos || typeof pos.right !== 'number' || typeof pos.bottom !== 'number') return pos;
  if (!fabRect || fabRect.width < 1 || fabRect.height < 1) return pos;
  const height = Number(viewportHeight);
  if (!Number.isFinite(height) || height < 1) return pos;

  const list = (Array.isArray(obstacles) ? obstacles : []).filter(
    (obs) => obs && obs.width >= 1 && obs.height >= 1,
  );
  const hits = list.filter((obs) => rectsOverlap(fabRect, obs));
  if (!hits.length) return pos;

  const ceiling = Math.min(...hits.map((obs) => obs.top));
  const pad = Number.isFinite(Number(gap)) ? Number(gap) : 0;
  const bottom = height - ceiling + pad;
  if (!(bottom > pos.bottom + 0.5)) return pos;
  return { right: pos.right, bottom };
}

/**
 * When the FAB overlaps the placed monthly card, one of its tiles, or a header
 * control, raise `bottom` so the FAB rests `gap` px above that obstacle.
 * `right` stays put. No overlap (card dismissed or absent) returns `pos`.
 */
export function mooniFabPositionAboveMonthlyCard({
  pos,
  fabRect,
  cardRect = null,
  obstacles = [],
  viewportHeight,
  gap = HOME_MONTHLY_CARD_GAP,
} = {}) {
  const merged = [];
  if (cardRect && cardRect.width >= 1 && cardRect.height >= 1) merged.push(cardRect);
  for (const obs of Array.isArray(obstacles) ? obstacles : []) {
    if (obs && obs.width >= 1 && obs.height >= 1) merged.push(obs);
  }
  return mooniFabPositionAboveObstacles({
    pos,
    fabRect,
    obstacles: merged,
    viewportHeight,
    gap,
  });
}

/** @param {(typeof document)['querySelectorAll']} root */
export function collectMooniFabObstacleRects(selectors, root = document) {
  const rects = [];
  for (const sel of selectors) {
    for (const el of root.querySelectorAll(sel)) {
      const rect = el.getBoundingClientRect();
      if (rect.width >= 1 && rect.height >= 1) rects.push(rect);
    }
  }
  return rects;
}

export function mooniFabPositionClearingObstacles({
  pos,
  fabRect,
  obstacles = [],
  viewportHeight,
  gap = HOME_MONTHLY_CARD_GAP,
  resolveFabRect,
  maxPasses = 12,
} = {}) {
  if (!pos || !fabRect || fabRect.width < 1) return pos;
  let current = pos;
  let rect = fabRect;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    const next = mooniFabPositionAboveObstacles({
      pos: current,
      fabRect: rect,
      obstacles,
      viewportHeight,
      gap,
    });
    if (Math.abs(next.bottom - current.bottom) < 0.5) return current;
    current = next;
    rect = typeof resolveFabRect === 'function' ? resolveFabRect(current) : rect;
  }
  return current;
}

export function shouldHideHomeWatchCard({
  placeCard = false,
  explore = false,
  mooniChat = false,
  cinema = false,
  siteNotice = false,
  /** Mobile globe country/subregion menu open — yields the highlights bar. */
  mobileGlobeRegionsMenu = false,
} = {}) {
  return Boolean(placeCard || explore || mooniChat || cinema || siteNotice || mobileGlobeRegionsMenu);
}

export function isHomeWatchDismissed(now = Date.now(), storage = defaultStorage()) {
  if (!storage) return false;
  try {
    const until = Number(storage.getItem(HOME_WATCH_DISMISS_KEY));
    return Number.isFinite(until) && until > now;
  } catch {
    return false;
  }
}

/** Stores only the hide-until timestamp. No place names or other personal data. */
export function dismissHomeWatchCard(now = Date.now(), storage = defaultStorage()) {
  if (!storage) return 0;
  const until = now + HOME_WATCH_DISMISS_MS;
  storage.setItem(HOME_WATCH_DISMISS_KEY, String(until));
  return until;
}

function defaultStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export function homeWatchViewParams(slotCount) {
  return { slot_count: slotCount };
}

export function homeWatchClickParams(slotType) {
  return { slot_type: slotType };
}

export function homeWatchDismissParams() {
  return {};
}

/**
 * @param {string} slug
 * @param {Array<{ place_slug?: string, persona_label?: string, created_at?: string }>} [rows]
 */
export function reviewerForPlaceSlug(slug, rows) {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return '';
  const matches = (Array.isArray(rows) ? rows : []).filter(
    (row) => String(row?.place_slug || '').trim().toLowerCase() === key && normalizePersonaLabel(row?.persona_label),
  );
  if (!matches.length) return '';
  matches.sort((a, b) => String(b?.created_at || '').localeCompare(String(a?.created_at || '')));
  return normalizePersonaLabel(matches[0]?.persona_label);
}

export function buildHomeWatchMonthlyDestinations(now = new Date(), rows = [], monthKey, language = 'ko') {
  const resolvedKey = monthKey
    ? resolveExploreV2MonthlyPickKey(monthKey)
    : resolveExploreV2MonthlyPickKey(resolveExploreCurrentMonthPickKey(now));
  const cards = partitionExploreMonthlyPickCardsByHero(buildVisibleMonthlyPickCards(resolvedKey)).withHero;
  return cards.map(({ entry, spot, imageUrl }) => {
    const slug = String(spot?.slug || entry?.slug || '').trim();
    const name = monthlyPickDisplayName(spot, slug, language);
    const reviewer = reviewerForPlaceSlug(slug, rows);
    return {
      slug,
      name,
      imageUrl,
      reason: String(entry?.reason || '').trim(),
      reasonEn: String(entry?.reason_en || '').trim(),
      href: slug
        ? `/place/${getPlaceUrlParam(spot) || slug}?monthly=${encodeURIComponent(resolvedKey)}`
        : '',
      reviewer,
      reviewerHref: reviewer ? buildLogbookReviewerFilterHref(reviewer) : '',
    };
  }).filter((item) => item.name && item.href && item.imageUrl);
}

/**
 * @param {{
 *   continueItems?: object[],
 *   destinations?: object[],
 *   reelsEnabled?: boolean,
 *   slotCount?: number,
 *   reelsPoster?: string,
 *   limitDestinations?: boolean,
 * }} input
 */
export function buildHomeWatchSlots({
  continueItems = [],
  destinations = [],
  reelsEnabled = false,
  slotCount = HOME_WATCH_CARD_LAYOUT.mobile.slots,
  reelsPoster = '',
  limitDestinations = true,
} = {}) {
  const count = slotCount === HOME_WATCH_CARD_LAYOUT.desktop.slots
    ? HOME_WATCH_CARD_LAYOUT.desktop.slots
    : HOME_WATCH_CARD_LAYOUT.mobile.slots;
  const unlimited = limitDestinations === false;
  const slots = [];
  const head = continueItems[0];
  if (head?.href && (head.name || head.nameKey)) {
    slots.push({
      type: 'continue',
      ...head,
      continueCount: continueItems.length,
    });
  }
  const reelsSlot = reelsEnabled
    ? {
        type: 'reels',
        href: '/reels',
        poster: String(reelsPoster || ''),
        name: '',
        reviewer: '',
      }
    : null;
  const destLimit = unlimited ? Number.POSITIVE_INFINITY : count - (reelsSlot ? 1 : 0);
  for (const dest of destinations) {
    if (slots.length >= destLimit) break;
    if (!dest?.href || !dest?.name) continue;
    slots.push({
      type: 'destination',
      ...dest,
      reviewerHref: dest.reviewer ? dest.reviewerHref || buildLogbookReviewerFilterHref(dest.reviewer) : '',
    });
  }
  if (reelsSlot) slots.push(reelsSlot);
  if (unlimited) return slots;
  return slots.slice(0, count);
}

export function resolveHomeWatchReelsPoster() {
  const raw =
    import.meta.env?.VITE_GATEO_REELS_BASE_URL ?? globalThis.__VITE_ENV__?.VITE_GATEO_REELS_BASE_URL;
  const base = String(raw || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  return `${base}/kogl/v1/v5-poster.webp`;
}
