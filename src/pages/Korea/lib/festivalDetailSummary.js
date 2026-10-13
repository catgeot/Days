import {
  formatEnglishThenKorean,
  translateDescriptiveKorean,
} from '../../../shared/korea/englishPlaceLabel.js';

function stripHtml(raw) {
  return String(raw || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const FREE_PHRASE_PATTERN = /입장\s*무료|관람\s*무료|무료\s*입장|무료\s*관람/i;

function isFeeFreeText(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/^무료$/i.test(t) || /^free$/i.test(t)) return true;
  if (FREE_PHRASE_PATTERN.test(t) && !/\d[\d,]*\s*원/.test(t)) return true;
  return false;
}

/**
 * @param {unknown} raw
 * @param {string} freeLabel
 */
export function formatFestivalFeeDisplay(raw, freeLabel) {
  const text = stripHtml(raw);
  if (!text) return null;
  if (isFeeFreeText(text)) {
    return { text: freeLabel, isFree: true, raw: text };
  }
  return { text, isFree: false, raw: text };
}

/**
 * @param {unknown} eventplace
 * @param {unknown} addr1
 */
export function pickFestivalPlaceText(eventplace, addr1) {
  const venue = String(eventplace || '').trim();
  const addr = String(addr1 || '').trim();
  if (venue && addr && venue !== addr) {
    return `${venue}\n${addr}`;
  }
  return venue || addr || '';
}

function hasHangul(text) {
  return /[가-힣\u3400-\u9fff]/.test(String(text || ''));
}

function normalizeFestivalPlaceLine(text) {
  return String(text || '')
    .replace(/함평\s+엑스포공원/g, '함평엑스포공원')
    .replace(/\s+/g, ' ')
    .trim();
}

function localizeFestivalTextLine(raw, { descriptive = false } = {}) {
  const text = normalizeFestivalPlaceLine(raw);
  if (!text || !hasHangul(text)) return text;
  if (descriptive) {
    const described = translateDescriptiveKorean(text);
    if (described && !hasHangul(described)) return `${described} (${text})`;
  }
  const labeled = formatEnglishThenKorean(text);
  if (labeled && labeled !== text) return labeled;
  return text;
}

/**
 * @param {string} placeText
 */
export function localizeFestivalPlaceText(placeText, locale) {
  if (String(locale || '').slice(0, 2) !== 'en') return placeText;
  const lines = String(placeText || '').split('\n');
  if (!lines.some((line) => hasHangul(line))) return placeText;
  return lines
    .map((line) => localizeFestivalTextLine(line.trim()))
    .filter(Boolean)
    .join('\n');
}

/**
 * @param {ReturnType<typeof formatFestivalFeeDisplay> | null} fee
 * @param {string} locale
 */
export function localizeFestivalFeeDisplay(fee, locale) {
  if (!fee || String(locale || '').slice(0, 2) !== 'en') return fee;
  if (!hasHangul(fee.text)) return fee;
  const lines = String(fee.raw || fee.text)
    .split('\n')
    .map((line) => localizeFestivalTextLine(line.trim(), { descriptive: true }))
    .filter(Boolean);
  return { ...fee, text: lines.join('\n') };
}

/**
 * @param {string} raw
 * @param {string} locale
 */
export function localizeFestivalDetailField(raw, locale) {
  if (String(locale || '').slice(0, 2) !== 'en') return String(raw || '').trim();
  const text = stripHtml(raw);
  if (!text) return '';
  if (!hasHangul(text)) return text;
  if (text.includes('\n')) {
    return text
      .split('\n')
      .map((line) => localizeFestivalTextLine(line.trim(), { descriptive: true }))
      .filter(Boolean)
      .join('\n');
  }
  return localizeFestivalTextLine(text, { descriptive: true });
}

/**
 * @param {{ item?: { addr1?: string, addr1En?: string }, intro?: { playtime?: string, usetimefestival?: string, usetimefestivalEn?: string, eventplace?: string, eventplaceEn?: string }, range?: string, freeLabel?: string, locale?: string }} input
 */
export function buildFestivalDetailSummary(input = {}) {
  const { item, intro, range, freeLabel = '무료', locale } = input;
  const timeText = stripHtml(intro?.playtime);
  const fee = formatFestivalFeeDisplay(intro?.usetimefestival, freeLabel);
  const placeText = pickFestivalPlaceText(intro?.eventplace, item?.addr1);
  const dateText = String(range || '').trim();
  const base = {
    dateText,
    timeText,
    fee,
    placeText,
  };
  if (String(locale || '').slice(0, 2) !== 'en') return base;
  let enPlace = placeText;
  if (intro?.eventplaceEn || item?.addr1En) {
    enPlace = pickFestivalPlaceText(
      intro?.eventplaceEn || intro?.eventplace,
      item?.addr1En || item?.addr1,
    );
  } else {
    enPlace = localizeFestivalPlaceText(placeText, locale);
  }
  let enFee = fee;
  if (intro?.usetimefestivalEn) {
    enFee = formatFestivalFeeDisplay(intro.usetimefestivalEn, freeLabel);
  } else {
    enFee = localizeFestivalFeeDisplay(fee, locale);
  }
  return { ...base, placeText: enPlace, fee: enFee };
}

/** Static TourAPI-shaped fixture for smoke (양양송이연어축제-like). */
export const FESTIVAL_DETAIL_SUMMARY_FIXTURE = {
  item: {
    contentId: '506708',
    addr1: '강원특별자치도 양양군 현남면 주청리 123',
    eventStartDate: '20250906',
    eventEndDate: '20250914',
  },
  intro: {
    playtime: '10:00~18:00',
    usetimefestival: '무료',
    eventplace: '양양 송어체험장',
  },
  range: '9.06 – 9.14',
};
