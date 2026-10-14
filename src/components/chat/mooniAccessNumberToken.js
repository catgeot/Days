import { visit, SKIP } from 'unist-util-visit';

/** Fare, clock, duration tokens in MOONi access prose (not calendar 10/31). */
export const MOONI_ACCESS_NUMBER_TOKEN_RE =
  /\d[\d,:~.\u2060\u00A0⁠–-]*\d(?:원|분)?/g;

function accessNumberTokenParts(value) {
  const text = String(value ?? '');
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(MOONI_ACCESS_NUMBER_TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > last) {
      parts.push({ type: 'text', value: text.slice(last, start) });
    }
    parts.push({
      type: 'element',
      tagName: 'span',
      properties: {
        style: 'white-space:nowrap',
        dataMooniAccessNumber: 'true',
      },
      children: [{ type: 'text', value: match[0] }],
    });
    last = start + match[0].length;
  }
  if (!parts.length) return [{ type: 'text', value: text }];
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

/** Rehype — keep clock/fare units on one line in WebKit narrow bubbles. */
export function rehypeMooniWrapAccessNumberTokens() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || !Array.isArray(parent.children)) return;
      const tag = parent.tagName;
      if (tag === 'code' || tag === 'pre' || tag === 'a') return;
      const next = accessNumberTokenParts(node.value);
      if (next.length === 1 && next[0].type === 'text') return;
      parent.children.splice(index, 1, ...next);
      return [SKIP, index + next.length];
    });
  };
}
