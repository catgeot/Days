/** micromark bold — 괄호가 있으면 `(` `)` 앞에 `\\`가 없을 때만 이스케이프 */
export function escapeMicromarkBoldParentheses(markdown) {
  let out = String(markdown ?? '').replace(
    /\*\*([^*\n]*?\([^)\n]*?\)[^*\n]*?)\*\*/g,
    (full, inner) => {
      const escaped = String(inner).replace(/(?<!\\)\(/g, '\\(').replace(/(?<!\\)\)/g, '\\)');
      return `**${escaped}**`;
    },
  );
  out = out.replace(
    /\*\*((?:\\.|[^*\\\n])+)\*\*(?=[\p{Script=Hangul}])/gu,
    (full, inner) =>
      /[\(\\]/.test(inner) || /[a-zA-Z0-9]/.test(inner) ? `${full} ` : full,
  );
  return out;
}
