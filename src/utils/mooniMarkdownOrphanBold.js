const FENCE_RE = /(```[\s\S]*?```)/g;

function splitMarkdownFences(markdown) {
  const parts = [];
  let last = 0;
  let m;
  const re = new RegExp(FENCE_RE.source, 'g');
  while ((m = re.exec(markdown)) !== null) {
    if (m.index > last) parts.push({ fenced: false, text: markdown.slice(last, m.index) });
    parts.push({ fenced: true, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < markdown.length) parts.push({ fenced: false, text: markdown.slice(last) });
  return parts.length ? parts : [{ fenced: false, text: String(markdown ?? '') }];
}

/** 짝 없이 남은 `**` — 코드 펜스 밖 prose만 (닫는 `**`까지 지우지 않음). */
function stripOrphanBoldInProse(text) {
  let s = String(text ?? '').replace(/\*\*\s{2,}\*\*/g, '');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const idx = s.indexOf('**', i);
    if (idx === -1) {
      out.push(s.slice(i));
      break;
    }
    out.push(s.slice(i, idx));
    const next = s.indexOf('**', idx + 2);
    if (next === -1) {
      i = idx + 2;
      continue;
    }
    const inner = s.slice(idx + 2, next);
    if (inner.includes('**') || inner.includes('\n')) {
      i = idx + 2;
      continue;
    }
    out.push(`**${inner}**`);
    i = next + 2;
  }
  return out.join('');
}

export function stripOrphanMarkdownBoldAsterisks(markdown) {
  return splitMarkdownFences(markdown)
    .map((part) => (part.fenced ? part.text : stripOrphanBoldInProse(part.text)))
    .join('');
}
