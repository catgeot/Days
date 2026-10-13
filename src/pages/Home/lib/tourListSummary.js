/**
 * 관광지 목록 써머리. Tour overview 전문이 아니라 첫 문장만.
 * 목록에 전문을 넣으면 행이 길어져 #93에서 되돌렸다.
 * @param {string | null | undefined} raw
 * @param {number} [maxLen]
 * @returns {string}
 */
export function tourListSummaryFromOverview(raw, maxLen = 96) {
  const text = String(raw || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length < 12) return '';
  const end = text.search(/다\.(?=\s|[가-힣「『(]|$)/);
  let sentence = (end >= 0 ? text.slice(0, end + 2) : text).trim();
  if (sentence.length > maxLen) {
    const cut = sentence.slice(0, maxLen);
    const sp = cut.lastIndexOf(' ');
    sentence = `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`;
  }
  return sentence;
}

/**
 * 목록 blurb가 주소뿐이면 써머리를 붙일 수 있다.
 * @param {string | null | undefined} blurb
 * @param {string | null | undefined} addr1
 */
export function isAddressOnlyBlurb(blurb, addr1) {
  const text = String(blurb || '').replace(/\s+/g, ' ').trim();
  if (!text || text === 'TourAPI 관광지') return true;
  const addr = String(addr1 || '').replace(/\s+/g, ' ').trim();
  if (addr && (text === addr || text === `${addr}`.trim())) return true;
  if (/다\./.test(text)) return false;
  return /(?:도|시|군|구|읍|면|리|로|길)\s*$/.test(text);
}

/**
 * 주소 행 뒤에 한 문장 써머리. 주소는 유지한다.
 * @param {string | null | undefined} blurb
 * @param {string | null | undefined} addr1
 * @param {string | null | undefined} summary
 */
export function blurbWithListSummary(blurb, addr1, summary) {
  const sentence = String(summary || '').trim();
  if (!sentence || !isAddressOnlyBlurb(blurb, addr1)) return String(blurb || '');
  const addr = String(addr1 || blurb || '').replace(/\s+/g, ' ').trim();
  if (!addr || sentence.startsWith(addr)) return sentence;
  return `${addr} · ${sentence}`;
}
