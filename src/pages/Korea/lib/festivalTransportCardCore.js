import { parseEventYmd } from '../../../shared/tripWindow.js';
import { glueAccessNumbersInProse, glueAccessUnit } from '../../../shared/korea/festivalAccessProseGlue.js';
import { shouldQueryFestivalTransport } from './festivalTransportCatalog.js';

export { FESTIVAL_TRANSPORT_CONTENT_IDS, shouldQueryFestivalTransport } from './festivalTransportCatalog.js';
export { glueAccessNumbersInProse, glueAccessUnit } from '../../../shared/korea/festivalAccessProseGlue.js';

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

/**
 * SR station codes returned by POST /hpg/hra/01/selectStnCdInfo.do.
 * GET selectScheduleList.do applies dptRsStnCd, arvRsStnCd, and dptDt.
 * Korail's ticket page and the bus booking forms do not.
 */
const SR_STATION_CODES = {
  수서: '0551',
  서울: '0001',
  광주송정: '0036',
  마산: '0059',
  강릉: '0115',
};

function srStationCode(name) {
  const compact = String(name || '').trim().replace(/\s+/g, '');
  const key = compact.endsWith('역') ? compact.slice(0, -1) : compact;
  return SR_STATION_CODES[key] || '';
}

function compactServiceDate(value) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.replace(/-/g, '');
  if (/^\d{8}$/.test(raw)) return raw;
  return '';
}

function objectParticle(word) {
  const chars = Array.from(String(word || '').trim());
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    const code = chars[i].codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      return (code - 0xac00) % 28 === 0 ? '를' : '을';
    }
  }
  return '을';
}

function srSearchHref(option) {
  if (String(option?.bookingOperator || '').trim() !== 'SR') return '';
  const depCode = srStationCode(option?.depStation);
  const arrCode = srStationCode(option?.arrStation);
  const date = compactServiceDate(option?.serviceDate);
  if (!depCode || !arrCode || !date || depCode === arrCode) return '';
  const params = new URLSearchParams({
    pageId: 'TK0101010000',
    dptRsStnCd: depCode,
    arvRsStnCd: arrCode,
    dptRsStnCdNm: String(option.depStation).trim(),
    arvRsStnCdNm: String(option.arrStation).trim(),
    dptDt: date,
    dptTm: '000000',
    isRequest: 'Y',
  });
  return `https://etk.srail.kr/hpg/hra/01/selectScheduleList.do?${params.toString()}`;
}

function bookingText(option, locale) {
  const en = englishLocale(locale);
  const operator = String(option?.bookingOperator || '').trim();
  if (operator === 'SR') return en ? 'Book on SR ↗' : 'SR에서 예매하기 ↗';
  if (operator === 'Korail') return en ? 'Book on Korail ↗' : '코레일에서 예매하기 ↗';
  if (option?.mode === 'expBus') return en ? 'Book express bus' : '고속버스 예매';
  if (option?.mode === 'suburbsBus') return en ? 'Book intercity bus' : '시외버스 예매';
  return en ? 'Book' : '예매';
}

export const TRIP_COM_KORAIL_HREF = 'https://www.trip.com/trains/korail/';

