import { KO, EN } from '../../i18n/mooniPromptBundleData.js';
import { listCityAttractionHubs, resolveCityAttractionHub } from '../../pages/Home/lib/cityAttractionHubs.js';
import { englishLodgingAreaLabel, englishLodgingPlaceName } from './englishPlaceLabel.js';
import { ensureItineraryMarkdownLineBreaks } from '../../utils/mooniTruncatedContinue.js';
import { haversineKm as stayHaversineKm, parseStayCoordPair } from '../../utils/mrtStayDistance.js';
import { filterBySearchQuery, normalizeFestivalQuery } from '../../pages/Korea/festivalSearch.js';
import {
  compareFestivalsByOpenDate,
  rangesOverlap,
  todayYmd,
  upcomingWeekendRange,
  rolling30DayRangeYmd,
  toYmd,
} from '../../pages/Korea/festivalTimeFilter.js';
import { glueAccessNumbersInProse } from './festivalAccessProseGlue.js';
import {
  composeFestivalAccessReply,
  festivalAccessAskIsRoute,
} from '../../pages/Korea/lib/festivalTransportCardCore.js';
import {
  domesticFestivalGroundOrigin,
  formatOriginHubGuidance,
} from '../../pages/Home/lib/festivalDomesticOrigins.js';
import { fitMooniKoreaFestivalHint } from './mooniKoreaFestivalHintBudget.js';

export {
  MOONI_KOREA_FESTIVAL_HINT_BUDGET,
  MOONI_KOREA_FESTIVAL_HINT_MAX,
  fitMooniKoreaFestivalHint,
} from './mooniKoreaFestivalHintBudget.js';

export const GATEO_KOREA_FESTIVAL_BASE = 'https://www.gateo.kr/korea/';

/** @param {string} contentId */
export function gateoKoreaFestivalDetailUrl(contentId) {
  const id = String(contentId || '').trim();
  if (!/^\d+$/.test(id)) return GATEO_KOREA_FESTIVAL_BASE;
  return `${GATEO_KOREA_FESTIVAL_BASE}?festival=${encodeURIComponent(id)}`;
}

/** FestivalStayStrip anchor on the festival detail sheet. */
export const FESTIVAL_LODGING_SECTION_ID = 'festival-lodging';

export const FESTIVAL_LODGING_EVENT = 'gateo-festival-lodging';

/** In-app open for MOONi «축제 페이지» / festival detail links on /korea. */
export const FESTIVAL_PAGE_EVENT = 'gateo-festival-page';

/**
 * @param {string} href
 * @returns {string}
 */
export function festivalContentIdFromGateoHref(href) {
  try {
    const raw = String(href || '').trim();
    if (!raw) return '';
    const url = new URL(raw, GATEO_KOREA_FESTIVAL_BASE);
    if (/^https?:\/\//i.test(raw)) {
      const host = String(url.hostname || '').toLowerCase();
      if (host !== 'www.gateo.kr' && host !== 'gateo.kr') return '';
    }
    const path = String(url.pathname || '').replace(/\/$/, '');
    if (!path.endsWith('/korea')) return '';
    const id = String(url.searchParams.get('festival') || '');
    return /^\d+$/.test(id) ? id : '';
  } catch {
    return '';
  }
}

/** @param {string} contentId */
export function gateoKoreaFestivalLodgingUrl(contentId) {
  const base = gateoKoreaFestivalDetailUrl(contentId);
  if (!base.includes('festival=')) return '';
  return `${base}#${FESTIVAL_LODGING_SECTION_ID}`;
}

const FESTIVAL_LODGING_ASK_RE =
  /숙소|숙박|어디서\s*자|어디(?:서)?\s*묵|머물\s*곳|where\s+to\s+stay|where\s+should\s+i\s+stay|accommodation|lodging|\bhotels?\b/i;

/**
 * @param {{ chipId?: string, userText?: string }} [input]
 */
export function isFestivalLodgingAsk(input = {}) {
  if (String(input.chipId || '') === 'prep_hotel') return true;
  return FESTIVAL_LODGING_ASK_RE.test(String(input.userText || ''));
}

/**
 * @param {string} contentId
 * @param {string} [locale]
 */
export function festivalLodgingLinkLabel(placeName, locale = 'ko') {
  const place = String(placeName || '').replace(/\s+/g, ' ').trim();
  const en = String(locale || '').slice(0, 2) === 'en';
  if (en) {
    const english = englishLodgingPlaceName(place);
    return english ? `${english} lodging guide` : 'the lodging card';
  }
  return place ? `${place} 숙소 안내` : '숙소 카드';
}

export function festivalLodgingNextStep(contentId, locale = 'ko', placeName = '') {
  const url = gateoKoreaFestivalLodgingUrl(contentId);
  if (!url) return '';
  const en = String(locale || '').slice(0, 2) === 'en';
  const place = String(placeName || '').trim();
  if (!place) {
    if (en) return `Next, stays for this festival are on [the lodging card](${url}).`;
    return `다음으로 이 축제의 [숙소 카드](${url})에서 볼 수 있어요.`;
  }
  const label = festivalLodgingLinkLabel(place, locale);
  if (en) return `Next, stays for this festival are on [${label}](${url}).`;
  return `다음으로 [${label}](${url})에서 볼 수 있어요.`;
}

/** «천지연 주차장 (일대)» is the place around 천지연, not a parking answer. */
export function festivalSpokenVenue(venue) {
  const raw = String(venue || '').replace(/\s+/g, ' ').trim();
  const match = raw.match(/^(.+?)\s*주차장\s*(?:\(\s*(일대|일원)\s*\)|\s+(일대|일원))\s*$/);
  if (!match) return raw;
  const place = match[1].replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!place) return raw;
  return `${place} ${match[2] || match[3]}`;
}

function speakVenuePhrases(text) {
  return String(text || '').replace(
    /([가-힣]{2,12})\s*주차장\s*(?:\(\s*(일대|일원)\s*\)|\s+(일대|일원))/g,
    (_, place, paren, loose) => `${place} ${paren || loose}`,
  );
}

function lodgingAreaNames(options = {}) {
  const lat = Number(options.lat);
  const lng = Number(options.lng);
  const names = [];
  const push = (value) => {
    const text = String(value?.name || value || '').replace(/\s*(?:일원|일대|부근)$/g, '').replace(/\s+/g, ' ').trim();
    if (!text || names.includes(text)) return;
    if (festivalStayLabelIsDistant(value?.hubId || text, lat, lng)) return;
    if (value?.hubId && festivalStayLabelIsDistant(text, lat, lng)) return;
    names.push(text);
  };
  push(options.venue);
  push(options.placeName);
  for (const area of options.stayAreas || []) push(area);
  return names.slice(0, 3);
}

function lodgingAreaLead(areas, locale = 'ko', placeName = '') {
  const names = (areas || []).slice(0, 3);
  const en = String(locale || '').slice(0, 2) === 'en';
  const labels = en
    ? names.map((name) => englishLodgingAreaLabel(name, placeName)).filter(Boolean).slice(0, 3)
    : names;
  if (labels.length < 2) return '';
  if (en) {
    const list = labels.length === 2
      ? `${labels[0]} and ${labels[1]}`
      : `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
    return `${list} are practical places to stay.`;
  }
  return `${labels.join(', ')}에서 묵기 좋아요.`;
}

function renameVagueLodgingLabels(text, label, locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  return String(text || '').replace(
    /\[([^\]]*)\]\((https:\/\/www\.gateo\.kr\/korea\/\?festival=\d+#festival-lodging)\)/g,
    (full, old, url) => {
      if (en && label && !/[가-힣]/.test(label)) return `[${label}](${url})`;
      return /이곳|여기|이\s*링크|숙소\s*카드|this link|^here$|the lodging card/i.test(old)
        ? `[${label}](${url})`
        : full;
    },
  );
}

/**
 * One next step for a lodging question in a festival session.
 * @param {string} reply
 * @param {{ contentId?: string, locale?: string, chipId?: string, userText?: string }} [options]
 */
/**
 * Bare gateo.kr festival URLs become markdown links. Already-linked URLs stay as they are.
 * @param {string} text
 * @param {string} [locale]
 */
export function linkifyBareGateoFestivalUrls(text, locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  const bareGateoFestivalUrlRe =
    /(^|[^\w(\[])(https?:\/\/(?:www\.)?gateo\.kr\/korea\/?\?[^\s<>)]+)/gi;
  return String(text || '').replace(bareGateoFestivalUrlRe, (full, prefix, url) => {
    const clean = url.replace(/[.,]+$/, '');
    const tail = url.slice(clean.length);
    const lodging = clean.includes(`#${FESTIVAL_LODGING_SECTION_ID}`);
    const label = lodging
      ? (en ? 'the lodging card' : '숙소 카드')
      : (en ? 'the festival page' : '축제 페이지');
    return `${prefix}[${label}](${clean})${tail}`;
  });
}

/** Drop matching sentences, but keep paragraph breaks and list lines. */
function filterPreservingBreaks(text, drop) {
  const paragraphs = String(text || '').split(/\n{2,}/);
  const kept = paragraphs.map((paragraph) => {
    const lines = paragraph.split('\n').map((line) => {
      const sentences = line
        .split(/(?<=[.!?。])\s+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => !drop(part));
      return sentences.join(' ');
    }).filter((line) => line.trim());
    return lines.join('\n');
  }).filter((paragraph) => paragraph.trim());
  return kept.join('\n\n').trim();
}

/** Collapse runs of spaces/tabs only — keep paragraph and line breaks. */
function collapseHorizontalWhitespace(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/g, ''))
    .join('\n');
}

const NON_STAY_RE = /사우나|찜질|목욕탕|목욕|스파|sauna|jjimjilbang|bathhouse/i;
const NON_STAY_ASK_RE = /사우나|찜질|목욕|스파|sauna|jjimjilbang|bathhouse/i;
const BROADCAST_RE = /방청|공개\s*방송|시청자/;
const BROADCAST_ASK_RE = /방청|공개\s*방송|시청자|KBS|MBC|SBS/;
const TWELVE_GO_CTA_RE =
  /12\s*Go[^\n]{0,80}|12go\.asia|교통편\s*검색(?:\s*\([^)]*\))?(?:\s*[|｜])?|바로\s*가기[^\n]{0,48}12\s*Go|12\s*Go[^\n]{0,48}바로\s*가기/i;

function isDomesticTwelveGoCtaFragment(part) {
  const t = String(part || '').trim();
  if (!t) return false;
  if (TWELVE_GO_CTA_RE.test(t)) return true;
  if (/^교통편\s*검색\s*[.。!?\s]*$/i.test(t)) return true;
  if (/^교통편\s*검색$/i.test(normalizeCta(t))) return true;
  return false;
}

const FESTIVAL_OVERSEAS_AIR_CHIPS = new Set([
  'festival_overseas_visa',
  'festival_overseas_flight',
  'festival_overseas_airport',
]);

function normalizeEventYmdForPolish(value) {
  const raw = String(value || '').trim();
  if (/^\d{8}$/.test(raw)) return raw;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}${iso[2]}${iso[3]}`;
  const digits = raw.replace(/\D/g, '');
  return /^\d{8}$/.test(digits) ? digits : '';
}

function shouldPolishDomesticKoreaFestival(options = {}) {
  const chipId = String(options.chipId || '');
  if (FESTIVAL_OVERSEAS_AIR_CHIPS.has(chipId)) return false;
  if (/인천\s*공항|인천국제공항|incheon airport/i.test(String(options.userText || ''))) return false;
  return Boolean(
    String(options.contentId || '').trim()
    || String(options.festivalTitle || '').trim(),
  );
}

/**
 * Lodging answers drop saunas and other non-stay facilities unless the user asked.
 * @param {string} text
 * @param {string} [userText]
 */
export function stripNonStayFacilities(text, userText = '') {
  if (NON_STAY_ASK_RE.test(String(userText || ''))) return String(text || '').trim();
  return filterPreservingBreaks(text, (part) => NON_STAY_RE.test(part));
}

/**
 * Drop broadcast-audience lines unless the user asked about them.
 * @param {string} text
 * @param {string} [userText]
 */
export function stripUnaskedBroadcastLines(text, userText = '') {
  if (BROADCAST_ASK_RE.test(String(userText || ''))) return String(text || '').trim();
  return filterPreservingBreaks(text, (part) => BROADCAST_RE.test(part));
}

/** Domestic festival answers do not keep a 12Go partner jump line. */
export function stripDomesticTwelveGoMention(text) {
  const withoutLinks = String(text || '')
    .replace(/\[[^\]]*12\s*Go[^\]]*\]\([^)]+\)/gi, '')
    .replace(/\[[^\]]*교통편\s*검색[^\]]*\]\([^)]+\)/gi, '')
    .replace(/https?:\/\/(?:www\.)?12go\.asia\S*/gi, '');
  let next = filterPreservingBreaks(withoutLinks, (part) => isDomesticTwelveGoCtaFragment(part));
  next = next
    .split('\n')
    .filter((line) => !/^[\s*#\-–—•|｜]*교통편\s*검색\s*[.。!?\s]*$/i.test(String(line || '').trim()))
    .join('\n');
  return next.replace(/\n{3,}/g, '\n\n').trim();
}

export function appendFestivalLodgingNextStep(reply, options = {}) {
  let text = linkifyBareGateoFestivalUrls(String(reply || '').trim(), options.locale);
  if (!isFestivalLodgingAsk(options)) return text;
  const placeName = options.placeName || '';
  const label = festivalLodgingLinkLabel(placeName, options.locale);
  text = renameVagueLodgingLabels(text, label, options.locale);
  const areas = lodgingAreaNames(options);
  const present = areas.filter((name) => text.includes(name));
  if (areas.length >= 2 && present.length < 2) {
    const lead = lodgingAreaLead(areas, options.locale, placeName);
    if (lead) text = text ? `${lead}\n\n${text}` : lead;
  }
  const step = festivalLodgingNextStep(options.contentId, options.locale, placeName);
  if (!step) return text;
  if (text.includes(`#${FESTIVAL_LODGING_SECTION_ID}`)) return text;
  return text ? `${text}\n\n${step}` : step;
}

/**
 * Festival model text: drop unasked broadcast lines, non-stay lodging mentions,
 * and a domestic 12Go jump, then link bare GATEO festival URLs.
 * @param {string} reply
 * @param {{ contentId?: string, locale?: string, chipId?: string, userText?: string }} [options]
 */
const ALLOWED_FESTIVAL_URL =
  /^https:\/\/(?:www\.)?gateo\.kr\/korea\/\?festival=\d+(?:#festival-lodging)?$/i;

const FESTIVAL_BOOKING_URL =
  /^https:\/\/(?:www\.)?(?:letskorail\.com|korail\.com|bustago\.or\.kr|kobus\.co\.kr|txbus\.t-money\.co\.kr)\/?/i;

const OFFICIAL_SITE_LABEL_RE = /^(?:공식\s*홈페이지|official\s+site)$/i;

export const FESTIVAL_ACCESS_KORAIL_URL = 'https://www.letskorail.com/';
export const FESTIVAL_ACCESS_BUSTAGO_URL = 'https://www.bustago.or.kr/';
export const FESTIVAL_ACCESS_KOBUS_URL = 'https://www.kobus.co.kr/';
export const FESTIVAL_ACCESS_TXBUS_URL = 'https://txbus.t-money.co.kr/';

const BOOKING_SITE_CHECKS = [
  { id: 'korail', re: /(?:lets)?korail\.com/i },
  { id: 'srt', re: /(?:etk\.)?srail\.co\.kr/i },
  { id: 'kobus', re: /kobus\.co\.kr/i },
  { id: 'bustago', re: /bustago\.or\.kr/i },
  { id: 'txbus', re: /txbus\.t-money\.co\.kr/i },
];

const FESTIVAL_ACCESS_BOOKING_MARKDOWN_LINK_RE =
  /\[[^\]]+\]\(\s*https?:\/\/(?:www\.)?(?:letskorail\.com|korail\.com|etk\.srail\.co\.kr|srail\.co\.kr|bustago\.or\.kr|kobus\.co\.kr|txbus\.t-money\.co\.kr)[^)]*\)/i;

function bodyHasFestivalAccessBookingMarkdownLink(text) {
  const s = String(text || '');
  if (FESTIVAL_ACCESS_BOOKING_MARKDOWN_LINK_RE.test(s)) return true;
  return /\[(?:코레일|Korail|SRT|버스타고|BUSTAGO|고속버스|KOBUS|시외버스|intercity bus)\]\([^)]+\)/i.test(s);
}

function festivalAccessBookingDomainsInText(text) {
  const found = new Set();
  for (const { id, re } of BOOKING_SITE_CHECKS) {
    if (re.test(String(text || ''))) found.add(id);
  }
  return found;
}

function hasFestivalAccessBookingFooterParagraph(text, locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  const startRe = en ? /^Check train and bus schedules on\b/i : /^열차·버스 시각은\b/;
  return String(text || '')
    .split(/\n\n/)
    .some((block) => startRe.test(block.trim()));
}

/** Keep one booking footer block when the model already echoed the client footer. */
export function dedupeFestivalAccessBookingFooters(text, locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  const footerRe = en
    ? /\n\nCheck train and bus schedules on[\s\S]*?(?=\n\n|$)/gi
    : /\n\n열차·버스 시각은[\s\S]*?(?=\n\n|$)/g;
  const body = String(text || '').trim();
  const matches = [...body.matchAll(footerRe)];
  if (matches.length <= 1) return body;
  const keep = matches[matches.length - 1][0];
  let out = body;
  for (const match of matches.slice(0, -1)) {
    out = out.replace(match[0], '');
  }
  if (!out.includes(keep.trim())) out = `${out.trim()}${keep}`.trim();
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

function bodyMentionsFestivalBookingServices(text) {
  const blob = String(text || '');
  const domains = festivalAccessBookingDomainsInText(blob);
  const rail = domains.has('korail') || /코레일|letskorail/i.test(blob);
  const bus = domains.has('bustago') || /버스타고/i.test(blob)
    || domains.has('kobus') || /고속버스/i.test(blob)
    || domains.has('txbus') || /시외버스/i.test(blob);
  return rail && bus;
}

function splitAccessBodyAndAutoFooter(body, locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  const text = String(body || '').trim();
  const marker = en ? 'Check train and bus schedules on' : '열차·버스 시각은';
  const blockIdx = text.indexOf(`\n\n${marker}`);
  if (blockIdx >= 0) {
    return { main: text.slice(0, blockIdx).trim(), footer: text.slice(blockIdx).trim() };
  }
  const inlineIdx = text.indexOf(marker);
  if (inlineIdx > 0) {
    let mainEnd = inlineIdx;
    while (mainEnd > 0 && /\s/.test(text[mainEnd - 1])) mainEnd -= 1;
    return { main: text.slice(0, mainEnd).trim(), footer: text.slice(inlineIdx).trim() };
  }
  return { main: text, footer: '' };
}

function accessAnswerMainBeforeFooter(body, locale = 'ko') {
  return splitAccessBodyAndAutoFooter(body, locale).main;
}

function koAccessBookingDomainsInText(text) {
  const domains = festivalAccessBookingDomainsInText(text);
  return {
    domains,
    rail: domains.has('korail') || /\[코레일\]/i.test(text) || /\[SRT\]/i.test(text),
    bus: domains.has('bustago') || domains.has('kobus') || domains.has('txbus')
      || /\[버스타고\]|\[고속버스\]|\[시외버스\]|\[BUSTAGO\]|\[KOBUS\]/i.test(text),
  };
}

function koAccessTimetableIntentInText(main) {
  const text = String(main || '');
  const { rail, bus } = koAccessBookingDomainsInText(text);
  const trainScheduleFare = /(?:열차|기차|KTX)(?:\s+[가-힣]{1,10})*\s*(?:시각|시간|시간표)(?:과|와)?\s*요금/;
  const busScheduleFare = /버스(?:\s+[가-힣]{1,10})*\s*(?:시각|시간|시간표)(?:과|와)?\s*요금/;
  if (trainScheduleFare.test(text) && rail) return true;
  if (busScheduleFare.test(text) && bus) return true;
  if (/열차·버스\s*시각/.test(text) && rail && bus) return true;
  if (/시간표/.test(text) && rail && /(?:열차|기차|KTX|SRT)/.test(text)) return true;
  if (/시간표/.test(text) && bus && /버스/.test(text)) return true;
  return false;
}

function bodyHasAccessTimetablePointer(text, locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  const main = accessAnswerMainBeforeFooter(text, locale);
  if (en) {
    const domains = festivalAccessBookingDomainsInText(main);
    return /check train and bus schedules on/i.test(main)
      || (/train (?:times|schedules)|bus schedules/i.test(main) && domains.size >= 2);
  }
  if (bodyHasFestivalAccessBookingMarkdownLink(main)) return true;
  return koAccessTimetableIntentInText(main);
}

/** Drop echoed auto footers before appending the client booking block. */
function stripEchoedAccessAutoFooter(text, locale = 'ko') {
  let body = dedupeFestivalAccessBookingFooters(String(text || '').trim(), locale);
  const { main, footer } = splitAccessBodyAndAutoFooter(body, locale);
  const en = String(locale || '').slice(0, 2) === 'en';
  const autoFooterLead = en ? /^Check train and bus schedules on/i : /^열차·버스\s*시각은/;
  if (!footer || !autoFooterLead.test(footer)) return body;
  if (
    bodyHasFestivalAccessBookingMarkdownLink(main)
    || bodyHasAccessTimetablePointer(main, locale)
    || bodyHasFestivalAccessBookingMarkdownLink(footer)
  ) {
    return main.trim();
  }
  return body;
}

/** One timetable pointer — drop the auto footer when the route body already points to booking sites. */
export function reconcileAccessBookingPointers(text, locale = 'ko') {
  return stripEchoedAccessAutoFooter(text, locale);
}

function shouldSkipFestivalAccessBookingFooterAppend(body) {
  if (hasFestivalAccessBookingFooterParagraph(body)) return true;
  if (bodyHasFestivalAccessBookingMarkdownLink(body)) return true;
  if (bodyHasAccessTimetablePointer(body)) return true;
  if (bodyMentionsFestivalBookingServices(body)) return true;
  const domains = festivalAccessBookingDomainsInText(body);
  if (!domains.has('korail')) return false;
  const busSites = (domains.has('kobus') ? 1 : 0)
    + (domains.has('bustago') ? 1 : 0)
    + (domains.has('txbus') ? 1 : 0);
  return busSites >= 1;
}

function isAllowedFestivalMarkdownUrl(url, homepage = '') {
  const clean = String(url || '').trim();
  if (ALLOWED_FESTIVAL_URL.test(clean)) return true;
  if (FESTIVAL_BOOKING_URL.test(clean)) return true;
  if (sameOfficialUrl(clean, homepage)) return true;
  return false;
}

function isAllowedFestivalBareUrl(url) {
  const clean = String(url || '').trim();
  if (ALLOWED_FESTIVAL_URL.test(clean)) return true;
  if (FESTIVAL_BOOKING_URL.test(clean)) return true;
  return false;
}

/** Client footer for festival_access — booking links the model may omit. */
export function appendFestivalAccessBookingLinks(text, locale = 'ko') {
  const body = stripEchoedAccessAutoFooter(String(text || '').trim(), locale);
  if (shouldSkipFestivalAccessBookingFooterAppend(body)) return body;
  const en = String(locale || '').slice(0, 2) === 'en';
  const domains = festivalAccessBookingDomainsInText(body);
  const links = [];
  if (!domains.has('korail')) {
    links.push(en
      ? `[Korail](${FESTIVAL_ACCESS_KORAIL_URL})`
      : `[코레일](${FESTIVAL_ACCESS_KORAIL_URL})`);
  }
  if (!domains.has('bustago')) {
    links.push(en
      ? `[BUSTAGO](${FESTIVAL_ACCESS_BUSTAGO_URL})`
      : `[버스타고](${FESTIVAL_ACCESS_BUSTAGO_URL})`);
  }
  if (!domains.has('kobus')) {
    links.push(en
      ? `[KOBUS](${FESTIVAL_ACCESS_KOBUS_URL})`
      : `[고속버스](${FESTIVAL_ACCESS_KOBUS_URL})`);
  }
  if (!domains.has('txbus')) {
    links.push(en
      ? `[intercity bus](${FESTIVAL_ACCESS_TXBUS_URL})`
      : `[시외버스](${FESTIVAL_ACCESS_TXBUS_URL})`);
  }
  if (!links.length) return body;
  const footer = en
    ? `\n\nCheck train and bus schedules on ${links.join(', ')}.`
    : `\n\n열차·버스 시각은 ${links.join(', ')}에서 편하게 확인할 수 있어요.`;
  return body ? `${body}${footer}` : footer.trim();
}

const FESTIVAL_ACCESS_STEP_LEAD_RE =
  /^(?:먼저|다음|그다음|그\s*다음|이어서|마지막으로|마지막|KTX|SRT|ITX|무궁화|버스|자가용|택시|광주|나주|용산|서울역)/;

/** Preserve model newlines; insert breaks between route steps when the reply is one block. */
export function ensureFestivalAccessStepLineBreaks(text) {
  let s = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!s) return s;
  if (/\n\n/.test(s)) return s.replace(/\n{3,}/g, '\n\n').trim();
  const lines = s.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 2) return lines.join('\n\n');
  const sentences = s.split(/(?<=[.!?。])\s+/).map((part) => part.trim()).filter(Boolean);
  if (sentences.length < 2) return s;
  const parts = [];
  for (let i = 0; i < sentences.length; i += 1) {
    const sent = sentences[i];
    if (i > 0 && FESTIVAL_ACCESS_STEP_LEAD_RE.test(sent)) parts.push('\n\n');
    else if (i > 0) parts.push(' ');
    parts.push(sent);
  }
  return parts.join('').replace(/\n{3,}/g, '\n\n').trim();
}

const SECTION_CTA_LABELS = [
  '교통 · 티켓',
  '출발 전 준비',
  '플래너 보기',
  '플래너에서 확인',
  '예약 · 정보',
  'Transport · tickets',
  'Before you go',
  'Open planner',
  'Check in planner',
  'Book · info',
];

function ctaLabelList() {
  const titles = [...SECTION_CTA_LABELS];
  for (const bundle of [KO, EN]) {
    for (const chip of Object.values(bundle?.chips || {})) {
      if (chip?.title) titles.push(String(chip.title));
    }
  }
  return titles;
}

