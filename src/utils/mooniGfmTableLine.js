/** GFM pipe table row — chip/CTA line strip must leave these intact. */
export function isMooniGfmTableLine(line) {
  const trimmed = String(line ?? '').trim();
  if (!trimmed.includes('|')) return false;
  if (/^\|(?:[^|\n]+\|)+\s*$/.test(trimmed)) return true;
  if (/^\|[\s\-:|\u2014]+\|\s*$/.test(trimmed)) return true;
  return false;
}
