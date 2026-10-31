/** AI 답변 «**13:30 **» — 닫는 ** 앞 공백이 있으면 GFM bold가 깨짐 */
export function normalizeMooniMarkdownBoldSpacing(markdown) {
  let out = String(markdown ?? '');
  for (let i = 0; i < 4; i += 1) {
    const next = out
      .replace(/\*\*([^*\n]+?)\s+\*\*/g, '**$1**')
      .replace(/\*\*\s+([^*\n]+?)\*\*/g, '**$1**');
    if (next === out) break;
    out = next;
  }
  return out;
}
