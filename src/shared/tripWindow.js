/**
 * TripWindow — event dates → MRT/planner check-in·check-out (YYYY-MM-DD).
 * Q5 defaults: buffer before/after 1 day · minimum 2 nights.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const COMPACT_DATE = /^(\d{4})(\d{2})(\d{2})$/;
const DEFAULT_BUFFER_DAYS = 1;
const DEFAULT_MIN_NIGHTS = 2;
const DEFAULT_MAX_NIGHTS = 30;

/**
 * @param {string|number|null|undefined} value
 * @returns {string|null} YYYY-MM-DD
 */
export function parseEventYmd(value) {
  const raw = String(value ?? '').trim();
  const iso = ISO_DATE.exec(raw);
  if (iso) return raw;
  const compact = COMPACT_DATE.exec(raw);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  return null;
}

/**
 * @param {Date} [now]
 * @returns {string}
 */
export function todayYmdIso(now = new Date()) {
  return ymdLocal(now);
}

/**
 * @param {string} ymd
 * @returns {Date|null}
 */
function parseYmdLocal(ymd) {
  const m = ISO_DATE.exec(String(ymd || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {Date} d
 * @returns {string}
 */
function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {string} ymd
 * @param {number} days
 * @returns {string}
 */
function addDaysYmd(ymd, days) {
  const d = parseYmdLocal(ymd);
  if (!d) return ymd;
  d.setDate(d.getDate() + days);
  return ymdLocal(d);
}

/**
 * @param {string} checkIn
 * @param {string} checkOut
 * @returns {number}
 */
export function tripWindowNights(checkIn, checkOut) {
  const a = parseYmdLocal(checkIn);
  const b = parseYmdLocal(checkOut);
  if (!a || !b) return 0;
  const nights = Math.round((b.getTime() - a.getTime()) / 86400000);
  return nights > 0 ? nights : 0;
}

/**
 * @param {{ startDate?: string, endDate?: string, id?: string, eventId?: string }} event
 * @param {{
 *   bufferDays?: number,
 *   minNights?: number,
 *   maxNights?: number,
 *   todayYmd?: string,
 * }} [opts]
 * @returns {{ checkIn: string, checkOut: string, source: 'event', eventId?: string }}
 */
export function tripWindowFromEvent(event, opts = {}) {
  const bufferDays = Math.max(0, Number(opts.bufferDays ?? DEFAULT_BUFFER_DAYS) || 0);
  const minNights = Math.max(1, Number(opts.minNights ?? DEFAULT_MIN_NIGHTS) || DEFAULT_MIN_NIGHTS);
  const maxNights = Math.max(
    minNights,
    Number(opts.maxNights ?? DEFAULT_MAX_NIGHTS) || DEFAULT_MAX_NIGHTS,
  );
  const today = parseEventYmd(opts.todayYmd) || todayYmdIso();

  const startIso = parseEventYmd(event?.startDate);
  const endIso = parseEventYmd(event?.endDate ?? event?.startDate);
  if (!startIso || !endIso) {
    throw new Error('[tripWindow] startDate/endDate required (YYYY-MM-DD or YYYYMMDD)');
  }

  const eventStart = startIso <= endIso ? startIso : endIso;
  const eventEnd = startIso <= endIso ? endIso : startIso;

  let checkIn;
  let checkOut;

  if (eventEnd < today) {
    checkIn = today;
    checkOut = addDaysYmd(checkIn, minNights);
  } else {
    checkIn = addDaysYmd(eventStart, -bufferDays);
    checkOut = addDaysYmd(eventEnd, bufferDays);
    if (checkIn < today) checkIn = today;
    if (checkOut <= checkIn) checkOut = addDaysYmd(checkIn, 1);
    if (tripWindowNights(checkIn, checkOut) < minNights) {
      checkOut = addDaysYmd(checkIn, minNights);
    }
  }

  const maxOut = addDaysYmd(checkIn, maxNights);
  if (checkOut > maxOut) checkOut = maxOut;
  if (checkOut <= checkIn) checkOut = addDaysYmd(checkIn, Math.min(minNights, maxNights));

  const eventId = event?.id ?? event?.eventId;
  /** @type {{ checkIn: string, checkOut: string, source: 'event', eventId?: string }} */
  const result = { checkIn, checkOut, source: 'event' };
  if (eventId != null && String(eventId).trim()) {
    result.eventId = String(eventId).trim();
  }
  return result;
}
