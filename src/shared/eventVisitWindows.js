import {
  addDaysYmd,
  parseEventYmd,
  todayYmdIso,
  tripWindowFromEvent,
  tripWindowNights,
} from './tripWindow.js';

const DEFAULT_CTA_MAX_NIGHTS = 10;
const LONG_EVENT_DAYS = 7;

/**
 * @param {{ recommendedNights?: number }} [event]
 */
export function eventCtaMaxNights(event) {
  const rec = Number(event?.recommendedNights);
  if (Number.isFinite(rec) && rec > 0) {
    return Math.min(rec, DEFAULT_CTA_MAX_NIGHTS);
  }
  return 7;
}

/**
 * @param {string} ymd
 * @returns {Date|null}
 */
function parseYmdLocal(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim());
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
 * @param {string} eventStart
 * @param {string} eventEnd
 * @returns {string|null}
 */
function midEventSaturdayYmd(eventStart, eventEnd) {
  const start = parseYmdLocal(eventStart);
  const end = parseYmdLocal(eventEnd);
  if (!start || !end) return null;
  const midMs = (start.getTime() + end.getTime()) / 2;
  const mid = new Date(midMs);
  const dow = mid.getDay();
  const daysToSat = (6 - dow + 7) % 7;
  mid.setDate(mid.getDate() + daysToSat);
  const satYmd = ymdLocal(mid);
  if (satYmd < eventStart || satYmd > eventEnd) return null;
  return satYmd;
}

/**
 * @param {string} checkIn
 * @param {string} checkOut
 * @param {string} eventStart
 * @param {string} eventEnd
 * @param {string} today
 */
function clampWindowToEvent(checkIn, checkOut, eventStart, eventEnd, today) {
  let inYmd = checkIn;
  let outYmd = checkOut;
  if (inYmd < today) inYmd = today;
  if (inYmd < eventStart) inYmd = eventStart;
  if (outYmd > addDaysYmd(eventEnd, 1)) outYmd = addDaysYmd(eventEnd, 1);
  if (outYmd <= inYmd) outYmd = addDaysYmd(inYmd, 1);
  return { checkIn: inYmd, checkOut: outYmd };
}

/**
 * @typedef {{ id: string, checkIn: string, checkOut: string, nights: number }} VisitWindowPreset
 */

/**
 * Heuristic visit windows — long events get opening / mid-weekend / closing chips.
 * @param {{ startDate?: string, endDate?: string, recommendedNights?: number }} event
 * @param {Parameters<typeof tripWindowFromEvent>[1]} [opts]
 * @returns {VisitWindowPreset[]}
 */
export function visitWindowPresetsFromEvent(event, opts = {}) {
  const today = parseEventYmd(opts.todayYmd) || todayYmdIso();
  const startIso = parseEventYmd(event?.startDate);
  const endIso = parseEventYmd(event?.endDate ?? event?.startDate);
  if (!startIso || !endIso) return [];

  const eventStart = startIso <= endIso ? startIso : endIso;
  const eventEnd = startIso <= endIso ? endIso : startIso;
  const spanNights = tripWindowNights(eventStart, addDaysYmd(eventEnd, 1));

  const defaultWindow = tripWindowFromEvent(event, {
    ...opts,
    maxNights: eventCtaMaxNights(event),
  });

  if (spanNights <= LONG_EVENT_DAYS) {
    return [
      {
        id: 'default',
        checkIn: defaultWindow.checkIn,
        checkOut: defaultWindow.checkOut,
        nights: tripWindowNights(defaultWindow.checkIn, defaultWindow.checkOut),
      },
    ];
  }

  /** @type {VisitWindowPreset[]} */
  const presets = [];

  const openingIn = eventStart < today ? today : eventStart;
  const opening = clampWindowToEvent(
    openingIn,
    addDaysYmd(openingIn, 3),
    eventStart,
    eventEnd,
    today,
  );
  presets.push({
    id: 'opening',
    checkIn: opening.checkIn,
    checkOut: opening.checkOut,
    nights: tripWindowNights(opening.checkIn, opening.checkOut),
  });

  const satYmd = midEventSaturdayYmd(eventStart, eventEnd);
  if (satYmd) {
    const mid = clampWindowToEvent(satYmd, addDaysYmd(satYmd, 2), eventStart, eventEnd, today);
    if (tripWindowNights(mid.checkIn, mid.checkOut) >= 1) {
      presets.push({
        id: 'midWeekend',
        checkIn: mid.checkIn,
        checkOut: mid.checkOut,
        nights: tripWindowNights(mid.checkIn, mid.checkOut),
      });
    }
  }

  const closingOut = addDaysYmd(eventEnd, 1);
  const closing = clampWindowToEvent(
    addDaysYmd(closingOut, -3),
    closingOut,
    eventStart,
    eventEnd,
    today,
  );
  presets.push({
    id: 'closing',
    checkIn: closing.checkIn,
    checkOut: closing.checkOut,
    nights: tripWindowNights(closing.checkIn, closing.checkOut),
  });

  const seen = new Set();
  return presets.filter((preset) => {
    const key = `${preset.checkIn}|${preset.checkOut}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return preset.nights >= 1;
  });
}
