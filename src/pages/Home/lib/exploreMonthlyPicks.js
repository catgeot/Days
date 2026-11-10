import { TRAVEL_SPOTS } from '../data/travelSpots';
import { MONTHLY_PICKS } from '../data/spotTraits';
import { EXPLORE_MONTHLY_PICK_VERIFIED_HERO_URLS } from '../data/exploreMonthlyPickHeroUrls.js';
import { resolveListImageUrl } from '../../../utils/listImageUrl.js';
import { getLocalizedPlaceName } from '../../../components/PlaceCard/common/locationDisplay';

/** 「11월의 여행지」 행 — 코드 기본 ON (VITE_GATEO_EXPLORE_V2·쿼리와 무관). */
export function isExploreV2MonthlyRowVisible() {
  return true;
}

const SEOUL_TZ = 'Asia/Seoul';

/**
 * @param {Date} [now]
 * @returns {{ year: number, month: number, day: number, monthKey: string, nextMonthKey: string }}
 */
export function seoulExploreCalendarParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const nextMonthKey = `${nextMonth.y}-${String(nextMonth.m).padStart(2, '0')}`;
  return { year, month, day, monthKey, nextMonthKey };
}

/** @param {Date} [now] */
export function resolveExploreCurrentMonthPickKey(now = new Date()) {
  const { monthKey } = seoulExploreCalendarParts(now);
  return monthKey;
}

/** KST 15일 00:00 ~ 말일 23:59:59 */
export function isExploreNextMonthPreviewWindowOpen(now = new Date()) {
  const { day } = seoulExploreCalendarParts(now);
  return day >= 15;
}

/**
 * @param {Date} [now]
 * @returns {string | null} next month YYYY-MM when preview window is open
 */
export function resolveExploreNextMonthPreviewPickKey(now = new Date()) {
  if (!isExploreNextMonthPreviewWindowOpen(now)) return null;
  return seoulExploreCalendarParts(now).nextMonthKey;
}

/**
 * @param {Date} [now]
 * @param {Record<string, unknown>} [picks]
 */
export function getExploreMonthlyPickSchedule(now = new Date(), picks = MONTHLY_PICKS) {
  const { monthKey, nextMonthKey } = seoulExploreCalendarParts(now);
  const showPreview = isExploreNextMonthPreviewWindowOpen(now);
  const currentPickKey = resolveExploreV2MonthlyPickKey(monthKey, picks);
  const previewMonthKey = showPreview ? nextMonthKey : null;
  const previewPickKey = previewMonthKey
    ? resolveExploreV2MonthlyPickKey(previewMonthKey, picks)
    : null;
  return {
    currentMonthKey: monthKey,
    nextMonthKey,
    showPreview,
    currentPickKey,
    previewPickKey,
  };
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

/**
 * @param {string | null | undefined} monthKey
 * @param {Record<string, unknown>} [picks]
 */
export function resolveExploreV2MonthlyPickKey(monthKey, picks = MONTHLY_PICKS) {
  if (!monthKey) return null;
  return picks[monthKey] ? monthKey : null;
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
export function buildVisibleMonthlyPickCards(monthKey) {
  if (!monthKey) return [];
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

export function exploreV2MonthlyPickHeadline(monthKey) {
  const monthLabel = monthlyPickHeadingMonthLabel(monthKey);
  return `${monthLabel}의 여행지`;
}

export function exploreV2MonthlyPickPreviewHeadline(monthKey) {
  const monthLabel = monthlyPickHeadingMonthLabel(monthKey);
  return `${monthLabel}의 여행지 미리 보기`;
}

export function monthlyPickHeadingMonthNumber(monthKey) {
  return Number(String(monthKey || '').split('-')[1]) || 0;
}
