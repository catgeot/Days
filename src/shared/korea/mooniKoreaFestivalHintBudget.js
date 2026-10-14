/**
 * gemini-proxy `optStr(koreaFestivalHint, 8000)` rejects a longer hint with 400.
 * Target stays under that cap. Shrink nearby and program lists first, then
 * collapse repeated timetable rows. Do not drop rules, unique times, fares,
 * or official links. The last cut is a whole block or a ` | ` row, never a mid-line slice.
 */
export const MOONI_KOREA_FESTIVAL_HINT_MAX = 8000;
export const MOONI_KOREA_FESTIVAL_HINT_BUDGET = 7900;

const NEARBY_LIST_RE = /^- (?:근처\(GATEO\)|Nearby \(GATEO\)):/;
const PROGRAM_LIST_RE = /^- (?:프로그램|Program):/;
const OVERVIEW_RE = /^- (?:개요|Overview):/;
const TIMETABLE_RE = /^- (?:확인된 열차·버스|Confirmed trains and buses)\./;

function splitBlocks(hint) {
  const blocks = [];
  let buf = [];
  for (const line of String(hint || '').split('\n')) {
    if (line.startsWith('- ') && buf.length) {
      blocks.push(buf);
      buf = [];
    }
    buf.push(line);
  }
  if (buf.length) blocks.push(buf);
  return blocks;
}

function joinBlocks(blocks) {
  return blocks.map((block) => block.join('\n')).join('\n');
}

function listLineIndex(block, re) {
  return block.findIndex((line) => re.test(line));
}

function shrinkList(blocks, re, limit) {
  const index = blocks.findIndex((block) => listLineIndex(block, re) >= 0);
  if (index < 0) return;
  while (joinBlocks(blocks).length > limit) {
    const block = blocks[index];
    if (!block) return;
    const lineAt = listLineIndex(block, re);
    if (lineAt < 0) return;
    const line = block[lineAt];
    const colon = line.indexOf(':');
    if (colon < 0) {
      blocks.splice(index, 1);
      return;
    }
    const items = line.slice(colon + 1).trim().split(', ').filter(Boolean);
    if (items.length <= 1) {
      blocks.splice(index, 1);
      return;
    }
    items.pop();
    block[lineAt] = `${line.slice(0, colon + 1)} ${items.join(', ')}`;
  }
}

function dedupeTimetable(blocks) {
  for (const block of blocks) {
    const lineAt = block.findIndex((line) => TIMETABLE_RE.test(line));
    if (lineAt < 0) continue;
    const line = block[lineAt];
    const colon = line.lastIndexOf(': ');
    if (colon < 0) continue;
    const head = line.slice(0, colon + 2);
    const seen = new Set();
    const unique = [];
    for (const part of line.slice(colon + 2).split(' | ')) {
      if (!part || seen.has(part)) continue;
      seen.add(part);
      unique.push(part);
    }
    block[lineAt] = unique.length ? `${head}${unique.join(' | ')}` : head.trimEnd();
  }
}

function isNearbyAside(line) {
  return line.startsWith('- 근처 장소는 ')
    || (line.startsWith('- 장소 «') && line.includes('이름 줄기가 같은'));
}

function dropNearbyAsides(blocks, limit) {
  if (joinBlocks(blocks).length <= limit) return;
  if (blocks.some((block) => block.some((line) => NEARBY_LIST_RE.test(line)))) return;
  for (let i = blocks.length - 1; i >= 0 && joinBlocks(blocks).length > limit; i -= 1) {
    if (blocks[i].some((line) => isNearbyAside(line))) blocks.splice(i, 1);
  }
}

function dropMatchingBlock(blocks, re) {
  const index = blocks.findIndex((block) => block.some((line) => re.test(line)));
  if (index >= 0) blocks.splice(index, 1);
}

function dropTimetableTail(blocks, limit) {
  const block = blocks.find((item) => item.some((line) => TIMETABLE_RE.test(line)));
  if (!block) return;
  const lineAt = block.findIndex((line) => TIMETABLE_RE.test(line));
  while (joinBlocks(blocks).length > limit) {
    const line = block[lineAt];
    const cut = line.lastIndexOf(' | ');
    if (cut < 0) return;
    block[lineAt] = line.slice(0, cut);
  }
}

function remember(before, after) {
  const probe = globalThis.__GATEO_HINT_BUDGET_PROBE__;
  if (!probe || typeof probe !== 'object') return;
  const row = { before: before.length, after: after.length };
  if (Array.isArray(probe)) probe.push(row);
  else probe.last = row;
}

/**
 * @param {string} hint
 * @param {number} [budget]
 * @returns {string}
 */
export function fitMooniKoreaFestivalHint(hint, budget = MOONI_KOREA_FESTIVAL_HINT_BUDGET) {
  const source = String(hint || '');
  const limit = Number.isFinite(budget) ? budget : MOONI_KOREA_FESTIVAL_HINT_BUDGET;
  if (source.length <= limit) {
    remember(source, source);
    return source;
  }

  const blocks = splitBlocks(source);
  shrinkList(blocks, NEARBY_LIST_RE, limit);
  shrinkList(blocks, PROGRAM_LIST_RE, limit);
  if (joinBlocks(blocks).length > limit) dedupeTimetable(blocks);
  if (joinBlocks(blocks).length > limit) shrinkList(blocks, OVERVIEW_RE, limit);
  if (joinBlocks(blocks).length > limit) dropMatchingBlock(blocks, OVERVIEW_RE);
  if (joinBlocks(blocks).length > limit) dropNearbyAsides(blocks, limit);

  let text = joinBlocks(blocks);
  if (text.length > MOONI_KOREA_FESTIVAL_HINT_MAX) {
    dropMatchingBlock(blocks, NEARBY_LIST_RE);
    dropMatchingBlock(blocks, PROGRAM_LIST_RE);
    dropMatchingBlock(blocks, OVERVIEW_RE);
    dropNearbyAsides(blocks, limit);
    dropTimetableTail(blocks, limit);
    text = joinBlocks(blocks);
  }

  remember(source, text);
  return text;
}
