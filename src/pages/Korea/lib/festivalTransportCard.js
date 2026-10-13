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
  if (operator === 'SR' || operator === 'Korail') {
    return en ? `Book · ${operator}` : `${operator} 예매`;
  }
  if (option?.mode === 'expBus') return en ? 'Book express bus' : '고속버스 예매';
  if (option?.mode === 'suburbsBus') return en ? 'Book intercity bus' : '시외버스 예매';
  return en ? 'Book' : '예매';
}

export function bookingLink(option, locale = 'ko') {
  const home = String(option?.bookingUrl || '');
  const deep = srSearchHref(option);
  const href = deep || home;
  if (!/^https:\/\//.test(href)) return null;
  const dep = String(option?.depStation || '').trim();
  const arr = String(option?.arrStation || '').trim();
  const segment = deep || !dep || !arr ? null : { dep, arr, particle: objectParticle(arr) };
  return { href, text: bookingText(option, locale), segment };
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
    grade: String(option.grade || '').trim(),
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

/**
 * One unbreakable unit: fare commas, spaces inside a duration, and the range mark.
 * @param {unknown} value
 */
export function glueAccessUnit(value) {
  return String(value || '')
    .replace(/(\d),(\d)/g, '$1,\u2060$2')
    .replace(/~/g, '\u2060~\u2060')
    .replace(/–/g, '\u2060–\u2060')
    .replace(/ /g, '\u00A0');
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
    return `${segment.dep} → ${segment.arr} direct on ${row.grade}: ${clock}, ${fare}.`;
  }
  return `${segment.dep}→${segment.arr}${topicParticle(segment.arr)} ${row.grade}${instrumentalParticle(row.grade)} ${clock}에 바로 갈 수 있어요. 요금은 ${fare}${copula(row.fare)}.`
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
