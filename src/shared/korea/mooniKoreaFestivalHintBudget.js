/**
 * gemini-proxy `optStr(koreaFestivalHint, 8000)` rejects a longer hint with 400.
 * Target stays under that cap. Shrink nearby and program lists first, then
 * collapse repeated timetable rows. A food question keeps restaurant names,
 * distances, and links, and drops non-food nearby places before those.
 * Do not drop rules, unique times, fares, or official links. The last cut is
 * a whole block or a ` | ` row, never a mid-line slice.
 */
export const MOONI_KOREA_FESTIVAL_HINT_MAX = 8000;
export const MOONI_KOREA_FESTIVAL_HINT_BUDGET = 7900;

const NEARBY_LIST_RE = /^- (?:근처\(GATEO\)|Nearby \(GATEO\)):/;
const PROGRAM_LIST_RE = /^- (?:프로그램|Program):/;
const OVERVIEW_RE = /^- (?:개요|Overview):/;
const TIMETABLE_RE = /^- (?:확인된 열차·버스|Confirmed trains and buses)\./;
const RESTAURANT_LINE_RE = /^- (?:주변 맛집\(GATEO\)|Nearby restaurants)\b/;
const FOOD_QUESTION_LINE_RE = /^- (?:이번 질문은 근처 먹을 곳|This question is where to eat)/;
const FOOD_ASK_RE = /먹을\s*곳|맛집|뭐\s*먹|어디서\s*먹|where\s+to\s+eat|what\s+(?:can|should)\s+i\s+eat|\brestaurants?\b/i;
const FOOD_NAME_RE = /식당|맛집|횟집|카페|제과|방앗간|치킨|국수|돈가스|돈까스|restaurant|cafe|bakery|sashimi|noodle|cutlet|\bmill\b/i;
const FOOD_DISTANCE_RE = /\((?:도보\s*\d+\s*분|차로\s*\d+\s*분|\d+\s*m|\d+-min walk|\d+-min drive|한식|양식|일식|중식|돈가스|제과|방앗간|치킨|카페|국수|횟집|cutlet|bakery|mill|chicken|cafe|noodles|sashimi)\)/;

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

function visiblePlaceName(item) {
  const text = String(item || '').trim();
  const linked = text.match(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/);
  const base = linked ? linked[1] : text;
  return base.replace(/\([^)]*\)/g, '').replace(/[.。]$/, '').replace(/\s+/g, ' ').trim();
}

function isRestaurantEntry(item, knownNames) {
  const name = visiblePlaceName(item);
  if (name && knownNames?.has(name)) return true;
  if (FOOD_NAME_RE.test(item) || FOOD_DISTANCE_RE.test(item)) return true;
  return false;
}

function namesFromListTail(tail) {
  const cut = String(tail || '').split(/\.\s*(?:«|Do not|Don't)/)[0];
  const names = [];
  for (const part of cut.split(',')) {
    const name = visiblePlaceName(part);
    if (!name || name.length > 40) continue;
    names.push(name);
  }
  return names;
}

function knownRestaurantNames(blocks) {
  const names = new Set();
  for (const block of blocks) {
    for (const line of block) {
      if (!RESTAURANT_LINE_RE.test(line) && !FOOD_QUESTION_LINE_RE.test(line)) continue;
      const colon = line.lastIndexOf(':');
      if (colon < 0) continue;
      for (const name of namesFromListTail(line.slice(colon + 1))) names.add(name);
    }
  }
  return names;
}

function isFoodBudgetAsk(hint, options = {}) {
  const chipId = String(options.chipId || '');
  if (chipId === 'food' || chipId === 'festival_nearby') return true;
  if (FOOD_ASK_RE.test(String(options.userText || ''))) return true;
  return String(hint || '').split('\n').some((line) => FOOD_QUESTION_LINE_RE.test(line));
}

function shrinkList(blocks, re, limit, dropItem) {
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
    let dropAt = items.length - 1;
    if (dropItem) {
      dropAt = -1;
      for (let i = items.length - 1; i >= 0; i -= 1) {
        if (dropItem(items[i])) {
          dropAt = i;
          break;
        }
      }
      if (dropAt < 0) return;
    }
    if (items.length <= 1) {
      blocks.splice(index, 1);
      return;
    }
    items.splice(dropAt, 1);
    block[lineAt] = items.length
      ? `${line.slice(0, colon + 1)} ${items.join(', ')}`
      : line.slice(0, colon + 1).trimEnd();
    if (!items.length) {
      blocks.splice(index, 1);
      return;
    }
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
  if (probe && typeof probe === 'object') {
    const row = { before: before.length, after: after.length };
    if (Array.isArray(probe)) probe.push(row);
    else probe.last = row;
  }
  if (process.env.NODE_ENV !== 'development') return;
  console.info(
    `[mooni] koreaFestivalHint chars before=${before.length} after=${after.length}`,
  );
}

/**
 * @param {string} hint
 * @param {number} [budget]
 * @returns {string}
 */
export function fitMooniKoreaFestivalHint(hint, budget = MOONI_KOREA_FESTIVAL_HINT_BUDGET, options = {}) {
  const source = String(hint || '');
  const limit = Number.isFinite(budget) ? budget : MOONI_KOREA_FESTIVAL_HINT_BUDGET;
  if (source.length <= limit) {
    remember(source, source);
    return source;
  }

  const blocks = splitBlocks(source);
  const foodAsk = isFoodBudgetAsk(source, options);
  const restaurantNames = foodAsk ? knownRestaurantNames(blocks) : null;
  const dropNearbyItem = foodAsk
    ? (item) => !isRestaurantEntry(item, restaurantNames)
    : undefined;
  shrinkList(blocks, NEARBY_LIST_RE, limit, dropNearbyItem);
  shrinkList(blocks, PROGRAM_LIST_RE, limit);
  if (joinBlocks(blocks).length > limit) dedupeTimetable(blocks);
  if (joinBlocks(blocks).length > limit) shrinkList(blocks, OVERVIEW_RE, limit);
  if (joinBlocks(blocks).length > limit) dropMatchingBlock(blocks, OVERVIEW_RE);
  if (joinBlocks(blocks).length > limit) dropNearbyAsides(blocks, limit);

  let text = joinBlocks(blocks);
  if (text.length > MOONI_KOREA_FESTIVAL_HINT_MAX) {
    shrinkList(blocks, NEARBY_LIST_RE, limit, dropNearbyItem);
    if (!foodAsk) dropMatchingBlock(blocks, NEARBY_LIST_RE);
    dropMatchingBlock(blocks, PROGRAM_LIST_RE);
    dropMatchingBlock(blocks, OVERVIEW_RE);
    dropNearbyAsides(blocks, limit);
    dropTimetableTail(blocks, limit);
    text = joinBlocks(blocks);
  }
  if (foodAsk && text.length > MOONI_KOREA_FESTIVAL_HINT_MAX) {
    shrinkList(blocks, NEARBY_LIST_RE, limit);
    shrinkList(blocks, RESTAURANT_LINE_RE, limit);
    dropTimetableTail(blocks, limit);
    text = joinBlocks(blocks);
  }

  remember(source, text);
  return text;
}
