import { TRAVEL_SPOTS } from '../data/travelSpots';
import {
  EXPLORE_V2_MONTHLY_PICK_KEY,
  MONTHLY_PICKS,
} from '../data/spotTraits';
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

/** 11월의 여행지 행 — PROD 기본 ON (VITE_GATEO_EXPLORE_V2와 무관). */
export function isExploreV2MonthlyRowVisible(_search = '') {
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

export function exploreV2MonthlyPickHeadline(monthKey = EXPLORE_V2_MONTHLY_PICK_KEY) {
  const cards = buildVisibleMonthlyPickCards(monthKey);
  const monthLabel = monthlyPickHeadingMonthLabel(monthKey);
  const total = TRAVEL_SPOTS.length;
  return `${monthLabel}의 여행지 · ${total}곳 중 ${cards.length}곳`;
}
