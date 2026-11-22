import { parseEventYmd, todayYmdIso, todayYmdKst } from './tripWindow.js';

/** @typedef {'ongoing' | 'upcoming' | 'past'} WorldEventTimelineBucket */

const BUCKET_RANK = { ongoing: 0, upcoming: 1, past: 2 };

/** Inclusive span; ongoing hub tier uses this (start–end, or 1 day when same-day). */
export const WORLD_EVENT_LONG_SEASON_DAYS = 60;

/**
 * @param {{ startDate?: string, endDate?: string }} event
 * @returns {number}
 */
export function worldEventInclusiveDayCount(event) {
  const start = parseEventYmd(event?.startDate);
  const end = parseEventYmd(event?.endDate ?? event?.startDate);
  if (!start) return 0;
  if (!end) return 1;
  const a = parseYmdForDiff(start);
  const b = parseYmdForDiff(end);
  if (!a || !b) return 1;
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : 1;
}

/**
 * @param {string} ymd
 * @returns {Date | null}
 */
function parseYmdForDiff(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {{ startDate?: string, endDate?: string }} event
 * @param {string} [todayYmd]
 * @returns {WorldEventTimelineBucket}
 */
export function getWorldEventTimelineBucket(event, todayYmd = todayYmdKst()) {
  const start = parseEventYmd(event?.startDate);
  const end = parseEventYmd(event?.endDate ?? event?.startDate);
  if (!start) return 'past';

  const eventStart = !end || start <= end ? start : end;
  const eventEnd = !end || start <= end ? end ?? start : start;

  if (eventStart <= todayYmd && todayYmd <= eventEnd) return 'ongoing';
  if (eventStart > todayYmd) return 'upcoming';
  return 'past';
}

/**
 * Hub list: 종료일(없으면 시작일)이 KST 오늘 이전이면 제외.
 * @param {{ startDate?: string, endDate?: string }} event
 * @param {string} [todayYmd]
 */
export function isWorldEventActiveForHub(event, todayYmd = todayYmdKst()) {
  return getWorldEventTimelineBucket(event, todayYmd) !== 'past';
}

/**
 * @param {Array<{ startDate?: string, endDate?: string, id?: string }>} events
 * @param {string} [todayYmd]
 */
export function filterWorldEventsForHub(events, todayYmd = todayYmdKst()) {
  return events.filter((event) => isWorldEventActiveForHub(event, todayYmd));
}

/**
 * Hub sort tier: 0 = short ongoing, 1 = upcoming, 2 = long ongoing (60+ days), 9 = past.
 * @param {{ startDate?: string, endDate?: string }} event
 * @param {string} [todayYmd]
 */
export function getWorldEventHubSortTier(event, todayYmd = todayYmdKst()) {
  const bucket = getWorldEventTimelineBucket(event, todayYmd);
  if (bucket === 'upcoming') return 1;
  if (bucket === 'ongoing') {
    return worldEventInclusiveDayCount(event) > WORLD_EVENT_LONG_SEASON_DAYS ? 2 : 0;
  }
  return 9;
}

/**
 * 짧은 진행 중 → 곧 개막(시작일 순) → 장기 시즌.
 * @param {{ startDate?: string, endDate?: string, id?: string }} a
 * @param {{ startDate?: string, endDate?: string, id?: string }} b
 * @param {string} [todayYmd]
 */
export function compareWorldEventsForHubList(a, b, todayYmd = todayYmdKst()) {
  const tierA = getWorldEventHubSortTier(a, todayYmd);
  const tierB = getWorldEventHubSortTier(b, todayYmd);
  if (tierA !== tierB) return tierA - tierB;

  const startA = parseEventYmd(a?.startDate) ?? '';
  const startB = parseEventYmd(b?.startDate) ?? '';
  if (startA !== startB) return startA.localeCompare(startB);

  return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
}

/**
 * 여행 계획용: 진행 중 → 오픈일(시작일) 순 → id.
 * @param {{ startDate?: string, endDate?: string, id?: string }} a
 * @param {{ startDate?: string, endDate?: string, id?: string }} b
 * @param {string} [todayYmd]
 */
export function compareWorldEventsForList(a, b, todayYmd = todayYmdIso()) {
  const bucketA = BUCKET_RANK[getWorldEventTimelineBucket(a, todayYmd)] ?? 2;
  const bucketB = BUCKET_RANK[getWorldEventTimelineBucket(b, todayYmd)] ?? 2;
  if (bucketA !== bucketB) return bucketA - bucketB;

  const startA = parseEventYmd(a?.startDate) ?? '';
  const startB = parseEventYmd(b?.startDate) ?? '';
  if (startA !== startB) return startA.localeCompare(startB);

  return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
}

/**
 * @param {{ startDate?: string, endDate?: string }} event
 * @param {string} [todayYmd]
 * @returns {'ongoing' | 'upcoming' | null}
 */
export function getWorldEventHubBadgeKind(event, todayYmd = todayYmdKst()) {
  const bucket = getWorldEventTimelineBucket(event, todayYmd);
  if (bucket === 'upcoming') return 'upcoming';
  if (bucket === 'ongoing') return 'ongoing';
  return null;
}