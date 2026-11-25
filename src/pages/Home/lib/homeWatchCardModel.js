import { buildLogbookReviewerFilterHref } from '../../../logbookOfficialReviews/logbookReviewFilterUrl.js';
import { normalizePersonaLabel } from '../../../utils/placeReviewEditorial.js';
import {
  buildVisibleMonthlyPickCards,
  monthlyPickDisplayName,
  partitionExploreMonthlyPickCardsByHero,
  resolveExploreCurrentMonthPickKey,
  resolveExploreV2MonthlyPickKey,
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
 * Solid band behind every tile caption. A bottom gradient left live captions
 * at about 3.6–4.3:1 on bright photos. 0.86 black stays ≥4.5:1 for white,
 * white/80, and amber-100 even when the photo under the band is white.
 */
export const HOME_WATCH_CAPTION_BAND = 'rgba(0,0,0,0.86)';

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

export function buildHomeWatchMonthlyDestinations(now = new Date(), rows = []) {
  const monthKey = resolveExploreV2MonthlyPickKey(resolveExploreCurrentMonthPickKey(now));
  const cards = partitionExploreMonthlyPickCardsByHero(buildVisibleMonthlyPickCards(monthKey)).withHero;
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
 * }} input
 */
export function buildHomeWatchSlots({
  continueItems = [],
  destinations = [],
  reelsEnabled = false,
  slotCount = HOME_WATCH_CARD_LAYOUT.mobile.slots,
  reelsPoster = '',
} = {}) {
  const count = slotCount === HOME_WATCH_CARD_LAYOUT.desktop.slots
    ? HOME_WATCH_CARD_LAYOUT.desktop.slots
    : HOME_WATCH_CARD_LAYOUT.mobile.slots;
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
  const destLimit = count - (reelsSlot ? 1 : 0);
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
  return slots.slice(0, count);
}

export function resolveHomeWatchReelsPoster() {
  const raw =
    import.meta.env?.VITE_GATEO_REELS_BASE_URL ?? globalThis.__VITE_ENV__?.VITE_GATEO_REELS_BASE_URL;
  const base = String(raw || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  return `${base}/kogl/v1/v5-poster.webp`;
}
