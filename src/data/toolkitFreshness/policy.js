import { getFreshnessToday, daysBetweenIsoDates, isIsoDateString } from '../placeVerifiedFacts/freshness.js';
import { TOOLKIT_FRESHNESS_SECTIONS } from './sections.js';

/** Re-check window in calendar days (KST), per toolkit-freshness plan 2026-10-25. */
export const TOOLKIT_SECTION_MAX_AGE_DAYS = {
  visa: 30,
  safety: 30,
  flight: 60,
  ferry_booking: 60,
  airport_transfer: 60,
  transport: 90,
  apps: 90,
  connectivity: 90,
  map_poi: 90,
  accommodation: 180,
  pre_travel: 180,
};

export function maxAgeDaysForToolkitSection(section) {
  const key = String(section || '');
  return TOOLKIT_SECTION_MAX_AGE_DAYS[key] ?? 90;
}

function toIsoDateFromTimestamp(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (isIsoDateString(text)) return text;
  const dt = new Date(text);
  if (Number.isNaN(dt.getTime())) return null;
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(dt);
}

/**
 * @param {{ checked_at?: string | null } | null | undefined} metaRow
 * @param {string | null | undefined} toolkitUpdatedAt
 */
export function resolveToolkitSectionCheckedIso(section, metaRow, toolkitUpdatedAt) {
  const fromMeta = toIsoDateFromTimestamp(metaRow?.checked_at);
  if (fromMeta) return fromMeta;
  return toIsoDateFromTimestamp(toolkitUpdatedAt);
}

/**
 * @returns {'fresh' | 'overdue' | 'critical'}
 */
export function toolkitSectionFreshnessBand(section, checkedIso, todayYmd = getFreshnessToday()) {
  if (!checkedIso || !isIsoDateString(checkedIso) || !isIsoDateString(todayYmd)) {
    return 'fresh';
  }
  const ageDays = daysBetweenIsoDates(checkedIso, todayYmd);
  if (ageDays == null || ageDays < 0) return 'fresh';
  const maxAge = maxAgeDaysForToolkitSection(section);
  if (ageDays > maxAge * 2) return 'critical';
  if (ageDays > maxAge) return 'overdue';
  return 'fresh';
}

/** Display `2026.10.12` (ko) or `10/12/2026` (en). */
export function formatToolkitCheckedBadgeDate(checkedIso, locale = 'ko') {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(checkedIso || '').trim());
  if (!match) return '';
  const [, y, mo, d] = match;
  if (locale === 'en' || String(locale || '').startsWith('en')) {
    return `${Number(mo)}/${Number(d)}/${y}`;
  }
  return `${y}.${mo}.${d}`;
}

/**
 * @param {Record<string, { checked_at?: string }>} metaBySection
 * @param {string | null | undefined} toolkitUpdatedAt
 */
export function summarizeToolkitFreshness(metaBySection, toolkitUpdatedAt, todayYmd = getFreshnessToday()) {
  let hasOverdue = false;
  let hasCritical = false;
  for (const section of TOOLKIT_FRESHNESS_SECTIONS) {
    const checked = resolveToolkitSectionCheckedIso(section, metaBySection?.[section], toolkitUpdatedAt);
    const band = toolkitSectionFreshnessBand(section, checked, todayYmd);
    if (band === 'overdue') hasOverdue = true;
    if (band === 'critical') hasCritical = true;
  }
  return { hasOverdue, hasCritical, showBanner: hasOverdue || hasCritical };
}

export function buildSectionMetaMap(rows) {
  if (!rows?.length) return {};
  const map = {};
  for (const row of rows) {
    const section = String(row?.section || '').trim();
    if (!section) continue;
    map[section] = row;
  }
  return map;
}