function normalizeCta(value) {
  return String(value || '')
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '')
    .replace(/[|｜]/g, ' ')
    .replace(/[·・‧]/g, '·')
    .replace(/#{1,6}/g, ' ')
    .replace(/-{3,}/g, ' ')
    .replace(/[-–—•*]+/g, ' ')
    .replace(/[.!?。]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const CTA_LABELS = ctaLabelList()
  .map((label) => normalizeCta(label))
  .filter((label) => label.length >= 2)
  .sort((a, b) => b.length - a.length);

const SECTION_LABELS = SECTION_CTA_LABELS
  .map((label) => normalizeCta(label))
  .sort((a, b) => b.length - a.length);

function isCtaSequence(raw) {
  let rest = normalizeCta(raw);
  if (!rest) return true;
  while (rest) {
    rest = rest.replace(/^[·\s]+/, '');
    if (!rest) return true;
    const hit = CTA_LABELS.find((label) => rest === label || rest.startsWith(`${label} `) || rest.startsWith(`${label}·`));
    if (!hit) return false;
    rest = rest.slice(hit.length).trim();
  }
  return true;
}

function trailingSectionRegExp(label) {
  const chunks = label.split('·').map((part) => (
    part.trim().split(/\s+/).filter(Boolean).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')
  ));
  const body = chunks.join('\\s*[·・‧]\\s*');
  return new RegExp(`(?:\\s*[-–—•|｜]+\\s*)?${body}\\s*[|｜]?\\s*$`, 'i');
}

function trailingChipLabelSuffixRegExp(normalizedLabel) {
  const segments = String(normalizedLabel || '')
    .split('·')
    .filter(Boolean)
    .map((part) => part.trim().split(/\s+/).filter(Boolean)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('\\s+'));
  if (!segments.length) return null;
  const body = segments.join('\\s*[·・‧]\\s*');
  return new RegExp(
    `(?:[.!?。]\\s*|\\s*[-–—•|｜]+\\s*|\\s+)${body}(?:\\s*[·・‧|｜]\\s*${body})*\\s*[|｜]?\\s*$`,
    'i',
  );
}

function stripTrailingChipLabelSuffix(line) {
  let s = String(line || '').trimEnd();
  if (!s) return '';
  const labels = [...new Set([...SECTION_LABELS, ...CTA_LABELS])].sort((a, b) => b.length - a.length);
  let guard = 0;
  while (guard < 24) {
    guard += 1;
    const prev = s;
    s = s.replace(/[|｜]\s*$/, '').trimEnd();
    if (isCtaSequence(s)) return '';
    for (const label of labels) {
      const re = trailingChipLabelSuffixRegExp(label);
      if (!re) continue;
      s = s.replace(re, '').trimEnd();
    }
    if (s === prev) break;
  }
  return s.trimEnd();
}

const ENTRY_DOC_RE = /입국\s*증빙|입국\s*심사|입국\s*서류|비자\s*서류|여행\s*증빙|예약\s*확인서|숙소\s*예약\s*확인|proof-of-stay|entry document|immigration document/i;
const ENTRY_ASK_RE = /비자|입국|visa|entry|immigration/i;

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function looseUrlKey(url) {
  return String(url || '')
    .trim()
    .replace(/[.,;]+$/g, '')
    .replace(/\/+$/, '')
    .replace(/^https?:\/\//i, '')
    .toLowerCase();
}

function officialHomepageMarkdown(options = {}) {
  const homepage = String(options.homepage || '').trim();
  if (!/^https?:\/\//i.test(homepage)) return '';
  const en = String(options.locale || 'ko').slice(0, 2) === 'en';
  return en ? `[official site](${homepage})` : `[공식 홈페이지](${homepage})`;
}

function sameOfficialUrl(url, homepage) {
  if (!/^https?:\/\//i.test(String(homepage || ''))) return false;
  const key = looseUrlKey(url);
  return Boolean(key) && key === looseUrlKey(homepage);
}

/** Keep festival and lodging links. An official homepage bare URL becomes a markdown link. */
export function stripDisallowedFestivalLinks(text, options = {}) {
  const homepage = String(options.homepage || '').trim();
  const tel = String(options.tel || '').trim();
  const telUrl = /^https?:\/\//i.test(tel) ? tel : '';
  const kept = [];
  const stash = (value) => {
    const token = `\u0000L${kept.length}\u0000`;
    kept.push(value);
    return token;
  };
  const linkedOfficial = (url) => {
    if (sameOfficialUrl(url, homepage)) return officialHomepageMarkdown(options);
    if (telUrl && sameOfficialUrl(url, telUrl)) {
      return officialHomepageMarkdown({ ...options, homepage: telUrl });
    }
    return '';
  };
  const foodUrlKeys = new Set();
  if (isFestivalFoodAsk(options)) {
    for (const row of festivalFoodPlaceEntries(options.nearbyRestaurants, options.locale, 4)) {
      if (row.url) foodUrlKeys.add(looseUrlKey(row.url));
    }
  }
  let next = String(text || '').replace(
    /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
    (full, label, url) => {
      const clean = String(url || '').trim();
      if (foodUrlKeys.has(looseUrlKey(clean))) return stash(full);
      if (OFFICIAL_SITE_LABEL_RE.test(String(label || '').trim()) && !sameOfficialUrl(clean, homepage)) {
        const linked = linkedOfficial(homepage);
        return linked ? stash(linked) : String(label || '').trim();
      }
      if (isAllowedFestivalMarkdownUrl(clean, homepage)) return stash(full);
      const linked = linkedOfficial(clean);
      if (linked) return stash(linked);
      const plain = String(label || '').trim();
      return plain || '';
    },
  );
  next = next.replace(
    /(공식\s*홈페이지|official\s+site)?[ \t]*([(\[（「])?[ \t]*(https?:\/\/[^\s)\]）」]+)([.,;]+)?[ \t]*([)\]）」])?/gi,
    (full, label, _open, url) => {
      const clean = url.replace(/[.,;]+$/, '');
      if (isAllowedFestivalBareUrl(clean)) return full;
      const linked = linkedOfficial(clean);
      if (linked) return linked;
      return label ? String(label).trim() : '';
    },
  );
  next = next.replace(/\u0000L(\d+)\u0000/g, (_full, index) => kept[Number(index)] || '');
  return cleanOrphanLinkConjunctions(next
    .replace(/[(\[（「][ \t]*[)\]）」]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim());
}

const LINK_GLUE_PARTICLES = '(?:과|와|및|이나|나|또는| 또는)';

/** Dangling 조사·접속 after a markdown link was stripped, deduped, or plain-text substituted. */
export function cleanOrphanLinkConjunctions(text) {
  let out = String(text || '');
  for (let pass = 0; pass < 6; pass += 1) {
    const prev = out;
    out = out
      .replace(new RegExp(`\\]\\s*${LINK_GLUE_PARTICLES}\\s*,\\s*(?=\\[)`, 'g'), '] ')
      .replace(new RegExp(`\\]\\s*${LINK_GLUE_PARTICLES}\\s*[,，]?\\s*(?=[,，.!?。\\s]|$)`, 'g'), '] ')
      .replace(new RegExp(`\\]\\s*${LINK_GLUE_PARTICLES}\\s+(?=에서\\b)`, 'g'), ']')
      .replace(new RegExp(`(?:^|[\\s「『(「])${LINK_GLUE_PARTICLES}\\s+(?=에서\\b)`, 'gm'), (lead) => lead || '')
      .replace(new RegExp(`${LINK_GLUE_PARTICLES}\\s+(?=에서\\b)`, 'g'), '')
      .replace(/\s+(?=에서\b)/g, '')
      .replace(new RegExp(`\\s*${LINK_GLUE_PARTICLES}\\s*[,，](?=\\s*[,，.!?。]|\\s*$)`, 'g'), '')
      .replace(new RegExp(`[,，]\\s*${LINK_GLUE_PARTICLES}(?=\\s*[,，.!?。]|\\s*$)`, 'g'), '')
      .replace(new RegExp(`(?:^|[\\s「『(「])${LINK_GLUE_PARTICLES}\\s*[,，]`, 'gm'), (lead) => lead || '')
      .replace(new RegExp(`^${LINK_GLUE_PARTICLES}\\s*[,，]?\\s*`, 'gm'), '')
      .replace(new RegExp(`\\s+${LINK_GLUE_PARTICLES}\\s*$`, 'gm'), '')
      .replace(/[,，]\s*[,，]+/g, ',')
      .replace(/\s+([,.!?。])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ');
    if (out === prev) break;
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

function chipLabelDecoratedLine(line) {
  return String(line || '')
    .replace(/^\s*[*#\-–—•🚆🚌🎫|｜\s]+/g, '')
    .replace(/^\*\*|\*\*$/g, '')
    .trim();
}

function stripCtaLine(line) {
  let s = String(line || '').replace(/\[([^\]\n]+)\](?!\()/g, '');
  if (isCtaSequence(normalizeCta(chipLabelDecoratedLine(s)))) return '';
  s = s.replace(/(^|\s)#{1,6}[ \t]*([^#\n]*)/g, (_full, lead, body) => (
    isCtaSequence(body) ? lead : `${lead}${String(body || '').trim()}`
  ));
  s = s.replace(/-{3,}/g, ' ');
  s = s.replace(/(^|\s)[-–—•](?=\s|$)/g, ' ');
  if (isCtaSequence(s)) return '';
  let guard = 0;
  while (guard < 6) {
    guard += 1;
    const norm = normalizeCta(s);
    const hit = SECTION_LABELS.find((label) => norm.endsWith(label) && (norm === label || /\s/.test(norm.charAt(norm.length - label.length - 1))));
    if (!hit) break;
    const next = s.replace(trailingSectionRegExp(hit), '').trim();
    if (!next || next === s) break;
    s = next;
  }
  if (isCtaSequence(s)) return '';
  s = stripTrailingChipLabelSuffix(s);
  if (isCtaSequence(s)) return '';
  return s.replace(/[ \t]{2,}/g, ' ').replace(/\s+([.!?])/g, '$1').trim();
}

const QUOTED_BARE_LINK_RE = /[「『"][^」』"\n]+[」』"]\s*(?:플래너\s*)?링크[.。]?/g;
const INFO_HEADER_RE = /^(?:[-*]\s*)?(?:\*\*)?(?:축제\s*)?(?:상세\s*안내|기간|날짜|상세|장소|주소|요금|시간|제목|안내)\s*[:：]/;

function lineHasUrl(line) {
  return /https?:\/\/|\[[^\]]+\]\([^)]+\)/.test(line);
}

/** Drop info-card headers and unlinked 「…」 플래너 링크 / 「…」 링크 phrases. */
const SHORT_KO_LABEL_RE = /^([가-힣](?:[가-힣]*[ \t]+)*[가-힣]{0,8})\s*[:：]\s*(.*)$/;

function isCardInfoRest(rest) {
  const text = String(rest || '').replace(/\s+/g, ' ').trim();
  if (!text) return true;
  if (/^\d{1,2}\/\d{1,2}(?:~\d{1,2}(?:\/\d{1,2})?)?[.。]?$/.test(text)) return true;
  if (/^\[[^\]]*(?:상세\s*안내|축제\s*페이지)[^\]]*\]\([^)]+\)[.。]?$/.test(text)) return true;
  return false;
}

/**
 * A line that starts with a short Korean label and a colon keeps the sentence.
 * Card-only values are dropped. Bullet lines such as «* **강릉역 인근**:» stay.
 */
function unwrapFestivalLabelLine(line) {
  const trimmed = String(line || '').trim();
  if (/^[*+-]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed) || /^\*\*/.test(trimmed)) return trimmed;
  const match = trimmed.match(SHORT_KO_LABEL_RE);
  if (!match) return trimmed;
  const label = match[1].replace(/\s+/g, ' ').trim();
  if (!label || label.length > 16 || /[.!?。]/.test(label)) return trimmed;
  const rest = match[2].trim();
  if (isCardInfoRest(rest)) return '';
  return rest;
}

function stripPlannerResidueLine(line) {
  let trimmed = String(line || '').trim();
  if (!trimmed) return '';
  trimmed = unwrapFestivalLabelLine(trimmed);
  if (!trimmed) return '';
  if (INFO_HEADER_RE.test(trimmed)) return '';
  if (lineHasUrl(trimmed)) return trimmed;
  return trimmed.replace(QUOTED_BARE_LINK_RE, '').replace(/[ \t]{2,}/g, ' ').replace(/\s+([.!?。])/g, '$1').trim();
}

/** «- 항목» is the same list as «* 항목». A separator dash between chip names is not. */
function promoteDashListMarkers(text) {
  return String(text || '').replace(/^( *)[-–—] +(?=\S)/gm, '$1* ');
}

/** Festival screens have no planner and no chip sections. Drop those sentences. */
function dropFestivalPlannerSentences(text) {
  const source = String(text || '');
  if (!/플래너|섹션/.test(source)) return source;
  return filterPreservingBreaks(source, (part) => {
    const line = String(part || '').trim();
    if (!line) return false;
    if (/플래너/.test(line)) return true;
    if (/(?:\[[^\]]+\]|「[^」]+」)\s*섹션/.test(line)) return true;
    if (/섹션\s*(?:에서|을|와|과|및)/.test(line)) return true;
    return false;
  });
}

function stripChipLabelSentencesInLine(line) {
  const parts = String(line || '').split(/(?<=[.!?。])\s+/);
  const kept = parts.map((sentence) => {
    let s = String(sentence || '').trim();
    if (!s) return '';
    if (isCtaSequence(normalizeCta(s))) return '';
    s = stripTrailingChipLabelSuffix(s);
    s = stripInlineChipLabelPhrases(s);
    if (!s.trim()) return '';
    if (isCtaSequence(normalizeCta(s))) return '';
    return s;
  }).filter(Boolean);
  return kept.join(' ');
}

function chipLabelInlineRegExp(label) {
  const segments = String(label || '').split(/[·・‧]/).map((seg) => (
    seg.trim().split(/\s+/).filter(Boolean)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('\\s+')
  )).filter(Boolean);
  if (!segments.length) return null;
  const core = segments.join('\\s*[·・‧\\s]+');
  return new RegExp(
    `(?:^|[\\s\\n,，|｜])[*#\\-–—•\\s🚆🚌🎫]*(?:\\*\\*)?${core}(?:\\*\\*)?(?=$|[\\s\\n,，|｜.!?。])`,
    'gi',
  );
}

/** Chip CTA titles anywhere in a line (bullets, bold, emoji, or plain). */
export function stripInlineChipLabelPhrases(text) {
  let s = String(text || '');
  for (const label of SECTION_CTA_LABELS) {
    const re = chipLabelInlineRegExp(label);
    if (!re) continue;
    s = s.replace(re, (match) => (/^\s/.test(match) ? ' ' : ''));
  }
  return s
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.!?。])/g, '$1')
    .replace(/^[|｜·\s]+/g, '')
    .replace(/[|｜·\s]+$/g, '')
    .trim();
}

const BOOKING_LINK_ONLY_LINE_RE = /^\s*(?:[*#\-–—•🚆🚌🎫|｜\s]|(?:\*\*)?)*((?:\[[^\]]+\]\([^)]+\)\s*)+)\s*$/;

/** Drop stray link-only lines when that booking domain already appears above. */
export function stripRedundantBookingLinkOnlyLines(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const kept = [];
  let prior = '';
  let priorProseHasBookingLink = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      kept.push('');
      continue;
    }
    const linkOnly = BOOKING_LINK_ONLY_LINE_RE.test(trimmed)
      || (/\[[^\]]+\]\([^)]+\)/.test(trimmed) && !trimmed.replace(/\[[^\]]+\]\([^)]+\)/g, '').replace(/[*#\-–—•🚆🚌🎫|｜\s]/g, '').trim());
    const lineDomains = festivalAccessBookingDomainsInText(trimmed);
    if (linkOnly && lineDomains.size > 0) {
      if (priorProseHasBookingLink) continue;
      const priorDomains = festivalAccessBookingDomainsInText(prior);
      if ([...lineDomains].every((id) => priorDomains.has(id))) continue;
    }
    if (!linkOnly && lineDomains.size > 0) priorProseHasBookingLink = true;
    kept.push(line);
    prior = `${prior}\n${trimmed}`;
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const TRAILING_BRACKET_CHIP_HEADER_RE =
  /(?:\[\s*(?:교통\s*·\s*티켓|출발\s*전\s*준비|Transport\s*·\s*tickets|Before\s*you\s*go)\s*\]\s*)+$/gi;
const TRAILING_CORNER_BRACKET_CHIP_HEADER_RE =
  /(?:\s*[「『](?:교통\s*·\s*티켓|출발\s*전\s*준비|Transport\s*·\s*tickets|Before\s*you\s*go)[」』]\s*)+$/gi;

function cornerBracketChipHeaderOnly(line) {
  const trimmed = String(line || '').trim();
  const match = trimmed.match(/^[「『]([^」』]+)[」』][.。]?$/);
  if (!match) return false;
  return isCtaSequence(match[1]);
}

/** Trailing `[교통 · 티켓]` / `「출발 전 준비」`-style headers with no body. */
export function stripTrailingBracketChipHeaders(text) {
  let s = String(text || '').trimEnd();
  let guard = 0;
  while (guard < 8) {
    guard += 1;
    const next = s
      .replace(TRAILING_BRACKET_CHIP_HEADER_RE, '')
      .replace(TRAILING_CORNER_BRACKET_CHIP_HEADER_RE, '')
      .trimEnd();
    if (next === s) break;
    s = next;
  }
  return s;
}

/** Chip headings, CTA labels, separator leftovers, and bracket phrases with no URL. */
export function stripMooniUiChipLabels(text) {
  const lines = promoteDashListMarkers(text)
    .replace(/\[([^\]\n]+)\](?!\()/g, '')
    .split('\n')
    .map((line) => {
      if (!line.trim()) return '';
      if (cornerBracketChipHeaderOnly(line)) return '';
      let stripped = stripPlannerResidueLine(stripCtaLine(line));
      stripped = stripInlineChipLabelPhrases(stripped);
      if (!stripped) return '';
      return stripChipLabelSentencesInLine(stripped);
    });
  return stripTrailingBracketChipHeaders(lines.join('\n').replace(/\n{3,}/g, '\n\n').trim());
}

/**
 * @param {string} text
 * @param {{ chipId?: string, userText?: string }} [options]
 */
export function stripDomesticEntryDocLines(text, options = {}) {
  const chip = String(options.chipId || '');
  if (chip === 'visa_docs' || chip === 'festival_overseas_visa') return String(text || '').trim();
  if (ENTRY_ASK_RE.test(String(options.userText || ''))) return String(text || '').trim();
  return filterPreservingBreaks(text, (part) => ENTRY_DOC_RE.test(part));
}

/**
 * 20261015 → October 15, 2026 or 2026년 10월 15일. URLs are left alone.
 * @param {string} text
 * @param {string} [locale]
 */
export function expandCompactDates(text, locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  return String(text || '')
    .split(/(https?:\/\/[^\s)]+)/)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return part.replace(/\b(20\d{2})(\d{2})(\d{2})\b/g, (full, year, month, day) => {
        const m = Number(month);
        const d = Number(day);
        if (m < 1 || m > 12 || d < 1 || d > 31) return full;
        return en ? `${EN_MONTHS[m - 1]} ${d}, ${year}` : `${Number(year)}년 ${m}월 ${d}일`;
      });
    })
    .join('');
}

const COUNTDOWN_CLAUSE_RE = /(?:^|[,，]\s*|\s+)(?:현재\s*)?시작까지\s*\d+\s*일(?:이)?\s*남았(?:어요|습니다|다)?[.。]?/g;
const LONG_SPAN_RE = /(?:\d{4}\s*년\s*)?\d{1,2}\s*월\s*\d{1,2}\s*일\s*부터\s*(?:\d{4}\s*년\s*)?\d{1,2}\s*월\s*\d{1,2}\s*일\s*까지(?:\s*열리(?:며|고))?(?:\s*(?:입니다|이에요|예요|해요))?[.。]?/g;
const LONG_YMD_RE = /\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일/g;
const EN_LONG_DATE_RE = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}\b/g;

function cleanCalendarLine(line) {
  let next = String(line || '')
    .replace(LONG_SPAN_RE, ' ')
    .replace(COUNTDOWN_CLAUSE_RE, ' ')
    .replace(LONG_YMD_RE, ' ')
    .replace(EN_LONG_DATE_RE, ' ');
  next = next.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.])/g, '$1').trim();
  next = next.replace(/^[,，]\s*/, '').replace(/[,，]\s*$/, '').trim();
  if (/^(?:입니다|예요|이에요|해요)[.。]?$/.test(next)) return '';
  if (!next || /^[\s,.。]*$/.test(next)) return '';
  return next;
}

const FORMAL_ENDING_TABLE = [
  ['있습니다', '있어요'],
  ['없습니다', '없어요'],
  ['좋습니다', '좋아요'],
  ['됩니다', '돼요'],
  ['엽니다', '열어요'],
  ['집니다', '져요'],
  ['냅니다', '나요'],
  ['갑니다', '가요'],
  ['립니다', '려요'],
  ['합니다', '해요'],
];

