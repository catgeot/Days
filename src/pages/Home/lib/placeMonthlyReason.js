import { MONTHLY_PICKS } from '../data/spotTraits.js';

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
 * The home monthly card sets `?monthly=YYYY-MM`. Direct, search, and explore
 * visits have no param, so they do not show the box.
 * @param {{
 *   slug?: string,
 *   monthKey?: string,
 *   picks?: Record<string, unknown[]>,
 * }} [input]
 */
export function resolvePlaceMonthlyPick({
  slug,
  monthKey = '',
  picks = MONTHLY_PICKS,
} = {}) {
  const key = String(slug || '').trim().toLowerCase();
  const requested = String(monthKey || '').trim();
  if (!key || !MONTH_KEY.test(requested)) return null;
  const entry = entryFor(picks, requested, key);
  if (!entry) return null;
  const sources = (Array.isArray(entry.sources) ? entry.sources : []).filter(
    (source) => source && typeof source.url === 'string' && source.url.startsWith('https://'),
  );
  if (sources.length === 0) return null;
  return {
    monthKey: requested,
    month: Number(requested.slice(5, 7)),
    entry,
    sources,
  };
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
  const sources = (pick.sources || []).slice(0, 4).map((source) => ({
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
