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
  mobile: { bottom: 228, height: 85, side: 12, slots: 3, maxWidth: 1279 },
  desktop: { left: 300, bottom: 110, height: 85, minWidth: 1280, slots: 4 },
};

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
/**
 * Fixed right inset. Matches `.home-monthly-card` and clears the docked MOONi.
 * A dragged MOONi overlays this box; its live position must not change the width.
 */
export const HOME_MONTHLY_CARD_RIGHT = {
  mobile: 108,
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
  return {
    left,
    right,
    bottom,
    height: HOME_WATCH_CARD_LAYOUT.mobile.height,
    top: height - bottom - HOME_WATCH_CARD_LAYOUT.mobile.height,
  };
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

export function shouldHideHomeWatchCard({
  placeCard = false,
  explore = false,
  mooniChat = false,
  cinema = false,
  siteNotice = false,
} = {}) {
  return Boolean(placeCard || explore || mooniChat || cinema || siteNotice);
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

export function buildHomeWatchMonthlyDestinations(now = new Date(), rows = [], monthKey) {
  const resolvedKey = monthKey
    ? resolveExploreV2MonthlyPickKey(monthKey)
    : resolveExploreV2MonthlyPickKey(resolveExploreCurrentMonthPickKey(now));
  const cards = partitionExploreMonthlyPickCardsByHero(buildVisibleMonthlyPickCards(resolvedKey)).withHero;
  return cards.map(({ entry, spot, imageUrl }) => {
    const slug = String(spot?.slug || entry?.slug || '').trim();
    const name = monthlyPickDisplayName(spot, slug);
    const reviewer = reviewerForPlaceSlug(slug, rows);
    return {
      slug,
      name,
      imageUrl,
      reason: String(entry?.reason || '').trim(),
      reasonEn: String(entry?.reason_en || '').trim(),
      href: slug ? `/place/${getPlaceUrlParam(spot) || slug}` : '',
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
