/** MOONi가 출력한 「[버튼 텍스트]」 단독 줄 — UI 링크가 아님 */
const BRACKET_ONLY_LINE = /^\s*\[[^\]]+\]\s*$/gm;

const EXPLORE_USER_PATTERNS =
  /이곳은 어떤 곳|분위기와 치안|역사나 문화|왜 가볼 만한|추천 액티비티|맛집 추천|일정 짜|동행별 추천|치안과 현지|의료 후송|입국 심사에 필요/;

const PREP_HINT_IN_REPLY =
  /플래너|항공|입국|비자|관광세|예약 확인|여행 준비|GATEO/i;

/**
 * @param {string} text
 * @returns {{ text: string, hadBracketLinks: boolean }}
 */
/** AI가 환각한 버튼명 — UI에 없음 */
const PHANTOM_TICKET_SEARCH_LINE =
  /^.*예약\s*[·・]\s*티켓\s*검색.*$/gim;

const PHANTOM_DUAL_CTA_LINE =
  /^.*GATEO\s*플래너.*(?:와|과).*예약.*(?:버튼|티켓).*$/gim;

/**
 * @param {string} text
 * @param {{ stripPhantomTicketMention?: boolean }} [options]
 */
export function sanitizeMooniModelReply(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return { text: text ?? '', hadBracketLinks: false };
  }
  const hadBracketLinks = BRACKET_ONLY_LINE.test(text);
  BRACKET_ONLY_LINE.lastIndex = 0;
  let cleaned = text.replace(BRACKET_ONLY_LINE, '');
  if (options.stripPhantomTicketMention !== false) {
    cleaned = cleaned
      .replace(PHANTOM_TICKET_SEARCH_LINE, '')
      .replace(PHANTOM_DUAL_CTA_LINE, '');
  }
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return { text: cleaned, hadBracketLinks };
}

/**
 * 예약 CTA 없이 탐색·소개 답변일 때 플래너 안내 버튼 노출.
 *
 * @param {{
 *   slug?: string | null,
 *   hadBracketLinks?: boolean,
 *   bookingShow?: boolean,
 *   userText?: string,
 *   aiReplyText?: string,
 * }} params
 */
export function shouldShowMooniPlannerFollowUp({
  slug = null,
  hadBracketLinks = false,
  bookingShow = false,
  userText = '',
  aiReplyText = '',
} = {}) {
  if (!slug || bookingShow) return false;
  if (hadBracketLinks) return true;
  const user = String(userText ?? '');
  const reply = String(aiReplyText ?? '');
  if (EXPLORE_USER_PATTERNS.test(user)) return true;
  if (
    PREP_HINT_IN_REPLY.test(reply) &&
    /여행 준비|교통편|입국|예약|비자|관광세/.test(reply)
  ) {
    return true;
  }
  return false;
}
