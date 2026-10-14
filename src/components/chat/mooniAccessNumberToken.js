import { visit, SKIP } from 'unist-util-visit';

/** Fare, clock, duration tokens in MOONi access prose (not calendar 10/31). */
export const MOONI_ACCESS_NUMBER_TOKEN_RE =
  /\d[\d,:~.\u2060\u00A0⁠–-]*\d(?:원|분)?/g;

/**
 * Card lines also keep «2시간 53분» / «2 hr 53 min» in one span.
 * MOONi prose stays on MOONI_ACCESS_NUMBER_TOKEN_RE (that one stops before 시간).
 */
const CARD_ACCESS_NUMBER_TOKEN_RE =
  /\d+시간(?:\s*\d+분)?|\d+\s*hr(?:\s+\d+\s*min)?|\d+\s*min|₩[\d,]+(?:[–~-]₩[\d,]+)?|\d{1,2}:\d{2}(?:\s*[~–-]\s*\d{1,2}:\d{2})?|\d{1,3}(?:,\d{3})+원|\d+원|\d+분|\d+회/g;

function splitAccessNumberTokens(value, pattern) {
  const text = String(value ?? '');
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start), accessNumber: false });
    parts.push({ text: match[0], accessNumber: true });
    last = start + match[0].length;
  }
  if (!parts.length) return [{ text, accessNumber: false }];
  if (last < text.length) parts.push({ text: text.slice(last), accessNumber: false });
  return parts;
}

export function splitMooniAccessNumberTokens(value) {
  return splitAccessNumberTokens(value, MOONI_ACCESS_NUMBER_TOKEN_RE);
}

export function splitCardAccessNumberTokens(value) {
  return splitAccessNumberTokens(value, CARD_ACCESS_NUMBER_TOKEN_RE);
}

function accessNumberTokenParts(value) {
  const parts = splitMooniAccessNumberTokens(value);
  if (parts.length === 1 && !parts[0].accessNumber) {
    return [{ type: 'text', value: parts[0].text }];
  }
  return parts.map((part) => (
    part.accessNumber
      ? {
          type: 'element',
          tagName: 'span',
          properties: {
            style: 'white-space:nowrap',
            dataMooniAccessNumber: 'true',
          },
          children: [{ type: 'text', value: part.text }],
        }
      : { type: 'text', value: part.text }
  ));
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
