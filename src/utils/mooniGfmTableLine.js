function splitGfmTableCells(line) {
  const trimmed = String(line ?? '').trim();
  if (!trimmed.includes('|')) return null;
  let inner = trimmed;
  if (inner.startsWith('|')) inner = inner.slice(1);
  if (inner.endsWith('|')) inner = inner.slice(0, -1);
  const cells = inner
    .split(/\s*\|\s*/)
    .map((c) => c.trim())
    .filter((c, i, arr) => !(i === arr.length - 1 && c === ''));
  return cells.length ? cells : null;
}

function isAlignCell(cell) {
  const t = String(cell ?? '').trim();
  if (!t) return false;
  if (/^:?-{1,}:?$/.test(t)) return true;
  return /^:+$/.test(t);
}

/** GFM alignment row (`:---`, `---:`, `:---:`) — may omit outer `|`. */
export function isMooniGfmTableSeparatorLine(line) {
  const cells = splitGfmTableCells(line);
  if (!cells || cells.length < 2) return false;
  return cells.every(isAlignCell);
}

/** GFM pipe table row — chip/CTA line strip must leave these intact. */
export function isMooniGfmTableLine(line) {
  const trimmed = String(line ?? '').trim();
  if (!trimmed.includes('|')) return false;

  if (/^\|(?:[^|\n]+\|)+\s*$/.test(trimmed)) return true;
  if (/^\|[\s\-:|\u2014]+\|\s*$/.test(trimmed)) return true;
  if (/^\|[\s\-:|\u2014]+(?:\s*\|)+/.test(trimmed)) return true;

  const pipeCount = (trimmed.match(/\|/g) || []).length;
  if (pipeCount >= 4 && /\|\s*:+\s*(?:\||$)/.test(trimmed)) return true;

  if (isMooniGfmTableSeparatorLine(trimmed)) return true;

  const cells = splitGfmTableCells(trimmed);
  if (!cells || cells.length < 2) return false;
  if (cells.some((c) => !c)) return false;

  return true;
}
