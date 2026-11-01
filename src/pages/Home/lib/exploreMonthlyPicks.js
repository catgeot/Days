import { TRAVEL_SPOTS } from '../data/travelSpots';
import {
  EXPLORE_V2_MONTHLY_PICK_KEY,
  MONTHLY_PICKS,
} from '../data/spotTraits';
import { isGateoExploreV2Enabled } from '../../../shared/gateoFeatureFlags';
import { PLACE_SEO_OG_IMAGE_OVERRIDES } from '../../../data/placeSeoOgImageOverrides.js';
import { resolveListImageUrl } from '../../../utils/listImageUrl.js';
import { getLocalizedPlaceName } from '../../../components/PlaceCard/common/locationDisplay';

/** `/explore?explore_v2=1` — request-scoped preview; no storage. */
export function readExploreV2QueryParam(search = '') {
  const raw = String(search || '').trim();
  if (!raw) return false;
  try {
    const query = raw.startsWith('?') ? raw.slice(1) : raw;
    return new URLSearchParams(query).get('explore_v2') === '1';
  } catch {
    return false;
  }
}

/** `layout=a` (default) | `layout=b` — monthly row visual variant. */
export function readExploreV2LayoutParam(search = '') {
  const raw = String(search || '').trim();
  if (!raw) return 'a';
  try {
    const query = raw.startsWith('?') ? raw.slice(1) : raw;
    const value = new URLSearchParams(query).get('layout');
    if (value === 'b') return 'b';
    return 'a';
  } catch {
    return 'a';
  }
}

export function isExploreV2MonthlyRowVisible(search = '') {
  return isGateoExploreV2Enabled() || readExploreV2QueryParam(search);
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
  const raw = PLACE_SEO_OG_IMAGE_OVERRIDES[slug] || '';
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