export function bookingLink(option, locale = 'ko') {
  const home = String(option?.bookingUrl || '');
  const deep = srSearchHref(option);
  const href = deep || home;
  if (!/^https:\/\//.test(href)) return null;
  const dep = String(option?.depStation || '').trim();
  const arr = String(option?.arrStation || '').trim();
  const segment = !dep || !arr ? null : { dep, arr, particle: objectParticle(arr) };
  return { href, text: bookingText(option, locale), segment };
}

/** Korail train rows only. SR segments stay on the official SR link. */
export function tripComLink(option, locale = 'ko') {
  if (String(option?.mode || '') !== 'train') return null;
  if (String(option?.bookingOperator || '').trim() !== 'Korail') return null;
  const en = englishLocale(locale);
  return {
    href: TRIP_COM_KORAIL_HREF,
    text: en ? 'Book in another language (Trip.com) ↗' : '외국어 예매 (Trip.com) ↗',
  };
}

function fareValue(row) {
  return isRealFare(row?.fareAdultMin) ? row.fareAdultMin : null;
}

const SUSEO_STATION_ID = 'NATH30000';

/** TAGO labels Suseo SRT stock as KTX. Never show that grade next to SR booking. */
export function isSrtDeparture(option) {
  if (String(option?.bookingOperator || '').trim() === 'SR') return true;
  if (String(option?.depStationId || '').trim() === SUSEO_STATION_ID) return true;
  const dep = String(option?.depStation || '').replace(/\s+/g, '').replace(/역$/, '');
  return dep === '수서';
}

export function displayTrainGrade(option) {
  const grade = String(option?.grade || '').trim();
  if (isSrtDeparture(option)) return 'SRT';
  return grade;
}

function durationValue(row) {
  return Number.isFinite(row?.durationMin) ? row.durationMin : null;
}

function countValue(row) {
  return Number.isInteger(row?.dailyCount) && row.dailyCount > 0 ? row.dailyCount : 0;
}

function rowIsPartial(row) {
  return row?.truncated === true || row?.partial === true;
}

function formatFareAmount(value, locale) {
  if (!isRealFare(value)) return '';
  const en = englishLocale(locale);
  const fmt = value.toLocaleString(en ? 'en-US' : 'ko-KR');
  return en ? `₩${fmt}` : `${fmt}원`;
}

function formatTrainDateLabel(trainDate, locale) {
  const raw = String(trainDate || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const ymd = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  const hit = iso || ymd;
  if (!hit) return '';
  const month = Number(hit[2]);
  const day = Number(hit[3]);
  if (!month || !day) return '';
  if (englishLocale(locale)) return `${month}/${day}`;
  return `${month}월 ${day}일`;
}

function textPart(text, strong = false) {
  return { text: String(text ?? ''), strong: Boolean(strong) };
}

/**
 * Fastest grade: shortest duration, then lower fare, then more runs, then earlier first train.
 * @param {object[]} rows
 */
export function pickFastestTrainGrade(rows) {
  const list = (rows || []).filter((row) => durationValue(row) != null);
  if (!list.length) return null;
  return [...list].sort((a, b) => {
    const duration = durationValue(a) - durationValue(b);
    if (duration) return duration;
    const fareA = fareValue(a);
    const fareB = fareValue(b);
    if (fareA == null && fareB != null) return 1;
    if (fareA != null && fareB == null) return -1;
    if (fareA != null && fareB != null && fareA !== fareB) return fareA - fareB;
    const count = countValue(b) - countValue(a);
    if (count) return count;
    return String(a.firstDeparture || '').localeCompare(String(b.firstDeparture || ''));
  })[0];
}

function compareCheapest(a, b) {
  const fare = fareValue(a) - fareValue(b);
  if (fare) return fare;
  const duration = (durationValue(a) ?? Number.POSITIVE_INFINITY) - (durationValue(b) ?? Number.POSITIVE_INFINITY);
  if (duration) return duration;
  const count = countValue(b) - countValue(a);
  if (count) return count;
  return String(a.firstDeparture || '').localeCompare(String(b.firstDeparture || ''));
}

/**
 * Every grade that shares the lowest adult fare, cheapest-sort order.
 * @param {object[]} rows
 */
export function listCheapestTrainGrades(rows) {
  const list = (rows || []).filter((row) => fareValue(row) != null);
  if (!list.length) return [];
  const sorted = [...list].sort(compareCheapest);
  const min = fareValue(sorted[0]);
  return sorted.filter((row) => fareValue(row) === min);
}

/**
 * Cheapest grade: lowest adult fare, then shorter duration, then more runs.
 * @param {object[]} rows
 */
export function pickCheapestTrainGrade(rows) {
  return listCheapestTrainGrades(rows)[0] || null;
}

function cheapestDisplayNames(rows) {
  const names = [];
  for (const row of listCheapestTrainGrades(rows)) {
    const name = displayTrainGrade(row);
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

/** Same grade name on one segment is one run total (transfer dupes). */
export function summarizeTrainRuns(rows) {
  const seen = new Set();
  let sum = 0;
  let any = false;
  let partial = false;
  for (const row of rows || []) {
    const grade = String(row?.grade || '').trim();
    if (!grade || seen.has(grade)) continue;
    seen.add(grade);
    if (rowIsPartial(row)) partial = true;
    const count = countValue(row);
    if (count) {
      any = true;
      sum += count;
    }
  }
  return { sum, any, partial, gradeCount: seen.size };
}

function unknownLine(locale, which) {
  const en = englishLocale(locale);
  if (which === 'fastest') {
    return [textPart(en ? 'Fastest train: not confirmed' : '가장 빠른 열차: 확인 안 됨')];
  }
  if (which === 'cheapest') {
    return [textPart(en ? 'Cheapest train: not confirmed' : '가장 싼 열차: 확인 안 됨')];
  }
  return [textPart(en ? 'Daily departures: not confirmed' : '하루 횟수: 확인 안 됨')];
}

function fastestParts(row, locale) {
  const en = englishLocale(locale);
  const grade = displayTrainGrade(row);
  const duration = formatDuration(row.durationMin, locale);
  if (en) {
    return [
      textPart('The fastest train is '),
      textPart(grade, true),
      textPart(', about '),
      textPart(duration, true),
      textPart('.'),
    ];
  }
  return [
    textPart('가장 빠른 열차는 '),
    textPart(grade, true),
    textPart(', 약 '),
    textPart(duration, true),
    textPart(`${copula(duration)}.`),
  ];
}

function cheapestParts(row, locale) {
  const en = englishLocale(locale);
  const grade = displayTrainGrade(row);
  const fare = formatFareAmount(row.fareAdultMin, locale);
  if (en) {
    return [
      textPart('The cheapest train is '),
      textPart(grade, true),
      textPart(', '),
      textPart(fare, true),
      textPart('.'),
    ];
  }
  return [
    textPart('가장 싼 열차는 '),
    textPart(grade, true),
    textPart(', '),
    textPart(fare, true),
    textPart(`${copula(fare)}.`),
  ];
}

function tiedCheapestParts(names, fareAmount, locale) {
  const en = englishLocale(locale);
  const list = names.join('·');
  const fare = formatFareAmount(fareAmount, locale);
  if (en) {
    return [
      textPart('The cheapest fare is '),
      textPart(fare, true),
      textPart(' ('),
      textPart(list, true),
      textPart(').'),
    ];
  }
  return [
    textPart('가장 싼 요금은 '),
    textPart(fare, true),
    textPart('('),
    textPart(list, true),
    textPart(`)${copula(list)}.`),
  ];
}

function combinedParts(row, locale) {
  const en = englishLocale(locale);
  const grade = displayTrainGrade(row);
  const duration = formatDuration(row.durationMin, locale);
  const fare = formatFareAmount(row.fareAdultMin, locale);
  if (en) {
    return [
      textPart('The fastest and cheapest train is '),
      textPart(grade, true),
      textPart(', about '),
      textPart(duration, true),
      textPart(' · '),
      textPart(fare, true),
      textPart('.'),
    ];
  }
  return [
    textPart('가장 빠르고 싼 열차는 '),
    textPart(grade, true),
    textPart(', 약 '),
    textPart(duration, true),
    textPart(' · '),
    textPart(fare, true),
    textPart(`${copula(fare)}.`),
  ];
}

function runParts(runs, trainDate, locale) {
  const en = englishLocale(locale);
  const date = formatTrainDateLabel(trainDate, locale);
  if (!runs.any) return unknownLine(locale, 'runs');
  if (en) {
    const parts = [
      textPart(runs.partial ? 'At least ' : ''),
      textPart(String(runs.sum), true),
      textPart(runs.partial ? ' departures a day.' : ' departures a day.'),
    ].filter((part) => part.text);
    if (!runs.partial && date) parts.push(textPart(` (as of ${date})`));
    return parts;
  }
  const parts = [
    textPart('하루 '),
    textPart(`${runs.sum}회`, true),
    textPart(runs.partial ? ' 이상 다녀요.' : ' 다녀요.'),
  ];
  if (!runs.partial && date) parts.push(textPart(` (${date} 기준)`));
  return parts;
}

/**
 * Collapsed train card: fastest, cheapest, daily runs.
 * One grade, or the same grade for both, becomes a single sentence.
 * @param {object[]} rows
 * @param {{ locale?: string, trainDate?: string }} [opts]
 */
export function buildTrainGradeSummary(rows, opts = {}) {
  const locale = opts.locale || 'ko';
  const runs = summarizeTrainRuns(rows);
  const fastest = pickFastestTrainGrade(rows);
  const cheapest = pickCheapestTrainGrade(rows);
  const cheapestNames = cheapestDisplayNames(rows);
  const sameGrade = Boolean(
    fastest && cheapest && cheapestNames.length === 1
    && String(fastest.grade || '').trim() === String(cheapest.grade || '').trim(),
  );
  const single = runs.gradeCount <= 1;
  const lines = [];
  if ((single || sameGrade) && fastest && cheapest) {
    lines.push({
      parts: combinedParts({
        ...fastest,
        grade: fastest.grade,
        durationMin: fastest.durationMin,
        fareAdultMin: cheapest.fareAdultMin,
      }, locale),
    });
  } else if (single && fastest && !cheapest) {
    lines.push({ parts: fastestParts(fastest, locale) });
    lines.push({ parts: unknownLine(locale, 'cheapest') });
  } else {
    lines.push({ parts: fastest ? fastestParts(fastest, locale) : unknownLine(locale, 'fastest') });
    if (cheapestNames.length > 1) {
      lines.push({ parts: tiedCheapestParts(cheapestNames, cheapest.fareAdultMin, locale) });
    } else {
      lines.push({ parts: cheapest ? cheapestParts(cheapest, locale) : unknownLine(locale, 'cheapest') });
    }
  }
  lines.push({ parts: runParts(runs, opts.trainDate, locale) });
  return {
    lines,
    gradeCount: runs.gradeCount,
    expandable: runs.gradeCount > 1,
  };
}

export function trainSummaryText(summary) {
  return (summary?.lines || [])
    .map((line) => (line.parts || []).map((part) => part.text).join(''))
    .join('\n');
}

/** Expanded grade row. No range mark. */
export function buildTrainGradeDetail(option, locale = 'ko') {
  const en = englishLocale(locale);
  const first = String(option?.firstDeparture || '');
  const last = String(option?.lastDeparture || '');
  const once = countValue(option) === 1 || (first && first === last);
  const clock = !first
    ? (en ? 'not confirmed' : '확인 안 됨')
    : once
      ? (en ? `Departs ${first}` : `${first} 출발`)
      : (en ? `First ${first} · Last ${last}` : `첫차 ${first} · 막차 ${last}`);
  const duration = formatDuration(option?.durationMin, locale);
  const durationText = duration
    ? (en ? `from ${duration}` : `${duration}부터`)
    : (en ? 'not confirmed' : '확인 안 됨');
  const fare = formatFareAmount(option?.fareAdultMin, locale);
  const count = countValue(option);
  const partial = rowIsPartial(option);
  let countText = '';
  if (count) {
    countText = en
      ? (partial ? `${count} confirmed` : `${count}/day`)
      : (partial ? `확인 ${count}회` : `하루 ${count}회`);
  }
  let aside = '';
  if (fare && countText) aside = en ? `from ${fare} · ${countText}` : `${fare}부터 · ${countText}`;
  else if (fare) aside = en ? `from ${fare}` : `${fare}부터`;
  else if (countText) aside = countText;
  else aside = en ? 'not confirmed' : '확인 안 됨';
  return {
    grade: displayTrainGrade(option),
    clock,
    durationText,
    aside,
  };
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

export function preferredOriginId(origins, contentId) {
  if (!origins?.length) return '';
  if (String(contentId || '') === '638576') {
    const yongsan = origins.find((origin) => origin.originId === 'yongsan');
    if (yongsan) return yongsan.originId;
  }
  const seoul = origins.find((origin) => origin.originId === 'seoul-station');
  return (seoul || origins[0]).originId;
}

const ACCESS_CARD_CAP = 3;

function segmentCount(segment) {
  return segment.rows.reduce((sum, row) => sum + (Number(row.dailyCount) || 0), 0);
}

/** One card per mode + departure + arrival. Grades stay as rows. */
export function groupAccessSegments(options, { transfer = false } = {}) {
  const segments = [];
  const byKey = new Map();
  for (const option of options || []) {
    const depStation = String(option?.depStation || '').trim();
    const arrStation = String(option?.arrStation || '').trim();
    const mode = String(option?.mode || '');
    if (!depStation || !arrStation || !mode) continue;
    const key = `${mode}|${option.depStationId || depStation}|${option.arrStationId || arrStation}`;
    let segment = byKey.get(key);
    if (!segment) {
      segment = {
        key,
        mode,
        depStation,
        arrStation,
        venue: false,
        transfer,
        rows: [],
      };
      byKey.set(key, segment);
      segments.push(segment);
    }
    if (option.venue === true || option.role === 'venue') segment.venue = true;
    segment.rows.push(option);
  }
  for (const segment of segments) {
    segment.rows.sort((a, b) => (
      String(a.firstDeparture || '').localeCompare(String(b.firstDeparture || ''))
      || String(a.grade || '').localeCompare(String(b.grade || ''))
    ));
  }
  segments.sort((a, b) => {
    if (a.venue !== b.venue) return a.venue ? -1 : 1;
    return segmentCount(b) - segmentCount(a);
  });
  return segments;
}

/** At most three cards: direct venue, then other directs, then transfers. */
export function selectAccessCards(origin) {
  const direct = groupAccessSegments(origin?.direct, { transfer: false });
  const hops = groupAccessSegments(origin?.hops, { transfer: true });
  return [...direct, ...hops].slice(0, ACCESS_CARD_CAP);
}

function rowFact(option, locale) {
  return {
    grade: displayTrainGrade(option),
    clock: formatClockRange(option.firstDeparture, option.lastDeparture, locale),
    duration: formatDurationRange(option.durationMin, option.durationMax, locale),
    fare: formatFareRange(option.fareAdultMin, option.fareAdultMax, locale),
    count: formatRunCount(option, locale),
  };
}

function factsForOrigin(origin, locale) {
  return selectAccessCards(origin).map((card) => ({
    key: card.key,
    mode: card.mode,
    dep: card.depStation,
    arr: card.arrStation,
    transfer: card.transfer === true,
    rows: card.rows.map((row) => rowFact(row, locale)).filter((row) => row.clock && row.fare),
  })).filter((segment) => segment.rows.length > 0);
}

/** Selected tab plus every origin, already capped, for the MOONi hint. */
export function transportFactsFromView(view, origin, locale = 'ko') {
  if (!origin) return null;
  const origins = (view?.origins || [])
    .map((row) => ({
      originId: row.originId,
      label: row.label,
      segments: factsForOrigin(row, locale),
    }))
    .filter((row) => row.segments.length > 0);
  const selected = origins.find((row) => row.originId === origin.originId) || null;
  if (!selected) return null;
  return { selected, origins };
}

function stationToken(name) {
  return String(name || '').replace(/\s+/g, '').replace(/역$/, '').replace(/터미널$/, '');
}

/** Text before the first 에서. «용산역에서 어떻게 가요?» → «용산역». */
export function festivalAccessAskFragment(text) {
  const head = String(text || '').match(/^(.{1,24}?)에서/u);
  return String(head?.[1] || '').trim();
}

/** A how-to-get question, including one that also asks for clocks and fares. */
export function festivalAccessAskIsRoute(text) {
  return /어떻게\s*가|가는\s*(?:길|방법|법)|how\s*to\s*get/i.test(String(text || ''));
}

/**
 * Card facts already on the festival, or a fresh proxy read for the same content id.
 * Cache-opened sheets can open MOONi before the card has pushed its facts.
 */
export async function transportForFestivalAsk(festivalContext, locale = 'ko') {
  if (festivalContext?.transport?.origins?.length) return festivalContext.transport;
  const contentId = String(festivalContext?.contentId || '').trim();
  if (!shouldQueryFestivalTransport(contentId)) return festivalContext?.transport || null;
  const trainDate = resolveFestivalTrainDate(
    festivalContext?.eventStartDate,
    festivalContext?.eventEndDate,
  );
  const { fetchFestivalTransportCard } = await import('./festivalTransportCardFetch.js');
  const result = await fetchFestivalTransportCard({ contentId, trainDate });
  if (result.status !== 'ready') return null;
  const view = buildAccessView(result.card);
  if (view.status !== 'ready') return null;
  const originId = preferredOriginId(view.origins, contentId);
  const origin = view.origins.find((row) => row.originId === originId) || view.origins[0];
  return transportFactsFromView(view, origin, locale);
}

export function departureCoversStation(stations, depStation) {
  const dep = stationToken(depStation);
  if (!dep) return false;
  return String(stations || '').split('·').some((part) => stationToken(part) === dep);
}

function segmentFactKey(segment) {
  return `${stationToken(segment?.dep)}|${stationToken(segment?.arr)}|${segment?.mode || ''}`;
}

function rowFactKey(segment, row) {
  return [
    segmentFactKey(segment),
    row?.grade || '',
    row?.clock || '',
    row?.duration || '',
    row?.fare || '',
    row?.count || '',
  ].join('|');
}

/** Transfer hops can repeat a direct segment. Keep one copy of each grade. */
function dedupeAccessSegments(segments) {
  const seenRows = new Set();
  const merged = new Map();
  const order = [];
  for (const segment of segments || []) {
    const key = segmentFactKey(segment);
    let bucket = merged.get(key);
    if (!bucket) {
      bucket = { ...segment, rows: [] };
      merged.set(key, bucket);
      order.push(bucket);
    }
    for (const row of segment.rows || []) {
      const rowKey = rowFactKey(segment, row);
      if (seenRows.has(rowKey)) continue;
      seenRows.add(rowKey);
      bucket.rows.push(row);
    }
  }
  return order.filter((segment) => segment.rows.length > 0);
}

function hangulJong(word) {
  const chars = Array.from(String(word || '').trim());
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    const code = chars[i].codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28;
  }
  return null;
}

function topicParticle(word) {
  const jong = hangulJong(word);
  if (jong == null) return '는';
  return jong === 0 ? '는' : '은';
}

function instrumentalParticle(word) {
  const jong = hangulJong(word);
  if (jong == null || jong === 0 || jong === 8) return '로';
  return '으로';
}

function copula(word) {
  const jong = hangulJong(word);
  if (jong == null || jong === 0) return '예요';
  return '이에요';
}

function runCount(row) {
  const match = String(row?.count || '').match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function bestRow(rows) {
  let best = rows[0];
  let bestCount = runCount(best);
  for (const row of rows.slice(1)) {
    const count = runCount(row);
    if (count > bestCount) {
      best = row;
      bestCount = count;
    }
  }
  return best;
}

function directSentence(segment, en) {
  const row = bestRow(segment.rows || []);
  if (!row) return '';
  const clock = glueAccessUnit(row.clock);
  const fare = glueAccessUnit(row.fare);
  if (en) {
    const range = /~|–/.test(String(row.clock || ''));
    if (range) {
      return `${segment.dep} → ${segment.arr} direct on ${row.grade}: departures ${clock}, ${fare}.`;
    }
    return `${segment.dep} → ${segment.arr} direct on ${row.grade}: ${clock}, ${fare}.`;
  }
  const range = /~|–/.test(String(row.clock || ''));
  const when = range
    ? `조회한 시간대(${clock})에 운행하는 출발편 예시로 바로 갈 수 있어요`
    : `${clock}에 바로 갈 수 있어요`;
  return `${segment.dep}→${segment.arr}${topicParticle(segment.arr)} ${row.grade}${instrumentalParticle(row.grade)} ${when}. 요금은 ${fare}${copula(row.fare)}.`
}

function transferSentence(trunk, en) {
  const row = bestRow(trunk.rows || []);
  if (!row) return '';
  const bits = [glueAccessUnit(row.duration), glueAccessUnit(row.fare)].filter(Boolean);
  const detail = bits.join(', ');
  if (en) {
    return `A more frequent ${row.grade} to ${trunk.arr}, then a change, also works${detail ? ` (${detail})` : ''}.`;
  }
  return `더 자주 다니는 ${row.grade}${instrumentalParticle(row.grade)} ${trunk.arr}까지 가서 갈아타는 방법도 있어요${detail ? `(${detail})` : ''}.`;
}

function cardPointer(en) {
  return en
    ? 'The full timetable is on the access card on this screen.'
    : '전체 시각표는 화면의 가는 법 카드에 있어요.';
}

/**
 * One or two direct sentences, an optional transfer summary, then the on-screen card.
 * Empty when the selected tab has none.
 * @param {{ selected?: { segments?: object[] }, origins?: Array<{ segments?: object[] }> } | null} transport
 */
export function composeFestivalAccessReply(transport, {
  useSelected = false,
  stations = '',
  locale = 'ko',
} = {}) {
  if (!transport) return '';
  let segments = [];
  if (useSelected) {
    segments = transport.selected?.segments || [];
  } else {
    for (const origin of transport.origins || []) {
      const rows = origin.segments || [];
      const asked = rows.some((segment) => !stations || departureCoversStation(stations, segment.dep));
      if (!asked) continue;
      for (const segment of rows) {
        if (!stations || segment.transfer === true || departureCoversStation(stations, segment.dep)) {
          segments.push(segment);
        }
      }
    }
  }
  segments = dedupeAccessSegments(segments);
  if (!useSelected) segments = segments.slice(0, ACCESS_CARD_CAP);
  if (!segments.length) return '';
  const en = englishLocale(locale);
  const hops = segments.filter((segment) => segment.transfer === true);
  const hopDeps = new Set(hops.map((segment) => stationToken(segment.dep)));
  const directs = segments.filter((segment) => segment.transfer !== true);
  const trunks = [];
  const recommended = [];
  for (const segment of directs) {
    const arrival = stationToken(segment.arr);
    const changePoint = hopDeps.has(arrival) || (
      recommended.length > 0 && arrival !== stationToken(recommended[0].arr)
    );
    if (changePoint) trunks.push(segment);
    else recommended.push(segment);
  }
  const lead = recommended.length ? recommended : directs;
  const lines = lead.slice(0, 2).map((segment) => directSentence(segment, en)).filter(Boolean);
  if (trunks.length) lines.push(transferSentence(trunks[0], en));
  lines.push(cardPointer(en));
  return lines.filter(Boolean).join('\n\n');
}

/** Hint block when TAGO rows exist — model still answers (last leg + car). */
export function festivalAccessTagoModelHint(tagoLead, locale = 'ko') {
  const lead = String(tagoLead || '').trim();
  if (!lead) return '';
  const en = String(locale || '').slice(0, 2) === 'en';
  if (en) {
    return [
      '- Confirmed TAGO segment (quote only these times and fares; do not stop at the arrival station — continue with the last leg to the festival venue, name the transfer stop, bus/taxi when known, and an encouraging driving option with only confirmed numbers):',
      lead,
    ].join('\n');
  }
  return [
    '- 확인된 TAGO 구간(아래 시각·요금만 쓰고, 도착 역에서 끝내지 말고 축제장까지 마지막 구간·갈아타는 곳·버스·택시와 자가용 옵션을 따뜻하게 이어서 안내):',
    lead,
  ].join('\n');
}

/**
 * Route questions always call the model. TAGO lead goes in the festival hint only.
 */
export function planFestivalMooniModelCall({
  chipId = null,
  userText = '',
  transport = null,
  useCardTransport = false,
  locale = 'ko',
  stations = '',
} = {}) {
  const route = chipId === 'festival_access' || festivalAccessAskIsRoute(userText);
  if (!route) return { callModel: true, reply: '', tagoLead: '' };
  const askFragment = festivalAccessAskFragment(userText);
  const tagoLead = composeFestivalAccessReply(transport, {
    locale,
    useSelected: useCardTransport || !askFragment,
    stations: askFragment || stations,
  });
  return { callModel: true, reply: '', tagoLead };
}

/** Synchronous send lock. end() runs on every exit, including a local card answer. */
export function createMooniSendGate() {
  let busy = false;
  return {
    tryBegin() {
      if (busy) return false;
      busy = true;
      return true;
    },
    end() {
      busy = false;
    },
    get busy() {
      return busy;
    },
  };
}

export function groupOptionsByMode(options) {
  const groups = MODE_ORDER.map((mode) => ({
    mode,
    options: (options || []).filter((option) => option.mode === mode),
  })).filter((group) => group.options.length > 0);
  return groups;
}
