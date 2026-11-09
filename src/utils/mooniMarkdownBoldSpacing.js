const MOONI_BOLD_OPEN =
  '(?:^|(?<=[\\s([{「『"\'.,，:：—\\-!?。]))\\*\\*';

/** AI 답변 «**13:30 **» — 닫는 ** 앞 공백이 있으면 GFM bold가 깨짐 */
export function normalizeMooniMarkdownBoldSpacing(markdown) {
  let out = String(markdown ?? '');
  const tailSpaceRe = new RegExp(`${MOONI_BOLD_OPEN}([^*\\n]+?)\\s+\\*\\*`, 'g');
  const leadSpaceRe = new RegExp(`${MOONI_BOLD_OPEN}\\s+([^*\\n]+?)\\*\\*`, 'g');
  for (let i = 0; i < 4; i += 1) {
    const next = out
      .replace(tailSpaceRe, '**$1**')
      .replace(leadSpaceRe, '**$1**');
    if (next === out) break;
    out = next;
  }
  return out.replace(/\*\*([^*\n]+?)\*\*(?=[\p{Script=Hangul}])/gu, '**$1** ');
}
