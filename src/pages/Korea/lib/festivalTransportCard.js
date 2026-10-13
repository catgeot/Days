import { parseEventYmd } from '../../../shared/tripWindow.js';
import { invokeSupabaseFunctionDeduped } from '../../../shared/api/invokeSupabaseFunctionDeduped.js';

/**
 * Server catalog DESTINATION_ORDER. Unknown ids are not requested:
 * the proxy answers 400, and a miss still spends the per-IP limit.
 */
export const FESTIVAL_TRANSPORT_CONTENT_IDS = ['638576', '637693', '2930716'];

const FETCH_TIMEOUT_MS = 25_000;
const CLOCK_RE = /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/;
const MODES = new Set(['train', 'expBus', 'suburbsBus']);
const MODE_ORDER = ['train', 'expBus', 'suburbsBus'];

export function kstYmd(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addDaysYmd(iso, days) {
  const [year, month, day] = String(iso || '').split('-').map(Number);
  if (!year || !month || !day) return '';
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function shouldQueryFestivalTransport(contentId) {
  return FESTIVAL_TRANSPORT_CONTENT_IDS.includes(String(contentId || '').trim());
}

/**
 * Train day the proxy will accept (today through +60, KST).
 * Null means the festival day is outside that window — do not substitute another day.
 * @param {string|number|null|undefined} startRaw
 * @param {string|number|null|undefined} endRaw
 * @param {Date} [now]
 * @returns {string|null}
 */
export function resolveFestivalTrainDate(startRaw, endRaw, now = new Date()) {
  const today = kstYmd(now);
  const max = addDaysYmd(today, 60);
  const start = parseEventYmd(startRaw);
  const end = parseEventYmd(endRaw);
  if (start && start >= today && start <= max) return start;
  if (start && end && start <= today && end >= today) return today;
  if (start && start > max) return null;
  if (end && end < today) return today;
  if (!start && !end) return today;
  return today;
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('transport-proxy timeout')), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * @param {{ contentId: string, trainDate?: string|null }} args
 * @returns {Promise<{ status: 'unsupported'|'outOfRange'|'unavailable'|'ready', card?: Record<string, unknown> }>}
 */
export async function fetchFestivalTransportCard({ contentId, trainDate }) {
  const id = String(contentId || '').trim();
  if (!shouldQueryFestivalTransport(id)) return { status: 'unsupported' };
  if (!trainDate) return { status: 'outOfRange' };
  try {
    const { data, error } = await withTimeout(
      invokeSupabaseFunctionDeduped('transport-proxy', {
        body: { contentId: id, trainDate },
        ttlMs: 5 * 60 * 1000,
      }),
      FETCH_TIMEOUT_MS,
    );
    if (error || !data || data.ok !== true) return { status: 'unavailable' };
    return { status: 'ready', card: data };
  } catch {
    return { status: 'unavailable' };
  }
}

export function isRealClock(value) {
  return CLOCK_RE.test(String(value || ''));
}

export function isRealFare(value) {
  return Number.isInteger(value) && value > 0;
}

export function optionIsDisplayable(option) {
  if (!option || option.verified === false) return false;
  if (!MODES.has(option.mode)) return false;
  if (!isRealClock(option.firstDeparture) || !isRealClock(option.lastDeparture)) return false;
  const dep = String(option.depStation || '').trim();
  const arr = String(option.arrStation || '').trim();
  const grade = String(option.grade || '').trim();
  if (!dep || !arr || !grade) return false;
  if (!Number.isFinite(option.durationMin) || option.durationMin < 0) return false;
  if (!Number.isFinite(option.durationMax) || option.durationMax < option.durationMin) return false;
  return true;
}

function englishLocale(locale) {
  return String(locale || '').slice(0, 2) === 'en';
}

function formatDuration(total, locale) {
  const minutes = Math.round(total);
  if (!Number.isFinite(minutes) || minutes < 0) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (englishLocale(locale)) {
    if (hours && mins) return `${hours} hr ${mins} min`;
    if (hours) return `${hours} hr`;
    return `${mins} min`;
  }
  if (hours && mins) return `${hours}시간 ${mins}분`;
  if (hours) return `${hours}시간`;
  return `${mins}분`;
}

export function formatDurationRange(min, max, locale = 'ko') {
  const start = formatDuration(min, locale);
  const end = formatDuration(max, locale);
  if (!start || !end) return '';
  if (min === max) return start;
  return `${start}${englishLocale(locale) ? '–' : '~'}${end}`;
}

export function formatClockRange(first, last, locale = 'ko') {
  if (!isRealClock(first) || !isRealClock(last)) return '';
  if (first === last) return first;
  return `${first}${englishLocale(locale) ? '–' : '~'}${last}`;
}

export function formatFareRange(min, max, locale = 'ko') {
  if (!isRealFare(min)) return '';
  const hi = isRealFare(max) ? max : min;
  const en = englishLocale(locale);
  const fmt = (value) => value.toLocaleString(en ? 'en-US' : 'ko-KR');
  if (en) return hi === min ? `₩${fmt(min)}` : `₩${fmt(min)}–${fmt(hi)}`;
  return hi === min ? `${fmt(min)}원` : `${fmt(min)}~${fmt(hi)}원`;
}

export function formatRunCount(option, locale = 'ko') {
  const count = option?.dailyCount;
  if (!Number.isInteger(count) || count <= 0) return '';
  const partial = option.truncated === true;
  if (englishLocale(locale)) return partial ? `${count} confirmed` : `${count} departures`;
  return partial ? `확인 ${count}회` : `${count}회`;
}

export function bookingLink(option, locale = 'ko') {
  const href = String(option?.bookingUrl || '');
  if (!/^https:\/\//.test(href)) return null;
  const operator = String(option?.bookingOperator || '').trim();
  const named = operator === 'SR' || operator === 'Korail';
  const en = englishLocale(locale);
  const text = named
    ? (en ? `Book · ${operator}` : `${operator} 예매`)
    : (en ? 'Book' : '예매');
  return { href, text };
}

function sourceMeta(card) {
  const source = String(card?.source || '').trim();
  const trainDate = String(card?.trainDate || '').trim();
  const busDate = String(card?.busDate || '').trim();
  if (!source && !trainDate && !busDate) return null;
  return {
    source,
    trainDate,
    busDate,
    busSameDayOnly: card?.flags?.busSameDayOnly === true,
  };
}

function rowsFrom(options) {
  return (Array.isArray(options) ? options : []).filter(optionIsDisplayable);
}

/**
 * Display model. Unverified legs, including AREX, contribute no times or fares.
 * @param {Record<string, unknown>|null|undefined} card
 */
export function buildAccessView(card) {
  if (!card || card.ok !== true) return { status: 'unavailable', origins: [], source: null };
  const origins = [];
  for (const origin of card.origins || []) {
    const direct = rowsFrom(origin.options);
    const hops = [];
    let arexUnverified = false;
    for (const leg of origin.suggestedTransfer?.legs || []) {
      if (leg?.mode === 'arex' || leg?.verified === false) {
        if (leg?.mode === 'arex' && leg?.verified === false) arexUnverified = true;
        if (leg?.verified === false) continue;
      }
      hops.push(...rowsFrom(leg?.options));
    }
    if (!direct.length && !hops.length && !arexUnverified) continue;
    origins.push({
      originId: String(origin.originId || ''),
      label: String(origin.label || '').trim(),
      direct,
      hops,
      arexUnverified,
    });
  }
  const source = sourceMeta(card);
  if (!origins.length) return { status: 'empty', origins: [], source };
  return { status: 'ready', origins, source };
}

export function preferredOriginId(origins) {
  if (!origins?.length) return '';
  const seoul = origins.find((origin) => origin.originId === 'seoul-station');
  return (seoul || origins[0]).originId;
}

export function groupOptionsByMode(options) {
  const groups = MODE_ORDER.map((mode) => ({
    mode,
    options: (options || []).filter((option) => option.mode === mode),
  })).filter((group) => group.options.length > 0);
  return groups;
}
