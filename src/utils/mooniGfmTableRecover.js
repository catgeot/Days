import { isMooniGfmTableLine } from './mooniGfmTableLine.js';

const COLLAPSED_ROW_SPLIT = /\s+\|\s+\|\s+/g;

function splitMaybeEmbeddedRowHeader(cell) {
  const t = String(cell ?? '').trim();
  if (!t || t.length < 12 || !/\s/.test(t)) return [t];
  for (let pos = t.lastIndexOf(' '); pos > 0; pos = t.lastIndexOf(' ', pos - 1)) {
    const left = t.slice(0, pos).trim();
    const right = t.slice(pos + 1).trim();
    if (!left || !right || right.includes(',') || /[,.]\s*$/.test(left)) continue;
    if (left.includes(',') && /적$|형$/.test(right)) continue;
    if (right.length < 3 || right.length > 16) continue;
    if (right.split(/\s+/).filter(Boolean).length > 3) continue;
    if (left.length < 6) continue;
    if (!left.includes(',') && !left.includes(' 및 ') && left.length < right.length + 6) continue;
    return [left, right];
  }
  return [t];
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

function flattenBodyCells(cells, colCount) {
  const body = [...cells];
  for (let attempt = 0; attempt < 12 && body.length % colCount !== 0; attempt += 1) {
    let splitAt = -1;
    for (let i = colCount - 1; i < body.length; i += colCount) {
      const parts = splitMaybeEmbeddedRowHeader(body[i]);
      if (parts.length > 1) {
        splitAt = i;
        break;
      }
    }
    if (splitAt < 0) {
      for (let i = body.length - 1; i >= 0; i -= 1) {
        const parts = splitMaybeEmbeddedRowHeader(body[i]);
        if (parts.length > 1) {
          splitAt = i;
          break;
        }
      }
    }
    if (splitAt < 0) break;
    const parts = splitMaybeEmbeddedRowHeader(body[splitAt]);
    body.splice(splitAt, 1, ...parts);
  }
  return body;
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

function resolveTableColumnCount(headerLen, alignLen) {
  if (headerLen < 2 || alignLen < 2) return null;
  if (headerLen === alignLen) return headerLen;
  if (Math.abs(headerLen - alignLen) === 1) {
    return Math.max(headerLen, alignLen);
  }
  return null;
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
  const alignLen = alignEnd - alignStart;
  const header = cells.slice(0, alignStart);
  const colCount = resolveTableColumnCount(header.length, alignLen);
  if (!colCount) return null;

  const rows = [formatTableRow(header), normalizeAlignRow(colCount)];
  const body = flattenBodyCells(cells.slice(alignEnd), colCount);
  let idx = 0;
  while (idx < body.length) {
    const slice = body.slice(idx, idx + colCount);
    if (slice.length < colCount) break;
    rows.push(formatTableRow(slice));
    idx += colCount;
  }
  if (rows.length < 3) return null;
  return rows.join('\n');
}

function looksLikeCollapsedPipeTable(line) {
  const raw = String(line ?? '');
  if (!raw.includes('|')) return false;
  const pipeCount = (raw.match(/\|/g) || []).length;
  if (pipeCount < 4) return false;
  if (/\|\s*:+\s*(?:\||$)/.test(raw)) return true;
  if (/\|\s*:-{1,}:?\s*(?:\||$)/.test(raw)) return true;
  return pipeCount >= 8;
}

function recoverCollapsedTableLine(line) {
  const raw = String(line ?? '');
  if (!raw.includes('|')) return raw;

  if (looksLikeCollapsedPipeTable(raw)) {
    const merged = recoverMergedPipeCells(raw);
    if (merged) return merged;
  }

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
