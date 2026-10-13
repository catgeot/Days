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
import { festivalAccessAskIsRoute } from '../../pages/Korea/lib/festivalTransportCard.js';
import {
  domesticFestivalGroundOrigin,
  formatOriginHubGuidance,
} from '../../pages/Home/lib/festivalDomesticOrigins.js';

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

const FESTIVAL_BOOKING_URL =
  /^https:\/\/(?:www\.)?(?:letskorail\.com|korail\.com|bustago\.or\.kr|kobus\.co\.kr|txbus\.t-money\.co\.kr)\/?/i;

const OFFICIAL_SITE_LABEL_RE = /^(?:공식\s*홈페이지|official\s+site)$/i;

export const FESTIVAL_ACCESS_KORAIL_URL = 'https://www.letskorail.com/';
export const FESTIVAL_ACCESS_BUSTAGO_URL = 'https://www.bustago.or.kr/';
export const FESTIVAL_ACCESS_KOBUS_URL = 'https://www.kobus.co.kr/';

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
  const body = String(text || '').trim();
  const en = String(locale || '').slice(0, 2) === 'en';
  const hasKorail = /letskorail\.com/i.test(body);
  const hasBustago = /bustago\.or\.kr/i.test(body);
  const hasKobus = /kobus\.co\.kr/i.test(body);
  if (hasKorail && hasBustago && hasKobus) return body;
  const links = [];
  if (!hasKorail) {
    links.push(en
      ? `[Korail](${FESTIVAL_ACCESS_KORAIL_URL})`
      : `[코레일](${FESTIVAL_ACCESS_KORAIL_URL})`);
  }
  if (!hasBustago) {
    links.push(en
      ? `[BUSTAGO](${FESTIVAL_ACCESS_BUSTAGO_URL})`
      : `[버스타고](${FESTIVAL_ACCESS_BUSTAGO_URL})`);
  }
  if (!hasKobus) {
    links.push(en
      ? `[KOBUS](${FESTIVAL_ACCESS_KOBUS_URL})`
      : `[고속버스](${FESTIVAL_ACCESS_KOBUS_URL})`);
  }
  if (!links.length) return body;
  const footer = en
    ? `\n\nCheck train and bus schedules on ${links.join(', ')}.`
    : `\n\n열차·버스 시각은 ${links.join(', ')}에서 편하게 확인할 수 있어요.`;
  return body ? `${body}${footer}` : footer.trim();
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
  let next = String(text || '').replace(
    /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
    (full, label, url) => {
      const clean = String(url || '').trim();
      if (OFFICIAL_SITE_LABEL_RE.test(String(label || '').trim()) && !sameOfficialUrl(clean, homepage)) {
        const linked = linkedOfficial(homepage);
        return linked ? stash(linked) : String(label || '').trim();
      }
      if (isAllowedFestivalMarkdownUrl(clean, homepage)) return stash(full);
      const linked = linkedOfficial(clean);
      return linked ? stash(linked) : '';
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
  return next
    .replace(/[(\[（「][ \t]*[)\]）」]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
    const row = { name, distKm: Number.isFinite(distKm) ? distKm : null };
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

export function isFestivalAccessAsk(input = {}) {
  if (String(input.chipId || '') === 'festival_access') return true;
  return festivalAccessAskIsRoute(String(input.userText || ''));
}

function festivalTransportHasTagoRows(transport) {
  for (const origin of transport?.origins || []) {
    for (const segment of origin.segments || []) {
      if ((segment.rows || []).length > 0) return true;
    }
  }
  return false;
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
  return result
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

function foodDistKm(raw) {
  const distKm = Number(raw?.distKm);
  return Number.isFinite(distKm) ? distKm : null;
}

/** One-word type from the name, otherwise a walk time or meters from the sheet. */
export function festivalFoodPlaceTag(name, distKm, locale = 'ko') {
  const text = String(name || '');
  const type = FOOD_TYPE_TAGS.find((row) => row.re.test(text));
  if (type) return String(locale || 'ko').slice(0, 2) === 'en' ? type.en : type.label;
  const km = Number(distKm);
  if (distKm == null || !Number.isFinite(km) || km <= 0) return '';
  const meters = Math.round(km * 1000);
  if (meters >= 80) {
    const minutes = Math.max(1, Math.round(meters / 80));
    return String(locale || 'ko').slice(0, 2) === 'en' ? `${minutes}-min walk` : `도보 ${minutes}분`;
  }
  const near = Math.max(1, meters);
  return String(locale || 'ko').slice(0, 2) === 'en' ? `${near} m` : `${near}m`;
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

/** 3–4 places that have a distance. A gap is filled by the next closest local. */
export function festivalFoodPlaceLabels(values, locale = 'ko', limit = 4) {
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
    })
    .slice(0, limit);
  return names.map((name) => {
    const tag = festivalFoodPlaceTag(name, foodDistKm(facts.get(name)), locale);
    return tag ? `${name}(${tag})` : name;
  });
}

function restaurantLead(names, locale = 'ko') {
  const shown = festivalFoodPlaceLabels(names, locale, 4);
  if (!shown.length) return '';
  if (String(locale || 'ko').slice(0, 2) === 'en') {
    return `Nearby places to eat: ${shown.join(', ')}.`;
  }
  const last = shown[shown.length - 1];
  const copula = syllableHasBatchim(last.slice(-1)) ? '이에요' : '예요';
  return `주변 맛집은 ${shown.join(', ')}${copula}.`;
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

/** With sheet names, the food answer is that list. Otherwise drop filler and invented markets. */
function ensureFestivalFoodAnswer(text, options = {}) {
  if (!isFestivalFoodAsk(options)) return String(text || '');
  const locale = String(options.locale || 'ko').slice(0, 2) === 'en' ? 'en' : 'ko';
  const lead = restaurantLead(options.nearbyRestaurants, locale);
  if (lead) return lead;
  const blob = restaurantNameBlob(options.nearbyRestaurants);
  let next = stripNextActionLabel(text);
  next = filterPreservingBreaks(next, (part) => (
    NON_RESTAURANT_PLACE_RE.test(part)
    || FOOD_DEFLECTION_RE.test(part)
    || FOOD_FILLER_RE.test(part)
    || (/중앙시장/.test(part) && !blob.includes('중앙시장'))
  ));
  return next;
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

const FESTIVAL_FILLER_SENTENCE_RE = /다양한 숙소가 자리|숙소가\s*자리하고|매력을 느끼며|인근으로[\s\S]{0,40}숙소를\s*찾을\s*수\s*있|특별한 순간을 경험해|The atmosphere is majestic|a variety of stays|feel the charm|find stays in the .* area/i;

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

export function polishFestivalModelReply(reply, options = {}) {
  let text = String(reply || '').trim();
  if (String(options.locale || 'ko').slice(0, 2) !== 'en') text = dropFestivalPlannerSentences(text);
  text = stripDisallowedFestivalLinks(text, options);
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
    text = rewriteVenueParkingLotPhrases(text, options);
    text = stripVenueAreaNearbyRepeat(text, options);
    text = polishWaAndGeurigoList(text);
    text = rewriteFoodEveningJoin(text);
    if (options.evening === false) text = stripUnverifiedEveningClause(text);
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
  text = ensureFestivalLodgingAnswer(text, options);
  text = stripOffTopicLodgingNudge(text, options);
  text = settleFestivalNextAction(text, options);
  text = dedupeFestivalPageLinks(redirectMissingPracticalCheck(text, options));
  if (String(options.chipId || '') === 'festival_access') {
    text = appendFestivalAccessBookingLinks(text, options.locale);
  }
  return text;
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
      });
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
  const restaurants = festivalFoodPlaceLabels(ctx?.nearbyRestaurants, isEn ? 'en' : 'ko', 4);
  if (restaurants.length) {
    lines.push(isEn
      ? `- Nearby restaurants (GATEO 주변 맛집): ${restaurants.join(', ')}`
      : `- 주변 맛집(GATEO): ${restaurants.join(', ')}`);
    lines.push(isEn
      ? '- Where to eat: name 3 or 4 of these places, each with the type or distance in parentheses. Every named place must have a distance. If one does not, use the next closest local place that does. Do not say to look for restaurants. Do not write filler such as a variety of restaurants, a culinary trip, or well-known spots. Do not invent a place that is not on this list, including a central market. Do not add a "next action" label, an unlinked getting-there line, or a lodging link. Do not call a community center, welfare center, bathhouse, sauna, or tunnel a place to eat.'
      : '- 근처 먹을 곳·맛집 질문: 위 이름 3~4곳만 말한다. 괄호의 한 단어 유형이나 거리(돈가스·제과·방앗간·도보 N분·N m)를 그대로 붙인다. 거리가 없는 곳은 빼고, 거리가 있는 다음으로 가까운 곳을 말한다. «주변의 맛집을 찾아보세요»처럼 이름을 빼지 않는다. «다양한 맛집», «미식 여행», «소문난»은 쓰지 않는다. 목록에 없는 장소는 만들지 않는다. 중앙시장은 목록에 있을 때만 말한다. «다음 행동으로»와 «다음 행동:» 머리말을 쓰지 않는다. 링크 없는 가는 법 문장과 숙소 링크, «숙소 정보도 함께 알아보세요»를 붙이지 않는다. 생활문화센터·복지관·목욕탕·사우나·터널·주민센터는 맛집으로 말하지 않는다.');
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
  const parkingKnown = hasFestivalParkingData({
    parking,
    overview: ctx?.overview,
    sceneOverview: ctx?.sceneOverview,
    program: ctx?.program,
    venue: ctx?.venue,
    feeText: ctx?.feeText,
    info: ctx?.info,
  });
  if (parking && parkingKnown) {
    lines.push(isEn ? `- Parking: ${parking}` : `- 주차: ${parking}`);
  } else if (!parkingKnown) {
    const telBit = tel
      ? (isEn ? ` Call ${tel}.` : ` 전화번호가 있으면 «문의 ${tel}»를 붙인다.`)
      : (isEn ? ' Do not mention a contact number.' : ' 전화번호가 없으면 문의 문장을 쓰지 않는다.');
    lines.push(isEn
      ? `- Parking is not in the festival data. Write only "Parking is on the [official site](${/^https?:\/\//i.test(homepage) ? homepage : 'url'})."${telBit} Do not repeat "check". Do not say "through the contact" without a number. Do not tell the user to see or find parking on the festival page. A parking-lot place name is not parking data.`
      : `- 주차 정보가 이 데이터에 없다. 답은 «주차 안내는 [공식 홈페이지](${/^https?:\/\//i.test(homepage) ? homepage : 'url'})에 있어요.»만 쓴다.${telBit} «확인»을 반복하지 않는다. 번호 없는 «문의처를 통해»와 «축제 페이지에서 살펴보세요»는 쓰지 않는다. «찾아볼 수 있어요», «알아볼», «볼 수 있어요»처럼 축제 페이지로 보내는 문장도 쓰지 않는다. 장소 이름의 «주차장»은 주차 정보가 아니다.`);
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
      const originRow = domesticFestivalGroundOrigin(userText, input.departureLabel);
      if (originRow) {
        const hubLine = formatOriginHubGuidance(originRow, input.locale);
        hint += enFood
          ? `\n- Departure hubs for this chip: ${hubLine}`
          : `\n- 출발 칩 안내: ${hubLine}`;
      }
      if (!festivalTransportHasTagoRows(festivalContext.transport)) {
        hint += enFood
          ? '\n- Getting there: GATEO has no confirmed train or bus times for this departure. Describe real routes (rail, express bus, driving) from the hubs above. Use only confirmed numbers for times and fares; otherwise link [Korail](https://www.letskorail.com/), [BUSTAGO](https://www.bustago.or.kr/), [KOBUS](https://www.kobus.co.kr/), or [T-money express bus](https://txbus.t-money.co.kr/). Never end with only a line that there are no confirmed times.'
          : '\n- 가는 법: GATEO에 이 출발지의 확인된 열차·버스 시각이 없을 수 있어요. 사용자는 당신을 믿고 이 축제에 갑니다. 위 출발 역·터미널에서 실제 열차·고속버스·차 경로를 이어서 안내해 주세요. 시각·요금은 확인된 숫자만 말하고, 없으면 [코레일](https://www.letskorail.com/)·[버스타고](https://www.bustago.or.kr/)·[고속버스](https://www.kobus.co.kr/)·[시외버스](https://txbus.t-money.co.kr/) 링크로 확인할 수 있다고 알려 주세요. 도착 역에서 끝내지 말고 축제장까지 마지막 구간과 자가용 옵션도 함께 안내해 주세요.';
      }
    }
    const foodNames = festivalFoodPlaceLabels(festivalContext.nearbyRestaurants, enFood ? 'en' : 'ko', 4);
    if (foodNames.length && isFestivalFoodAsk({ userText, chipId: input.chipId })) {
      hint += enFood
        ? `\n- This question is where to eat. Name these 3 or 4 places with their type or distance: ${foodNames.join(', ')}. Do not tell the user to look for restaurants. Do not invent a place, and do not write a "next action" label, an unlinked getting-there line, or a lodging link. This overrides a generic next-action rule.`
        : `\n- 이번 질문은 근처 먹을 곳이다. 3~4곳만 유형이나 거리와 함께 말한다: ${foodNames.join(', ')}. «맛집을 찾아보세요»처럼 이름을 빼지 않는다. «다양한 맛집», «미식 여행», «소문난»은 쓰지 않는다. «다음 행동으로»와 «다음 행동:» 머리말을 쓰지 않는다. 숙소 링크와 «숙소 정보도 함께 알아보세요»를 붙이지 않는다. 다른 다음 행동 규칙보다 이 문장이 우선한다.`;
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
