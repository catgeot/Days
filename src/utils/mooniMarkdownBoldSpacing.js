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

/** AI 답변 «**13:30 **» — 닫는 ** 앞 공백이 있으면 GFM bold가 깨짐 */
export function normalizeMooniMarkdownBoldSpacing(markdown) {
  let out = String(markdown ?? '');
  const tailSpaceRe = new RegExp(`${MOONI_BOLD_OPEN}([^*\\n]+?)\\s+\\*\\*`, 'gu');
  const leadSpaceRe = new RegExp(`${MOONI_BOLD_OPEN}\\s+([^*\\n]+?)\\*\\*`, 'gu');
  for (let i = 0; i < 4; i += 1) {
    const next = out
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
      .replace(SPACED_BOLD_PAIR_RE, replaceSpacedBoldPair)
      .replace(OPEN_SPACE_TIGHT_CLOSE_RE, replaceTightBoldPair)
      .replace(TIGHT_OPEN_SPACE_CLOSE_RE, replaceTightBoldPair)
      .replace(tailSpaceRe, '**$1**')
      .replace(leadSpaceRe, '**$1**');
    if (next === out) break;
    out = next;
  }
  return out.replace(
    /\*\*([^\s*][^*\n]*?)\*\*(?=[\p{Script=Hangul}]{2,})/gu,
    (full, inner) => {
      const t = String(inner ?? '').trim();
      if (t.length < 2) return full;
      return `**${t}** `;
    },
  );
}
