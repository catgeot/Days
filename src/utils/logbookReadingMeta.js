import { stripLogbookMarkdownSnippet } from '../pages/DailyReport/utils/logbookMarkdownSnippet.js';
import { filterPublicLogbookFeedRows } from './logbookPublicFeed.js';
import { isReportsMissingColumnError } from './reportsSchemaFallback.js';

const HANGUL_PER_MIN = 500;
const CJK_PER_MIN = 400;
const WORDS_PER_MIN = 200;

/** Saved when the writer skips a place. Not a shared destination. */
const UNKNOWN_PLACE_KEYS = new Set(['위치 미상', 'Location unknown']);

const KOREAN_CITY_SUFFIXES = ['특별자치시', '특별시', '광역시', '시', '군'];

function koreanAdminCity(part) {
  for (const suffix of KOREAN_CITY_SUFFIXES) {
    if (!part.endsWith(suffix) || part.length <= suffix.length) continue;
    const stem = part.slice(0, -suffix.length);
    if (/^[가-힣]{1,12}$/.test(stem)) return stem;
  }
  return '';
}

function isKoreanAddressDetail(part) {
  if (koreanAdminCity(part)) return false;
  return /(?:구|읍|면|동|리|로|길)$/.test(part) || /\d가$/.test(part);
}

/**
 * GPS saves "춘천시 퇴계동" in one string. Chips use the city.
 * A spaced name without a 시·군 token stays whole — "파리 근교" is not "파리".
 */
function koreanAddressCity(key) {
  const parts = key.split(' ');
  const city = parts.map(koreanAdminCity).find(Boolean) || '';
  if (!city) return '';
  if (parts.length === 1) return city;
  return parts.some(isKoreanAddressDetail) ? city : '';
}

export function logbookPlaceKey(location) {
  const key = String(location ?? '').replace(/\s+/g, ' ').trim();
  if (!key || UNKNOWN_PLACE_KEYS.has(key)) return '';
  return koreanAddressCity(key) || key;
}

export function logbookReadingMinutes(content) {
  const plain = stripLogbookMarkdownSnippet(typeof content === 'string' ? content : '', 0);
  if (!plain) return null;
  const hangul = (plain.match(/[가-힣]/g) || []).length;
  const cjk = (plain.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || []).length;
  const words = plain
    .replace(/[가-힣\u3040-\u30ff\u3400-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter((word) => /[A-Za-z0-9]/.test(word)).length;
  if (hangul + cjk + words === 0) return null;
  const minutes = hangul / HANGUL_PER_MIN + cjk / CJK_PER_MIN + words / WORDS_PER_MIN;
  return Math.max(1, Math.ceil(minutes));
}

export function countReportsByPlace(reports) {
  const counts = new Map();
  if (!Array.isArray(reports)) return counts;
  for (const report of reports) {
    const key = logbookPlaceKey(report?.location);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

export function samePlaceCount(counts, location) {
  const key = logbookPlaceKey(location);
  if (!key || !counts || typeof counts.get !== 'function') return null;
  const n = counts.get(key);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

/** Archive chips: one row per saved place, busiest first. Unknown places are omitted. */
export function listLogbookPlaceChips(reports) {
  const counts = countReportsByPlace(reports);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
}

/** Empty filter keeps every row. A chip matches the normalized place only. */
export function reportMatchesLogbookPlace(report, locationFilter) {
  const filter = logbookPlaceKey(locationFilter);
  if (!filter) return true;
  return logbookPlaceKey(report?.location) === filter;
}

function ilikeContains(key) {
  return `%${key.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

/**
 * Public feed or one writer's rows. Exact place after trim, not a substring.
 * Missing column falls back to location-only. Query errors hide the chip.
 */
export async function fetchSamePlaceCount(client, { location, userId = '' } = {}) {
  const key = logbookPlaceKey(location);
  if (!key || !client?.from) return null;
  const pattern = ilikeContains(key);

  const run = (columns) => {
    let query = client.from('reports').select(columns).eq('is_deleted', false).ilike('location', pattern);
    if (userId) query = query.eq('user_id', userId);
    else query = query.eq('is_public', true);
    return query.limit(1000);
  };

  let { data, error } = await run('location, is_editorial, status');
  if (error && isReportsMissingColumnError(error)) {
    ({ data, error } = await run('location'));
  }
  if (error || !Array.isArray(data)) return null;

  const rows = userId ? data : filterPublicLogbookFeedRows(data);
  return samePlaceCount(countReportsByPlace(rows), key);
}
