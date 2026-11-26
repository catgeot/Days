import { MONTHLY_PICKS } from '../data/spotTraits.js';
import { seoulExploreCalendarParts } from './exploreMonthlyPicks.js';

/** Matches HOME_MONTHLY_PREVIEW_START_DAY — next month’s home strip is open all month. */
export const PLACE_MONTHLY_REASON_PREVIEW_START_DAY = 1;
export const PLACE_MONTHLY_REASON_QUERY = 'monthly';

const MONTH_KEY = /^\d{4}-\d{2}$/;

/**
 * @param {string | null | undefined} search
 */
export function readPlaceMonthlyPickKey(search) {
  try {
    const raw = new URLSearchParams(String(search || '').replace(/^\?/, '')).get(
      PLACE_MONTHLY_REASON_QUERY,
    );
    return MONTH_KEY.test(String(raw || '')) ? String(raw) : '';
  } catch {
    return '';
  }
}

function entryFor(picks, monthKey, slug) {
  const rows = picks?.[monthKey];
  if (!Array.isArray(rows)) return null;
  return rows.find((row) => String(row?.slug || '').trim().toLowerCase() === slug) || null;
}

/**
 * Card month wins. Otherwise the current month, then next month while the home preview is open.
 * @param {{
 *   slug?: string,
 *   now?: Date,
 *   monthKey?: string,
 *   previewStartDay?: number,
 *   picks?: Record<string, unknown[]>,
 * }} [input]
 */
export function resolvePlaceMonthlyPick({
  slug,
  now = new Date(),
  monthKey = '',
  previewStartDay = PLACE_MONTHLY_REASON_PREVIEW_START_DAY,
  picks = MONTHLY_PICKS,
} = {}) {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return null;
  const parts = seoulExploreCalendarParts(now);
  const requested = String(monthKey || '').trim();
  const start = Number(previewStartDay);
  const candidates = [];
  if (requested) candidates.push(requested);
  if (!candidates.includes(parts.monthKey)) candidates.push(parts.monthKey);
  if (Number.isInteger(start) && parts.day >= start && !candidates.includes(parts.nextMonthKey)) {
    candidates.push(parts.nextMonthKey);
  }
  for (const candidate of candidates) {
    const entry = entryFor(picks, candidate, key);
    if (!entry) continue;
    const sources = (Array.isArray(entry.sources) ? entry.sources : []).filter(
      (source) => source && typeof source.url === 'string' && source.url.startsWith('https://'),
    );
    return {
      monthKey: candidate,
      month: Number(candidate.slice(5, 7)),
      entry,
      sources,
    };
  }
  return null;
}

const MONTH_EN = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function placeMonthlyReasonCopy(pick, language = 'ko') {
  if (!pick?.entry) return null;
  const isEn = String(language || '').trim().toLowerCase().startsWith('en');
  const entry = pick.entry;
  const reason = String((isEn ? entry.reason_en : entry.reason) || entry.reason || entry.reason_en || '').trim();
  const best = String((isEn ? entry.best_en : entry.best) || '').trim();
  const sources = (pick.sources || []).slice(0, 2).map((source) => ({
    url: source.url,
    label: String((isEn ? source.label_en || source.label : source.label) || '').trim(),
  })).filter((source) => source.url && source.label);
  if (!reason || sources.length === 0) return null;
  return {
    monthKey: pick.monthKey,
    month: pick.month,
    monthLabel: isEn ? MONTH_EN[pick.month] || String(pick.month) : String(pick.month),
    reason,
    best,
    sources,
  };
}
