/**
 * MooniChatMarkdownBoundary — markdown 렌더 실패 시 plain 본문(링크 없음).
 * @param {string} text
 */
export function mooniChatMarkdownPlainFallback(text) {
  let out = String(text ?? '');
  out = out.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  out = out.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  out = out.replace(/https?:\/\/[^\s<>)]+/gi, '');
  return out;
}
