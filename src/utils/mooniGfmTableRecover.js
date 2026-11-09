import { isMooniGfmTableLine } from './mooniGfmTableLine.js';

const COLLAPSED_ROW_SPLIT = /\s+\|\s+\|\s+/g;

function recoverCollapsedTableLine(line) {
  const raw = String(line ?? '');
  if (!raw.includes('|')) return raw;
  if (!COLLAPSED_ROW_SPLIT.test(raw)) {
    COLLAPSED_ROW_SPLIT.lastIndex = 0;
    return raw;
  }
  COLLAPSED_ROW_SPLIT.lastIndex = 0;
  const out = raw.replace(COLLAPSED_ROW_SPLIT, '\n| ').trim();
  const rows = out
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      let row = r;
      if (!row.startsWith('|')) row = `| ${row}`;
      if (!row.endsWith('|')) row = `${row} |`;
      return row;
    });
  if (rows.length < 2) return raw;
  if (!rows.every((r) => isMooniGfmTableLine(r) || /^\|/.test(r))) return raw;
  return rows.join('\n');
}

/** Streaming·정규화로 행 사이 \\n이 사라진 한 줄짜리 GFM 표를 복구한다. */
export function recoverMooniCollapsedGfmTables(markdown) {
  const lines = String(markdown ?? '').split('\n');
  const out = lines.map((line) => recoverCollapsedTableLine(line));
  let joined = out.join('\n');
  if (!joined.includes('\n') && joined.includes('|')) {
    joined = recoverCollapsedTableLine(joined);
  }
  return joined;
}
