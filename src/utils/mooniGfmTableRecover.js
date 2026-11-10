import { isMooniGfmTableLine } from './mooniGfmTableLine.js';

const COLLAPSED_ROW_SPLIT = /\s+\|\s+\|\s+/g;

const EMBEDDED_ROW_LABEL_RE =
  /^(.*?)\s+(주요 매력|분위기|이동 편의|추천 대상)$/u;

function splitEmbeddedRowLabel(cell) {
  const t = String(cell ?? '').trim();
  const m = t.match(EMBEDDED_ROW_LABEL_RE);
  if (!m?.[1]?.trim()) return [t];
  return [m[1].trim(), m[2]];
}

/** Header·align 셀에 붙은 ` :` / `: 라벨` 분해 */
function expandCollapsedTableCells(cells) {
  const out = [];
  for (const cell of cells) {
    const t = String(cell ?? '').trim();
    if (!t) continue;
    const headerTail = t.match(/^(.+?)\s+:\s*$/);
    if (headerTail && !isAlignCell(t)) {
      out.push(headerTail[1]);
      out.push(':');
      continue;
    }
    const alignHead = t.match(/^:+\s+(.+)$/);
    if (alignHead) {
      out.push(':');
      out.push(alignHead[1]);
      continue;
    }
    out.push(t);
  }
  return out;
}

function flattenBodyCells(cells) {
  const out = [];
  for (const cell of cells) {
    for (const piece of splitEmbeddedRowLabel(cell)) {
      out.push(piece);
    }
  }
  return out;
}

function isAlignCell(cell) {
  const t = String(cell ?? '').trim();
  if (!t) return false;
  if (/^:?-{1,}:?$/.test(t)) return true;
  return /^:+$/.test(t);
}

function splitTableCells(line) {
  const raw = String(line ?? '').trim();
  if (!raw.includes('|')) return null;
  const inner = raw.startsWith('|') ? raw.slice(1) : raw;
  const cells = inner
    .split(/\s*\|\s*/)
    .map((c) => c.trim())
    .filter((c, i, arr) => !(i === arr.length - 1 && c === ''));
  return cells.length >= 4 ? cells : null;
}

function formatTableRow(cells) {
  return `| ${cells.join(' | ')} |`;
}

function normalizeAlignRow(colCount) {
  return formatTableRow(Array.from({ length: colCount }, () => '---'));
}

/** Gemini·스트리밍에서 한 줄로 붙은 `cell | : | : | body` 표를 행 단위로 복구 */
function recoverMergedPipeCells(line) {
  let cells = splitTableCells(line);
  if (!cells) return null;
  cells = expandCollapsedTableCells(cells);

  let alignStart = -1;
  for (let i = 0; i < cells.length; i += 1) {
    if (isAlignCell(cells[i])) {
      alignStart = i;
      break;
    }
  }
  if (alignStart < 1) return null;

  let alignEnd = alignStart;
  while (alignEnd < cells.length && isAlignCell(cells[alignEnd])) alignEnd += 1;
  const colCount = alignEnd - alignStart;
  if (colCount < 2) return null;

  const header = cells.slice(0, alignStart);
  if (header.length < 2 || header.length !== colCount) return null;

  const rows = [formatTableRow(header), normalizeAlignRow(colCount)];
  let idx = alignEnd;
  const body = flattenBodyCells(cells.slice(idx));
  idx = 0;
  while (idx < body.length) {
    const slice = body.slice(idx, idx + colCount);
    if (slice.length < colCount) break;
    rows.push(formatTableRow(slice));
    idx += colCount;
  }
  if (rows.length < 2) return null;
  return rows.join('\n');
}

function recoverCollapsedTableLine(line) {
  const raw = String(line ?? '');
  if (!raw.includes('|')) return raw;

  const merged = recoverMergedPipeCells(raw);
  if (merged) return merged;

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
  if (!rows.every((r) => isMooniGfmTableLine(r))) return raw;
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
