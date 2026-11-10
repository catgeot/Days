const MOONI_BOLD_OPEN =
  '(?:^|(?<=[\\s([{「『"\'.,，:：—\\-!?。]))\\*\\*';

const SPACED_BOLD_PAIR_RE = /(?:^|\s)\*\*\s+([^*\n]+?)\s+\*\*(?!\*)/g;
const OPEN_SPACE_TIGHT_CLOSE_RE = /(?:^|\s)\*\*\s+([^*\n]+?)\*\*(?!\*)/g;
const TIGHT_OPEN_SPACE_CLOSE_RE = /(?:^|\s)\*\*([^*\n]+?)\s+\*\*(?!\*)/g;
const BACK_TO_BACK_SPACED_BOLD_RE = /\*\*\s+([^*]+?)\s+\*\*\s+([^*\n]+?)\s+\*\*/g;
const BACK_TO_BACK_TIGHT_CLOSE_RE =
  /\*\*\s+([^*]+?)\*\*\s+\*\*\s+([^*\n]+?)\*\*/g;
const GLUE_TIGHT_THEN_SPACED_OPEN_RE =
  /\*\*([^*]+?)\*\*(\p{Script=Hangul})\s*\*\*\s+([^*\n]+?)\*\*/gu;
const GLUED_TEXT_BEFORE_SPACED_OPEN_RE =
  /([\p{Script=Hangul}.,!?])\*\*\s+([^*\n]+?)\*\*/gu;
const GLUED_HANGUL_BEFORE_OPEN_STAR_RE =
  /(?:^|(?<=\s))([\p{Script=Hangul}]{1,12})\*\*(?=\s)/gu;
const GLUE_BEFORE_INNER_BOLD_RE =
  /([과와을를이가은는의에도만])\*\*([\p{Script=Hangul}][^*\n]{0,40}?\*\*)/gu;

function shouldNormalizeSpacedBoldInner(inner) {
  const t = String(inner ?? '').trim();
  if (!t) return false;
  if (/^(?:and|or|for|to|in|on|at|the|a)$/i.test(t)) return false;
  if (/^for\s+travel$/i.test(t)) return false;
  if (/[\u3131-\uD79D]/.test(t)) return true;
  if (/\d/.test(t)) return true;
  if (/^[a-zA-Z0-9\s:：\-_/]+$/.test(t) && t.length <= 12) return false;
  return true;
}

function replaceSpacedBoldPair(full, inner) {
  if (!shouldNormalizeSpacedBoldInner(inner)) return full;
  const lead = /^\s/.test(full) ? full.slice(0, full.indexOf('**')) : '';
  return `${lead}**${String(inner).trim()}**`;
}

function replaceTightBoldPair(full, inner) {
  if (!shouldNormalizeSpacedBoldInner(inner)) return full;
  const lead = /^\s/.test(full) ? full.slice(0, full.indexOf('**')) : '';
  return `${lead}**${String(inner).trim()}**`;
}

const WELL_FORMED_BOLD = /\*\*([^\s*][^*\n]*?)\*\*(?!\*)/g;
const BOLD_SLOT = '\uE000B';

function maskWellFormedBold(markdown) {
  const slots = [];
  const masked = String(markdown ?? '').replace(WELL_FORMED_BOLD, (full, inner) => {
    if (/^\s/.test(inner) || /\s$/.test(inner)) return full;
    const id = slots.length;
    slots.push(full);
    return `${BOLD_SLOT}${id}${BOLD_SLOT}`;
  });
  return { masked, slots };
}

function unmaskWellFormedBold(masked, slots) {
  return String(masked ?? '').replace(
    new RegExp(`${BOLD_SLOT}(\\d+)${BOLD_SLOT}`, 'g'),
    (_, id) => slots[Number(id)] ?? '',
  );
}

/** AI 답변 «**13:30 **» — 닫는 ** 앞 공백이 있으면 GFM bold가 깨짐 */
export function normalizeMooniMarkdownBoldSpacing(markdown) {
  let out = String(markdown ?? '');
  const tailSpaceRe = new RegExp(`${MOONI_BOLD_OPEN}([^*\\n]+?)\\s+\\*\\*`, 'gu');
  const leadSpaceRe = new RegExp(`${MOONI_BOLD_OPEN}\\s+([^*\\n]+?)\\*\\*`, 'gu');
  for (let i = 0; i < 4; i += 1) {
    const { masked, slots } = maskWellFormedBold(out);
    const prev = out;
    const next = masked
      .replace(BACK_TO_BACK_SPACED_BOLD_RE, (full, a, b) => {
        if (!shouldNormalizeSpacedBoldInner(a) || !shouldNormalizeSpacedBoldInner(b)) return full;
        return `**${a.trim()}** **${b.trim()}**`;
      })
      .replace(BACK_TO_BACK_TIGHT_CLOSE_RE, (full, a, b) => {
        if (!shouldNormalizeSpacedBoldInner(a) || !shouldNormalizeSpacedBoldInner(b)) return full;
        return `**${a.trim()}** **${b.trim()}**`;
      })
      .replace(GLUE_TIGHT_THEN_SPACED_OPEN_RE, (full, a, glue, b) => {
        if (!shouldNormalizeSpacedBoldInner(a) || !shouldNormalizeSpacedBoldInner(b)) return full;
        return `**${a.trim()}**${glue} **${b.trim()}**`;
      })
      .replace(GLUED_TEXT_BEFORE_SPACED_OPEN_RE, (full, lead, inner, offset, whole) => {
        const before = String(whole ?? '').slice(0, offset);
        if (((before.match(/\*\*/g) || []).length % 2) === 1) return full;
        if (!shouldNormalizeSpacedBoldInner(inner)) return full;
        return `${lead} **${String(inner).trim()}**`;
      })
      .replace(GLUED_HANGUL_BEFORE_OPEN_STAR_RE, '$1 **')
      .replace(GLUE_BEFORE_INNER_BOLD_RE, (full, lead, rest) => `${lead} **${rest}`)
      .replace(SPACED_BOLD_PAIR_RE, replaceSpacedBoldPair)
      .replace(OPEN_SPACE_TIGHT_CLOSE_RE, replaceTightBoldPair)
      .replace(TIGHT_OPEN_SPACE_CLOSE_RE, replaceTightBoldPair)
      .replace(tailSpaceRe, (full, inner) => {
        const pad = /^\s/.test(full) ? full.slice(0, full.indexOf('**')) : '';
        return `${pad}**${String(inner).trim()}**`;
      })
      .replace(leadSpaceRe, (full, inner) => {
        const pad = /^\s/.test(full) ? full.slice(0, full.indexOf('**')) : '';
        return `${pad}**${String(inner).trim()}**`;
      });
    out = unmaskWellFormedBold(next, slots);
    if (out === prev) break;
  }
  return out;
}
