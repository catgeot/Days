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

/**
 * @param {{ item?: { addr1?: string }, intro?: { playtime?: string, usetimefestival?: string, eventplace?: string }, range?: string, freeLabel?: string }} input
 */
export function buildFestivalDetailSummary(input = {}) {
  const { item, intro, range, freeLabel = '무료' } = input;
  const timeText = stripHtml(intro?.playtime);
  const fee = formatFestivalFeeDisplay(intro?.usetimefestival, freeLabel);
  const placeText = pickFestivalPlaceText(intro?.eventplace, item?.addr1);
  const dateText = String(range || '').trim();
  return {
    dateText,
    timeText,
    fee,
    placeText,
  };
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
