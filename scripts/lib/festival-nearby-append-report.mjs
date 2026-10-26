import { compareNearbyRestSpots, sortNearbyRestSpots } from '../../src/pages/Korea/lib/festivalNearbySights.js';

const INITIAL_VISIBLE = 5;
const VISIBLE_STEP = 4;

/**
 * @param {Array<{ id: string, title?: string, distanceKm?: number | null, localScenicListId?: string }>} restRows
 */
export function normalizeRestRow(row) {
  return {
    id: String(row?.id || '').trim(),
    title: String(row?.title || '').trim(),
    distanceKm: Number.isFinite(Number(row?.distanceKm)) ? Number(row.distanceKm) : null,
    localScenicListId: String(row?.localScenicListId || '').trim(),
  };
}

/**
 * @param {object[]} beforeRest
 * @param {object[]} afterRest
 * @param {number} visibleCountBefore
 * @param {number} [step]
 */
export function analyzeNearbyRestAppend(beforeRest, afterRest, visibleCountBefore, step = VISIBLE_STEP) {
  const before = beforeRest.map(normalizeRestRow);
  const after = afterRest.map(normalizeRestRow);
  const visible = Math.max(0, Number(visibleCountBefore) || INITIAL_VISIBLE);
  const prefixLen = Math.min(visible, before.length, after.length);

  const prefixOk =
    prefixLen > 0 && before.slice(0, prefixLen).every((row, i) => after[i]?.id === row.id);

  const shownBefore = new Set(before.slice(0, visible).map((row) => row.id));
  const remainingSorted = sortNearbyRestSpots(after.filter((row) => row.id && !shownBefore.has(row.id)));
  const expectedAppended = remainingSorted.slice(0, step).map((row) => ({
    id: row.id,
    title: row.title,
    distanceKm: row.distanceKm,
  }));

  const actualAppended = after.slice(visible, visible + step).map((row) => ({
    id: row.id,
    title: row.title,
    distanceKm: row.distanceKm,
  }));

  const appendedNextNearestOk =
    expectedAppended.length === step &&
    actualAppended.length === step &&
    expectedAppended.every((row, i) => row.id === actualAppended[i]?.id);

  const actualIds = new Set(actualAppended.map((row) => row.id));
  const maxAppendedDist = Math.max(
    ...actualAppended.map((row) => row.distanceKm).filter((n) => Number.isFinite(n)),
    -Infinity,
  );

  /** @type {Array<{ id: string, title: string, distanceKm: number | null, reason: string }>} */
  const skippedNearerCandidates = [];
  for (const row of remainingSorted) {
    if (actualIds.has(row.id)) continue;
    if (!Number.isFinite(row.distanceKm)) continue;
    if (Number.isFinite(maxAppendedDist) && row.distanceKm > maxAppendedDist + 0.05) break;
    if (shownBefore.has(row.id)) {
      skippedNearerCandidates.push({
        ...row,
        reason: 'already visible in rest prefix before 더보기',
      });
      continue;
    }
    skippedNearerCandidates.push({
      ...row,
      reason: appendedNextNearestOk
        ? 'not selected (unexpected)'
        : 'closer than an appended row but not in the next slice — rest tail order or expand merge',
    });
    if (skippedNearerCandidates.length >= 12) break;
  }

  return {
    visibleCountBefore: visible,
    prefixOk,
    expectedAppended,
    actualAppended,
    appendedNextNearestOk,
    skippedNearerCandidates,
    remainingSortedHead: remainingSorted.slice(0, visible + step + 4).map((row) => ({
      id: row.id,
      title: row.title,
      distanceKm: row.distanceKm,
    })),
  };
}

export { INITIAL_VISIBLE, VISIBLE_STEP, compareNearbyRestSpots };
