import { parseEventYmd, todayYmdIso } from './tripWindow.js';

/** @typedef {'ongoing' | 'upcoming' | 'past'} WorldEventTimelineBucket */

const BUCKET_RANK = { ongoing: 0, upcoming: 1, past: 2 };

/**
 * @param {{ startDate?: string, endDate?: string }} event
 * @param {string} [todayYmd]
 * @returns {WorldEventTimelineBucket}
 */
export function getWorldEventTimelineBucket(event, todayYmd = todayYmdIso()) {
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
