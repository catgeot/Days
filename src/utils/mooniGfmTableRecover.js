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

function isAlignOnlyRow(cells) {
  return Boolean(cells?.length >= 2 && cells.every((c) => isAlignCell(c)));
}

function lineLooksTableish(line) {
  const raw = String(line ?? '').trim();
  if (!raw.includes('|')) return false;
  const cells = splitTableCells(raw);
  if (!cells) return false;
  return isAlignOnlyRow(cells) || cells.length >= 3;
}

function blockAlreadyGfmTable(blockLines) {
  return blockLines.some((line) => {
    const t = String(line ?? '').trim();
    return /^\|/.test(t) && /\|\s*:?-{2,}:?\s*\|/.test(t);
  });
}

function assembleMultilineTableBlock(blockLines) {
  if (blockLines.length < 2) return null;
  if (blockAlreadyGfmTable(blockLines)) return null;
  let headerCells = expandCollapsedTableCells(splitTableCells(blockLines[0]) ?? []);
  if (headerCells.length < 2) return null;

  let bodyStart = 1;
  let colCount = headerCells.length;
  const maybeAlign = splitTableCells(blockLines[1]);
  if (maybeAlign && isAlignOnlyRow(maybeAlign)) {
    colCount = resolveTableColumnCount(headerCells.length, maybeAlign.length) ?? maybeAlign.length;
    bodyStart = 2;
  } else if (maybeAlign?.some(isAlignCell)) {
    const merged = recoverMergedPipeCells(blockLines.join(' '));
    if (merged) return merged;
  }

  const headerRow = headerCells.slice(0, colCount);
  while (headerRow.length < colCount) headerRow.push('');
  const rows = [formatTableRow(headerRow), normalizeAlignRow(colCount)];

  const bodyCells = [];
  for (let i = bodyStart; i < blockLines.length; i += 1) {
    const cells = expandCollapsedTableCells(splitTableCells(blockLines[i]) ?? []);
    if (!cells.length) continue;
  bodyCells.push(...cells);
  }
  const flatBody = flattenBodyCells(bodyCells, colCount);
  for (let idx = 0; idx < flatBody.length; idx += colCount) {
    const slice = flatBody.slice(idx, idx + colCount);
    if (slice.length < colCount) break;
    rows.push(formatTableRow(slice));
  }
  if (rows.length < 3) return null;
  return rows.join('\n');
}

function recoverMultilineTableBlocks(markdown) {
  const lines = String(markdown ?? '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      out.push(lines[i]);
      i += 1;
      continue;
    }
    if (!lineLooksTableish(trimmed)) {
      out.push(lines[i]);
      i += 1;
      continue;
    }

    const block = [];
    let j = i;
    while (j < lines.length) {
      const row = lines[j].trim();
      if (!row) {
        if (block.length >= 2) break;
        j += 1;
        continue;
      }
      if (!row.includes('|')) break;
      if (!lineLooksTableish(row) && block.length >= 2) break;
      if (lineLooksTableish(row) || block.length === 0) block.push(row);
      else break;
      j += 1;
    }

    const table = assembleMultilineTableBlock(block);
    if (table) {
      if (out.length && out[out.length - 1].trim() !== '') out.push('');
      out.push(table);
      if (j < lines.length && lines[j].trim() !== '') out.push('');
      i = j;
      continue;
    }
    if (block.length >= 2) {
      for (const row of block) out.push(row);
      i = j;
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }
  return out.join('\n');
}

function looksLikeUnparsedTableParagraph(paragraph) {
  const raw = String(paragraph ?? '');
  if (!raw.includes('|')) return false;
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.some((l) => !l.includes('|'))) return false;
  const pipeCount = (raw.match(/\|/g) || []).length;
  if (pipeCount < 6) return false;
  if (/^\s*\|/.test(raw) && /^\s*\|.*\|\s*$/m.test(raw) && /\|\s*---/.test(raw)) return false;
  return (
    /:\s*\|/.test(raw) ||
    /\|\s*:\s*\|/.test(raw) ||
    (pipeCount >= 10 && /\|\s*[^\n|]{2,}\s*\|/.test(raw))
  );
}

function recoverTableRunInChunk(chunk) {
  const lines = String(chunk ?? '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const row = lines[i];
    if (!String(row ?? '').includes('|')) {
      out.push(row);
      i += 1;
      continue;
    }
    let j = i;
    while (j < lines.length) {
      const t = String(lines[j] ?? '').trim();
      if (!t) break;
      if (!t.includes('|')) break;
      j += 1;
    }
    const block = lines.slice(i, j).map((l) => l.trim()).filter(Boolean);
    if (block.length >= 2) {
      const blockText = block.join('\n');
      if (looksLikeUnparsedTableParagraph(blockText) || block.some((l) => lineLooksTableish(l))) {
        const multiline = assembleMultilineTableBlock(block);
        const oneLine =
          multiline || recoverMergedPipeCells(block.join(' ').trim());
        if (oneLine) {
          if (out.length && String(out[out.length - 1] ?? '').trim() !== '') out.push('');
          out.push(...oneLine.split('\n'));
          if (j < lines.length && String(lines[j] ?? '').trim() !== '') out.push('');
          i = j;
          continue;
        }
      }
    }
    out.push(row);
    i += 1;
  }
  return out.join('\n');
}

function recoverTableParagraphSafetyNet(markdown) {
  const chunks = String(markdown ?? '').split(/(\n{2,})/);
  return chunks
    .map((chunk) => {
      if (!chunk || /^\n+$/.test(chunk)) return chunk;
      return recoverTableRunInChunk(chunk);
    })
    .join('');
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
  let md = recoverMultilineTableBlocks(String(markdown ?? ''));
  const lines = md.split('\n');
  const out = lines.map((line) => recoverCollapsedTableLine(line));
  md = out.join('\n');
  if (!md.includes('\n') && md.includes('|')) {
    md = recoverCollapsedTableLine(md);
  }
  md = recoverTableParagraphSafetyNet(md);
  return md;
}
