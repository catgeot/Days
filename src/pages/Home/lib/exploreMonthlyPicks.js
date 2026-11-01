import { TRAVEL_SPOTS } from '../data/travelSpots';
import {
  EXPLORE_V2_MONTHLY_PICK_KEY,
  MONTHLY_PICKS,
} from '../data/spotTraits';
import { EXPLORE_MONTHLY_PICK_VERIFIED_HERO_URLS } from '../data/exploreMonthlyPickHeroUrls.js';
import { resolveListImageUrl } from '../../../utils/listImageUrl.js';
import { getLocalizedPlaceName } from '../../../components/PlaceCard/common/locationDisplay';

/** 「11월의 여행지」 행 — 코드 기본 ON (VITE_GATEO_EXPLORE_V2·쿼리와 무관). */
export function isExploreV2MonthlyRowVisible() {
  return true;
}

const HTTPS_SOURCE = /^https:\/\/.+/i;

export function isValidMonthlyPickSource(url) {
  return typeof url === 'string' && HTTPS_SOURCE.test(url.trim());
}

/** @param {import('../data/spotTraits.js').MonthlyPickSource | string} raw */
export function normalizeMonthlyPickSource(raw) {
  if (typeof raw === 'string') {
    const url = raw.trim();
    return isValidMonthlyPickSource(url) ? { url, label: '출처' } : null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const url = String(raw.url || '').trim();
  const label = String(raw.label || '').trim();
  if (!isValidMonthlyPickSource(url) || !label) return null;
  return { url, label };
}

/** @param {string} [monthKey] */
export function resolveExploreV2MonthlyPickKey(monthKey = EXPLORE_V2_MONTHLY_PICK_KEY) {
  return MONTHLY_PICKS[monthKey] ? monthKey : null;
}

/** @param {string} monthKey */
export function monthlyPickHeadingMonthLabel(monthKey) {
  const month = Number(String(monthKey).split('-')[1]);
  if (!Number.isFinite(month) || month < 1 || month > 12) return '이달';
  return `${month}월`;
}

/**
 * @param {string} monthKey
 * @returns {{ entry: import('../data/spotTraits.js').MonthlyPickEntry, spot: typeof TRAVEL_SPOTS[number] }[]}
 */
export function buildVisibleMonthlyPickCards(monthKey = EXPLORE_V2_MONTHLY_PICK_KEY) {
  const entries = MONTHLY_PICKS[monthKey];
  if (!Array.isArray(entries)) return [];

  const bySlug = new Map(
    TRAVEL_SPOTS.map((spot) => [(spot.slug || '').toLowerCase(), spot]),
  );

  const cards = [];
  for (const entry of entries) {
    const sources = (entry.sources || [])
      .map(normalizeMonthlyPickSource)
      .filter(Boolean);
    if (sources.length === 0) continue;
    const spot = bySlug.get(String(entry.slug || '').toLowerCase());
    if (!spot) continue;
    cards.push({
      entry: { ...entry, sources },
      spot,
    });
  }
  return cards;
}

export function resolveExploreMonthlyPickHeroUrl(spot) {
  const slug = String(spot?.slug || '').toLowerCase();
  if (!slug) return '';
  const raw = EXPLORE_MONTHLY_PICK_VERIFIED_HERO_URLS[slug] || '';
  if (!raw) return '';
  return resolveListImageUrl(raw, { role: 'list', width: 640 });
}

export function monthlyPickDisplayName(spot, slug = '') {
  return (
    getLocalizedPlaceName(spot, 'ko') ||
    String(spot?.name || slug || '').trim()
  );
}

/**
 * @param {ReturnType<typeof buildVisibleMonthlyPickCards>} cards
 */
export function partitionExploreMonthlyPickCardsByHero(cards) {
  const withHero = [];
  const excluded = [];
  for (const card of cards) {
    const imageUrl = resolveExploreMonthlyPickHeroUrl(card.spot);
    if (imageUrl) withHero.push({ ...card, imageUrl });
    else {
      excluded.push({
        slug: card.entry.slug,
        name: monthlyPickDisplayName(card.spot, card.entry.slug),
      });
    }
  }
  return { withHero, excluded };
}

export function exploreV2MonthlyPickHeadline(monthKey = EXPLORE_V2_MONTHLY_PICK_KEY) {
  const monthLabel = monthlyPickHeadingMonthLabel(monthKey);
  return `${monthLabel}의 여행지`;
}
