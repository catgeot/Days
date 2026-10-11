import { KO, EN } from '../../i18n/mooniPromptBundleData.js';
import { listCityAttractionHubs, resolveCityAttractionHub } from '../../pages/Home/lib/cityAttractionHubs.js';
import { englishLodgingAreaLabel, englishLodgingPlaceName } from './englishPlaceLabel.js';
import { ensureItineraryMarkdownLineBreaks } from '../../utils/mooniTruncatedContinue.js';
import { filterBySearchQuery, normalizeFestivalQuery } from '../../pages/Korea/festivalSearch.js';
import {
  compareFestivalsByOpenDate,
  rangesOverlap,
  todayYmd,
  upcomingWeekendRange,
  rolling30DayRangeYmd,
  toYmd,
} from '../../pages/Korea/festivalTimeFilter.js';

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

const NON_STAY_RE = /사우나|찜질|목욕탕|목욕|스파|sauna|jjimjilbang|bathhouse/i;
const NON_STAY_ASK_RE = /사우나|찜질|목욕|스파|sauna|jjimjilbang|bathhouse/i;
const BROADCAST_RE = /방청|공개\s*방송|시청자/;
const BROADCAST_ASK_RE = /방청|공개\s*방송|시청자|KBS|MBC|SBS/;
const TWELVE_GO_CTA_RE = /12\s*Go[^\n]{0,48}바로\s*가기|바로\s*가기[^\n]{0,48}12\s*Go|12go\.asia/i;

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
    .replace(/https?:\/\/(?:www\.)?12go\.asia\S*/gi, '');
  return filterPreservingBreaks(withoutLinks, (part) => TWELVE_GO_CTA_RE.test(part));
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
  return new RegExp(`(?:\\s*[-–—•]+\\s*)?${body}\\s*$`, 'i');
}

