/**
 * 본문 주변 카드 격자에서 사진 없는 칸의 아이콘.
 * 넓은 화면 4열 기준으로 이웃 아이콘이 겹치지 않게 고른다.
 * 좌우·위·대각 이웃과 같은 아이콘을 두지 않는다.
 * 시작 칸은 키 해시라 같은 장소는 같은 아이콘을 유지한다.
 */

export const SCENIC_NEARBY_ICON_IDS = {
  food: [
    'utensils',
    'utensils-crossed',
    'chef-hat',
    'cooking-pot',
    'hand-platter',
    'store',
    'soup',
    'coffee',
  ],
  leports: ['bike', 'waves', 'tent', 'fish', 'dumbbell', 'mountain'],
  culture: ['landmark', 'book', 'palette', 'camera', 'library', 'building'],
  festival: ['calendar', 'sparkles', 'ticket', 'music', 'flag', 'party'],
  attraction: ['landmark', 'mountain', 'trees', 'camera', 'map', 'compass'],
  hub: ['pin', 'landmark', 'compass', 'building', 'trees', 'mountain'],
};

export function hashNearbyIconKey(key) {
  let hash = 2166136261;
  const text = String(key || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function neighborIndexes(index, columnCount, length) {
  const col = index % columnCount;
  const out = [];
  if (col > 0) out.push(index - 1);
  if (index >= columnCount) out.push(index - columnCount);
  if (index >= columnCount && col > 0) out.push(index - columnCount - 1);
  if (index >= columnCount && col < columnCount - 1) {
    out.push(index - columnCount + 1);
  }
  return out.filter((j) => j >= 0 && j < length);
}

/**
 * @param {Array<{ key?: string, hasPhoto?: boolean }>} entries
 * @param {number} iconCount
 * @param {number} [columnCount]
 * @returns {Array<number | null>}
 */
export function assignNearbyIconSlots(entries, iconCount, columnCount = 2) {
  const count = Math.max(1, iconCount | 0);
  const cols = Math.max(1, columnCount | 0);
  const slots = new Array(entries.length).fill(null);
  for (let i = 0; i < entries.length; i += 1) {
    if (entries[i]?.hasPhoto) continue;
    const start = hashNearbyIconKey(entries[i]?.key) % count;
    const blocked = new Set();
    for (const j of neighborIndexes(i, cols, entries.length)) {
      if (slots[j] != null) blocked.add(slots[j]);
    }
    let pick = start;
    for (let step = 0; step < count; step += 1) {
      const candidate = (start + step) % count;
      if (!blocked.has(candidate)) {
        pick = candidate;
        break;
      }
    }
    slots[i] = pick;
  }
  return slots;
}

export function nearbyIconSlotsCollide(slots, columnCount = 2) {
  const cols = Math.max(1, columnCount | 0);
  for (let i = 0; i < slots.length; i += 1) {
    if (slots[i] == null) continue;
    for (const j of neighborIndexes(i, cols, slots.length)) {
      if (slots[j] != null && slots[j] === slots[i]) return true;
    }
  }
  return false;
}