function syllableHasBatchim(ch) {
  const code = String(ch || '').codePointAt(0);
  if (!code || code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/**
 * Sentence-final 합니다체 → 해요체. Only table entries. A bare 습니다/ㅂ니다 stays.
 * 입니다 picks 예요 or 이에요 from the previous syllable's batchim.
 * @param {string} text
 */
export function rewriteFestivalFormalEndings(text) {
  let out = String(text || '');
  out = out.replace(/([가-힣]+)하십시오(?=$|[\s.!?。,，])/g, '$1해요');
  for (const [from, to] of FORMAL_ENDING_TABLE) {
    out = out.replace(new RegExp(`${from}(?=$|[\\s.!?。,，])`, 'g'), to);
  }
  return out.replace(/([가-힣])입니다(?=$|[\s.!?。,，])/g, (full, prev) => (
    syllableHasBatchim(prev) ? `${prev}이에요` : `${prev}예요`
  ));
}

/** Last digit of the number, as read: 0·1·3·6·7·8 and 10·100·1000 take 이에요. 2·4·5·9 take 예요. */
const DIGIT_READS_WITH_BATCHIM = new Set(['0', '1', '3', '6', '7', '8']);

function digitTokenReadsWithBatchim(source, endIndex) {
  let i = endIndex;
  while (i >= 0 && /\d/.test(source.charAt(i))) i -= 1;
  const digits = source.slice(i + 1, endIndex + 1);
  if (!digits) return false;
  return DIGIT_READS_WITH_BATCHIM.has(digits.slice(-1));
}

/**
 * Only the always-wrong «이예요» is rewritten.
 * A model's «이에요» or «예요» stays as written. «자리에요» still becomes «자리예요».
 */
function isFestivalParkingAsk(options = {}) {
  if (/park/i.test(String(options.chipId || ''))) return true;
  return /주차|parking/i.test(String(options.userText || ''));
}

/** Place stems in the festival venue or address that are written as a lot: «천지연 주차장», «천지연폭포 주차장». */
function venueLotStems(options = {}) {
  const stems = [];
  const push = (stem) => {
    const text = String(stem || '').replace(/\s+/g, '').replace(/폭포$/, '');
    if (text.length < 2 || text.length > 12 || stems.includes(text)) return;
    if (/주차장|공영|민영|부설|노상|임시/.test(text)) return;
    stems.push(text);
  };
  const blob = `${options.venue || ''}\n${options.address || ''}`;
  for (const match of blob.matchAll(/([가-힣]{2,12})\s*폭포\s*주차장|([가-힣]{2,12})\s+주차장/g)) {
    push(match[1] || match[2]);
  }
  return stems.sort((a, b) => b.length - a.length);
}

/**
 * A venue lot in a festival answer reads as the place, not as parking.
 * Parking-chip answers keep «주차장». «주차장과» becomes «일대와». «일대 일대» collapses.
 */
function rewriteVenueParkingLotPhrases(text, options = {}) {
  if (isFestivalParkingAsk(options)) return String(text || '');
  const stems = venueLotStems(options);
  let out = String(text || '');
  for (const stem of stems) {
    const body = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `${body}(?:\\s*폭포\\s*주차장|\\s+주차장)(?:\\s*\\(\\s*(?:일대|일원)\\s*\\)|\\s*(?:일대|일원))?`,
      'g',
    );
    out = out.replace(re, `${stem} 일대`);
  }
  return sayJoinedVenueAreaOnce(out
    .replace(/일대\s*일대/g, '일대')
    .replace(/일대과(?![가-힣])/g, '일대와')
    .replace(/일대\s*및\s*/g, '일대와 '));
}

/** «A 일대와 B 일대» says 일대 once: «A와 B 일대». */
function sayJoinedVenueAreaOnce(text) {
  return String(text || '').replace(
    /([가-힣0-9]{2,12})\s*일대\s*(?:와|과)\s*((?:[가-힣0-9]+\s+){0,3}[가-힣0-9]+)\s*일대/g,
    (_, first, second) => {
      const stem = String(second).replace(/\s+/g, ' ').trim();
      const last = [...first].reverse().find((ch) => /[가-힣]/.test(ch)) || '';
      const particle = syllableHasBatchim(last) ? '과' : '와';
      return `${first}${particle} ${stem} 일대`;
    },
  );
}

/** A nearby sight this close to the venue is the venue area, not the next stop. */
const VENUE_AREA_NEAR_KM = 0.3;

function compactPlace(value) {
  return String(value || '').replace(/\s+/g, '');
}

/** «천지연 일대» → 천지연. Also the lot stem in «천지연폭포 주차장». */
function venueAreaTokens(options = {}) {
  const tokens = [];
  const push = (stem) => {
    const text = compactPlace(stem).replace(/폭포$/, '').replace(/(?:일대|일원)$/, '');
    if (text.length < 2 || text.length > 12 || tokens.includes(text)) return;
    if (/주차장|공영|민영|부설|노상|임시/.test(text)) return;
    tokens.push(text);
  };
  const spoken = festivalSpokenVenue(options.venue);
  const area = spoken.match(/^(.+?)\s*(?:일대|일원)\s*$/);
  if (area) push(area[1]);
  for (const stem of venueLotStems(options)) push(stem);
  return tokens.sort((a, b) => b.length - a.length);
}

/**
 * Nearby names whose stem equals the venue-area token are not repeated.
 * Within ~300m, a longer name that starts with that token is the same place.
 * @param {string} name
 * @param {{ venue?: string, address?: string }} [options]
 * @param {number | null} [distKm]
 */
export function nearbyRepeatsVenueArea(name, options = {}, distKm = null) {
  const tokens = venueAreaTokens(options);
  const raw = compactPlace(name);
  if (!raw || !tokens.length) return false;
  const stem = raw.replace(/폭포$/, '').replace(/(?:일대|일원)$/, '');
  const km = Number(distKm);
  const near = Number.isFinite(km) && km <= VENUE_AREA_NEAR_KM;
  return tokens.some((token) => {
    if (!token || stem === token) return Boolean(token) && stem === token;
    if (!near) return false;
    return raw.startsWith(token) && raw.length > token.length;
  });
}

function nearbyNameOf(raw) {
  if (raw && typeof raw === 'object') return String(raw.name || '').trim();
  return String(raw || '').trim();
}

/** Drop venue-area repeats before the nearby list is capped for the first answer. */
export function filterVenueAreaNearbyNames(values, options = {}) {
  const out = [];
  for (const raw of Array.isArray(values) ? values : []) {
    const name = nearbyNameOf(raw);
    if (!name || out.includes(name)) continue;
    const distKm = raw && typeof raw === 'object' ? Number(raw.distKm) : NaN;
    if (nearbyRepeatsVenueArea(name, options, Number.isFinite(distKm) ? distKm : null)) continue;
    out.push(name);
  }
  return out;
}

function splitKoreanPlaceList(body) {
  return String(body || '')
    .replace(/\s*(?:을|를)\s*$/, '')
    .split(/\s*,\s*|\s+그리고\s+|(?<=[가-힣])(?:와|과)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function objectParticle(name) {
  const compact = compactPlace(name);
  const last = compact.slice(-1);
  return syllableHasBatchim(last) ? '을' : '를';
}

function rewriteNearbyVenueRepeatSentence(sentence, options, pool) {
  const patterns = [
    /^(.*?(?:근처에서는|근처)\s+)(.+?)(\s*(?:을|를)\s*둘러볼 수 있어요[.]?)$/,
    /^(.*?)(.+?)((?:이|가)\s*근처에 있어요[.]?)$/,
  ];
  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (!match) continue;
    const items = splitKoreanPlaceList(match[2]);
    if (items.length < 1) continue;
    const kept = items.filter((item) => !nearbyRepeatsVenueArea(item, options));
    if (kept.length === items.length) continue;
    for (const name of pool) {
      if (kept.includes(name)) continue;
      kept.push(name);
      if (kept.length >= 3) break;
    }
    if (!kept.length) return sentence;
    if (pattern === patterns[0]) {
      return `${match[1]}${kept.join(', ')}${objectParticle(kept[kept.length - 1])} 둘러볼 수 있어요.`;
    }
    const last = kept[kept.length - 1];
    const particle = syllableHasBatchim(compactPlace(last).slice(-1)) ? '이' : '가';
    return `${match[1]}${kept.join(', ')}${particle} 근처에 있어요.`;
  }
  return sentence;
}

/**
 * If the model still names the venue as a nearby stop, the next place leads the list.
 * «천지연 일대에서» stays. Parking answers stay.
 */
function stripVenueAreaNearbyRepeat(text, options = {}) {
  if (isFestivalParkingAsk(options)) return String(text || '');
  if (!venueAreaTokens(options).length) return String(text || '');
  const pool = filterVenueAreaNearbyNames(options.nearbyPlaces, options);
  const parts = String(text || '').split(/(?<=[.!?。])\s+/);
  return parts.map((sentence) => {
    if (!/근처|둘러볼/.test(sentence)) return sentence;
    return rewriteNearbyVenueRepeatSentence(sentence, options, pool);
  }).filter(Boolean).join(' ');
}

const LIST_NOUN = '[가-힣A-Za-z0-9·]{2,18}(?:\\s+[가-힣A-Za-z0-9·]{1,18}){0,2}';
const WA_GEURIGO_LIST_RE = new RegExp(
  `(${LIST_NOUN})(와|과)\\s+(${LIST_NOUN})\\s+그리고\\s+(${LIST_NOUN})`,
  'g',
);

function peelListTail(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/^(.*?)(에서|으로|부터|까지|을|를|은|는|도)$/);
  if (!match || match[1].length < 2) return { noun: trimmed, tail: '' };
  return { noun: match[1], tail: match[2] };
}

/** A place-name chunk. Verbs and clause starters stay out of the list rewrite. */
function isSafeListNoun(text) {
  const noun = String(text || '').trim();
  if (noun.length < 2 || noun.length > 24) return false;
  if (/[,.!?。]|그리고|에는|이면|해요|예요|이에요|습니다|입니다|아요|어요|죠|까요|열리|만나|시작/.test(noun)) {
    return false;
  }
  if (/(?:에서|으로|부터|까지|에는)$/.test(noun)) return false;
  return /[가-힣]/.test(noun);
}

/**
 * «A와 B 그리고 C» (no comma) → «A와 B, C».
 * A comma already in the list, or «그리고» opening a new clause, is left as written.
 */
function polishWaAndGeurigoList(text) {
  return String(text || '').replace(WA_GEURIGO_LIST_RE, (full, left, particle, mid, right) => {
    const tail = peelListTail(right);
    if (!isSafeListNoun(left) || !isSafeListNoun(mid) || !isSafeListNoun(tail.noun)) return full;
    if (/에는|이면/.test(right)) return full;
    return `${left}${particle} ${mid}, ${tail.noun}${tail.tail}`;
  });
}

function fixNoBatchimEyeyo(text) {
  const fixed = String(text || '').replace(/이예요/g, (full, offset, source) => {
    let i = offset - 1;
    while (i >= 0 && /\s/.test(source.charAt(i))) i -= 1;
    const prev = source.charAt(i);
    if (/\d/.test(prev)) return digitTokenReadsWithBatchim(source, i) ? '이에요' : '예요';
    if (/[가-힣]/.test(prev)) return syllableHasBatchim(prev) ? '이에요' : '예요';
    return '예요';
  });
  return fixed.replace(/([가-힣])에요(?=$|[\s.!?。,，])/g, (full, prev) => {
    if (prev === '이' || syllableHasBatchim(prev)) return full;
    return `${prev}예요`;
  });
}

/** Fast food and national chains. Locals and markets stay ahead of these. */
export const FESTIVAL_CHAIN_RE =
  /맥도날드|롯데리아|버거킹|버거\s*킹|맘스터치|스타벅스|파리바게뜨|배스킨라빈스|베스킨라빈스|케이에프씨|서브웨이|도미노피자|도미노\s*피자|피자헛|미스터피자|던킨|mcdonald|lotteria|burger\s*king|mom'?s\s*touch|starbucks|paris\s*baguette|baskin|\bkfc\b/i;

export function isFestivalChainRestaurant(name) {
  return FESTIVAL_CHAIN_RE.test(String(name || ''));
}

/** Markets, then other local names, then chains. Chains drop off once six locals exist. */
export function rankFestivalRestaurantRows(values, limit = 6) {
  const markets = [];
  const locals = [];
  const chains = [];
  const seen = new Set();
  for (const raw of Array.isArray(values) ? values : []) {
    const name = String(raw?.name || raw || '').replace(/\s+/g, ' ').trim();
    if (!name || NON_RESTAURANT_PLACE_RE.test(name) || seen.has(name)) continue;
    seen.add(name);
    const distKm = Number(raw?.distKm);
    const locality = String(raw?.locality || '').replace(/\s+/g, ' ').trim();
    const addr1 = String(raw?.addr1 || '').replace(/\s+/g, ' ').trim();
    const cat3 = String(raw?.cat3 || '').trim();
    const homepage = String(raw?.url || raw?.homepage || '').trim();
    const row = {
      name,
      distKm: Number.isFinite(distKm) ? distKm : null,
      locality,
      addr1,
      cat3,
      url: /^https?:\/\//i.test(homepage) ? homepage : '',
    };
    if (isFestivalChainRestaurant(name)) chains.push(row);
    else if (/시장/.test(name)) markets.push(row);
    else locals.push(row);
  }
  const localCount = markets.length + locals.length;
  const ranked = localCount >= limit
    ? [...markets, ...locals]
    : [...markets, ...locals, ...chains];
  return ranked.slice(0, limit);
}

export function rankFestivalRestaurants(values, limit = 6) {
  return rankFestivalRestaurantRows(values, limit).map((row) => row.name);
}

const FESTIVAL_STAY_RADIUS_KM = 20;

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function festivalHubKm(label, lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const hub = resolveCityAttractionHub(label);
  const hLat = Number(hub?.lat);
  const hLng = Number(hub?.lng);
  if (!hub || !Number.isFinite(hLat) || !Number.isFinite(hLng)) return null;
  return haversineKm(lat, lng, hLat, hLng);
}

/** A resolved city hub farther than ~20 km. Neighborhood strings with no hub stay. */
export function festivalStayLabelIsDistant(label, lat, lng) {
  const km = festivalHubKm(label, lat, lng);
  return km != null && km > FESTIVAL_STAY_RADIUS_KM;
}

export function filterFestivalStayAreaNames(values, lat, lng, limit = 3) {
  const names = [];
  for (const raw of Array.isArray(values) ? values : []) {
    const text = String(raw?.name || raw || '').replace(/\s*(?:일원|일대|부근)$/g, '').replace(/\s+/g, ' ').trim();
    if (!text || names.includes(text)) continue;
    if (festivalStayLabelIsDistant(raw?.hubId || text, lat, lng)) continue;
    if (raw?.hubId && festivalStayLabelIsDistant(text, lat, lng)) continue;
    names.push(text);
    if (names.length >= limit) break;
  }
  return names;
}

const NON_RESTAURANT_PLACE_RE = /사우나|찜질|목욕|복지|노인회|생활문화|주민센터|경로당|행정복지|노인정|마을회관|주민자치|터널/;
const FESTIVAL_FOOD_ASK_RE = /먹을\s*곳|맛집|뭐\s*먹|어디서\s*먹|where\s+to\s+eat|what\s+(?:can|should)\s+i\s+eat|\brestaurants?\b/i;
const FESTIVAL_PAGE_URL = 'https:\\/\\/www\\.gateo\\.kr\\/korea\\/\\?festival=\\d+';

export function isFestivalFoodAsk(input = {}) {
  if (String(input.chipId || '') === 'festival_nearby') return true;
  return FESTIVAL_FOOD_ASK_RE.test(String(input.userText || ''));
}

const FESTIVAL_SIGHTS_ASK_RE = /볼\s*거리|분위기|볼\s*수\s*있|what\s+to\s+see|on[- ]site\s+atmosphere/i;

export function isFestivalSightsAsk(input = {}) {
  if (String(input.chipId || '') === 'festival_sights') return true;
  if (isFestivalFoodAsk(input)) return false;
  return FESTIVAL_SIGHTS_ASK_RE.test(String(input.userText || ''));
}

export function isFestivalAccessAsk(input = {}) {
  if (String(input.chipId || '') === 'festival_access') return true;
  return festivalAccessAskIsRoute(String(input.userText || ''));
}

/** Access polish (행사 기간·booking footer) only when a Korea festival is bound in chat. */
function isBoundFestivalAccessPolish(options = {}) {
  if (!isFestivalAccessAsk(options)) return false;
  return Boolean(
    String(options.contentId || '').trim()
    || String(options.festivalTitle || '').trim(),
  );
}

function festivalTransportHasTagoRows(transport) {
  for (const origin of transport?.origins || []) {
    for (const segment of origin.segments || []) {
      if ((segment.rows || []).length > 0) return true;
    }
  }
  return false;
}

const GUKHYANG_FESTIVAL_ID = '638576';
const CAPITAL_ORIGIN_IDS = new Set(['seoul', 'incheon', 'gyeonggi']);

function festivalOriginTransportRows(transport, originRow) {
  const needle = String(originRow?.ko || '').trim();
  if (!needle) return [];
  const out = [];
  for (const origin of transport?.origins || []) {
    const label = String(origin.label || '').trim();
    if (label !== needle && !label.includes(needle) && !needle.includes(label)) continue;
    for (const segment of origin.segments || []) {
      if ((segment.rows || []).length > 0) out.push(segment);
    }
  }
  return out;
}

function originHasVerifiedRailToGwangjuSongjeong(transport, originRow) {
  for (const segment of festivalOriginTransportRows(transport, originRow)) {
    if (segment.transfer) continue;
    if (/광주송정/.test(String(segment.arr || '')) && (segment.rows || []).length > 0) return true;
  }
  return false;
}

/** 국향대전 — non-capital origins without TAGO direct rail to 광주송정: bus-first chip hint. */
function formatGukhyangAccessOriginGuidance(originRow, transport, locale = 'ko') {
  if (!originRow || CAPITAL_ORIGIN_IDS.has(originRow.id)) return '';
  if (originHasVerifiedRailToGwangjuSongjeong(transport, originRow)) return '';
  const en = String(locale || '').slice(0, 2) === 'en';
  const place = en ? originRow.en : originRow.ko;
  const busTerminals = originRow.id === 'daegu'
    ? (en ? 'Daegu Express Bus Terminal (Seobu and Dongdaegu)' : '대구고속버스터미널(서부·동대구)')
    : (en ? (originRow.busEn || '') : (originRow.busKo || ''));
  if (en) {
    return `Readers leave from ${place} using only this answer — pick routes that really run. If there is no confirmed direct train to Gwangju Songjeong, say so honestly, then lead with express or intercity bus from ${busTerminals} to Gwangju, then Gwangju to Hampyeong and the venue, plus driving. Do not open with Dongdaegu KTX or SRT straight to Gwangju Songjeong.`;
  }
  const gwangjuBusHub = en ? 'Gwangju U-Square' : '광주(유·스퀘어)';
  const daeguBusFirst = originRow.id === 'daegu'
    ? (en
      ? `Lead with express or intercity bus from ${busTerminals} to ${gwangjuBusHub}, then a Hampyeong-bound bus toward the venue — like the Incheon answer pattern. Only after that, mention Dongdaegu KTX/SRT via Gwangju Songjeong as a secondary option if it really runs.`
      : `인천 답변처럼 ${busTerminals}→${gwangjuBusHub} 고속·시외버스를 먼저 쓰고, 유·스퀘어에서 함평공용버스터미널행 버스로 이어 택시·시내버스 10~20분이면 축제장이에요. 열차는 «광주송정역에서 함평역 방면으로 갈아타야 해요»처럼 광주송정 환승만 짧게 넣어 주세요. «함평역으로 이동하여 기차» 같은 문장은 넣지 마세요.`)
    : (en
      ? `Then bus from ${busTerminals} to Gwangju and on to Hampyeong and the venue.`
      : `${busTerminals}에서 광주 고속·시외버스 → 광주에서 함평행 버스 → 축제장 순으로 먼저 안내해 주세요.`);
  return `사용자는 ${place}에서 이 안내만 보고 출발해요. 실제로 운행하는 노선만 골라 안내해 주세요. TAGO·카드에 확인된 ${place}→광주송정 직통 열차가 없으면 «확인된 직통 열차는 없어요»라고 말하고, ${daeguBusFirst} 자가용도 함께 넣어 주세요.`;
}

const GANGNEUNG_FESTIVAL_ID = '2930716';
const PALACE_FESTIVAL_ID = '1998564';

const FESTIVAL_ACCESS_TRANSIT_GROUNDING = {
  [PALACE_FESTIVAL_ID]: {
    ko: '궁중문화축전 권역(경복궁·창덕궁 등) 가까운 지하철역: 3호선 안국역·경복궁역. 서울역에는 3호선이 없어요.',
    en: 'Nearest subway for the palace venues: Line 3 Anguk or Gyeongbokgung. Line 3 does not serve Seoul Station.',
  },
  [GANGNEUNG_FESTIVAL_ID]: {
    ko: '강릉 국수 축제 권역은 강릉역(KTX)이 가장 가까운 장거리 역이에요. 서울역·청량리에서 KTX(강릉선)로 강릉역까지 가는 편이 있어요.',
    en: 'Gangneung Station (KTX on the Gangneung line) is the main rail stop. From Seoul Station or Cheongnyangni, KTX serves Gangneung.',
  },
};

function festivalAccessTransitGroundingLine(ctx, locale = 'ko') {
  const id = String(ctx?.contentId || '').trim();
  const row = FESTIVAL_ACCESS_TRANSIT_GROUNDING[id];
  if (!row) return '';
  const en = String(locale || '').slice(0, 2) === 'en';
  return en ? row.en : row.ko;
}

const PALACE_ACCESS_CANONICAL_LINE3_SENTENCE =
  '서울역에서 지하철 1호선을 타고 종로3가역에서 3호선으로 갈아타면 안국역·경복궁역에 내릴 수 있어요.';

const PALACE_ACCESS_CANONICAL_LINE3_RE =
  /서울역에서\s*지하철\s*1호선을\s*타고\s*종로3가역에서\s*3호선으로\s*갈아타면\s*안국역·경복궁역에\s*내릴\s*수\s*있어요/;

function palaceAccessTextHasCanonicalLine3Sentence(text) {
  return PALACE_ACCESS_CANONICAL_LINE3_RE.test(String(text || ''));
}

function palaceAccessSentenceAlreadyHasJongno3gaTransfer(sentence) {
  return /종로\s*3\s*가|종로3가역에서\s*3\s*호선으로\s*갈아타/.test(String(sentence || ''));
}

function palaceAccessSentenceIsKtxThenYongsanLine3(sentence) {
  const t = String(sentence || '');
  return /서울역에서\s*(?:KTX|SRT|ITX|무궁화)/.test(t)
    && /용산역/.test(t)
    && /3\s*호선/.test(t);
}

function palaceAccessSentenceImpliesLine3AtHubWithoutJongno3ga(sentence) {
  const t = String(sentence || '');
  if (!/3\s*호선/.test(t)) return false;
  if (!/(?:서울역|용산역)/.test(t)) return false;
  if (palaceAccessSentenceAlreadyHasJongno3gaTransfer(t)) return false;
  if (palaceAccessSentenceIsKtxThenYongsanLine3(t)) return false;
  if (/서울역에서\s*(?:지하철\s*)?3\s*호선/.test(t)) return true;
  const hubIdx = Math.min(
    t.includes('서울역') ? t.indexOf('서울역') : Number.POSITIVE_INFINITY,
    t.includes('용산역') ? t.indexOf('용산역') : Number.POSITIVE_INFINITY,
  );
  const line3Idx = t.search(/3\s*호선/);
  return hubIdx < Number.POSITIVE_INFINITY && line3Idx > hubIdx;
}

function palaceAccessSentenceRestatesHubLine3Route(sentence) {
  const t = String(sentence || '');
  if (PALACE_ACCESS_CANONICAL_LINE3_RE.test(t)) return false;
  if (!/3\s*호선/.test(t)) return false;
  if (!/(?:안국역|경복궁역)/.test(t)) return false;
  if (!/(?:서울역|용산역|거기서)/.test(t)) return false;
  return true;
}

function palaceAccessSentenceIsLine3Disclaimer(sentence) {
  return /직접\s*연결되지\s*않|서울역에는\s*3\s*호선이\s*없/.test(String(sentence || ''));
}

function palaceAccessSentenceDropForLine3Net(sentence) {
  if (palaceAccessSentenceIsKtxThenYongsanLine3(sentence)) return false;
  if (palaceAccessSentenceImpliesLine3AtHubWithoutJongno3ga(sentence)) return true;
  if (palaceAccessSentenceRestatesHubLine3Route(sentence)) return true;
  if (palaceAccessSentenceIsLine3Disclaimer(sentence)) return true;
  return false;
}

function palaceAccessSentenceDropMangledFragment(sentence) {
  return /가까워요에서/.test(String(sentence || ''));
}

function palaceAccessSentenceIsVagueLine3Orphan(sentence) {
  const t = String(sentence || '');
  if (!/\d\s*호선/.test(t)) return false;
  if (/(?:종로\s*3\s*가|안국역|경복궁역)/.test(t)) return false;
  return /(?:까지\s*이동|하차하는\s*경로|가장\s*편리|환승하여\s*하차)/.test(t);
}

function palaceAccessTextHasNamedPalaceStationRoute(text) {
  const t = String(text || '');
  if (palaceAccessTextHasCanonicalLine3Sentence(t)) return true;
  if (!/\d\s*호선/.test(t)) return false;
  return /(?:종로\s*3\s*가|안국역|경복궁역)/.test(t);
}

function ensurePalaceAccessCanonicalSubwayRoute(text, options = {}) {
  if (String(options.contentId || '').trim() !== PALACE_FESTIVAL_ID) return String(text || '');
  const source = String(text || '').trim();
  const hasCanonical = palaceAccessTextHasCanonicalLine3Sentence(source);
  const needsCanonical = !palaceAccessTextHasNamedPalaceStationRoute(source);
  const paragraphs = source ? source.split(/\n{2,}/) : [];
  const cleaned = paragraphs.map((paragraph) => {
    const sentences = paragraph
      .split(/(?<=[.!?。])\s+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((sentence) => !palaceAccessSentenceIsVagueLine3Orphan(sentence));
    return sentences.join(' ');
  }).filter((paragraph) => paragraph.trim());
  if (!needsCanonical) {
    return collapseHorizontalWhitespace(cleaned.join('\n\n').trim());
  }
  if (!hasCanonical) {
    if (cleaned.length) {
      cleaned[0] = `${PALACE_ACCESS_CANONICAL_LINE3_SENTENCE} ${cleaned[0]}`.trim();
    } else {
      cleaned.push(PALACE_ACCESS_CANONICAL_LINE3_SENTENCE);
    }
  }
  return collapseHorizontalWhitespace(cleaned.join('\n\n').trim());
}

function rewriteImpossibleSeoulStationLine3Access(text, options = {}) {
  if (String(options.contentId || '').trim() !== PALACE_FESTIVAL_ID) return String(text || '');
  const source = String(text || '');
  const hasCanonical = palaceAccessTextHasCanonicalLine3Sentence(source);
  const paragraphs = source.split(/\n{2,}/);
  const fixed = paragraphs.map((paragraph) => {
    const sentences = paragraph
      .split(/(?<=[.!?。])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    const line3DropFlags = sentences.map((sentence) => palaceAccessSentenceDropForLine3Net(sentence));
    const mangledDropFlags = sentences.map((sentence) => palaceAccessSentenceDropMangledFragment(sentence));
    if (!line3DropFlags.some(Boolean) && !mangledDropFlags.some(Boolean)) {
      return sentences.join(' ');
    }
    const kept = [];
    let insertAt = null;
    sentences.forEach((sentence, idx) => {
      if (line3DropFlags[idx] || mangledDropFlags[idx]) {
        if (line3DropFlags[idx] && insertAt === null) insertAt = kept.length;
        return;
      }
      kept.push(sentence);
    });
    if (line3DropFlags.some(Boolean) && !hasCanonical) {
      kept.splice(insertAt ?? 0, 0, PALACE_ACCESS_CANONICAL_LINE3_SENTENCE);
    }
    return kept.join(' ');
  });
  return ensurePalaceAccessCanonicalSubwayRoute(
    collapseHorizontalWhitespace(fixed.join('\n\n').trim()),
    options,
  );
}

/** 인천역 KTX는 미개통 — access 답에서 인천역 KTX 출발 표기를 서울역으로 교정한다. */
export function rewriteFalseIncheonStationKtxAccess(text, options = {}) {
  if (!isFestivalAccessAsk(options) && !isBoundFestivalAccessPolish(options)) return String(text || '');
  const ask = String(options.userText || '');
  if (/인천\s*공항|인천국제공항|incheon airport/i.test(ask)) return String(text || '');
  let s = String(text || '');
  s = s.replace(/인천역이나\s*서울역에서/g, '서울역에서');
  s = s.replace(/인천역(?:이나|에서)\s*(?=(?:KTX|SRT|ITX|열차|기차))/g, '서울역에서 ');
  s = s.replace(/서울역에서\s*서울역에서/g, '서울역에서');
  return collapseHorizontalWhitespace(s).trim();
}

const GANGNEUNG_SEOUL_RAIL_KO =
  '서울역·청량리에서 KTX로 강릉역까지 가는 열차가 있어요.';

/** 강릉선에는 ITX-이음이 없음 — access 답에서 ITX 표기를 제거·교정한다. */
export function stripGangneungAccessItxMentions(text, options = {}) {
  if (String(options.contentId || '').trim() !== GANGNEUNG_FESTIVAL_ID) return String(text || '');
  if (!isFestivalAccessAsk(options) && !isBoundFestivalAccessPolish(options)) return String(text || '');
  const out = String(text || '')
    .replace(/KTX·ITX-이음/g, 'KTX')
    .replace(/ITX-이음/g, 'KTX-이음')
    .replace(/KTX·KTX-이음/g, 'KTX·KTX-이음')
    .replace(/강릉역\s*\(\s*KTX·ITX\s*\)/g, '강릉역(KTX)')
    .replace(/ITX(?:-새마을)?(?:으로|로)?\s*강릉/g, 'KTX로 강릉')
    .replace(/\bITX\b/g, 'KTX')
    .replace(/KTX·KTX/g, 'KTX');
  return collapseHorizontalWhitespace(out).trim();
}

function ensureGangneungSeoulAccessKtxMention(text, options = {}) {
  if (String(options.contentId || '').trim() !== GANGNEUNG_FESTIVAL_ID) return String(text || '');
  if (!isBoundFestivalAccessPolish(options)) return String(text || '');
  const origin = String(options.departureOriginId || '').trim();
  const ask = String(options.userText || '');
  const fromSeoul = origin === 'seoul' || /서울|청량리|수도권/.test(ask);
  if (!fromSeoul) return String(text || '');
  if (/강릉역|KTX/.test(text)) return String(text || '');
  return `${GANGNEUNG_SEOUL_RAIL_KO} ${String(text || '').trim()}`.trim();
}

/** 강릉 국수 축제 — avoid vague «환승 경로»; bus-first from non-capital when TAGO supports it. */
function formatGangneungAccessOriginGuidance(originRow, transport, locale = 'ko') {
  if (!originRow || String(originRow.id || '') !== 'daegu') return '';
  const en = String(locale || '').slice(0, 2) === 'en';
  const tagoLead = composeFestivalAccessReply(transport, {
    locale,
    useSelected: false,
    stations: en ? 'Dongdaegu Station' : '동대구역',
  });
  const tagoHint = tagoLead
    ? (en
      ? `Confirmed TAGO rows for this departure (quote only these times and fares in the answer): ${tagoLead.replace(/\n/g, ' ')}`
      : `이 출발지 TAGO·카드 확인 구간(아래 시각·요금만 인용): ${tagoLead.replace(/\n/g, ' ')}`)
    : (en
      ? 'No confirmed TAGO rows — skip «no data» disclaimers. Lead with Daegu Express Bus Terminal to Gangneung Express Bus Terminal; point times and fares to the booking links below. Name transfer stations only when TAGO shows them. '
      : 'TAGO·카드에 시각이 없어도 «데이터/정보 없음» 문장은 쓰지 말고, 대구고속버스터미널→강릉고속버스터미널 고속버스를 먼저 쓰고 시각·요금은 아래 버스타고·고속버스 링크로 안내해 주세요. 열차는 확인된 환승 역·편명만 짧게 덧붙여 주세요.');
  return en
    ? `Readers leave using only this answer — give a route they can take now and where to book. ${tagoHint}`
    : `여행자는 이 답만 보고 출발해요. 바로 탈 수 있는 경로와 예매처를 짧게 알려 주세요. ${tagoHint}`;
}

const FALSE_DONGDAEGU_GWANGJU_SONGJEONG_DIRECT_RE =
  /동대구(?:역)?에서\s+(?:(?:KTX|SRT)(?:나\s+|·|와\s+)?(?:SRT|KTX)?\s*)?(?:을|를)?\s*(?:타고\s*)?광주송정/;

function rewriteFalseDongdaeguGwangjuSongjeongLead(text, options = {}) {
  if (String(options.contentId || '').trim() !== GUKHYANG_FESTIVAL_ID) return String(text || '');
  if (!FALSE_DONGDAEGU_GWANGJU_SONGJEONG_DIRECT_RE.test(text)) return String(text || '');
  return String(text || '').replace(
    FALSE_DONGDAEGU_GWANGJU_SONGJEONG_DIRECT_RE,
    '확인된 동대구→광주송정 직통 열차는 없어요. 대구고속버스터미널(서부·동대구)에서 광주(유·스퀘어)까지 고속·시외버스를 타고, 광주에서 함평행 버스로 이어 가면 돼요',
  );
}

const GUKHYANG_DAEGU_BUS_LEAD_KO =
  '동대구·서부정류장에서 광주 유·스퀘어로 가는 버스를 타고, 함평공용버스터미널행 버스로 갈아타는 길이 가장 편해요.';

const GUKHYANG_DAEGU_RAIL_SECONDARY_KO =
  '열차로 가시려면 광주송정역에서 함평역 방면 열차로 갈아타야 해요.';

const GANGNEUNG_DAEGU_RAIL_KO =
  '열차로 가시려면 동대구역에서 서울역·청량리역으로 가서 KTX-이음으로 환승해 강릉역까지 가는 편이 있어요.';

/** Named hub in transfer copy — vague «환승을 거쳐» without these is dropped or rewritten. */
const ACCESS_NAMED_INTERMEDIATE_TRANSFER_RE =
  /(?:서울역|용산역|청량리역|대전역|오송역|천안아산역|김천구미역|수원역|평택역|전주역|나주역|순천역|광주역|정읍역|익산역|광주송정역|동대구역|강릉역|KTX|SRT|KTX-이음|대전|오송|천안|김천)/;

const ACCESS_VAGUE_HWANSUNG_SENTENCE_RE =
  /[^.!?。]*환승을\s*거쳐[^.!?。]*[.。]\s*/g;

const GUKHYANG_ACCESS_INTRO_SENTENCE_RE =
  /[^.!?。]*이동하는\s*방법이에요[^.!?。]*[.。]/;

function accessSentenceHasConcreteTransferPath(sentence) {
  const t = String(sentence || '');
  if (!/환승을\s*거쳐/.test(t)) return true;
  return /서울역·청량리역|KTX-이음|무궁화|ITX|SRT|KTX/.test(t);
}

function rewriteVagueAccessTransferWithoutNamedStation(text, options = {}) {
  const festId = String(options.contentId || '').trim();
  if (festId !== GUKHYANG_FESTIVAL_ID && festId !== GANGNEUNG_FESTIVAL_ID) return String(text || '');
  if (String(options.departureOriginId || '') !== 'daegu') return String(text || '');
  let out = String(text || '');
  out = out.replace(ACCESS_VAGUE_HWANSUNG_SENTENCE_RE, (sentence) =>
    accessSentenceHasConcreteTransferPath(sentence) ? sentence : '',
  );
  if (festId === GUKHYANG_FESTIVAL_ID) {
    out = out.replace(
      /열차는[^.!?。]*(?:직통|확인된)[^.!?。]*(?:환승을\s*거쳐|광주송정)[^.!?。]*[.。]\s*/g,
      '',
    );
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

function rewriteVagueGukhyangTransferWithoutNamedStation(text, options = {}) {
  return rewriteVagueAccessTransferWithoutNamedStation(text, options);
}

function rewriteGukhyangDaeguAccessBusRailOrder(text, options = {}) {
  if (String(options.contentId || '').trim() !== GUKHYANG_FESTIVAL_ID) return String(text || '');
  if (String(options.departureOriginId || '') !== 'daegu') return String(text || '');
  let out = String(text || '');
  out = out.replace(/[^.!?。]*함평역으로\s*이동하여\s*기차[^.!?。]*[.。]\s*/g, '');
  out = out.replace(
    /광주\s*도착\s*후에는[^.!?。]*(?:함평역으로\s*이동|기차를\s*이용)[^.!?。]*[.。]\s*/g,
    '',
  );
  out = out.replace(
    /함평행\s*버스로\s*함평역에서\s*축제장까지는\s*/g,
    '함평공용버스터미널 쪽에서 택시·시내버스로 약 10~20분이면 ',
  );
  out = out.replace(
    /열차를\s*이용할\s*경우[^.!?。]*직통[^.!?。]*[.。]\s*/g,
    `확인된 대구→광주송정 직통 열차는 없어요. ${GUKHYANG_DAEGU_RAIL_SECONDARY_KO} `,
  );
  out = out.replace(
    /확인된\s*동대구→광주송정\s*직통\s*열차는\s*없어요\.\s*대구고속버스터미널[^.!?。]*이어\s*가면\s*돼요\.?\s*/g,
    '',
  );
  if (/직통\s*열차는\s*없어요/.test(out) && !/광주송정역에서/.test(out)) {
    out = out.replace(
      /(확인된\s*대구→광주송정\s*직통\s*열차는\s*없어요\.?)/,
      `$1 ${GUKHYANG_DAEGU_RAIL_SECONDARY_KO}`,
    );
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

function ensureGukhyangFestivalTelPeriod(text, options = {}) {
  if (String(options.contentId || '').trim() !== GUKHYANG_FESTIVAL_ID) return String(text || '');
  if (!isBoundFestivalAccessPolish(options)) return String(text || '');
  return String(text || '')
    .replace(/(061-320-2247)(?!\s*[.。])/g, '$1.')
    .replace(/061-320-2247\.{2,}/g, '061-320-2247.');
}

const GANGNEUNG_DAEGU_BUS_BOOKING_LEAD_KO =
  '대구고속버스터미널에서 강릉고속버스터미널로 가는 고속버스가 가장 편해요. 시간과 요금은 아래 버스타고·고속버스에서 바로 볼 수 있어요.';

const GANGNEUNG_ACCESS_NOISE_SENTENCE_RE =
  /(?:데이터|정보가\s*없|준비되어\s*있지\s*않|제공되지\s*않|등록되어\s*있지|확인된\s*정보가\s*없|터미널\s*예매\s*시스템)/;

function gangneungAccessSentenceIsTravelerNoise(sentence) {
  const t = String(sentence || '').trim();
  if (!t) return true;
  if (!GANGNEUNG_ACCESS_NOISE_SENTENCE_RE.test(t)) return false;
  if (/버스타고·고속버스에서\s*바로\s*볼\s*수\s*있어요/.test(t)) return false;
  return true;
}

function splitAccessPolishSentences(text) {
  return String(text || '')
    .split(/(?<=[.!?。])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeAccessPolishSentence(sentence) {
  return String(sentence || '').replace(/\s+/g, ' ').trim();
}

function dedupeExactAccessSentences(text) {
  const seen = new Set();
  const kept = [];
  for (const sentence of splitAccessPolishSentences(text)) {
    const key = normalizeAccessPolishSentence(sentence);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push(sentence);
  }
  return kept.join(' ').replace(/\s{2,}/g, ' ').trim();
}

function accessSentenceMeaningKey(sentence) {
  return normalizeAccessPolishSentence(sentence)
    .replace(/[.。!?]/g, '')
    .replace(/\s+/g, '')
    .replace(/(합니다|해요|돼요|됩니다|예요|이에요|세요)$/g, '');
}

/** Drop later sentences that repeat the same route guidance with different wording. */
function dedupeAccessSentencesByMeaning(text) {
  const seen = [];
  const kept = [];
  for (const sentence of splitAccessPolishSentences(text)) {
    const key = accessSentenceMeaningKey(sentence);
    if (!key) continue;
    const duplicate = seen.some((prior) => (
      prior === key
      || (prior.length > 28 && key.length > 28 && (prior.includes(key) || key.includes(prior)))
    ));
    if (duplicate) continue;
    seen.push(key);
    kept.push(sentence);
  }
  return kept.join(' ').replace(/\s{2,}/g, ' ').trim();
}

function dedupeDaeguFestivalAccessExactRepeats(text, options = {}, festivalId) {
  if (String(options.contentId || '').trim() !== festivalId) return String(text || '');
  if (String(options.departureOriginId || '') !== 'daegu') return String(text || '');
  return dedupeExactAccessSentences(text);
}

function dedupeGukhyangDaeguAccessBusRouteRepeat(text, options = {}) {
  return dedupeDaeguFestivalAccessExactRepeats(text, options, GUKHYANG_FESTIVAL_ID);
}

function dedupeGangneungDaeguAccessBusRouteRepeat(text, options = {}) {
  return dedupeDaeguFestivalAccessExactRepeats(text, options, GANGNEUNG_FESTIVAL_ID);
}

function orderGukhyangDaeguAccessIntro(text, options = {}) {
  if (String(options.contentId || '').trim() !== GUKHYANG_FESTIVAL_ID) return String(text || '');
  if (String(options.departureOriginId || '') !== 'daegu') return String(text || '');
  const sentences = splitAccessPolishSentences(text);
  const introIdx = sentences.findIndex((s) => GUKHYANG_ACCESS_INTRO_SENTENCE_RE.test(s));
  if (introIdx < 0) return String(text || '');
  const intro = sentences[introIdx];
  const rest = sentences.filter((_, index) => index !== introIdx);
  const hasBusLead = rest.some(
    (s) => /가장\s*편해요/.test(s) && /(함평공용버스터미널|유·스퀘어|유ㆍ스퀘어)/.test(s),
  );
  if (hasBusLead) return rest.join(' ').replace(/\s{2,}/g, ' ').trim();
  if (introIdx === 0) return String(text || '');
  return [intro, ...rest].join(' ').replace(/\s{2,}/g, ' ').trim();
}

function rewriteGukhyangDaeguAccessVagueRail(text, options = {}) {
  if (String(options.contentId || '').trim() !== GUKHYANG_FESTIVAL_ID) return String(text || '');
  if (String(options.departureOriginId || '') !== 'daegu') return String(text || '');
  let out = String(text || '');
  out = out.replace(
    /[^.!?。]*(?:동대구역\s*등에서|기차를\s*타려면\s*동대구)[^.!?。]*광주송정[^.!?。]*(?:환승|방면)[^.!?。]*[.。]\s*/g,
    `확인된 대구→광주송정 직통 열차는 없어요. ${GUKHYANG_DAEGU_RAIL_SECONDARY_KO} `,
  );
  out = out.replace(
    /[^.!?。]*광주송정역까지\s*확인된\s*직통\s*열차는\s*없[^.!?。]*동대구역\s*등[^.!?。]*[.。]\s*/g,
    `확인된 대구→광주송정 직통 열차는 없어요. ${GUKHYANG_DAEGU_RAIL_SECONDARY_KO} `,
  );
  if (/직통\s*열차는\s*없/.test(out) && !/광주송정역에서[^.]*갈아타/.test(out)) {
    out = out.replace(
      /(확인된\s*대구→광주송정\s*직통\s*열차는\s*없어요\.?)/,
      `$1 ${GUKHYANG_DAEGU_RAIL_SECONDARY_KO}`,
    );
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

function rewriteGangneungDaeguAccessNamedRail(text, options = {}) {
  if (String(options.contentId || '').trim() !== GANGNEUNG_FESTIVAL_ID) return String(text || '');
  if (String(options.departureOriginId || '') !== 'daegu') return String(text || '');
  let out = String(text || '');
  out = out.replace(
    /열차는[^.!?。]*환승을\s*거쳐[^.!?。]*[.。]\s*/g,
    `${GANGNEUNG_DAEGU_RAIL_KO} `,
  );
  if (!/서울역·청량리역/.test(out) || !/KTX-이음/.test(out)) {
    const lead = GANGNEUNG_DAEGU_BUS_BOOKING_LEAD_KO;
    if (out.includes(lead)) {
      out = out.replace(lead, `${lead} ${GANGNEUNG_DAEGU_RAIL_KO}`);
    } else if (/강릉고속버스터미널/.test(out)) {
      out = `${GANGNEUNG_DAEGU_RAIL_KO} ${out}`;
    }
  }
  if (/KTX-이음/.test(out)) {
    out = out.replace(/열차를\s*이용할\s*경우[^.!?。]*환승을\s*거쳐[^.!?。]*[.。]\s*/g, '');
    out = rewriteVagueAccessTransferWithoutNamedStation(out, options);
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

function rewriteGangneungDaeguAccessTravelerCopy(text, options = {}) {
  if (String(options.contentId || '').trim() !== GANGNEUNG_FESTIVAL_ID) return String(text || '');
  if (String(options.departureOriginId || '') !== 'daegu') return String(text || '');
  const chunks = String(text || '')
    .split(/(?<=[.!?。])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((sentence) => !gangneungAccessSentenceIsTravelerNoise(sentence));
  let out = chunks.join(' ').replace(/\s{2,}/g, ' ').trim();
  const lead = GANGNEUNG_DAEGU_BUS_BOOKING_LEAD_KO;
  if (!/강릉고속버스터미널/.test(out) || !/가장\s*편해요/.test(out)) {
    out = `${lead} ${out}`.trim();
  } else if (out.indexOf(lead) < 0) {
    out = `${lead} ${out}`.trim();
  } else if (out.indexOf(lead) > 60) {
    out = `${lead} ${out.replace(lead, '').trim()}`.trim();
  }
  return out;
}

function cleanupGukhyangAccessOrphanRailTails(text, options = {}) {
  if (String(options.contentId || '').trim() !== GUKHYANG_FESTIVAL_ID) return String(text || '');
  let out = String(text || '');
  out = out.replace(/돼요\s*역으로\s*이동한\s*뒤[^.!?。]*[.。]\s*/g, '');
  out = out.replace(/이어\s*가면\s*돼요\s*역으로[^.!?。]*[.。]\s*/g, '');
  if (String(options.departureOriginId || '') === 'daegu') {
    out = out.replace(
      /열차를\s*이용한다면[^.!?。]*광주송정[^.!?。]*[.。]\s*/g,
      `확인된 대구→광주송정 직통 열차는 없어요. ${GUKHYANG_DAEGU_RAIL_SECONDARY_KO} `,
    );
    const dupPhrase =
      '대구고속버스터미널(서부·동대구)에서 광주(유·스퀘어)까지 고속·시외버스를 타고, 광주에서 함평행 버스로 이어 가면 돼요';
    const firstDup = out.indexOf(dupPhrase);
    if (firstDup >= 0) {
      const secondDup = out.indexOf(dupPhrase, firstDup + dupPhrase.length);
      if (secondDup >= 0) {
        out = `${out.slice(0, secondDup)}${out.slice(secondDup + dupPhrase.length).replace(/^\.\s*/, '')}`;
      }
    }
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

function ensureGukhyangDaeguBusFirstLead(text, options = {}) {
  if (String(options.contentId || '').trim() !== GUKHYANG_FESTIVAL_ID) return String(text || '');
  if (String(options.departureOriginId || '') !== 'daegu') return String(text || '');
  const lead = GUKHYANG_DAEGU_BUS_LEAD_KO;
  let out = String(text || '').trim();
  const leadIdx = out.indexOf(lead);
  if (leadIdx >= 0 && leadIdx <= 80) return out;
  const legacyBus = out.match(
    /[^.!?。]*(?:동대구·서부정류장|동대구터미널이나 서대구터미널)[^.!?。]*(?:가장\s*편해요|편해요)[^.!?。]*[.。]/,
  );
  if (legacyBus && legacyBus[0].includes(lead.slice(0, 12))) {
    const rest = out.replace(legacyBus[0], '').trim();
    return `${legacyBus[0]} ${rest}`.trim();
  }
  return `${lead} ${out.replace(lead, '').trim()}`.trim();
}

const ACCESS_TIMETABLE_WINDOW_MISREAD_RE =
  /(\d{1,2}:\d{2}(?:\u2060?~\u2060?\d{1,2}:\d{2})?)\s*(?:사이에\s*)?바로\s*갈\s*수/g;

const ACCESS_TIMETABLE_WINDOW_LEGACY_RE =
  /(\d{1,2}:\u2060?\d{2}(?:\u2060?~\u2060?\d{1,2}:\u2060?\d{2})?|\d{1,2}:\d{2}~\d{1,2}:\d{2})\s*출발편\s*기준으로\s*바로\s*갈\s*수/g;

const VAGUE_GANGNEUNG_TRANSFER_RE =
  /[^.!?。]*환승\s*경로를\s*거쳐[^.!?。]*[.。]?/g;

function accessTimetableExamplePhrase(clock) {
  const glued = glueAccessNumbersInProse(clock);
  return `조회한 시간대(${glued})에 운행하는 출발편 예시로 바로 갈 수`;
}

function rewriteFestivalAccessTimetableWindowPhrase(text) {
  let out = String(text || '').replace(
    ACCESS_TIMETABLE_WINDOW_MISREAD_RE,
    (full, clock) => accessTimetableExamplePhrase(clock),
  );
  out = out.replace(
    ACCESS_TIMETABLE_WINDOW_LEGACY_RE,
    (full, clock) => accessTimetableExamplePhrase(clock),
  );
  return out;
}

function rewriteVagueGangneungTransferRoute(text, options = {}) {
  if (String(options.contentId || '').trim() !== GANGNEUNG_FESTIVAL_ID) return String(text || '');
  if (!/환승\s*경로/.test(text)) return String(text || '');
  const tagoLead = composeFestivalAccessReply(options.transport, {
    locale: options.locale || 'ko',
    useSelected: false,
    stations: '동대구역',
  });
  const replacement = tagoLead
    ? `${tagoLead.split(/\n/).filter(Boolean)[0]} `
    : '대구고속버스터미널에서 강릉행 고속·시외버스 시간·요금이 확인되면 그걸 먼저 알려 주세요. 동대구역에서 강릉역까지는 확인된 환승 역과 편명만 써 주세요. ';
  return String(text || '').replace(VAGUE_GANGNEUNG_TRANSFER_RE, replacement);
}

export {
  rewriteFalseDongdaeguGwangjuSongjeongLead,
  rewriteFestivalAccessTimetableWindowPhrase,
  glueAccessNumbersInProse as glueMooniAccessNumbersInProse,
};

function listedPlaceNames(values) {
  const out = [];
  for (const raw of Array.isArray(values) ? values : []) {
    const name = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!name || NON_RESTAURANT_PLACE_RE.test(name) || out.includes(name)) continue;
    out.push(name);
    if (out.length >= 6) break;
  }
  return out;
}

/**
 * Festival page links stay festival info. No «페이지에서 가는 법을 알아보세요» until a transport card exists.
 * @param {string} label
 * @param {string} href
 * @param {string} [title]
 */
function festivalInfoPageLink(label, href, title = '') {
  if (!href || String(href).includes('#')) return '';
  const raw = String(title || label || '').replace(/\s+/g, ' ').trim();
  const place = raw.replace(/\s*페이지\s*$/u, '').replace(/\s+page\s*$/i, '').trim();
  if (!place) return '';
  return /[가-힣]/.test(place) ? `[${place} 페이지](${href})` : `[${place} page](${href})`;
}

/**
 * «[강릉 국수 축제](url) 강릉 국수 축제 가는 법» and the prod Edge closer
 * «[강릉 국수 축제 페이지](url)에서 가는 법을 알아보세요» → «[강릉 국수 축제 페이지](url)».
 * @param {string} text
 * @param {string} [title]
 */
function collapseDoubledFestivalCloser(text, title = '') {
  const rewrite = (label, href) => festivalInfoPageLink(label, href, title) || festivalInfoPageLink(label, href);
  let out = String(text || '').replace(
    new RegExp(`\\[([^\\]\\n]+)\\]\\((${FESTIVAL_PAGE_URL})\\)\\s*(?:에서\\s*)?\\1\\s*가는\\s*법[^\\n.。]*[.。]?`, 'g'),
    (full, label, href) => rewrite(label, href) || full,
  );
  const name = String(title || '').replace(/\s+/g, ' ').trim();
  if (name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(
      new RegExp(`\\[([^\\]\\n]+)\\]\\((${FESTIVAL_PAGE_URL})\\)[^\\n.。]{0,80}${escaped}[^\\n.。]{0,40}가는\\s*법[^\\n.。]*[.。]?`, 'g'),
      (full, label, href) => rewrite(name, href) || rewrite(label, href) || full,
    );
  }
  out = out.replace(
    new RegExp(`\\[([^\\]\\n]+)\\]\\((${FESTIVAL_PAGE_URL})\\)\\s*에서\\s*가는\\s*법[^\\n.。]*[.。]?`, 'g'),
    (full, label, href) => rewrite(label, href) || full,
  );
  out = out.replace(
    new RegExp(`\\[([^\\]\\n]+)\\]\\((${FESTIVAL_PAGE_URL})\\)[^\\n.。]{0,48}(?:how\\s+to\\s+get\\s+there|getting\\s+there)[^\\n.。]*[.!?]?`, 'gi'),
    (full, label, href) => rewrite(label, href) || full,
  );
  return out
    .replace(/페이지에서\s*가는\s*법을\s*알아\s*보세요[.。]?/g, '')
    .replace(/에서\s*둘러\s*보세요[.。]?/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function isPlainFestivalPageUrl(url) {
  try {
    const parsed = new URL(url);
    if (!/^(?:www\.)?gateo\.kr$/i.test(parsed.hostname)) return false;
    if (parsed.pathname !== '/korea/' && parsed.pathname !== '/korea') return false;
    if (!/^\d+$/.test(parsed.searchParams.get('festival') || '')) return false;
    return parsed.hash === '' || parsed.hash === '#';
  } catch {
    return false;
  }
}

/** Keep the last festival-page markdown link. A #festival-lodging link stays. */
export function dedupeFestivalPageLinks(text) {
  const src = String(text || '');
  const matches = [...src.matchAll(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)]
    .filter((match) => isPlainFestivalPageUrl(match[2]));
  if (matches.length < 2) return src;
  const keep = matches[matches.length - 1];
  let result = '';
  let cursor = 0;
  for (const match of matches) {
    if (match === keep) continue;
    result += src.slice(cursor, match.index);
    cursor = match.index + match[0].length;
  }
  result += src.slice(cursor);
  return cleanOrphanLinkConjunctions(result
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim());
}

const FOOD_TYPE_TAGS = [
  { label: '돈가스', en: 'cutlet', re: /돈가스|돈까스/ },
  { label: '제과', en: 'bakery', re: /제과|베이커리/ },
  { label: '방앗간', en: 'mill', re: /방앗간/ },
  { label: '치킨', en: 'chicken', re: /치킨|닭강정/ },
  { label: '카페', en: 'cafe', re: /카페|커피/ },
  { label: '국수', en: 'noodles', re: /국수|막국수/ },
  { label: '횟집', en: 'sashimi', re: /횟집|회집/ },
];

/** TourAPI content type 39 cat3. A code that is not here stays unlabeled. */
const FOOD_CAT3_LABELS = {
  A05020100: { ko: '한식', en: 'Korean food' },
  A05020200: { ko: '양식', en: 'Western food' },
  A05020300: { ko: '일식', en: 'Japanese food' },
  A05020400: { ko: '중식', en: 'Chinese food' },
  A05020500: { ko: '이색음식', en: 'specialty food' },
  A05020600: { ko: '카페', en: 'cafe' },
  A05020700: { ko: '클럽', en: 'club' },
  A05020900: { ko: '바', en: 'bar' },
};

const INVENTED_FOOD_NAME_RE = /[가-힣A-Za-z0-9]{2,18}(?:식당|횟집|제과|방앗간|국수집|돈까스|돈가스|비빔밥집|한식당|잔치집|국밥|삼계탕|탕집|뷔페|먹거리|카페|커피)/g;

function foodAnswerLocale(locale) {
  return String(locale || 'ko').slice(0, 2) === 'en' ? 'en' : 'ko';
}

function foodDistKm(raw) {
  const distKm = Number(raw?.distKm);
  return Number.isFinite(distKm) ? distKm : null;
}

function foodTypeLabel(name, cat3, locale = 'ko') {
  const type = FOOD_TYPE_TAGS.find((row) => row.re.test(String(name || '')));
  const en = foodAnswerLocale(locale) === 'en';
  if (type) return en ? type.en : type.label;
  const mapped = FOOD_CAT3_LABELS[String(cat3 || '').trim().toUpperCase()];
  if (!mapped) return '';
  if ((mapped.ko === '바' || mapped.ko === '클럽') && /식당|키친|분식|국수|한식/.test(String(name || ''))) {
    return '';
  }
  return en ? mapped.en : mapped.ko;
}

const WALK_NEAR_KM = 1.2;
const CAR_FEW_MIN_KM = 4.2;

const FOOD_META_SENTENCE_RE = /여행자는 이 답을 보고 바로 찾아갈 수 있어요\.?|여행자가 바로 찾아갈 수 있도록[^.!?。]{0,160}[.!?。]?|링크를 누르면 그 가게를 바로 찾을 수 있어요\.?|사용자는 이 답을 보고 실제로 가게를 찾아가요\.?|A traveler can head out from these shops\.?|Each link opens that shop\.?|The user will actually visit a shop from this answer\.?|So the traveler can head out right away[^.!?。]{0,160}[.!?。]?/g;

function foodCarLabel(distKm, locale = 'ko') {
  const minutes = Math.max(2, Math.round((Number(distKm) * 60) / 25));
  return foodAnswerLocale(locale) === 'en' ? `${minutes}-min drive` : `차로 ${minutes}분`;
}

function foodTravel(distKm, locale = 'ko') {
  const km = Number(distKm);
  if (!Number.isFinite(km) || km <= 0) return { mode: '', label: '' };
  if (km <= WALK_NEAR_KM) return { mode: 'walk', label: foodDistanceLabel(km, locale) };
  return { mode: km <= CAR_FEW_MIN_KM ? 'car' : 'far', label: foodCarLabel(km, locale) };
}

function foodNameBatchim(name) {
  const hangul = [...String(name || '')].reverse().find((ch) => /[가-힣]/.test(ch));
  if (!hangul) return true;
  return (hangul.codePointAt(0) - 0xac00) % 28 !== 0;
}

function foodDistanceLabel(distKm, locale = 'ko') {
  const km = Number(distKm);
  if (distKm == null || !Number.isFinite(km) || km <= 0) return '';
  const meters = Math.round(km * 1000);
  const en = foodAnswerLocale(locale) === 'en';
  if (meters >= 80) {
    const minutes = Math.max(1, Math.round(meters / 80));
    return en ? `${minutes}-min walk` : `도보 ${minutes}분`;
  }
  const near = Math.max(1, meters);
  return en ? `${near} m` : `${near}m`;
}

/** One-word type from the name, otherwise a walk time or meters from the sheet. */
export function festivalFoodPlaceTag(name, distKm, locale = 'ko') {
  return foodTypeLabel(name, '', locale) || foodDistanceLabel(distKm, locale);
}

/** Homepage when the sheet has one, otherwise a Naver search for that shop. */
export function festivalFoodPlaceUrl(raw) {
  const explicit = String(raw?.url || raw?.homepage || '').trim();
  if (/^https?:\/\//i.test(explicit)) return explicit;
  const name = String(raw?.name || raw || '').replace(/\s+/g, ' ').trim();
  if (!name) return '';
  const locality = String(raw?.locality || '').replace(/\s+/g, ' ').trim();
  const addr = String(raw?.addr1 || '').replace(/\s+/g, ' ').trim().split(/\s+/).slice(0, 2).join(' ');
  const query = [locality || addr, name].filter(Boolean).join(' ');
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`;
}

function foodFactByName(values) {
  const map = new Map();
  for (const raw of Array.isArray(values) ? values : []) {
    const name = String(raw?.name || raw || '').replace(/\s+/g, ' ').trim();
    if (!name || map.has(name)) continue;
    map.set(name, raw);
  }
  return map;
}

function foodHasDistance(raw) {
  const km = foodDistKm(raw);
  return km != null && km > 0;
}

function nearbyRestaurantsHaveDistance(values) {
  return (Array.isArray(values) ? values : []).some((raw) => foodHasDistance(raw));
}

const FOOD_INVENTED_DISTANCE_RE =
  /차로\s*\d+\s*분|도보\s*\d+\s*분|\d+\s*m\b|\d+\s*분\s*거리|(?:^|[\s,，])(?:\d+)-min\s+(?:drive|walk)/i;

const FOOD_UNVERIFIED_WALK_PHRASE_RE =
  /도보\s*거리|도보로\s*(?:이동|이동하기)?\s*(?:하기\s*)?가까운|걸어\s*(?:가|갈)\s*(?:기|만한)\s*(?:거리|곳)?|걸어서\s*\d+\s*분|가까운\s*거리에\s*위치|walking\s+distance/gi;

const FOOD_INVENTED_WALK_CLAUSE_RE =
  /(?:모두\s*)?(?:도보로|걸어서)[^.!?。]{0,120}?(?:가까운\s*거리|이동하기\s*가까운|도보\s*거리)|가까운\s*거리에\s*위치해\s*있/;

function foodSentenceMentionsUnverifiedWalk(sentence) {
  return /도보|걸어서/.test(String(sentence || ''));
}

function trimFoodSentenceInventedWalkClause(sentence) {
  const s = String(sentence || '').trim();
  if (foodSentenceMentionsUnverifiedWalk(s) && !FOOD_INVENTED_WALK_CLAUSE_RE.test(s)) {
    return '';
  }
  if (!FOOD_INVENTED_WALK_CLAUSE_RE.test(s)) return s;
  const parts = s.split(/,\s*(?=(?:모두\s*)?(?:도보로|걸어서))/);
  if (parts.length > 1) {
    const lead = parts[0].trim();
    if (!lead) return '';
    const closed = lead
      .replace(/가\s*있고\s*$/u, '가 있어요.')
      .replace(/[,，]\s*$/u, '');
    if (/[.!?。]$/.test(closed)) return closed;
    return `${closed}.`;
  }
  return '';
}

function stripInventedFoodWalkDistanceSentences(text, options = {}) {
  if (!isFestivalFoodAsk(options)) return String(text || '');
  if (nearbyRestaurantsHaveDistance(options.nearbyRestaurants)) return String(text || '');
  const paragraphs = String(text || '').split(/\n{2,}/);
  const kept = paragraphs.map((paragraph) => {
    const sentences = paragraph
      .split(/(?<=[.!?。])\s+/)
      .map((part) => trimFoodSentenceInventedWalkClause(part.trim()))
      .filter(Boolean);
    return sentences.join(' ');
  }).filter((paragraph) => paragraph.trim());
  return kept.join('\n\n').trim();
}

function foodAllowedDetailBlob(entries) {
  const bits = [];
  for (const row of entries) {
    bits.push(row.name, row.type, row.distance);
  }
  return bits.filter(Boolean).join(' ');
}

function foodAllowedDetailBlobFromOptions(options = {}) {
  const entries = festivalFoodPlaceEntries(options.nearbyRestaurants, foodAnswerLocale(options.locale), 4);
  const names = (Array.isArray(options.nearbyRestaurants) ? options.nearbyRestaurants : [])
    .map((raw) => String(raw?.name || raw || '').trim())
    .filter(Boolean);
  return `${foodAllowedDetailBlob(entries)} ${names.join(' ')}`;
}

/** Drop drive/walk times when the restaurant sheet has no distances. */
export function stripUnverifiedFoodDistanceClaims(text, options = {}) {
  if (!isFestivalFoodAsk(options)) return String(text || '');
  if (nearbyRestaurantsHaveDistance(options.nearbyRestaurants)) return String(text || '');
  let s = stripInventedFoodWalkDistanceSentences(text, options);
  return String(s || '')
    .replace(FOOD_INVENTED_DISTANCE_RE, '')
    .replace(FOOD_UNVERIFIED_WALK_PHRASE_RE, '')
    .replace(/\(\s*[,·]\s*\)/g, '')
    .replace(/,\s*,/g, ',')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.!?。])/g, '$1')
    .trim();
}

/** Strip invented walk/menu phrasing when not present in the TourAPI list row. */
export function stripUnverifiedFoodDetailClaims(text, options = {}) {
  if (!isFestivalFoodAsk(options)) return String(text || '');
  const blob = foodAllowedDetailBlobFromOptions(options);
  let s = stripUnverifiedFoodDistanceClaims(text, options);
  if (!nearbyRestaurantsHaveDistance(options.nearbyRestaurants)) {
    s = s.replace(FOOD_UNVERIFIED_WALK_PHRASE_RE, '');
  }
  s = s.replace(/([가-힣A-Za-z]{2,12})\s*요리/g, (full, dish) => (
    blob.includes(dish) ? full : ''
  ));
  return s
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.!?。])/g, '$1')
    .trim();
}

/** 3–4 places that have a distance. A gap is filled by the next closest local. */
export function festivalFoodPlaceEntries(values, locale = 'ko', limit = 4) {
  const facts = foodFactByName(values);
  const ranked = rankFestivalRestaurants(values, 24);
  const locals = ranked.filter((name) => !isFestivalChainRestaurant(name));
  const pool = locals.length ? locals : ranked;
  const measured = pool.filter((name) => foodHasDistance(facts.get(name)));
  const names = (measured.length ? measured : pool)
    .slice()
    .sort((a, b) => {
      if (!measured.length) return 0;
      return foodDistKm(facts.get(a)) - foodDistKm(facts.get(b));
    });
  const rows = names.map((name) => {
    const raw = facts.get(name);
    const source = raw && typeof raw === 'object' ? raw : { name };
    const travel = foodTravel(foodDistKm(source), locale);
    return {
      name,
      type: foodTypeLabel(name, source.cat3, locale),
      distance: travel.label,
      mode: travel.mode,
      url: festivalFoodPlaceUrl({ ...source, name }),
    };
  }).filter((row) => row.mode !== 'far');
  const walk = rows.filter((row) => row.mode === 'walk');
  const car = rows.filter((row) => row.mode === 'car');
  const plain = rows.filter((row) => !row.mode);
  if (walk.length >= 3) return walk.slice(0, limit);
  if (walk.length || car.length) return [...walk, ...car].slice(0, limit);
  return plain.slice(0, limit);
}

export function formatFestivalFoodHintItem(entry) {
  const name = String(entry?.name || '').trim();
  const url = String(entry?.url || '').trim();
  const link = url ? `[${name}](${url})` : name;
  const bits = [entry?.type, entry?.distance].filter(Boolean);
  return bits.length ? `${link}(${bits.join(' · ')})` : link;
}

export function festivalFoodPlaceLabels(values, locale = 'ko', limit = 4) {
  return festivalFoodPlaceEntries(values, locale, limit).map(formatFestivalFoodHintItem);
}

function foodLink(row) {
  const name = String(row?.name || '').trim();
  const url = String(row?.url || '').trim();
  return url ? `[${name}](${url})` : name;
}

function foodSparse(entries) {
  if (!entries.length || entries.some((row) => !row.mode)) return false;
  return entries.filter((row) => row.mode === 'walk').length < 3;
}

function festivalFoodCoach(locale, sparse) {
  const en = foodAnswerLocale(locale) === 'en';
  const base = en
    ? 'The traveler will head out from this answer. Introduce only restaurant names from the nearby list in the hint—fewer names when the list is shorter—in natural sentences with type, distance, and link.'
    : '여행자가 바로 찾아갈 수 있도록, 힌트 주변 맛집 목록에 있는 실제 가게 이름만 알려 주세요. 목록이 짧으면 그만큼만 소개하고, 각 가게는 종류·거리·링크를 문장으로 전해 주세요.';
  if (!sparse) return base;
  return en
    ? `${base} Walking options are few, so say that first, then mention hint shops a few minutes by car, or continue to the festival page's food notes.`
    : `${base} 걸어서 갈 곳은 적으니 그 점을 먼저 말하고, 차로 몇 분인 힌트 가게를 이어서 소개하거나 축제 페이지의 먹을거리 안내로 이어 주세요.`;
}

function stripFoodMetaSentences(text) {
  return String(text || '')
    .replace(FOOD_META_SENTENCE_RE, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function koFoodClause(row, first) {
  const link = foodLink(row);
  const particle = first
    ? (foodNameBatchim(row.name) ? '이' : '가')
    : (foodNameBatchim(row.name) ? '은' : '는');
  if (first && row.type && row.distance) return `${row.type}인 ${link}${particle} ${row.distance} 거리`;
  if (row.type && row.distance) return `${link}${particle} ${row.type}, ${row.distance}`;
  if (row.distance) return `${link}${particle} ${row.distance}${first ? ' 거리' : ''}`;
  if (row.type) return `${row.type}인 ${link}`;
  return link;
}

function koFoodLeadSentence(row) {
  const link = foodLink(row);
  const subj = foodNameBatchim(row.name) ? '이' : '가';
  if (row.type && row.distance) {
    return `가까운 곳으로는 ${row.type}인 ${link}${subj} ${row.distance} 거리에 있어요.`;
  }
  return `가까운 곳으로는 ${link}${subj} 있어요.`;
}

function koFoodRestSentence(row) {
  const link = foodLink(row);
  const topic = foodNameBatchim(row.name) ? '은' : '는';
  if (row.type && row.distance) return `${link}${topic} ${row.type}, ${row.distance} 거리에 있어요`;
  if (row.distance) return `${link}${topic} ${row.distance} 거리에 있어요`;
  if (row.type) return `${row.type}인 ${link}${topic} 있어요`;
  return `${link}${topic} 있어요`;
}

function koFoodTypePhrase(type) {
  const label = String(type || '').trim();
  if (!label) return '';
  if (label === '돈가스') return '돈가스집 ';
  if (label === '제과') return '제과점 ';
  if (label === '카페') return '카페 ';
  if (label.endsWith('식')) return `${label} `;
  return `${label} `;
}

function buildKoWarmFoodShopParagraph(entries, sparse) {
  const pick = entries.slice(0, 4);
  if (!pick.length) return '';
  if (pick.length === 1) {
    return sparse ? `${koFoodRestSentence(pick[0])}.` : koFoodLeadSentence(pick[0]);
  }
  if (sparse) {
    const [first, ...rest] = pick;
    const head = koFoodRestSentence(first);
    const tail = rest.map((row, idx) => {
      const link = foodLink(row);
      const prefix = koFoodTypePhrase(row.type);
      const dist = row.distance ? ` ${row.distance}` : '';
      if (idx === rest.length - 1) return `${prefix}${link}${dist}도 있어요`;
      return `${prefix}${link}${dist}`.trim();
    });
    return `${head}, ${tail.join(', ')}.`;
  }
  const [first, ...rest] = pick;
  const link0 = foodLink(first);
  const subj0 = foodNameBatchim(first.name) ? '이' : '가';
  const lead = first.type && first.distance
    ? `가까운 곳으로는 ${first.type}인 ${link0}${subj0} ${first.distance} 거리에 있어요`
    : `가까운 곳으로는 ${link0}${subj0} 있어요`;
  const tail = rest.map((row, idx) => {
    const link = foodLink(row);
    const prefix = koFoodTypePhrase(row.type);
    if (idx === rest.length - 1) return `${prefix}${link}도 있어요`;
    if (row.distance) return `${prefix}${link}(${row.distance})`;
    return `${prefix}${link}`.trim();
  });
  return `${lead}. ${tail.join(', ')}.`;
}

function warmFestivalFoodAnswer(entries, locale = 'ko', contentId = '') {
  const en = foodAnswerLocale(locale) === 'en';
  const sparse = foodSparse(entries);
  const page = /^\d+$/.test(String(contentId || '')) ? gateoKoreaFestivalDetailUrl(contentId) : '';
  if (en) {
    const bits = entries.map((row) => {
      const facts = [row.type, row.distance].filter(Boolean).join(', ');
      return facts ? `${foodLink(row)} (${facts})` : foodLink(row);
    });
    const intro = sparse
      ? 'Walking-distance restaurants are scarce around here.'
      : 'Nearby meals are an easy stop.';
    const shops = bits.length ? `${bits.join(', ')}.` : '';
    const more = sparse && entries.length < 3 && page
      ? `More food notes are on the [festival page](${page}).`
      : '';
    return [intro, shops, more].filter(Boolean).join(' ');
  }
  const shopLine = entries.length ? buildKoWarmFoodShopParagraph(entries, sparse) : '';
  const intro = sparse ? '걸어서 갈 만한 맛집은 많지 않아요.' : '';
  const more = sparse && entries.length < 3 && page
    ? `더 많은 먹을거리는 [축제 페이지](${page})에서 볼 수 있어요.`
    : '';
  return [intro, shopLine, more].filter(Boolean).join(' ').replace(/\s+\./g, '.').trim();
}

function foodAnswerCoversHint(text, entries) {
  const body = String(text || '');
  const minNames = Math.min(3, entries.length);
  const namedCount = entries.filter((row) => body.includes(row.name)).length;
  if (namedCount < minNames) return false;
  const required = entries.slice(0, minNames);
  const facts = required.length > 0 && required.every((row) => (
    body.includes(row.name)
    && (!row.url || body.includes(row.url))
    && (!row.distance || body.includes(row.distance))
    && (!row.type || body.includes(row.type))
  ));
  if (!facts) return false;
  if (foodSparse(entries) && !/많지 않아요|scarce/.test(body)) return false;
  if (/\]\(https?:\/\/[^)]+\) — /.test(body)) return false;
  return true;
}

function foodNameAllowed(hit, names) {
  const token = String(hit || '').trim();
  if (!token) return true;
  return names.some((name) => name === token || name.includes(token) || token.includes(name));
}

function mentionsInventedFood(part, entries) {
  const names = entries.map((row) => row.name);
  const text = String(part || '');
  for (const match of text.matchAll(/\[([^\]]+)\]\([^)]+\)/g)) {
    if (!foodNameAllowed(match[1].trim(), names)) return true;
  }
  const hits = text.match(INVENTED_FOOD_NAME_RE) || [];
  if (hits.some((hit) => !foodNameAllowed(hit, names))) return true;
  for (const match of text.matchAll(/([가-힣A-Za-z0-9]{2,18})(?:와|과|랑|하고)\s*([가-힣A-Za-z0-9]{2,18})/g)) {
    if (!foodNameAllowed(match[1], names) || !foodNameAllowed(match[2], names)) return true;
  }
  return false;
}

function replyHasUnknownFoodName(text, entries) {
  if (!entries.length) return false;
  const names = entries.map((row) => row.name);
  const hits = String(text || '').match(INVENTED_FOOD_NAME_RE) || [];
  if (hits.some((hit) => !foodNameAllowed(hit, names))) return true;
  for (const match of String(text || '').matchAll(/\[([^\]]+)\]\([^)]+\)/g)) {
    if (!foodNameAllowed(match[1].trim(), names)) return true;
  }
  return false;
}

const FOOD_DEFLECTION_RE = /맛집(?:을|를)\s*찾아\s*보|find\s+(?:nearby\s+)?restaurants|look\s+for\s+(?:nearby\s+)?restaurants/i;
const FOOD_FILLER_RE = /다양한\s*맛집|미식\s*여행|소문난|a variety of restaurants|culinary trip|well-known local/i;

/** «다음 행동으로» / «다음 행동:» is a prompt label, not part of the answer. */
function stripNextActionLabel(text) {
  return String(text || '').replace(
    /(^|\n|(?<=[.!?。])\s*)다음\s*행동(?:으로)?\s*[:：]?\s*/g,
    '$1',
  );
}

function restaurantNameBlob(values) {
  return (Array.isArray(values) ? values : [])
    .map((raw) => String(raw?.name || raw || ''))
    .join('\n');
}

/** Keep a natural answer that already carries the hint shops. Otherwise write those shops. */
function ensureFestivalFoodAnswer(text, options = {}) {
  if (!isFestivalFoodAsk(options)) return String(text || '');
  const locale = foodAnswerLocale(options.locale);
  const entries = festivalFoodPlaceEntries(options.nearbyRestaurants, locale, 4);
  if (!entries.length) {
    const blob = restaurantNameBlob(options.nearbyRestaurants);
    let next = stripFoodMetaSentences(stripNextActionLabel(text));
    next = filterPreservingBreaks(next, (part) => (
      NON_RESTAURANT_PLACE_RE.test(part)
      || FOOD_DEFLECTION_RE.test(part)
      || FOOD_FILLER_RE.test(part)
      || (/중앙시장/.test(part) && !blob.includes('중앙시장'))
    ));
    return stripUnverifiedFoodDetailClaims(next, options);
  }
  let next = stripFoodMetaSentences(stripNextActionLabel(text));
  next = filterPreservingBreaks(next, (part) => (
    NON_RESTAURANT_PLACE_RE.test(part)
    || FOOD_DEFLECTION_RE.test(part)
    || FOOD_FILLER_RE.test(part)
    || mentionsInventedFood(part, entries)
    || (/중앙시장/.test(part) && !entries.some((row) => row.name.includes('중앙시장')))
  ));
  next = stripUnverifiedFoodDetailClaims(next, options);
  if (foodAnswerCoversHint(next, entries) && !replyHasUnknownFoodName(next, entries)) return next;
  return warmFestivalFoodAnswer(entries, locale, options.contentId);
}

const DATE_LINK_FRAGMENT_RE = /^\d{1,2}\/\d{1,2}(?:~\d{1,2}(?:\/\d{1,2})?)?\s*[,，]\s*\[[^\]]*상세\s*안내[^\]]*\]\([^)]+\)[.。]?$/;

/** Drop a trailing chip sentence that is only a short date plus a detail link. */
function dropDateLinkFragmentSentences(text) {
  if (!/\d{1,2}\/\d{1,2}[^\n]{0,80}상세\s*안내/.test(String(text || ''))) return String(text || '');
  return filterPreservingBreaks(text, (part) => DATE_LINK_FRAGMENT_RE.test(String(part || '').trim()));
}

/** A repeated prep_hotel «[숙소 검색](url)» is kept once. */
function dedupeStaySearchLinks(text) {
  const matches = String(text || '').match(/\[[^\]]*숙소\s*검색[^\]]*\]\([^)\s]+\)/g) || [];
  if (matches.length < 2) return String(text || '');
  const seen = new Set();
  const next = String(text || '').replace(/\[([^\]]*숙소\s*검색[^\]]*)\]\(([^)\s]+)\)/g, (full, label, url) => {
    const key = `${label}\n${url}`;
    if (seen.has(key)) return '';
    seen.add(key);
    return full;
  });
  return cleanOrphanLinkConjunctions(next
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim());
}

/** Narrative -답니다 endings are not 해요체. Specific forms first, then a boundary-safe generic. */
function softenDapnida(text) {
  let out = String(text || '')
    .replace(/있답니다/g, '있어요')
    .replace(/된답니다/g, '돼요');
  out = out.replace(/([가-힣])이랍니다(?=$|[\s.!?。,，])/g, (full, prev) => (
    syllableHasBatchim(prev) ? `${prev}이에요` : full
  ));
  out = out.replace(/([가-힣])랍니다(?=$|[\s.!?。,，])/g, (full, prev) => (
    syllableHasBatchim(prev) ? full : `${prev}예요`
  ));
  return out.replace(/([가-힣])답니다(?=$|[\s.!?。,，])/g, '$1대요');
}

function softenNightHour(text) {
  return String(text || '').replace(/밤\s*(\d{1,2})\s*시/g, (full, hour) => {
    const n = Number(hour);
    if (n < 13 || n > 23) return full;
    return `밤 ${n - 12}시`;
  });
}

const FESTIVAL_FILLER_SENTENCE_RE = /다양한 숙소가 자리|숙소가\s*자리하고|매력을 느끼며|인근으로[\s\S]{0,40}숙소를\s*찾을\s*수\s*있|특별한 순간을 경험해|The atmosphere is majestic|a variety of stays|feel the charm|find stays in the .* area/i;
const FESTIVAL_SIGHTS_DECORATIVE_RE =
  /함께\s*즐겨\s*보세요|즐겨\s*보세요\.?$|느껴\s*보세요|만끽해\s*보세요|특별한\s*추억|정취를\s*느끼|계절의\s*정취|현장의\s*활기를\s*만끽|분위기를\s*만들어\s*보세요|enjoy the atmosphere together/i;
const FOOD_UNASKED_TRANSPORT_RE =
  /주차|parking|셔틀|공영\s*주차|주차장\s*이용|자가용으로\s*이용|차량\s*이용\s*시|drive\s+and\s+park|축제장\s*운영\s*시간|주차\s*정보는\s*\[(?:공식|official)/i;
const MOONI_GUIDE_FILLER_RE =
  /안내해\s*드릴게요|안내해\s*드리겠습니다|안내할게요|알려\s*드릴게요|알려드릴게요|도와\s*드릴게요/;

function stripFestivalSightsDecorative(text, options = {}) {
  if (!isFestivalSightsAsk(options)) return String(text || '');
  return filterPreservingBreaks(text, (part) => FESTIVAL_SIGHTS_DECORATIVE_RE.test(part));
}

function festivalSightsNearbyPick(options = {}) {
  return filterVenueAreaNearbyNames(options.nearbyPlaces, options).slice(0, 3);
}

function formatKoSightsNearbySentence(names) {
  const pick = names.slice(0, 3).filter(Boolean);
  if (!pick.length) return '';
  if (pick.length === 1) {
    const last = compactPlace(pick[0]).slice(-1);
    const particle = syllableHasBatchim(last) ? '이' : '가';
    return `근처에는 ${pick[0]}${particle} 있어요.`;
  }
  const tail = pick[pick.length - 1];
  const tailKey = compactPlace(tail).slice(-1);
  const particle = syllableHasBatchim(tailKey) ? '이' : '가';
  return `근처에는 ${pick.slice(0, -1).join(', ')}, ${tail}${particle} 있어요.`;
}

function sightsAnswerIncludesNearby(text, names) {
  if (!names.length) return true;
  const hits = names.filter((name) => String(text || '').includes(name)).length;
  return hits >= Math.min(2, names.length);
}

/** Append a nearby-sights line from GATEO nearbyPlaces when the model skipped them. */
export function ensureFestivalSightsNearbyLine(text, options = {}) {
  if (!isFestivalSightsAsk(options)) return String(text || '');
  const names = festivalSightsNearbyPick(options);
  if (!names.length || sightsAnswerIncludesNearby(text, names)) return String(text || '').trim();
  const en = String(options.locale || 'ko').slice(0, 2) === 'en';
  const line = en
    ? `Nearby you have ${names.join(', ')}.`
    : formatKoSightsNearbySentence(names);
  const body = String(text || '').trim();
  return body ? `${body}\n\n${line}` : line;
}

const FESTIVAL_SIGHTS_PROGRAM_DETAIL_RE =
  /체험|프로그램|부스|공연|퍼레이드|마당|거리가|거리는|program|booth|parade|performance/i;

function splitSightsNearbyParagraph(text, locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  const marker = en ? 'Nearby you have' : '근처에는';
  const s = String(text || '').trim();
  const idx = s.indexOf(marker);
  if (idx <= 0) return s;
  if (s.slice(Math.max(0, idx - 2), idx) === '\n\n') return s;
  return `${s.slice(0, idx).trimEnd()}\n\n${s.slice(idx).trimStart()}`;
}

/** Split intro vs program detail and isolate the nearby line for readability. */
export function ensureFestivalSightsParagraphBreaks(text, options = {}) {
  if (!isFestivalSightsAsk(options)) return String(text || '').trim();
  let s = splitSightsNearbyParagraph(String(text || '').trim(), options.locale);
  if (/\n\n/.test(s)) return s;
  const sentences = splitAccessPolishSentences(s);
  if (sentences.length < 3) return s;
  const nearbyIdx = sentences.findIndex((row) => /^(근처에는|Nearby you have)\b/.test(row));
  const searchEnd = nearbyIdx >= 0 ? nearbyIdx : sentences.length;
  let splitAt = -1;
  for (let i = 1; i < searchEnd; i += 1) {
    if (FESTIVAL_SIGHTS_PROGRAM_DETAIL_RE.test(sentences[i])) {
      splitAt = i;
      break;
    }
  }
  if (splitAt < 1 && s.length >= 140) splitAt = Math.min(2, sentences.length - 1);
  if (splitAt < 1 || splitAt >= sentences.length) return s;
  const lead = sentences.slice(0, splitAt).join(' ');
  const tail = sentences.slice(splitAt).join(' ');
  return `${lead}\n\n${tail}`.trim();
}

function sightsSentenceFingerprint(sentence) {
  const normalized = normalizeAccessPolishSentence(sentence)
    .replace(/\d{1,2}\/\d{1,2}(?:~\d{1,2}(?:\/\d{1,2})?)?/g, '')
    .replace(/[.!?。]/g, '')
    .trim();
  const festLead = normalized.match(/^(.+?축제는)/);
  if (festLead) return festLead[1].trim();
  return normalized.slice(0, 48);
}

/** Drop back-to-back sentences that repeat the same festival subject line. */
export function dedupeConsecutiveFestivalSightsSentences(text, options = {}) {
  if (!isFestivalSightsAsk(options)) return String(text || '').trim();
  const parts = splitAccessPolishSentences(text);
  if (parts.length < 2) return String(text || '').trim();
  const kept = [];
  for (const sentence of parts) {
    const key = sightsSentenceFingerprint(sentence);
    const prevKey = kept.length ? sightsSentenceFingerprint(kept[kept.length - 1]) : '';
    if (key && prevKey && key === prevKey) continue;
    if (key && prevKey && key.length > 18 && prevKey.length > 18
      && (key.includes(prevKey) || prevKey.includes(key))) continue;
    kept.push(sentence);
  }
  return kept.join(' ').replace(/\s{2,}/g, ' ').trim();
}

function stripUnaskedFoodTransportSentences(text, options = {}) {
  if (!isFestivalFoodAsk(options)) return String(text || '');
  if (/주차|parking/i.test(String(options.userText || ''))) return String(text || '');
  return filterPreservingBreaks(text, (part) => FOOD_UNASKED_TRANSPORT_RE.test(part));
}

function stripMooniGuideFiller(text) {
  return filterPreservingBreaks(text, (part) => MOONI_GUIDE_FILLER_RE.test(part));
}

function shortDateFromDateLabel(label) {
  const match = String(label || '').trim().match(/(\d{1,2}\/\d{1,2}(?:~\d{1,2}(?:\/\d{1,2})?)?)/);
  return match ? match[1] : '';
}

function festivalAccessDatesAlreadyInText(body, short) {
  const text = String(body || '');
  const range = String(short || '').trim();
  if (!range || !/\d{1,2}\/\d{1,2}/.test(range)) return false;
  if (text.includes(range)) return true;
  if (new RegExp(`행사\\s*기간(?:은|이)?\\s*${range.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text)) return true;
  const m = range.match(/^(\d{1,2})\/(\d{1,2})(?:~(\d{1,2})(?:\/(\d{1,2}))?)?$/);
  if (!m) return false;
  const [, sm, sd, em, ey] = m;
  const start = `${Number(sm)}/${Number(sd)}`;
  const altStart = `${sm}/${sd}`;
  if (!text.includes(start) && !text.includes(altStart)) return false;
  if (!em) return /행사\s*기간/.test(text) || text.includes(start) || text.includes(altStart);
  const endPart = ey ? `${Number(em)}/${Number(ey)}` : `~${Number(em)}`;
  const full = ey ? `${start}~${endPart}` : `${altStart}~${em}`;
  if (text.includes(full) || text.includes(`${altStart}~${em}`)) return true;
  if (/행사\s*기간/.test(text) && (text.includes(start) || text.includes(altStart))) return true;
  return false;
}

function accessPeriodMainBody(body) {
  return String(body || '').split(/\n\n행사\s*기간은/)[0].trim();
}

const ACCESS_TRANSPORT_SIGNAL_RE =
  /KTX|SRT|ITX|무궁화|열차|기차|버스|지하철|역|환승|택시|자가용|주차|고속|시외|코레일|kobus|bustago|letskorail|공항|항공|페리|터미널|정류|승차|하차|도보|출구|경로|요금|시각|시간표|타고|타면|이용|도착|출발|운행|하시면|오시면|가시면|내려|타세요|letskorail|t-money/i;
const ACCESS_NEARBY_LIST_RE =
  /근처|둘러볼|볼\s*거리|주변\s*(?:명소|장소)|nearby\s+(?:spots|places)/i;
const ACCESS_FESTIVAL_INTRO_RE =
  /국내\s*최대|전통문화|관람객|체험·|공연·|프로그램으로|주제로|펼쳐지는|국가유산|문화예술\s*무대|K-컬처|개막|특별\s*공연|5대\s*궁궐/i;
const GATEO_FESTIVAL_LINK_BLOCK_RE =
  /(?:^|\n\n)(?=\[[^\]]+\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=\d+[^)]*\))/;

function accessSentenceKeepsTransport(sentence) {
  const s = String(sentence || '');
  if (ACCESS_TRANSPORT_SIGNAL_RE.test(s)) return true;
  if (/\[(?:코레일|Korail|버스타고|BUSTAGO|고속버스|KOBUS|시외버스)/i.test(s)) return true;
  if (/\[[^\]]*(?:페이지|page|상세\s*안내)[^\]]*\]\(https:\/\/www\.gateo\.kr/i.test(s)) return true;
  return false;
}

/** Access chip: drop festival overview and nearby-place lists; keep route and booking lines. */
export function stripNonTransportAccessContent(text, options = {}) {
  if (!isBoundFestivalAccessPolish(options)) return String(text || '').trim();
  const places = filterVenueAreaNearbyNames(options.nearbyPlaces, options);
  const title = String(options.festivalTitle || '').trim();
  return filterPreservingBreaks(text, (part) => {
    const s = String(part || '').trim();
    if (!s) return false;
    if (accessSentenceKeepsTransport(s)) return false;
    if (places.length >= 1) {
      const hits = places.filter((name) => name.length >= 2 && s.includes(name));
      if (hits.length >= 2) return true;
      if (hits.length >= 1 && ACCESS_NEARBY_LIST_RE.test(s)) return true;
    }
    if (ACCESS_NEARBY_LIST_RE.test(s)) return true;
    if (ACCESS_FESTIVAL_INTRO_RE.test(s)) return true;
    if (/^\d{1,2}\/\d{1,2}(?:~\d{1,2}(?:\/\d{1,2})?)?\s*(?:이에요|예요|이예요|에요)[.。]?$/.test(s)) {
      return false;
    }
    if (title && s.includes(title) && /\d{1,2}\/\d{1,2}/.test(s)) return false;
    if (title && s.includes(title)) return true;
    return false;
  });
}

function gateoFestivalLinkBlockStart(body) {
  const s = String(body || '');
  const idx = s.search(GATEO_FESTIVAL_LINK_BLOCK_RE);
  return idx >= 0 ? idx : s.length;
}

function firstGateoFestivalLinkIndex(body) {
  const match = String(body || '').match(/\[[^\]]+\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=\d+[^)]*\)/);
  return match && match.index != null ? match.index : -1;
}

/** Start index of the sentence (or paragraph) that contains the first Gateo festival markdown link. */
function accessPeriodInsertPoint(text) {
  const s = String(text || '');
  const linkIdx = firstGateoFestivalLinkIndex(s);
  if (linkIdx < 0) return s.length;
  for (let i = linkIdx - 1; i >= 0; i -= 1) {
    if (s[i] === '\n' && i > 0 && s[i - 1] === '\n') return i + 1;
    if (/[.!?。]/.test(s[i])) {
      let j = i + 1;
      while (j < linkIdx && /\s/.test(s[j])) j += 1;
      return j;
    }
  }
  return 0;
}

function insertAccessPeriodBeforeGateoLinks(body, line) {
  const text = String(body || '').trim();
  const blockStart = gateoFestivalLinkBlockStart(text);
  if (blockStart < text.length && blockStart > 0) {
    return `${text.slice(0, blockStart).trim()}\n\n${line}\n\n${text.slice(blockStart).trim()}`.trim();
  }
  const insertAt = accessPeriodInsertPoint(text);
  const before = text.slice(0, insertAt).trim();
  const after = text.slice(insertAt).trim();
  if (!after) return `${before}\n\n${line}`.trim();
  if (!before) return `${line}\n\n${after}`.trim();
  return `${before}\n\n${line}\n\n${after}`.trim();
}

function reorderAccessPeriodBeforeGateoLink(text, short) {
  const range = String(short || '').trim();
  if (!range || !/\d{1,2}\/\d{1,2}/.test(range)) return String(text || '').trim();
  const escaped = range.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const periodRe = new RegExp(`행사\\s*기간은\\s*${escaped}[^.!?。]*[.!?。]?`);
  const paragraphs = String(text || '').split(/\n\n/);
  const next = paragraphs.map((paragraph) => {
    const s = String(paragraph || '').trim();
    if (!s) return '';
    const periodMatch = s.match(periodRe);
    if (!periodMatch) return s;
    const origLinkIdx = firstGateoFestivalLinkIndex(s);
    if (origLinkIdx < 0 || s.indexOf(periodMatch[0]) <= origLinkIdx) return s;
    const period = periodMatch[0].trim();
    const rest = s.replace(periodMatch[0], '').replace(/\s+/g, ' ').trim();
    if (firstGateoFestivalLinkIndex(rest) < 0) return s;
    const insertAt = accessPeriodInsertPoint(rest);
    const before = rest.slice(0, insertAt).trim();
    const linkSentence = rest.slice(insertAt).trim();
    return [before, period, linkSentence].filter(Boolean).join('\n\n');
  });
  return next.filter(Boolean).join('\n\n').trim();
}

function fixDanglingAccessPeriodAfterLinks(body, short) {
  const range = String(short || '').trim();
  if (!range) return String(body || '').trim();
  const escaped = range.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const periodTailRe = new RegExp(`\\n\\n행사\\s*기간은\\s*${escaped}[^\\n]*\\s*$`);
  const match = String(body || '').match(periodTailRe);
  if (!match || match.index == null) return String(body || '').trim();
  const beforePeriod = String(body || '').slice(0, match.index).trim();
  if (!/\]\(https:\/\/www\.gateo\.kr/.test(beforePeriod)) return String(body || '').trim();
  let linkStart = gateoFestivalLinkBlockStart(beforePeriod);
  if (linkStart >= beforePeriod.length) {
    linkStart = accessPeriodInsertPoint(beforePeriod);
  }
  const main = beforePeriod.slice(0, linkStart).trim();
  const links = beforePeriod.slice(linkStart).trim();
  const periodLine = match[0].trim();
  if (festivalAccessDatesAlreadyInText(main, range)) {
    return links ? `${main}\n\n${links}`.trim() : main;
  }
  const chunks = [main, periodLine, links].filter(Boolean);
  return chunks.join('\n\n').trim();
}

function stripDuplicateAccessPeriodLines(body, short) {
  const range = String(short || '').trim();
  if (!range) return String(body || '').trim();
  const escaped = range.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lineRe = new RegExp(`\\n\\n행사\\s*기간은\\s*${escaped}[^\\n]*`, 'g');
  let out = String(body || '').trim();
  if (festivalAccessDatesAlreadyInText(accessPeriodMainBody(out), range)) {
    return out.replace(lineRe, '').replace(/\n{3,}/g, '\n\n').trim();
  }
  const matches = [...out.matchAll(lineRe)];
  if (matches.length <= 1) return out;
  for (const match of matches.slice(0, -1)) {
    out = out.replace(match[0], '');
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

function ensureFestivalAccessPeriodLine(text, options = {}) {
  if (!isBoundFestivalAccessPolish(options)) return String(text || '').trim();
  const startYmd = normalizeEventYmdForPolish(options.eventStartDate);
  const endYmd = normalizeEventYmdForPolish(options.eventEndDate);
  const short = briefFestivalDate(startYmd, endYmd)
    || shortDateFromDateLabel(options.dateLabel)
    || String(options.dateLabel || '').trim();
  if (!short || !/\d{1,2}\/\d{1,2}/.test(short)) return String(text || '').trim();
  let body = stripDuplicateAccessPeriodLines(String(text || '').trim(), short);
  if (festivalAccessDatesAlreadyInText(accessPeriodMainBody(body), short)) return body;
  const en = String(options.locale || 'ko').slice(0, 2) === 'en';
  const { stem, particle } = festivalSubjectCopula(options.festivalTitle);
  const line = en
    ? `The festival runs ${short}.`
    : (stem && stem !== '축제')
      ? `${stem}${particle} ${short}이에요.`
      : `행사 기간은 ${short}이에요.`;
  const footerRe = /\n\n(?:열차·버스 시각은|Check train and bus schedules)/;
  const footerIdx = body.search(footerRe);
  if (footerIdx > 0) {
    const head = body.slice(0, footerIdx).trim();
    body = `${insertAccessPeriodBeforeGateoLinks(head, line)}${body.slice(footerIdx)}`.trim();
  } else {
    body = insertAccessPeriodBeforeGateoLinks(body, line);
  }
  body = fixDanglingAccessPeriodAfterLinks(body, short);
  return stripDuplicateAccessPeriodLines(body, short);
}

function festivalSubjectCopula(title) {
  const name = String(title || '').trim();
  if (!name) return { stem: '축제', particle: '는' };
  const last = [...name].reverse().find((ch) => /[가-힣]/.test(ch)) || '제';
  const particle = syllableHasBatchim(last) ? '은' : '는';
  return { stem: name, particle };
}

/** Sights/access answers should not open with a bare «10/15~18이에요.» */
function rewriteLeadingBareFestivalPeriod(text, options = {}) {
  const allow = isFestivalSightsAsk(options) || isBoundFestivalAccessPolish(options);
  if (!allow) return String(text || '');
  let s = String(text || '').trim();
  const m = s.match(/^(\d{1,2}\/\d{1,2}(?:~\d{1,2}(?:\/\d{1,2})?)?)\s*(?:이에요|예요|이예요|에요)[.。]?\s*/);
  if (!m) return String(text || '');
  const { stem, particle } = festivalSubjectCopula(options.festivalTitle);
  return s.replace(m[0], `${stem}${particle} ${m[1]}이에요. `);
}

function dropFestivalFillerSentences(text) {
  const stripped = String(text || '').replace(/편안한 휴식을 위해\s*/g, '');
  if (!FESTIVAL_FILLER_SENTENCE_RE.test(stripped)) return stripped;
  return filterPreservingBreaks(stripped, (part) => FESTIVAL_FILLER_SENTENCE_RE.test(part));
}

const TRAILING_DATE_ONLY_RE =
  /^(?:[가-힣0-9A-Za-z·\s]{0,40}?(?:은|는)\s*)?\d{1,2}\/\d{1,2}(?:~\d{1,2}(?:\/\d{1,2})?)?(?:\s*(?:이예요|이에요|예요|에요))?[.。]?$/;

/** Follow-ups drop a last sentence that is only the festival dates. */
function stripTrailingFestivalDateSentence(text) {
  const parts = String(text || '')
    .split(/(?<=[.!?。])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return String(text || '').trim();
  const last = parts[parts.length - 1].replace(/\s+/g, ' ').trim();
  if (!TRAILING_DATE_ONLY_RE.test(last)) return String(text || '').trim();
  return parts.slice(0, -1).join(' ').trim();
}

function stripDistantStaySentences(text, options = {}) {
  if (!isFestivalLodgingAsk(options)) return String(text || '');
  const lat = Number(options.lat);
  const lng = Number(options.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return String(text || '');
  const distant = listCityAttractionHubs().filter((hub) => {
    const name = String(hub?.name || '').trim();
    const km = festivalHubKm(name, lat, lng);
    return name.length >= 2 && km != null && km > FESTIVAL_STAY_RADIUS_KM;
  });
  if (!distant.length) return String(text || '');
  return filterPreservingBreaks(text, (part) => distant.some((hub) => part.includes(hub.name)));
}

/** Festival answers drop the countdown clause and long calendar dates without flattening lists. */
export function stripFestivalCalendarEcho(text) {
  const lines = String(text || '').split('\n').flatMap((line) => {
    if (!line.trim()) return [line];
    const next = cleanCalendarLine(line);
    return next ? [next] : [];
  });
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** @param {string} text */
export function stripLodgingCalendarEcho(text) {
  return stripFestivalCalendarEcho(text);
}

/**
 * «A를 맛보며 월화거리에서 축제 분위기가 저녁까지 이어져요» joins as one subject.
 * The venue already named in the previous sentence is not repeated.
 */
function rewriteFoodEveningJoin(text) {
  return String(text || '')
    .replace(
      /([^\n.!?。]+?)(을|를)\s*맛보며(?:\s+(?:[가-힣0-9·]+\s+){0,2}[가-힣0-9·]+에서)?\s*축제 분위기가 저녁까지 이어져요/g,
      '$1$2 맛볼 수 있고, 축제 분위기가 저녁까지 이어져요',
    )
    .replace(/맛볼 수 있고\s+축제 분위기가/g, '맛볼 수 있고, 축제 분위기가');
}

/** Drop the evening clause when playtime and overview do not run into the evening. */
function stripUnverifiedEveningClause(text) {
  const parts = String(text || '').split(/(?<=[.!?。])\s+/);
  return parts.map((sentence) => {
    if (!/저녁까지 이어/.test(sentence)) return sentence;
    let next = sentence
      .replace(/,?\s*축제 분위기가 저녁까지 이어져요\.?/g, '')
      .replace(/(?:^|\s)(?:[가-힣0-9·]+\s+){0,2}[가-힣0-9·]+에서\s*저녁까지 이어져요\.?/g, '')
      .replace(/저녁까지 이어져요\.?/g, '')
      .trim();
    next = next.replace(/맛볼 수 있고,?$/g, '맛볼 수 있어요');
    next = next.replace(/[,，]\s*$/g, '').trim();
    if (!next) return '';
    if (!/[.!?。]$/.test(next)) next = `${next}.`;
    return next;
  }).filter(Boolean).join(' ');
}

/** Data-free polish for Edge + legacy clients (no TourAPI restaurant list required). */
export function polishFestivalModelReplyBaseline(reply, options = {}) {
  const chipId = String(options.chipId || '');
  const locale = options.locale || 'ko';
  let text = String(reply || '').trim();
  text = stripMooniUiChipLabels(text);
  text = rewriteLeadingBareFestivalPeriod(text, options);
  if (!isFestivalLodgingAsk(options)) {
    text = collapseDoubledFestivalCloser(text, options.festivalTitle);
  }
  text = stripFestivalSightsDecorative(text, options);
  text = ensureFestivalSightsNearbyLine(text, options);
  text = dedupeConsecutiveFestivalSightsSentences(text, options);
  text = ensureFestivalSightsParagraphBreaks(text, options);
  const foodCtx = { chipId, locale, userText: options.userText || '' };
  if (chipId === 'festival_nearby' || isFestivalFoodAsk(foodCtx)) {
    text = stripUnaskedFoodTransportSentences(text, { ...foodCtx, chipId: 'festival_nearby' });
    const list = options.nearbyRestaurants;
    if (Array.isArray(list) && list.length > 0) {
      text = ensureFestivalFoodAnswer(text, {
        ...options,
        chipId: 'festival_nearby',
        nearbyRestaurants: list,
      });
    }
  }
  if (chipId === 'festival_access' || isFestivalAccessAsk(options)) {
    text = stripNonTransportAccessContent(text, options);
    text = dedupeFestivalAccessBookingFooters(text, locale);
  }
  if (chipId === 'festival_nearby' || isFestivalFoodAsk(foodCtx)) {
    text = stripUnverifiedFoodDetailClaims(text, options);
  }
  text = stripMooniUiChipLabels(text);
  return text;
}

export function polishFestivalModelReply(reply, options = {}) {
  let text = String(reply || '').trim();
  if (String(options.locale || 'ko').slice(0, 2) !== 'en') text = dropFestivalPlannerSentences(text);
  text = stripDisallowedFestivalLinks(text, options);
  text = stripMooniUiChipLabels(text);
  text = expandCompactDates(text, options.locale);
  if (shouldPolishDomesticKoreaFestival(options)) {
    text = stripUnaskedBroadcastLines(text, options.userText);
    text = stripDomesticTwelveGoMention(text);
    text = stripDomesticEntryDocLines(text, options);
    text = stripFestivalCalendarEcho(text);
  }
  if (isFestivalLodgingAsk(options)) {
    text = stripNonStayFacilities(text, options.userText);
    text = stripDistantStaySentences(text, options);
  }
  if (String(options.locale || 'ko').slice(0, 2) !== 'en') {
    text = rewriteFestivalFormalEndings(text);
    text = softenDapnida(text);
    text = fixNoBatchimEyeyo(text);
    text = rewriteVenueParkingLotPhrases(text, options);
    text = stripVenueAreaNearbyRepeat(text, options);
    text = polishWaAndGeurigoList(text);
    text = rewriteFoodEveningJoin(text);
    if (options.evening === false) text = stripUnverifiedEveningClause(text);
    if (!isBoundFestivalAccessPolish(options)) {
      text = stripTrailingFestivalDateSentence(text);
    }
    text = dropDateLinkFragmentSentences(text);
    text = dedupeStaySearchLinks(text);
    text = stripNextActionLabel(text);
  }
  text = softenNightHour(text);
  text = dropFestivalFillerSentences(text);
  text = stripFestivalSightsDecorative(text, options);
  text = ensureFestivalSightsNearbyLine(text, options);
  text = dedupeConsecutiveFestivalSightsSentences(text, options);
  text = ensureFestivalSightsParagraphBreaks(text, options);
  text = rewriteLeadingBareFestivalPeriod(text, options);
  if (!isFestivalLodgingAsk(options)) {
    text = collapseDoubledFestivalCloser(text, options.festivalTitle);
  }
  text = ensureFestivalFoodAnswer(text, options);
  text = appendFestivalLodgingNextStep(ensureItineraryMarkdownLineBreaks(text), options);
  text = ensureFestivalLodgingAnswer(text, options);
  text = stripOffTopicLodgingNudge(text, options);
  text = settleFestivalNextAction(text, options);
  text = dedupeFestivalPageLinks(redirectMissingPracticalCheck(text, options));
  text = ensureFestivalParkingAnswer(text, options);
  text = stripUnaskedParkingEcho(text, options);
  text = stripUnaskedFoodTransportSentences(text, options);
  if (isFestivalFoodAsk(options)) {
    text = stripUnverifiedFoodDetailClaims(text, options);
  }
  text = stripPromptEchoSentences(text);
  text = collapseUnconfirmedMentions(text);
  text = cleanOrphanLinkConjunctions(text);
  if (String(options.locale || 'ko').slice(0, 2) !== 'en') {
    text = stripMooniGuideFiller(text);
  }
  if (isBoundFestivalAccessPolish(options)) {
    text = rewriteLeadingBareFestivalPeriod(text, options);
    text = stripNonTransportAccessContent(text, options);
    text = rewriteImpossibleSeoulStationLine3Access(text, options);
    text = rewriteFalseIncheonStationKtxAccess(text, options);
    text = stripGangneungAccessItxMentions(text, options);
    text = ensureGangneungSeoulAccessKtxMention(text, options);
    text = rewriteFalseDongdaeguGwangjuSongjeongLead(text, options);
    text = rewriteVagueAccessTransferWithoutNamedStation(text, options);
    text = ensureGukhyangDaeguBusFirstLead(text, options);
    text = rewriteGukhyangDaeguAccessBusRailOrder(text, options);
    text = orderGukhyangDaeguAccessIntro(text, options);
    text = rewriteGukhyangDaeguAccessVagueRail(text, options);
    text = cleanupGukhyangAccessOrphanRailTails(text, options);
    text = rewriteVagueGangneungTransferRoute(text, options);
    text = rewriteGangneungDaeguAccessTravelerCopy(text, options);
    text = rewriteGangneungDaeguAccessNamedRail(text, options);
    text = dedupeGukhyangDaeguAccessBusRouteRepeat(text, options);
    text = dedupeGangneungDaeguAccessBusRouteRepeat(text, options);
    text = dedupeFestivalAccessBookingFooters(text, options.locale);
    text = dedupeAccessSentencesByMeaning(dedupeExactAccessSentences(text));
    text = ensureGukhyangFestivalTelPeriod(text, options);
    text = rewriteFestivalAccessTimetableWindowPhrase(text);
    text = glueAccessNumbersInProse(text);
    text = stripRedundantBookingLinkOnlyLines(text);
    text = ensureFestivalAccessStepLineBreaks(text);
    const periodShort = briefFestivalDate(
      normalizeEventYmdForPolish(options.eventStartDate),
      normalizeEventYmdForPolish(options.eventEndDate),
    ) || shortDateFromDateLabel(options.dateLabel);
    text = ensureFestivalAccessPeriodLine(text, options);
    text = reorderAccessPeriodBeforeGateoLink(text, periodShort);
    text = stripEchoedAccessAutoFooter(text, options.locale);
    text = appendFestivalAccessBookingLinks(text, options.locale);
    text = dedupeFestivalAccessBookingFooters(text, options.locale);
    text = stripDuplicateAccessPeriodLines(text, periodShort);
    text = rewriteLeadingBareFestivalPeriod(text, options);
    text = stripGangneungAccessItxMentions(text, options);
  }
  text = stripMooniUiChipLabels(text);
  return text;
}

function trimBoundFestivalHintForAccess(hint, locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  const drop = en
    ? /^- (?:Overview|Program|Nearby|Nearby restaurants|Where to eat)/
    : /^- (?:개요|프로그램|근처|주변 맛집|근처 먹을 곳)/;
  return String(hint || '')
    .split('\n')
    .filter((line) => !drop.test(line.trim()))
    .join('\n');
}

function festivalAccessVenueGuidanceLines(ctx, locale = 'ko') {
  const en = String(locale || '').slice(0, 2) === 'en';
  const id = String(ctx?.contentId || '').trim();
  const blob = `${ctx?.title || ''} ${ctx?.venue || ''} ${ctx?.address || ''}`;
  const lines = [];
  if (id === '638576' || /함평|국향/.test(blob)) {
    const addr = String(ctx?.address || '').trim();
    lines.push(en
      ? `- Routes: KTX does not normally stop at Hampyeong Station (only occasional butterfly-festival extras). From Yongsan, Mugunghwa or ITX-Saemaul direct to Hampyeong takes about 4h10–50m with no transfer — present that alongside KTX to Gwangju Songjeong then a local train or bus. Do not claim Seoul–Hampyeong KTX. Last leg: after Hampyeong Station or the bus terminal, continue to Hampyeong Expo Park${addr ? ` (${addr})` : ''} by local bus or taxi (~10–20 min when helpful). Add a driving option. Use only confirmed fares and times.`
      : `- 경로: KTX는 평소 함평역에 정차하지 않아요(나비축제 등 일시 운행만 예외). 용산에서 무궁화·ITX-새마을로 함평역까지 환승 없이 가는 편도 약 4시간 10분~50분대가 있어요 — KTX 광주송정 하차 후 환승과 함께 선택지로 짧게 비교해 주세요. 서울·용산→함평 KTX 직행이라고 말하지 마세요. 마지막 구간: 여행자는 역에서 축제장까지 어떻게 가는지가 가장 궁금해요. 함평역·함평공용버스터미널에서 함평엑스포공원${addr ? `(${addr})` : ''}까지 시내버스·택시, 자가용도 함께 안내해 주세요. 대략 10~20분대(교통에 따라 다름)처럼만 말하고, 확인된 요금·시각만 쓰세요.`);
  }
  if (id === '637693' || /해양누리|3·15|마산가고파|마산/.test(blob)) {
    lines.push(en
      ? '- Arrival station (inside the public-transit section only): for 3·15 Marine Nuri Park, guide KTX/SRT to Masan Station first, then the hop to the venue. Mention Changwon Jungang Station only as a backup in that same transit section — not again after the driving paragraph.'
      : '- 도착 역(대중교통 단락 안에서만): 3·15해양누리공원에는 KTX·SRT는 마산역이 가장 가까워요. 마산역→축제장 경로를 먼저 쓰고, 창원중앙역은 같은 대중교통·역→축제장 설명 안에서만 보조로 말해 주세요. 자가용 안내 **다음에** 창원중앙역을 다시 넣지 마세요.');
  }
  const transitGround = festivalAccessTransitGroundingLine(ctx, locale);
  if (transitGround) {
    lines.push(en
      ? `- Transit grounding: ${transitGround}`
      : `- 교통 기준역: ${transitGround}`);
  }
  return lines;
}

const LODGING_NUDGE_RE = /숙소\s*정보|숙소\s*(?:도|를|카드|안내)|#festival-lodging|묵기\s*좋|where\s+to\s+stay|lodging\s+(?:card|guide)|stays?\s+for\s+this\s+festival/i;

/** A lodging closer stays only on a lodging question. */
function stripOffTopicLodgingNudge(text, options = {}) {
  if (isFestivalLodgingAsk(options)) return String(text || '');
  return filterPreservingBreaks(text, (part) => LODGING_NUDGE_RE.test(part));
}

/** Unlinked getting-there closers drop. Food drops them even when linked. No «안내해 드릴까요». */
function settleFestivalNextAction(text, options = {}) {
  const food = isFestivalFoodAsk(options);
  return filterPreservingBreaks(text, (part) => {
    if (/안내해\s*드릴까요/.test(part)) return true;
    if (/다음에는/.test(part) && /안내/.test(part)) return true;
    if (!/가는\s*법/.test(part)) return false;
    if (food) return true;
    return !/\[[^\]]+\]\(https?:\/\//.test(part);
  });
}

const PRACTICAL_TOPIC_RE = [
  { kind: 'parking', re: /주차|parking/i },
  { kind: 'shuttle', re: /셔틀|shuttle/i },
  {
    kind: 'hours',
    re: /운영\s*시간|행사\s*시간|개장|폐장|몇\s*시|opening\s*hours|what\s+time|hours\s+(?:are|of)/i,
  },
];

function festivalFactCorpus(options = {}) {
  return [options.overview, options.program, options.sceneOverview, options.parking, options.feeText, options.venue]
    .map((value) => String(value || ''))
    .join('\n');
}

const PARKING_FACT_RE =
  /주차\s*가능|주차가\s*가능|주차요금|주차\s*대수|주차비|주차료|무료\s*주차|유료\s*주차|주차\s*공간|주차장(?:을|를)?\s*이용|parking\s*(?:is\s+)?(?:available|fee)|parking\s+fees?/i;
const PARKING_FIELD_NAME_RE =
  /주차\s*(?:시설|요금|대수|안내|정보|가능)|parking\s*(?:fee|info|information|available|capacity)/i;

function infoRowIsParkingFact(name, text) {
  const blob = `${name}\n${text}`;
  if (PARKING_FACT_RE.test(blob)) return true;
  if (!PARKING_FIELD_NAME_RE.test(name)) return false;
  const rest = String(text || '')
    .replace(/[0-9A-Za-z가-힣]*주차장/g, ' ')
    .replace(/\bparking\s+lots?\b/gi, ' ')
    .trim();
  return rest.length > 0;
}

/**
 * Parking data is a TourAPI parking field or an availability, fee, or capacity fact.
 * A lot name such as «천지연 주차장» in a description or venue is not parking data.
 * @param {string | {
 *   parking?: string,
 *   overview?: string,
 *   program?: string,
 *   sceneOverview?: string,
 *   venue?: string,
 *   feeText?: string,
 *   text?: string,
 *   info?: Array<{ infoname?: string, name?: string, infotext?: string, text?: string }>,
 * }} input
 */
export function hasFestivalParkingData(input = {}) {
  const src = typeof input === 'string' ? { text: input } : (input || {});
  if (String(src.parking || '').trim()) return true;
  const rows = Array.isArray(src.info) ? src.info : [];
  for (const row of rows) {
    const name = String(row?.infoname || row?.name || '').trim();
    const text = String(row?.infotext || row?.text || '').trim();
    if (infoRowIsParkingFact(name, text)) return true;
  }
  const corpus = [src.overview, src.program, src.sceneOverview, src.venue, src.feeText, src.text]
    .map((value) => String(value || ''))
    .join('\n');
  if (PARKING_FACT_RE.test(corpus)) return true;
  const withoutLots = corpus
    .replace(/[0-9A-Za-z가-힣]*주차장/g, ' ')
    .replace(/\bparking\s+lots?\b/gi, ' ');
  return /주차(?:는|가|을|를|요금|가능|안내|정보|공간)|(?<![A-Za-z])parking(?!\s+lot)\b/i.test(withoutLots);
}

function stayDistanceTag(km) {
  const n = Number(km);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1) return `${Math.max(1, Math.round(n * 1000))}m`;
  const one = Math.round(n * 10) / 10;
  return Number.isInteger(one) ? `${one}km` : `${one.toFixed(1)}km`;
}

const STAY_GENERIC_TOKEN_RE =
  /^(호텔|리조트|펜션|모텔|게스트하우스|게하|한옥|스테이|풀빌라|콘도|호스텔|여관|민박|호텔스|스위트|스위츠)$/;

function stayComplexKeys(name) {
  const tokens = String(name || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((token) => token.length >= 4 && !STAY_GENERIC_TOKEN_RE.test(token));
  const keys = tokens.filter((token) => token.length >= 5);
  const last = tokens[tokens.length - 1];
  if (last && last.length >= 4) keys.push(last);
  return [...new Set(keys)];
}

/** «신화관 제주신화월드» and «서머셋 제주신화월드» share one complex. A leading place name stays apart. */
export function sameFestivalStayComplex(a, b) {
  const left = String(a || '').replace(/\s+/g, ' ').trim();
  const right = String(b || '').replace(/\s+/g, ' ').trim();
  if (!left || !right) return false;
  if (left === right) return true;
  if (stayComplexKeys(left).some((key) => right.includes(key))) return true;
  return stayComplexKeys(right).some((key) => left.includes(key));
}

/** Closest stays, one per complex. */
export function pickDiverseLodgingStays(rows, limit = 3) {
  const picked = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (picked.some((kept) => sameFestivalStayComplex(kept.name, row.name))) continue;
    picked.push(row);
    if (picked.length >= limit) break;
  }
  return picked;
}

function lodgingOriginKm(raw, origin) {
  const lat = Number(origin?.lat);
  const lng = Number(origin?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const pt = parseStayCoordPair(raw);
  if (!pt) return null;
  const km = stayHaversineKm(lat, lng, pt.lat, pt.lng);
  return Number.isFinite(km) && km > 0 ? km : null;
}

function lodgingStayNames(values) {
  const names = [];
  for (const raw of Array.isArray(values) ? values : []) {
    const name = String(raw?.name || raw?.itemName || '').replace(/\s+/g, ' ').trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

/** Named stays need a measured distance inside 20km. A name with no coordinates stays off the list. */
function lodgingStayRows(values, origin) {
  const rows = [];
  for (const raw of Array.isArray(values) ? values : []) {
    const name = String(raw?.name || raw?.itemName || '').replace(/\s+/g, ' ').trim();
    let distKm = Number(raw?.distKm ?? raw?.distanceKm);
    if (!(Number.isFinite(distKm) && distKm > 0)) distKm = lodgingOriginKm(raw, origin);
    const type = String(raw?.type || '').replace(/\s+/g, ' ').trim();
    if (!name || !(Number.isFinite(distKm) && distKm > 0) || distKm > FESTIVAL_STAY_RADIUS_KM) continue;
    const pt = parseStayCoordPair(raw);
    rows.push({
      name,
      distKm,
      ...(pt ? { lat: pt.lat, lng: pt.lng } : {}),
      ...(type ? { type } : {}),
    });
  }
  rows.sort((a, b) => a.distKm - b.distKm);
  return pickDiverseLodgingStays(rows, 3);
}

function lodgingStayLabel(row) {
  const bits = [];
  if (row.type) bits.push(row.type);
  const dist = stayDistanceTag(row.distKm);
  if (dist) bits.push(dist);
  return bits.length ? `${row.name}(${bits.join(', ')})` : row.name;
}

function lastHangulSyllable(label) {
  const text = String(label || '');
  let last = '';
  for (const ch of text) {
    if (ch >= '가' && ch <= '힣') last = ch;
  }
  return last;
}

/** Copula follows the spoken ending. A trailing digit is read in Korean, not the hangul before it. */
function trailingLabelHasBatchim(label) {
  const digit = String(label || '').trim().match(/(\d)\s*$/);
  if (digit) return '013678'.includes(digit[1]);
  return syllableHasBatchim(lastHangulSyllable(label));
}

function lodgingStaySentence(rows, locale = 'ko') {
  const labels = rows.map((row) => lodgingStayLabel(row)).filter(Boolean);
  if (!labels.length) return '';
  if (String(locale || 'ko').slice(0, 2) === 'en') {
    return `Closest stays: ${labels.join(', ')}.`;
  }
  const particle = syllableHasBatchim(lastHangulSyllable(labels[labels.length - 1])) ? '이' : '가';
  return `가까운 숙소로 ${labels.join(', ')}${particle} 있어요.`;
}

function lodgingDistanceClause(rows, en) {
  if (en) {
    return `Write only: ${lodgingStaySentence(rows, 'en')} These are the closest, already in distance order. Do not invent a kilometer value. Do not name a stay that is not in this sentence.`;
  }
  return `이 문장만 쓴다: ${lodgingStaySentence(rows, 'ko')} 가까운 순이다. 적힌 거리만 쓴다. 여기 없는 km와 여기 없는 숙소 이름은 쓰지 않는다.`;
}

function displaySigunguName(raw) {
  const text = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!text || /구$/.test(text)) return text;
  const stripped = text.replace(/(?:시|군)$/, '');
  return stripped.length >= 2 ? stripped : text;
}

function lodgingPlaceBits(options = {}) {
  const parts = String(options.address || '').split(/\s+/).filter(Boolean);
  let raw = '';
  let kind = '';
  const rest = [];
  for (const part of parts) {
    if (/(?:특별자치도|특별자치시|특별시|광역시)$/.test(part) || /도$/.test(part)) continue;
    if (!raw && /^[가-힣]{1,8}(?:시|군|구)$/.test(part)) {
      raw = part;
      kind = part.endsWith('구') ? 'gu' : part.endsWith('군') ? 'gun' : 'si';
      continue;
    }
    rest.push(part);
  }
  if (!raw) {
    const hub = String(options.placeName || '').replace(/\s+/g, ' ').trim();
    if (/^[가-힣]{2,8}(?:시|군|구)?$/.test(hub)) {
      raw = hub;
      kind = hub.endsWith('구') ? 'gu' : hub.endsWith('군') ? 'gun' : hub.endsWith('시') ? 'si' : '';
    }
  }
  return { raw, kind, display: displaySigunguName(raw), addressRest: rest.join(' ') };
}

function lodgingVenueTokens(options, place) {
  const spoken = festivalSpokenVenue(options.venue);
  const blob = `${spoken} ${place.addressRest}`;
  const streets = [];
  const admins = [];
  for (const match of blob.matchAll(/([가-힣]{2,12}거리)/g)) {
    if (!streets.includes(match[1])) streets.push(match[1]);
  }
  for (const match of blob.matchAll(/([가-힣]{2,8}(?:읍|면|동|리))(?![가-힣])/g)) {
    if (!admins.includes(match[1]) && match[1] !== place.display && match[1] !== place.raw) admins.push(match[1]);
  }
  let landmark = spoken
    .replace(/\s*(?:일대|일원|부근|인근|주변)$/g, '')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (place.display && landmark.startsWith(`${place.display} `)) landmark = landmark.slice(place.display.length).trim();
  landmark = landmark.replace(/^[가-힣]{1,8}(?:시|군|구)\s+/, '').trim();
  if (!landmark || landmark.length < 2 || /주차장|거리$/.test(landmark) || /(?:로|길)\s*\d/.test(landmark)) landmark = '';
  if (landmark === place.display || landmark === place.raw) landmark = '';
  const tokens = [];
  for (const token of [landmark, ...streets, ...admins]) {
    if (token && !tokens.includes(token)) tokens.push(token);
    if (tokens.length >= 3) break;
  }
  return tokens;
}

function lodgingAreaCardLabel(place, locale = 'ko') {
  const en = String(locale || 'ko').slice(0, 2) === 'en';
  if (en) {
    const english = englishLodgingPlaceName(place.display) || englishLodgingPlaceName(place.raw);
    return english ? `${english} lodging card` : 'lodging card';
  }
  return place.display ? `${place.display} 숙소 카드` : '숙소 카드';
}

function lodgingAreaCardLink(contentId, place, locale = 'ko') {
  const url = gateoKoreaFestivalLodgingUrl(contentId);
  if (!url) return '';
  return `[${lodgingAreaCardLabel(place, locale)}](${url})`;
}

/** No measured stay: one venue-area sentence, or the card fallback. Never a hotel name. */
function lodgingUnmeasuredStayAnswer(options = {}) {
  const en = String(options.locale || 'ko').slice(0, 2) === 'en';
  const place = lodgingPlaceBits(options);
  const tokens = lodgingVenueTokens(options, place);
  const link = lodgingAreaCardLink(options.contentId, place, options.locale);
  if (!link) return '';
  const cityCenter = place.kind === 'si' && tokens.length > 0 && tokens.every((token) => !/(?:읍|면)$/.test(token));
  if (en) {
    const city = englishLodgingPlaceName(place.display) || englishLodgingPlaceName(place.raw);
    const tokenEn = tokens.map((token) => englishLodgingAreaLabel(token, place.display)).filter(Boolean);
    if (city && cityCenter && tokenEn.length) {
      return `Staying in downtown ${city} (${tokenEn.join(', ')}) keeps the venue walkable. ${link}`;
    }
    if (city && (tokens.length || place.display)) {
      return `Staying in ${city} keeps you near the venue. ${link}`;
    }
    if (tokenEn.length) return `Staying around ${tokenEn.join(', ')} keeps you near the venue. ${link}`;
    return `Stays near the venue are on ${link}.`;
  }
  if (cityCenter) {
    return `축제장이 있는 ${place.display} 시내(${tokens.join('·')} 일대)에 잡으면 걸어서 다니기 좋아요. ${link}`;
  }
  if (place.display && tokens.length) {
    return `축제장이 있는 ${place.display} ${tokens.join('·')} 일대에 잡으면 걸어서 다니기 좋아요. ${link}`;
  }
  if (tokens.length) {
    return `축제장이 있는 ${tokens.join('·')} 일대에 잡으면 걸어서 다니기 좋아요. ${link}`;
  }
  if (place.display) {
    return `축제장이 있는 ${place.display}에 잡으면 걸어서 다니기 좋아요. ${link}`;
  }
  return `축제장 근처 숙소는 ${link}에서 볼 수 있어요.`;
}

function stripStayNames(text, values) {
  let out = String(text || '');
  const names = lodgingStayNames(values).sort((a, b) => b.length - a.length);
  for (const name of names) {
    out = out.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  }
  return out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\s+([.!?。])/g, '$1')
    .trim();
}

function allowedStayDistanceTags(values, origin) {
  const tags = new Set();
  for (const row of lodgingStayRows(values, origin)) {
    const tag = stayDistanceTag(row.distKm);
    if (tag) tags.add(tag.toLowerCase());
  }
  return tags;
}

function stripUnhintedStayDistances(text, values, origin) {
  const allowed = allowedStayDistanceTags(values, origin);
  return String(text || '').replace(/\s*(\d+(?:\.\d+)?)\s*(km|m)\b/gi, (full, num, unit) => {
    const n = Number(num);
    const km = String(unit).toLowerCase() === 'm' ? n / 1000 : n;
    const tag = stayDistanceTag(km).toLowerCase();
    return tag && allowed.has(tag) ? full : '';
  }).replace(/[ \t]{2,}/g, ' ').replace(/\s+([.!?。])/g, '$1').trim();
}

function lodgingCardLink(contentId, locale = 'ko') {
  const url = gateoKoreaFestivalLodgingUrl(contentId);
  if (!url) return '';
  return String(locale || 'ko').slice(0, 2) === 'en'
    ? `[lodging card](${url})`
    : `[숙소 카드](${url})`;
}

const LODGING_AREA_SEARCH_RE = /권역에서\s*숙소를\s*찾을\s*수\s*있어요/;

function stripLodgingAreaSearchSentence(text) {
  const stripped = filterPreservingBreaks(text, (part) => (
    LODGING_AREA_SEARCH_RE.test(part) && !/\[[^\]]+\]\(https?:\/\//.test(part)
  ));
  return stripped.replace(/[^[\n]*권역에서\s*숙소를\s*찾을\s*수\s*있어요[.!]?\s*/g, '').trim();
}

/** Measured stays name distance. A card with no coordinates names none of them. */
function ensureFestivalLodgingAnswer(text, options = {}) {
  if (!isFestivalLodgingAsk(options)) return String(text || '');
  const origin = { lat: options.lat, lng: options.lng };
  const names = lodgingStayNames(options.nearbyStays);
  const rows = lodgingStayRows(options.nearbyStays, origin);
  const link = lodgingCardLink(options.contentId, options.locale);
  let body;
  if (rows.length && link) {
    body = `${lodgingStaySentence(rows, options.locale)}\n\n${link}`;
  } else if (names.length) {
    body = stripStayNames(
      lodgingUnmeasuredStayAnswer(options) || stripLodgingAreaSearchSentence(text),
      options.nearbyStays,
    );
  } else {
    body = stripLodgingAreaSearchSentence(text);
  }
  return stripUnhintedStayDistances(body, options.nearbyStays, origin);
}

const THIN_PARKING_RE = /^(?:가능|있음|없음|불가|주차\s*가능)$/;
const UNCONFIRMED_GAP_RE = /확인된 정보가 없|no confirmed (?:information|facts)|confirmed information is not/i;
const PROMPT_ECHO_RE = /사용자는 이 답을 보고|The user will actually visit/i;
const PARKING_HOMEPAGE_ECHO_RE = /주차 안내는|Parking is on the official/i;

function cleanParkingText(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function corpusParkingSentences(options) {
  return [options.overview, options.program, options.sceneOverview]
    .map((value) => String(value || ''))
    .join('\n')
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => PARKING_FACT_RE.test(part));
}

function parkingPlaceMatchesFestival(name, options) {
  const clean = String(name || '').replace(/\s+/g, '');
  if (clean.length < 2) return false;
  const blob = `${options.festivalTitle || ''} ${options.venue || ''}`.replace(/\s+/g, '');
  return blob.includes(clean);
}

const PARKING_WALK_RE = /걸어서\s*\d+\s*분|도보\s*\d+\s*분|\d+\s*분\s*(?:거리|소요)/;

/** A walk time counts only when the parking text itself states it. Sight distance does not. */
function parkingTextStatesWalk(text) {
  return PARKING_WALK_RE.test(String(text || ''));
}

/** Festival parking field, a parking fact sentence, or a nearby sight that is this festival. */
function parkingLotsForAnswer(options = {}) {
  const lots = [];
  const field = cleanParkingText(options.parking);
  if (field) lots.push({ name: '', text: field, distKm: null, addr: '' });
  for (const sentence of corpusParkingSentences(options)) {
    lots.push({ name: '', text: sentence, distKm: null, addr: '' });
  }
  for (const row of Array.isArray(options.nearbyParking) ? options.nearbyParking : []) {
    const name = String(row?.name || '').trim();
    const text = cleanParkingText(row?.text || row?.parking);
    if (!text || !parkingPlaceMatchesFestival(name, options)) continue;
    const distKm = Number(row?.distKm);
    lots.push({
      name,
      text,
      distKm: Number.isFinite(distKm) ? distKm : null,
      addr: cleanParkingText(row?.addr1 || row?.addr || ''),
    });
  }
  return lots.slice(0, 2);
}

function parkingLotLabel(lot) {
  const bits = [lot.text, lot.addr].filter(Boolean);
  return lot.name ? `${lot.name}(${bits.join(' · ')})` : bits.join(' · ');
}

function finishParkingSentence(text) {
  const body = String(text || '').trim();
  if (!body) return '';
  return /[.!?。]$/.test(body) ? body : `${body}.`;
}

function composeParkingAnswer(lots, options = {}) {
  const en = String(options.locale || 'ko').slice(0, 2) === 'en';
  const sentences = [];
  for (const lot of lots) {
    const thin = THIN_PARKING_RE.test(lot.text);
    if (en) {
      if (lot.name && thin) sentences.push(`${lot.name} parking: ${lot.text}.`);
      else if (lot.name) sentences.push(`${lot.name} parking: ${lot.text}.`);
      else sentences.push(finishParkingSentence(lot.text));
      if (lot.addr) sentences.push(`Location: ${lot.addr}.`);
      continue;
    }
    if (lot.name && thin) {
      const particle = syllableHasBatchim(lastHangulSyllable(lot.name)) ? '은' : '는';
      const possible = /없|불가/.test(lot.text) ? '주차가 어려워요' : '주차가 가능해요';
      sentences.push(`${lot.name}${particle} ${possible}.`);
    } else if (lot.name) {
      sentences.push(`${lot.name} 주차는 ${lot.text.replace(/[.。]$/, '')}예요.`);
    } else if (/해요|이에요|예요|어요/.test(lot.text)) {
      sentences.push(finishParkingSentence(lot.text));
    } else {
      sentences.push(`주차는 ${lot.text.replace(/[.。]$/, '')}이에요.`);
    }
    if (lot.addr && !sentences.join(' ').includes(lot.addr)) {
      const particle = trailingLabelHasBatchim(lot.addr) ? '이에요' : '예요';
      sentences.push(`위치는 ${lot.addr}${particle}.`);
    }
  }
  const rich = lots.some((lot) => !THIN_PARKING_RE.test(lot.text));
  if (!rich && /^https?:\/\//i.test(String(options.homepage || ''))) {
    sentences.push(parkingGuide(options));
  }
  return sentences.filter(Boolean).join(' ');
}

function parkingAnswerCovers(text, lots) {
  const body = String(text || '');
  return lots.every((lot) => {
    if (lot.name && !body.includes(lot.name)) return false;
    if (lot.addr && !body.includes(lot.addr)) return false;
    if (PARKING_WALK_RE.test(body) && !parkingTextStatesWalk(lot.text)) return false;
    if (THIN_PARKING_RE.test(lot.text)) {
      const negative = /없|불가/.test(lot.text);
      if (negative ? !/어렵|불가|없/.test(body) : !/가능/.test(body)) return false;
    } else {
      const token = lot.text.replace(/\s+/g, '').slice(0, 8);
      if (token && !body.replace(/\s+/g, '').includes(token)) return false;
    }
    return true;
  });
}

function ensureFestivalParkingAnswer(text, options = {}) {
  const asked = PRACTICAL_TOPIC_RE.some((topic) => topic.kind === 'parking' && topic.re.test(String(options.userText || '')));
  if (!asked) return String(text || '');
  const lots = parkingLotsForAnswer(options);
  if (!lots.length) return parkingGuide(options);
  if (parkingAnswerCovers(text, lots)) return String(text || '');
  return composeParkingAnswer(lots, options);
}

function stripUnaskedParkingEcho(text, options = {}) {
  if (/주차|parking/i.test(String(options.userText || ''))) return String(text || '');
  return filterPreservingBreaks(text, (part) => /주차|parking/i.test(part) || PARKING_HOMEPAGE_ECHO_RE.test(part));
}

function stripPromptEchoSentences(text) {
  return filterPreservingBreaks(text, (part) => PROMPT_ECHO_RE.test(part));
}

/** An unconfirmed gap is one short sentence. Later copies drop. */
function collapseUnconfirmedMentions(text) {
  let seen = false;
  return filterPreservingBreaks(text, (part) => {
    if (!UNCONFIRMED_GAP_RE.test(part)) return false;
    if (seen) return true;
    seen = true;
    return false;
  });
}

function parkingGuide(options = {}) {
  const homepage = String(options.homepage || '').trim();
  const tel = String(options.tel || '').trim();
  const homeOk = /^https?:\/\//i.test(homepage);
  const en = String(options.locale || 'ko').slice(0, 2) === 'en';
  if (en) {
    if (homeOk && tel) return `Parking is on the [official site](${homepage}). Call ${tel}.`;
    if (homeOk) return `Parking is on the [official site](${homepage}).`;
    if (tel) return `For parking, call ${tel}.`;
    return 'Parking is on the official site.';
  }
  if (homeOk && tel) return `주차 안내는 [공식 홈페이지](${homepage})에 있어요. 문의 ${tel}`;
  if (homeOk) return `주차 안내는 [공식 홈페이지](${homepage})에 있어요.`;
  if (tel) return `주차 안내는 문의 ${tel}에 있어요.`;
  return '주차 안내는 공식 홈페이지에 있어요.';
}

function hoursGuide(options = {}) {
  const homepage = String(options.homepage || '').trim();
  const tel = String(options.tel || '').trim();
  const homeOk = /^https?:\/\//i.test(homepage);
  const en = String(options.locale || 'ko').slice(0, 2) === 'en';
  if (en) {
    if (homeOk && tel) {
      return `Hours are on the [official site](${homepage}). Call ${tel}.`;
    }
    if (homeOk) return `Hours are on the [official site](${homepage}).`;
    if (tel) return `For hours, call ${tel}.`;
    return 'Hours are on the official site.';
  }
  if (homeOk && tel) {
    return `운영 시간은 [공식 홈페이지](${homepage})에 있고, 문의는 ${tel}로 해요.`;
  }
  if (homeOk) return `운영 시간은 [공식 홈페이지](${homepage})에 있어요.`;
  if (tel) return `운영 시간은 문의 ${tel}로 해요.`;
  return '운영 시간은 공식 홈페이지에 있어요.';
}

function officialPracticalCheck(options = {}) {
  const homepage = String(options.homepage || '').trim();
  const tel = String(options.tel || '').trim();
  const homeOk = /^https?:\/\//i.test(homepage);
  const en = String(options.locale || 'ko').slice(0, 2) === 'en';
  if (en) {
    if (homeOk && tel) return `Check the [official site](${homepage}) or call ${tel}.`;
    if (homeOk) return `Check the [official site](${homepage}) or the listed contact.`;
    if (tel) return `Check with the contact at ${tel}.`;
    return 'Check the official site or the listed contact.';
  }
  if (homeOk && tel) return `[공식 홈페이지](${homepage})나 문의처 ${tel}에서 확인해요.`;
  if (homeOk) return `[공식 홈페이지](${homepage})나 문의처에서 확인해요.`;
  if (tel) return `문의처 ${tel}에서 확인해요.`;
  return '공식 홈페이지나 문의처에서 확인해요.';
}

function alreadyLinksOfficialContact(text, options = {}) {
  const body = String(text || '');
  const homepage = String(options.homepage || '').trim();
  if (/^https?:\/\//i.test(homepage)) return body.includes(homepage);
  const tel = String(options.tel || '').replace(/\D/g, '');
  if (tel.length >= 8) return body.replace(/\D/g, '').includes(tel);
  return /공식 홈페이지나 문의처|official site or the listed contact|Check with the contact/i.test(body);
}

const FESTIVAL_PAGE_CHECK_RE = /축제\s*페이지에서\s*확인|check the festival page/i;
const GATEO_FESTIVAL_MD_RE = /\[[^\]]+\]\(https:\/\/www\.gateo\.kr\/korea\/\?festival=[^)]+\)/;
const FESTIVAL_PAGE_POINTER_RE =
  /확인|check|살펴\s*보|알아\s*보|찾아\s*볼|볼\s*수\s*있|\bsee\b|\bfind\b/i;

function isFestivalPageParkingPointer(part) {
  const body = String(part || '');
  if (!/축제\s*페이지|festival\s+page|gateo\.kr\/korea\/\?festival=/i.test(body)) return false;
  return FESTIVAL_PAGE_POINTER_RE.test(body);
}

/** Drop a festival-page sentence that sends the user there for parking. */
export function stripFestivalPageParkingPointers(text) {
  return filterPreservingBreaks(text, isFestivalPageParkingPointer);
}

/** «축제 페이지에서 확인» stays only when the asked parking or shuttle fact is in the data. */
function redirectMissingPracticalCheck(text, options = {}) {
  const asked = PRACTICAL_TOPIC_RE.filter((topic) => topic.re.test(String(options.userText || '')));
  if (!asked.length) return String(text || '');
  const corpus = festivalFactCorpus(options);
  const covered = (topic) => {
    if (topic.kind === 'parking') {
      return hasFestivalParkingData({
        parking: options.parking,
        overview: options.overview,
        program: options.program,
        sceneOverview: options.sceneOverview,
        venue: options.venue,
        feeText: options.feeText,
        info: options.info,
        text: corpus,
      }) || parkingLotsForAnswer(options).length > 0;
    }
    if (topic.kind === 'hours') {
      return Boolean(String(options.timeText || '').trim());
    }
    return /셔틀|shuttle/i.test(corpus);
  };
  if (asked.every(covered)) return String(text || '');
  if (asked.some((topic) => topic.kind === 'parking' && !covered(topic))) {
    return parkingGuide(options);
  }
  if (asked.some((topic) => topic.kind === 'hours' && !covered(topic))) {
    return hoursGuide(options);
  }
  const replacement = officialPracticalCheck(options);
  const next = filterPreservingBreaks(text, (part) => (
    FESTIVAL_PAGE_CHECK_RE.test(part)
    || (GATEO_FESTIVAL_MD_RE.test(part) && /확인|check/i.test(part))
  ));
  if (alreadyLinksOfficialContact(next, options)) return next;
  return next ? `${next} ${replacement}` : replacement;
}

/**
 * @param {string} href
 * @returns {string}
 */
export function festivalLodgingContentIdFromHref(href) {
  try {
    const url = new URL(String(href || ''), GATEO_KOREA_FESTIVAL_BASE);
    if (url.hash !== `#${FESTIVAL_LODGING_SECTION_ID}`) return '';
    const id = String(url.searchParams.get('festival') || '');
    return /^\d+$/.test(id) ? id : '';
  } catch {
    return '';
  }
}

/** @param {string} ymd */
export function formatFestivalYmdDot(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return '';
  return `${Number(s.slice(4, 6))}.${s.slice(6, 8)}`;
}

/** @param {string} startYmd @param {string} endYmd */
export function formatFestivalPeriodLabel(startYmd, endYmd) {
  const start = formatFestivalYmdDot(startYmd);
  const end = formatFestivalYmdDot(endYmd || startYmd);
  if (!start) return '';
  if (!end || end === start) return start;
  return `${start}–${end}`;
}

/** 20261015–20261018 → 10/15~18. Spoken dates stay in this short form. */
function briefFestivalDate(startYmd, endYmd) {
  if (!/^\d{8}$/.test(String(startYmd || ''))) return '';
  const sm = Number(startYmd.slice(4, 6));
  const sd = Number(startYmd.slice(6, 8));
  const end = /^\d{8}$/.test(String(endYmd || '')) ? String(endYmd) : String(startYmd);
  const em = Number(end.slice(4, 6));
  const ed = Number(end.slice(6, 8));
  if (String(startYmd) === end) return `${sm}/${sd}`;
  if (sm === em) return `${sm}/${sd}~${ed}`;
  return `${sm}/${sd}~${em}/${ed}`;
}

const FESTIVAL_INTENT_RE = /축제|페스티벌|festival/i;

const TIME_STRIP_RE =
  /다다음\s*주말?|다음\s*주말?|이번\s*주말?|다다음\s*주|다음\s*주|내주|이번\s*주|주말|근처|주변|인근|쪽|부근|에서|으로|에\s*있는|있는/gi;

/**
 * @param {string} userText
 */
export function isMooniKoreaFestivalQuery(userText) {
  return FESTIVAL_INTENT_RE.test(String(userText || ''));
}

function mondayOfWeekContaining(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + offset);
  return x;
}

/**
 * @param {number} weeksAhead 0=이번 주(월~일)
 * @param {Date} now
 */
function calendarWeekRange(weeksAhead, now) {
  const mon = mondayOfWeekContaining(now);
  mon.setDate(mon.getDate() + weeksAhead * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { startYmd: toYmd(mon), endYmd: toYmd(sun) };
}

function weekendInWeek(weeksAhead, now) {
  const { startYmd, endYmd } = calendarWeekRange(weeksAhead, now);
  const mon = new Date(
    Number(startYmd.slice(0, 4)),
    Number(startYmd.slice(4, 6)) - 1,
    Number(startYmd.slice(6, 8)),
  );
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { startYmd: toYmd(fri), endYmd: toYmd(sun) };
}

/**
 * @param {string} userText
 * @param {Date} [now]
 * @returns {{ startYmd: string, endYmd: string, label: string } | null}
 */
export function parseMooniFestivalTimeWindow(userText, now = new Date()) {
  const text = String(userText || '');
  const hasWeekend = /주말/.test(text);

  let weeksAhead = null;
  if (/다다음\s*주/.test(text)) weeksAhead = 2;
  else if (/다음\s*주|내주/.test(text)) weeksAhead = 1;
  else if (/이번\s*주(?!말)/.test(text)) weeksAhead = 0;

  if (hasWeekend && weeksAhead == null) {
    const { startYmd, endYmd } = upcomingWeekendRange(now);
    return { startYmd, endYmd, label: '이번 주말' };
  }
  if (hasWeekend && weeksAhead != null) {
    const range = weekendInWeek(weeksAhead, now);
    const label =
      weeksAhead === 0 ? '이번 주 주말' : weeksAhead === 1 ? '다음 주 주말' : '다다음 주 주말';
    return { ...range, label };
  }
  if (weeksAhead != null) {
    const range = calendarWeekRange(weeksAhead, now);
    const label = weeksAhead === 0 ? '이번 주' : weeksAhead === 1 ? '다음 주' : '다다음 주';
    return { ...range, label };
  }
  if (hasWeekend) {
    const { startYmd, endYmd } = upcomingWeekendRange(now);
    return { startYmd, endYmd, label: '이번 주말' };
  }

  const rolling = rolling30DayRangeYmd(now);
  return {
    startYmd: rolling.eventStartDate,
    endYmd: rolling.eventEndDate,
    label: '앞으로 30일',
  };
}

/**
 * @param {string} userText
 * @param {string} [boundPlaceName]
 */
export function extractMooniFestivalLocationQuery(userText, boundPlaceName = '') {
  let t = String(userText || '')
    .replace(FESTIVAL_INTENT_RE, ' ')
    .replace(TIME_STRIP_RE, ' ')
    .replace(/[?？!！.。,，]/g, ' ')
    .trim();
  const q = normalizeFestivalQuery(t);
  if (q.length >= 2) return t.trim();
  const bound = String(boundPlaceName || '').trim();
  if (bound && bound !== 'MOONi') return bound;
  return '';
}

/**
 * @param {object[]} items
 * @param {{
 *   userText: string,
 *   boundPlaceName?: string,
 *   now?: Date,
 *   limit?: number,
 * }} opts
 */
export function selectMooniKoreaFestivalCandidates(items, opts) {
  const now = opts.now ?? new Date();
  const window = parseMooniFestivalTimeWindow(opts.userText, now);
  if (!window) return { window: null, candidates: [] };

  const locationQuery = extractMooniFestivalLocationQuery(
    opts.userText,
    opts.boundPlaceName,
  );
  let list = Array.isArray(items) ? items : [];
  if (locationQuery) {
    list = filterBySearchQuery(list, locationQuery);
  }

  const today = todayYmd(now);
  list = list.filter((item) => {
    const start = String(item?.eventStartDate || '');
    const endRaw = String(item?.eventEndDate || '');
    const end = /^\d{8}$/.test(endRaw) ? endRaw : start;
    if (!/^\d{8}$/.test(start)) return false;
    if (end < today) return false;
    return rangesOverlap(start, end, window.startYmd, window.endYmd);
  });

  list = [...list].sort((a, b) => compareFestivalsByOpenDate(a, b, now));
  const limit = Math.min(Math.max(Number(opts.limit) || 5, 1), 8);
  const candidates = list.slice(0, limit).map((item) => {
    const contentId = String(item.contentId || '').trim();
    const title = String(item.title || '').trim();
    const start = String(item.eventStartDate || '');
    const end = String(item.eventEndDate || start);
    return {
      contentId,
      title,
      startYmd: start,
      endYmd: end,
      periodLabel: formatFestivalPeriodLabel(start, end),
      addr: String(item.addr1 || '').trim(),
      url: gateoKoreaFestivalDetailUrl(contentId),
    };
  });

  return { window, candidates };
}

const NO_MATCH_KO = '매칭 없음';
const NO_MATCH_KO_DETAIL = '겹치는 행사가 없습니다';

/**
 * Calendar date in Asia/Seoul as YYYYMMDD.
 * @param {Date} [now]
 */
export function kstTodayYmd(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const pick = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${pick('year')}${pick('month')}${pick('day')}`;
}

/**
 * @param {string} startYmd
 * @param {string} endYmd
 * @param {string} todayYmdValue
 * @returns {'upcoming' | 'ongoing' | 'ended' | 'unknown'}
 */
export function festivalTimingStatus(startYmd, endYmd, todayYmdValue) {
  const start = String(startYmd || '');
  const end = /^\d{8}$/.test(String(endYmd || '')) ? String(endYmd) : start;
  const today = String(todayYmdValue || '');
  if (!/^\d{8}$/.test(start) || !/^\d{8}$/.test(today)) return 'unknown';
  if (today < start) return 'upcoming';
  if (today > end) return 'ended';
  return 'ongoing';
}

/** @param {string} fromYmd @param {string} toYmd */
export function ymdDayDelta(fromYmd, toYmd) {
  const toUtc = (ymd) =>
    Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)));
  return Math.round((toUtc(toYmd) - toUtc(fromYmd)) / 86400000);
}

function clipFact(value, max) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

/**
 * @param {Record<string, unknown>} festivalContext
 * @param {string} [locale]
 * @param {Date} [now]
 */
export function buildMooniBoundFestivalSystemHint(festivalContext, locale = 'ko', now = new Date()) {
  const ctx = festivalContext && typeof festivalContext === 'object' ? festivalContext : null;
  const title = String(ctx?.title || '').trim();
  if (!title) return '';

  const isEn = String(locale || 'ko').slice(0, 2) === 'en';
  const bundle = isEn ? EN : KO;
  const today = kstTodayYmd(now);
  const startYmd = String(ctx?.eventStartDate || '').trim();
  const endYmd = String(ctx?.eventEndDate || '').trim();
  const status = festivalTimingStatus(startYmd, endYmd, today);
  const lines = isEn
    ? [
        '[GATEO Korea festival — verified facts for this chat session]',
        'Use ONLY the facts below for the festival the user is viewing. Do not claim there is no matching festival or that it is missing from GATEO.',
        'Do not state booths, programs, crowd times, fees, parking, or shuttles that are not listed below.',
        bundle.festivalAnswerRules,
      ]
    : [
        '[GATEO 한국 축제 — 이 세션의 확인된 사실]',
        '아래는 사용자가 보고 있는 축제의 확인된 정보입니다. 이 축제에 대해 답하세요. 「매칭 없음」「겹치는 행사가 없음」 등으로 안내하지 마세요.',
        '아래 목록에 없는 부스·프로그램·혼잡 시간·요금·주차·셔틀은 단정하지 마세요.',
        bundle.festivalAnswerRules,
      ];

  lines.push(isEn ? `- Today (KST): ${today}` : `- 오늘(한국시간 KST): ${today}`);
  if (status === 'upcoming') {
    lines.push(isEn ? '- Timing vs today: upcoming' : '- 오늘 기준 상태: 시작 전');
  } else if (status === 'ongoing') {
    lines.push(isEn ? '- Timing vs today: underway' : '- 오늘 기준 상태: 진행 중');
  } else if (status === 'ended') {
    lines.push(isEn ? '- Timing vs today: ended' : '- 오늘 기준 상태: 종료');
    lines.push(isEn
      ? '- The festival has ended. When you recall programs or atmosphere, use past tense (was open, ran, felt) rather than present tense.'
      : '- 이미 지난 행사라면, 프로그램·분위기를 회상할 때 과거형(열렸어요·이어졌어요·느꼈어요)으로 전해 주세요.');
  }

  lines.push(isEn ? `- Title: ${title}` : `- 제목: ${title}`);

  const shortDate = briefFestivalDate(startYmd, endYmd);
  const periodLabel = shortDate || String(ctx?.dateLabel || '').trim();
  if (periodLabel) {
    lines.push(isEn ? `- Dates: ${periodLabel}` : `- 날짜: ${periodLabel}`);
  }
  lines.push(
    isEn
      ? '- Write dates only in that short form. Do not write a countdown or a long calendar date such as "October 15, 2026".'
      : '- 답의 날짜는 위의 짧은 형식만 쓴다. 「N월 N일부터」와 「시작까지 N일 남았어요」「현재 시작까지」는 쓰지 않는다. 해요체만 쓰고, 반말(해/봐/좋아/추천해)과 「습니다」「입니다」로 끝내지 않는다. 「좋습니다」는 「좋아요」로 쓰고, 「하세요」는 써도 된다.',
  );
  lines.push(
    isEn
      ? '- Domestic festival in Korea. Do not mention visas or entry documents unless the user asked.'
      : '- 국내 축제다. 사용자가 비자·입국을 묻지 않으면 입국 증빙·입국 심사를 말하지 않는다.',
  );

  const transportLines = [];
  for (const origin of ctx?.transport?.origins || []) {
    for (const segment of origin.segments || []) {
      for (const row of segment.rows || []) {
        const bits = [row.grade, row.clock, row.duration, row.fare, row.count].filter(Boolean);
        if (!bits.length) continue;
        transportLines.push(`${segment.dep}→${segment.arr} ${bits.join(' ')}`);
      }
    }
  }
  if (transportLines.length) {
    lines.push(isEn
      ? `- Confirmed trains and buses. Say only these times and fares: ${transportLines.join(' | ')}`
      : `- 확인된 열차·버스. 이 시각과 요금만 말한다: ${transportLines.join(' | ')}`);
  }

  const timeText = String(ctx?.timeText || '').trim();
  if (timeText) {
    lines.push(isEn ? `- Hours: ${timeText}` : `- 시간: ${timeText}`);
  } else {
    const homepage = String(ctx?.homepage || '').trim();
    const tel = String(ctx?.tel || '').trim();
    const homeUrl = /^https?:\/\//i.test(homepage) ? homepage : 'url';
    lines.push(
      isEn
        ? `- Event hours are not in the festival data. For hours questions, use only the [official site](${homeUrl})${tel ? ` and ${tel}` : ''}. Do not send users to the GATEO detail page for hours.`
        : `- 행사 운영 시간이 이 데이터에 없다. 운영 시간 질문에는 GATEO 상세 링크 대신 [공식 홈페이지](${homeUrl})${tel ? `와 문의 ${tel}` : ''}만 안내한다.`,
    );
  }

  const feeText = String(ctx?.feeText || '').trim();
  if (feeText) lines.push(isEn ? `- Fee: ${feeText}` : `- 요금: ${feeText}`);

  const venueRaw = String(ctx?.venue || '').replace(/\s+/g, ' ').trim();
  const venue = festivalSpokenVenue(venueRaw);
  if (venue) lines.push(isEn ? `- Venue: ${venue}` : `- 장소: ${venue}`);
  if (venue && venue !== venueRaw) {
    lines.push(isEn
      ? `- Call this place "${venue}". Do not describe the venue as a parking lot.`
      : `- 장소는 «${venue}»로 말한다. «주차장»은 붙이지 않는다.`);
  }

  const address = String(ctx?.address || '').trim();
  if (address) lines.push(isEn ? `- Address: ${address}` : `- 주소: ${address}`);

  const transitGround = festivalAccessTransitGroundingLine(ctx, locale);
  if (transitGround) {
    lines.push(isEn ? `- Nearest station (GATEO): ${transitGround}` : `- 가까운 역(GATEO): ${transitGround}`);
  }

  const overview = speakVenuePhrases(clipFact(ctx?.overview, 700));
  if (overview && !isEn) lines.push(`- 개요: ${overview}`);

  const program = speakVenuePhrases(clipFact(ctx?.program, 500));
  if (program) lines.push(isEn ? `- Program: ${program}` : `- 프로그램: ${program}`);

  const nearby = filterVenueAreaNearbyNames(
    listedPlaceNames(ctx?.nearbyPlaces),
    { venue: ctx?.venue, address: ctx?.address },
  );
  if (nearby.length) {
    lines.push(isEn ? `- Nearby (GATEO): ${nearby.join(', ')}` : `- 근처(GATEO): ${nearby.join(', ')}`);
    if (!isEn) {
      lines.push('- 근처 장소는 «A, B, C» 또는 «A와 B, C»로 잇는다. «A와 B 그리고 C»처럼 쉼표 없이 «그리고»로 잇지 않는다.');
      if (venueAreaTokens({ venue: ctx?.venue, address: ctx?.address }).length) {
        lines.push(`- 장소 «${venue}»와 이름 줄기가 같은 명소는 근처로 다시 말하지 않는다.`);
      }
    }
  }
  const foodEntries = festivalFoodPlaceEntries(ctx?.nearbyRestaurants, isEn ? 'en' : 'ko', 4);
  if (foodEntries.length) {
    lines.push(isEn
      ? `- Nearby restaurants (GATEO 주변 맛집): ${foodEntries.map(formatFestivalFoodHintItem).join(', ')}`
      : `- 주변 맛집(GATEO): ${foodEntries.map(formatFestivalFoodHintItem).join(', ')}`);
    lines.push(`- ${festivalFoodCoach(isEn ? 'en' : 'ko', foodSparse(foodEntries))}`);
  }

  const gateoUrl =
    String(ctx?.gateoUrl || '').trim() || gateoKoreaFestivalDetailUrl(String(ctx?.contentId || ''));
  if (gateoUrl.startsWith('https://www.gateo.kr/')) {
    lines.push(isEn ? `- GATEO detail: ${gateoUrl}` : `- GATEO 상세: ${gateoUrl}`);
  }

  const homepage = String(ctx?.homepage || '').trim();
  if (/^https?:\/\//i.test(homepage)) {
    lines.push(isEn ? `- Official page URL: ${homepage}` : `- 공식 안내 URL: ${homepage}`);
    lines.push(isEn
      ? `- Write that official page only as [official site](${homepage}). Do not put the bare URL in parentheses.`
      : `- 그 공식 홈페이지는 [공식 홈페이지](${homepage})로만 쓴다. 괄호 안에 날 URL을 넣지 않는다.`);
    lines.push(isEn
      ? `- Encourage users to use that official page for parking, hours, and shuttles when those details are not listed below. Do not label a GATEO page as the official site.`
      : `- 주차·운영 시간·셔틀 등이 아래에 없으면, 위 [공식 홈페이지](${homepage})에서 최신 안내를 확인하도록 따뜻하게 안내해 주세요. GATEO 상세 페이지를 공식 홈페이지라고 부르지 않는다.`);
  } else {
    lines.push(isEn
      ? `- No verified official URL in the data. Do not invent domains (for example guessing go.kr hosts). Name the organizer and suggest finding their official site without a made-up link.`
      : `- 확인된 공식 URL이 없다. hp.go.kr 등 URL을 지어내지 않는다. 주관 기관 이름으로 공식 사이트를 찾도록 안내한다.`);
  }
  const tel = String(ctx?.tel || '').trim();
  if (tel) lines.push(isEn ? `- Contact phone: ${tel}` : `- 문의처: ${tel}`);
  const parking = String(ctx?.parking || '').trim();
  const parkingLots = parkingLotsForAnswer({
    parking,
    overview: ctx?.overview,
    sceneOverview: ctx?.sceneOverview,
    program: ctx?.program,
    venue: ctx?.venue,
    feeText: ctx?.feeText,
    nearbyParking: ctx?.nearbyParking,
    festivalTitle: ctx?.title,
  });
  const parkingKnown = hasFestivalParkingData({
    parking,
    overview: ctx?.overview,
    sceneOverview: ctx?.sceneOverview,
    program: ctx?.program,
    venue: ctx?.venue,
    feeText: ctx?.feeText,
    info: ctx?.info,
  }) || parkingLots.length > 0;
  if (parking && parkingKnown) {
    lines.push(isEn ? `- Parking: ${parking}` : `- 주차: ${parking}`);
  }
  const namedLots = parkingLots.filter((lot) => lot.name);
  if (namedLots.length) {
    lines.push(isEn
      ? `- Nearby parking: ${namedLots.map(parkingLotLabel).join(', ')}`
      : `- 근처 주차: ${namedLots.map(parkingLotLabel).join(', ')}`);
  }
  if (parkingLots.length) {
    lines.push(isEn
      ? '- For a parking question, introduce the lot name, place, and fee written above. Mention a walking time only when that parking line itself gives a distance or minutes.'
      : '- 주차 질문에는 위에 적힌 주차장 이름, 위치, 요금을 자연스러운 문장으로 소개한다. 걸어가는 시간은 그 줄에 거리나 분이 적혀 있을 때만 말한다.');
  } else if (!parkingKnown) {
    const telBit = tel
      ? (isEn ? ` Call ${tel}.` : ` 전화번호가 있으면 «문의 ${tel}»를 붙인다.`)
      : (isEn ? ' Do not mention a contact number.' : ' 전화번호가 없으면 문의 문장을 쓰지 않는다.');
    lines.push(isEn
      ? `- Parking is not in the festival data. When that is the case, link the official site${/^https?:\/\//i.test(homepage) ? ` (${homepage})` : ''}.${telBit} Do not repeat "check". Do not say "through the contact" without a number. Do not tell the user to see or find parking on the festival page. A parking-lot place name is not parking data.`
      : `- 주차 정보가 이 데이터에 없다. 그때는 공식 홈페이지 링크로 안내한다.${telBit} «확인»을 반복하지 않는다. 번호 없는 «문의처를 통해»와 «축제 페이지에서 살펴보세요»는 쓰지 않는다. «찾아볼 수 있어요», «알아볼», «볼 수 있어요»처럼 축제 페이지로 보내는 문장도 쓰지 않는다. 장소 이름의 «주차장»은 주차 정보가 아니다.`);
  }

  return `\n${lines.join('\n')}`;
}

/**
 * @param {{
 *   userText: string,
 *   boundPlaceName?: string,
 *   items?: object[],
 *   locale?: string,
 *   now?: Date,
 *   festivalContext?: Record<string, unknown> | null,
 * }} input
 * @returns {string}
 */
export function buildMooniKoreaFestivalSystemHint(input) {
  if (!isMooniKoreaFestivalQuery(input.userText)) return '';

  const boundCtx = input.festivalContext;
  if (boundCtx && String(boundCtx.title || '').trim()) {
    return buildMooniBoundFestivalSystemHint(boundCtx, input.locale, input.now);
  }
  const items = Array.isArray(input.items) ? input.items : [];
  const { window, candidates } = selectMooniKoreaFestivalCandidates(items, {
    userText: input.userText,
    boundPlaceName: input.boundPlaceName,
    now: input.now,
  });
  if (!window) return '';

  const locale = String(input.locale || 'ko').slice(0, 2);
  const isEn = locale === 'en';

  if (!candidates.length) {
    return isEn
      ? `\n[GATEO Korea festivals — no matches]\n- The user asked about Korean festivals for: ${window.label} (${formatFestivalPeriodLabel(window.startYmd, window.endYmd)}).\n- No festivals in GATEO data overlap this window and place filter. Say so briefly; do not invent festivals or URLs.`
      : `\n[GATEO 한국 축제 — 매칭 없음]\n- 사용자가 물은 기간: ${window.label}(${formatFestivalPeriodLabel(window.startYmd, window.endYmd)}).\n- GATEO 축제 데이터에 이 기간·지역과 겹치는 행사가 없습니다. 짧게 안내하고, 목록에 없는 축제명·링크를 만들지 마세요.`;
  }

  const lines = candidates.map(
    (c) =>
      `- ${c.title} · 기간 ${c.periodLabel}${c.addr ? ` · ${c.addr}` : ''} · contentId ${c.contentId} · ${c.url}`,
  );

  if (isEn) {
    return `\n[GATEO Korea festivals — use ONLY this list]\n- Question window: ${window.label} (${formatFestivalPeriodLabel(window.startYmd, window.endYmd)}). Exclude anything not listed.\n- Recommend only festivals below. Each line must appear in the answer with its period and the exact https://www.gateo.kr/korea/?festival= URL as a markdown link.\n- Do not recommend ended festivals or events outside this window.\n${lines.join('\n')}`;
  }

  return `\n[GATEO 한국 축제 — 아래 목록만 추천]\n- 사용자가 물은 기간: ${window.label}(${formatFestivalPeriodLabel(window.startYmd, window.endYmd)}). 이 기간과 겹치지 않거나 이미 끝난 행사는 추천하지 않는다.\n- **아래 목록에 있는 축제만** 추천한다. 각 축제는 **행사 기간**과 **정확한 GATEO 상세 URL**(https://www.gateo.kr/korea/?festival=…)을 마크다운 링크로 넣는다.\n- 목록에 없는 축제명·URL을 지어내지 않는다.\n${lines.join('\n')}`;
}

/**
 * @param {string} aiReply
 * @param {{ candidates: { title: string, periodLabel: string, url: string, contentId: string }[] }} ctx
 */
export function mergeMooniKoreaFestivalReply(aiReply, ctx) {
  const candidates = ctx?.candidates || [];
  if (!candidates.length) return aiReply ?? '';
  const reply = String(aiReply ?? '');
  const hasGateoFestivalLink = candidates.some(
    (c) => reply.includes(c.url) || reply.includes(`?festival=${c.contentId}`),
  );
  if (hasGateoFestivalLink) return reply;

  const blocks = candidates.map((c) => {
    const place = c.addr ? ` · ${c.addr}` : '';
    return `- **[${c.title}](${c.url})** (${c.periodLabel})${place}`;
  });
  const intro =
    'GATEO에 등록된 축제만 정리했습니다. 이름을 누르면 상세·일정으로 바로 갈 수 있습니다.\n\n';
  return `${reply.trim()}\n\n${intro}${blocks.join('\n')}`.trim();
}

/**
 * ChatModal · usePlaceChat 공통 — mooni_chat용 koreaFestivalHint.
 * @param {{
 *   userText: string,
 *   festivalContext?: Record<string, unknown> | null,
 *   boundPlaceName?: string,
 *   locale?: string,
 *   now?: Date,
 *   loadFestivalItems?: () => Promise<object[]>,
 * }} input
 * @returns {Promise<{ hint: string, candidates: object[] }>}
 */
export async function resolveMooniChatKoreaFestivalHint(input = {}) {
  const userText = String(input.userText || '');
  const festivalContext = input.festivalContext;
  if (festivalContext && String(festivalContext.title || '').trim()) {
    let hint = buildMooniBoundFestivalSystemHint(festivalContext, input.locale, input.now);
    const enFood = String(input.locale || '').slice(0, 2) === 'en';
    if (isFestivalAccessAsk({ userText, chipId: input.chipId })) {
      hint = trimBoundFestivalHintForAccess(hint, input.locale);
      const originRow = domesticFestivalGroundOrigin(userText, input.departureLabel);
      if (originRow) {
        const festId = String(festivalContext.contentId || '').trim();
        const gukhyangChip = festId === GUKHYANG_FESTIVAL_ID
          ? formatGukhyangAccessOriginGuidance(originRow, festivalContext.transport, input.locale)
          : '';
        const gangneungChip = festId === GANGNEUNG_FESTIVAL_ID
          ? formatGangneungAccessOriginGuidance(originRow, festivalContext.transport, input.locale)
          : '';
        const hubLine = gukhyangChip || gangneungChip || formatOriginHubGuidance(originRow, input.locale);
        hint += enFood
          ? `\n- Departure hubs for this chip: ${hubLine}`
          : `\n- 출발 칩 안내: ${hubLine}`;
      }
      for (const line of festivalAccessVenueGuidanceLines(festivalContext, input.locale)) {
        hint += `\n${line}`;
      }
      if (String(festivalContext.contentId || '') === '637693') {
        hint += enFood
          ? '\n- Order: public transit and station-to-venue hops (including Changwon Jungang as backup) first, then driving. Do not mention Changwon Jungang after the car paragraph.'
          : '\n- 순서: 열차·버스·역→축제장(창원중앙역 보조 포함) 안내를 먼저 쓰고, 그 다음에 자가용. 자가용 문단 뒤에 창원중앙역을 쓰지 않는다.';
      }
      hint += enFood
        ? '\n- This turn is only getting there. Do not repeat the festival welcome, overview, or program from the opening message — go straight from the chosen origin to the venue.'
        : '\n- 이번 답은 가는 법만이에요. 채팅 첫 인사·개요·프로그램 소개는 반복하지 말고, 고른 출발지에서 축제장까지 교통만 짧게 이어 주세요.';
      if (!festivalTransportHasTagoRows(festivalContext.transport)) {
        hint += enFood
          ? '\n- Getting there: when GATEO has no confirmed train or bus times for this departure, still describe real rail, express bus, and driving from the hubs above. Use only confirmed numbers; otherwise link [Korail](https://www.letskorail.com/), [BUSTAGO](https://www.bustago.or.kr/), [KOBUS](https://www.kobus.co.kr/), or [T-money express bus](https://txbus.t-money.co.kr/).'
          : '\n- 가는 법: GATEO에 이 출발지의 확인된 열차·버스 시각이 없을 수 있어요. 그래도 위 출발 역·터미널에서 실제 열차·고속버스·차 경로를 이어서 안내해 주세요. 시각·요금은 확인된 숫자만 말하고, 없으면 [코레일](https://www.letskorail.com/)·[버스타고](https://www.bustago.or.kr/)·[고속버스](https://www.kobus.co.kr/)·[시외버스](https://txbus.t-money.co.kr/) 링크로 확인할 수 있다고 알려 주세요.';
      }
    }
    const foodEntries = festivalFoodPlaceEntries(festivalContext.nearbyRestaurants, enFood ? 'en' : 'ko', 4);
    if (foodEntries.length && isFestivalFoodAsk({ userText, chipId: input.chipId })) {
      hint += enFood
        ? `\n- This question is where to eat. ${festivalFoodCoach('en', foodSparse(foodEntries))}`
        : `\n- 이번 질문은 근처 먹을 곳이다. ${festivalFoodCoach('ko', foodSparse(foodEntries))}`;
    }
    if (isFestivalLodgingAsk({ userText, chipId: input.chipId })) {
      const lodgingUrl = gateoKoreaFestivalLodgingUrl(festivalContext.contentId);
      const en = String(input.locale || '').slice(0, 2) === 'en';
      hint = hint
        .split('\n')
        .filter((line) => !/^- (?:날짜|Dates|오늘 기준 상태|Timing vs today):/.test(line.trim()))
        .join('\n');
      if (lodgingUrl) {
        const placeName = String(festivalContext.hubLabel || '').trim();
        const stayOrigin = { lat: festivalContext.lat, lng: festivalContext.lng };
        const stayRows = lodgingStayRows(festivalContext.nearbyStays, stayOrigin);
        const cardLabel = en ? 'lodging card' : '숙소 카드';
        if (stayRows.length) {
          hint += en
            ? `\n- Lodging answer: ${lodgingDistanceClause(stayRows, true)} End with one [${cardLabel}](${lodgingUrl}) link. Do not add area filler such as "find stays in the area" or "a variety of stays are located".`
            : `\n- 숙소 답: ${lodgingDistanceClause(stayRows, false)} 마지막은 [${cardLabel}](${lodgingUrl}) 한 번만. «인근으로 … 권역에서 숙소를 찾을 수 있어요», «숙소가 자리하고 있어요», «다양한 숙소가 자리하고 있어요», «매력을 느끼며»는 쓰지 않는다.`;
        } else if (lodgingStayNames(festivalContext.nearbyStays).length) {
          const sentence = lodgingUnmeasuredStayAnswer({
            contentId: festivalContext.contentId,
            locale: input.locale,
            venue: festivalContext.venue,
            address: festivalContext.address,
            placeName,
          });
          hint += en
            ? `\n- Lodging answer: Write only this: ${sentence} Do not name a hotel, pension, or resort. Do not say a stay is closest. Do not write kilometers. Do not tell the user to find stays in the area.`
            : `\n- 숙소 답: 이 문장만 쓴다: ${sentence} 숙소 이름은 쓰지 않는다. «가까운»은 쓰지 않는다. km를 붙이지 않는다. «권역에서 숙소를 찾을 수 있어요»는 쓰지 않는다.`;
        } else {
          const areas = lodgingAreaNames({
            venue: festivalContext.venue,
            placeName,
            stayAreas: festivalContext.stayAreas,
            lat: festivalContext.lat,
            lng: festivalContext.lng,
          });
          const label = festivalLodgingLinkLabel(placeName, input.locale);
          const areaLine = areas.length
            ? (en ? ` Stay areas: ${areas.join(', ')}.` : ` 숙소 권역: ${areas.join(', ')}.`)
            : '';
          hint += en
            ? `\n- Lodging answer: the stay list is empty. Name 2 or 3 stay areas within about 20 km of the venue, then end with [${label}](${lodgingUrl}). Do not name the next city. Do not write filler such as "for a comfortable rest", "a variety of stays", or "feel the charm". If the hint lists one stay area, name only that one. Do not answer with only a link. Do not use "here", "this link", or "this place" as the link text. No other stay URL.${areaLine}\n- Do not name non-stay facilities such as saunas, jjimjilbang, or bathhouses.\n- Lodging answer: do not restate the festival dates, a countdown, or a long calendar date. This overrides the festival date-comparison rule.`
            : `\n- 숙소 답: 숙소 목록이 없다. 짧게 답하고 [${label}](${lodgingUrl})로 끝낸다. «권역에서 숙소를 찾을 수 있어요»는 쓰지 않는다. 속초처럼 옆 도시는 말하지 않는다. «편안한 휴식을 위해», «다양한 숙소가 자리하고 있어요», «매력을 느끼며», «인근으로 … 권역에서 숙소를 찾을 수 있어요», «숙소가 자리하고 있어요» 같은 채움은 쓰지 않는다. 숙소 권역이 힌트에 있으면 그 이름만 짧게 말한다. 권역이 한 곳이면 그곳만 말한다. 링크만 두지 않는다. 「이곳」「여기」「이 링크」로 링크하지 않는다. 다른 숙소 URL은 쓰지 않는다.${areaLine}\n- 사우나·찜질방·목욕탕처럼 숙소가 아닌 시설은 말하지 않는다.\n- 숙소 답에는 행사 기간을 다시 말하지 않는다. «현재 시작까지 N일 남았습니다»와 «2026년 10월 15일부터» 같은 긴 날짜도 쓰지 않는다. 위의 기간 비교 규칙보다 이 문장이 우선한다.`;
        }
      }
    }
    return {
      hint: fitMooniKoreaFestivalHint(hint, undefined, {
        userText,
        chipId: input.chipId,
      }),
      candidates: [],
    };
  }

  if (!isMooniKoreaFestivalQuery(userText)) {
    return { hint: '', candidates: [] };
  }

  let items = [];
  try {
    if (typeof input.loadFestivalItems === 'function') {
      items = await input.loadFestivalItems();
    }
  } catch {
    items = [];
  }
  if (!items.length) {
    return { hint: '', candidates: [] };
  }

  const picked = selectMooniKoreaFestivalCandidates(items, {
    userText,
    boundPlaceName: input.boundPlaceName,
    now: input.now,
  });

  const hint = buildMooniKoreaFestivalSystemHint({
    userText,
    boundPlaceName: input.boundPlaceName,
    items,
    locale: input.locale,
    now: input.now,
  });

  return {
    hint: fitMooniKoreaFestivalHint(hint, undefined, {
      userText,
      chipId: input.chipId,
    }),
    candidates: picked.candidates,
  };
}

export { NO_MATCH_KO, NO_MATCH_KO_DETAIL };