const ENTRY_DOC_RE = /입국\s*증빙|입국\s*심사|입국\s*서류|비자\s*서류|여행\s*증빙|예약\s*확인서|숙소\s*예약\s*확인|proof-of-stay|entry document|immigration document/i;
const ENTRY_ASK_RE = /비자|입국|visa|entry|immigration/i;

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Keep festival and lodging links. Drop every other model-written link. */
export function stripDisallowedFestivalLinks(text) {
  let next = String(text || '').replace(
    /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
    (full, _label, url) => (ALLOWED_FESTIVAL_URL.test(url) ? full : ''),
  );
  next = next.replace(/https?:\/\/[^\s)]+/g, (url) => {
    const clean = url.replace(/[.,]+$/, '');
    return ALLOWED_FESTIVAL_URL.test(clean) ? url : '';
  });
  return next.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function stripCtaLine(line) {
  let s = String(line || '').replace(/\[([^\]\n]+)\](?!\()/g, '');
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

/** Chip headings, CTA labels, separator leftovers, and bracket phrases with no URL. */
export function stripMooniUiChipLabels(text) {
  const lines = promoteDashListMarkers(text)
    .replace(/\[([^\]\n]+)\](?!\()/g, '')
    .split('\n')
    .map((line) => (line.trim() ? stripPlannerResidueLine(stripCtaLine(line)) : ''));
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
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
export function rankFestivalRestaurants(values, limit = 6) {
  const markets = [];
  const locals = [];
  const chains = [];
  const seen = new Set();
  for (const raw of Array.isArray(values) ? values : []) {
    const name = String(raw?.name || raw || '').replace(/\s+/g, ' ').trim();
    if (!name || NON_RESTAURANT_PLACE_RE.test(name) || seen.has(name)) continue;
    seen.add(name);
    if (isFestivalChainRestaurant(name)) chains.push(name);
    else if (/시장/.test(name)) markets.push(name);
    else locals.push(name);
  }
  const localCount = markets.length + locals.length;
  const ranked = localCount >= limit
    ? [...markets, ...locals]
    : [...markets, ...locals, ...chains];
  return ranked.slice(0, limit);
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

function isFestivalFoodAsk(input = {}) {
  if (String(input.chipId || '') === 'festival_nearby') return true;
  return FESTIVAL_FOOD_ASK_RE.test(String(input.userText || ''));
}

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
  return out.replace(/페이지에서\s*가는\s*법을\s*알아\s*보세요[.。]?/g, '').replace(/[ \t]{2,}/g, ' ').trim();
}

function restaurantLead(names) {
  const ranked = rankFestivalRestaurants(names, 6);
  const locals = ranked.filter((name) => !isFestivalChainRestaurant(name));
  const shown = (locals.length ? locals : ranked).slice(0, 3);
  if (!shown.length) return '';
  const last = shown[shown.length - 1];
  const copula = syllableHasBatchim(last.slice(-1)) ? '이에요' : '예요';
  return `주변 맛집은 ${shown.join(', ')}${copula}.`;
}

const FOOD_DEFLECTION_RE = /맛집(?:을|를)\s*찾아\s*보|find\s+(?:nearby\s+)?restaurants|look\s+for\s+(?:nearby\s+)?restaurants/i;

/** «다음 행동으로» / «다음 행동:» is a prompt label, not part of the answer. */
function stripNextActionLabel(text) {
  return String(text || '').replace(
    /(^|\n|(?<=[.!?。])\s*)다음\s*행동(?:으로)?\s*[:：]?\s*/g,
    '$1',
  );
}

/** Food answers keep 주변 맛집 names and drop community, welfare, bath, and tunnel lines. */
function ensureFestivalFoodAnswer(text, options = {}) {
  if (!isFestivalFoodAsk(options)) return String(text || '');
  let next = stripNextActionLabel(text);
  next = filterPreservingBreaks(next, (part) => NON_RESTAURANT_PLACE_RE.test(part));
  const restaurants = rankFestivalRestaurants(options.nearbyRestaurants);
  const locals = restaurants.filter((name) => !isFestivalChainRestaurant(name));
  if (restaurants.length) {
    next = filterPreservingBreaks(next, (part) => FOOD_DEFLECTION_RE.test(part));
  }
  if (locals.length) {
    next = filterPreservingBreaks(next, (part) => (
      isFestivalChainRestaurant(part) && !locals.some((name) => part.includes(name))
    ));
  }
  if (String(options.locale || 'ko').slice(0, 2) === 'en') return next;
  if (!restaurants.length || locals.some((name) => next.includes(name))) return next;
  const lead = restaurantLead(restaurants);
  return lead ? (next ? `${lead}\n\n${next}` : lead) : next;
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
  return next
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

function dropFestivalFillerSentences(text) {
  const stripped = String(text || '').replace(/편안한 휴식을 위해\s*/g, '');
  if (!/특별한 순간을 경험해|The atmosphere is majestic/i.test(stripped)) return stripped;
  return filterPreservingBreaks(stripped, (part) => /특별한 순간을 경험해\s*보세요|The atmosphere is majestic/i.test(part));
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

export function polishFestivalModelReply(reply, options = {}) {
  let text = String(reply || '').trim();
  if (String(options.locale || 'ko').slice(0, 2) !== 'en') text = dropFestivalPlannerSentences(text);
  text = stripDisallowedFestivalLinks(text);
  text = stripMooniUiChipLabels(text);
  text = expandCompactDates(text, options.locale);
  if (options.contentId) {
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
    text = stripTrailingFestivalDateSentence(text);
    text = dropDateLinkFragmentSentences(text);
    text = dedupeStaySearchLinks(text);
    text = stripNextActionLabel(text);
  }
  text = softenNightHour(text);
  text = dropFestivalFillerSentences(text);
  if (!isFestivalLodgingAsk(options)) {
    text = collapseDoubledFestivalCloser(text, options.festivalTitle);
  }
  text = ensureFestivalFoodAnswer(text, options);
  text = appendFestivalLodgingNextStep(ensureItineraryMarkdownLineBreaks(text), options);
  text = stripOffTopicLodgingNudge(text, options);
  return text;
}

const LODGING_NUDGE_RE = /숙소\s*정보|숙소\s*(?:도|를|카드|안내)|#festival-lodging|묵기\s*좋|where\s+to\s+stay|lodging\s+(?:card|guide)|stays?\s+for\s+this\s+festival/i;

/** A lodging closer stays only on a lodging question. */
function stripOffTopicLodgingNudge(text, options = {}) {
  if (isFestivalLodgingAsk(options)) return String(text || '');
  return filterPreservingBreaks(text, (part) => LODGING_NUDGE_RE.test(part));
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

  const timeText = String(ctx?.timeText || '').trim();
  if (timeText) lines.push(isEn ? `- Hours: ${timeText}` : `- 시간: ${timeText}`);

  const feeText = String(ctx?.feeText || '').trim();
  if (feeText) lines.push(isEn ? `- Fee: ${feeText}` : `- 요금: ${feeText}`);

  const venue = String(ctx?.venue || '').trim();
  if (venue) lines.push(isEn ? `- Venue: ${venue}` : `- 장소: ${venue}`);

  const address = String(ctx?.address || '').trim();
  if (address) lines.push(isEn ? `- Address: ${address}` : `- 주소: ${address}`);

  const overview = clipFact(ctx?.overview, 700);
  if (overview && !isEn) lines.push(`- 개요: ${overview}`);

  const program = clipFact(ctx?.program, 500);
  if (program) lines.push(isEn ? `- Program: ${program}` : `- 프로그램: ${program}`);

  const nearby = listedPlaceNames(ctx?.nearbyPlaces);
  if (nearby.length) {
    lines.push(isEn ? `- Nearby (GATEO): ${nearby.join(', ')}` : `- 근처(GATEO): ${nearby.join(', ')}`);
  }
  const restaurants = rankFestivalRestaurants(ctx?.nearbyRestaurants);
  if (restaurants.length) {
    lines.push(isEn
      ? `- Nearby restaurants (GATEO 주변 맛집): ${restaurants.join(', ')}`
      : `- 주변 맛집(GATEO): ${restaurants.join(', ')}`);
    lines.push(isEn
      ? '- Where to eat: name these restaurants. Do not say to look for restaurants, and do not add a "next action" label or a lodging link. Markets and local places come first. Leave out fast food and national chains, or put them last. Do not call a community center, welfare center, bathhouse, sauna, or tunnel a place to eat.'
      : '- 근처 먹을 곳·맛집 질문: 위 주변 맛집 이름을 그대로 말한다. «주변의 맛집을 찾아보세요»처럼 이름을 빼지 않는다. «다음 행동으로»와 «다음 행동:» 머리말을 쓰지 않는다. 숙소 링크와 «숙소 정보도 함께 알아보세요»를 붙이지 않는다. 시장·지역 식당을 먼저 말하고, 맥도날드·롯데리아·버거킹·맘스터치·스타벅스·파리바게뜨·배스킨라빈스 같은 전국 체인은 빼거나 맨 뒤에 둔다. 생활문화센터·복지관·목욕탕·사우나·터널·주민센터는 맛집으로 말하지 않는다.');
  }

  const gateoUrl =
    String(ctx?.gateoUrl || '').trim() || gateoKoreaFestivalDetailUrl(String(ctx?.contentId || ''));
  if (gateoUrl.startsWith('https://www.gateo.kr/')) {
    lines.push(isEn ? `- GATEO detail: ${gateoUrl}` : `- GATEO 상세: ${gateoUrl}`);
  }

  const homepage = String(ctx?.homepage || '').trim();
  if (/^https?:\/\//i.test(homepage)) {
    lines.push(isEn ? `- Official page URL: ${homepage}` : `- 공식 안내 URL: ${homepage}`);
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
    const foodNames = rankFestivalRestaurants(festivalContext.nearbyRestaurants);
    if (foodNames.length && isFestivalFoodAsk({ userText, chipId: input.chipId })) {
      const en = String(input.locale || '').slice(0, 2) === 'en';
      hint += en
        ? `\n- This question is where to eat. Name these places: ${foodNames.join(', ')}. Do not tell the user to look for restaurants. Do not write a "next action" label or a lodging link. This overrides a generic next-action rule.`
        : `\n- 이번 질문은 근처 먹을 곳이다. 주변 맛집 이름을 그대로 말한다: ${foodNames.join(', ')}. «맛집을 찾아보세요»처럼 이름을 빼지 않는다. «다음 행동으로»와 «다음 행동:» 머리말을 쓰지 않는다. 숙소 링크와 «숙소 정보도 함께 알아보세요»를 붙이지 않는다. 다른 다음 행동 규칙보다 이 문장이 우선한다.`;
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
          ? `\n- Lodging answer: name 2 or 3 stay areas within about 20 km of the venue, then end with [${label}](${lodgingUrl}). Do not name the next city. Do not write filler such as "for a comfortable rest". Do not answer with only a link. Do not use "here", "this link", or "this place" as the link text. No other stay URL.${areaLine}\n- Do not name non-stay facilities such as saunas, jjimjilbang, or bathhouses.\n- Lodging answer: do not restate the festival dates, a countdown, or a long calendar date. This overrides the festival date-comparison rule.`
          : `\n- 숙소 답: 축제장에서 약 20km 안의 숙소 권역 2~3곳만 말한 뒤 [${label}](${lodgingUrl})로 끝낸다. 속초처럼 옆 도시는 말하지 않는다. «편안한 휴식을 위해» 같은 채움은 쓰지 않는다. 링크만 두지 않는다. 「이곳」「여기」「이 링크」로 링크하지 않는다. 다른 숙소 URL은 쓰지 않는다.${areaLine}\n- 사우나·찜질방·목욕탕처럼 숙소가 아닌 시설은 말하지 않는다.\n- 숙소 답에는 행사 기간을 다시 말하지 않는다. «현재 시작까지 N일 남았습니다»와 «2026년 10월 15일부터» 같은 긴 날짜도 쓰지 않는다. 위의 기간 비교 규칙보다 이 문장이 우선한다.`;
      }
    }
    return { hint, candidates: [] };
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

  return { hint, candidates: picked.candidates };
}

export { NO_MATCH_KO, NO_MATCH_KO_DETAIL };
