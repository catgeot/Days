/** Distance bands for festival nearby cards (flag ON). */
export const NEARBY_BAND_WALK_KM = 1;
export const NEARBY_BAND_DRIVE_KM = 5;

const BAND_ORDER = ['walk', 'drive', 'far', 'unknown'];

/**
 * @param {number | null | undefined} distKm
 * @returns {'walk' | 'drive' | 'far' | 'unknown'}
 */
export function nearbyDistanceBand(distKm) {
  if (!Number.isFinite(distKm)) return 'unknown';
  if (distKm <= NEARBY_BAND_WALK_KM) return 'walk';
  if (distKm <= NEARBY_BAND_DRIVE_KM) return 'drive';
  return 'far';
}

/**
 * @param {Array<{ distKm?: number }>} items
 */
export function countNearbyDistanceBands(items) {
  const counts = { walk: 0, drive: 0, far: 0, unknown: 0 };
  for (const row of items || []) {
    counts[nearbyDistanceBand(row?.distKm)] += 1;
  }
  return counts;
}

/**
 * @param {Array<{ distKm?: number }>} items
 */
export function summarizeNearbyListItems(items) {
  const spots = (items || []).filter(Boolean);
  const counts = countNearbyDistanceBands(spots);
  const total = spots.length;
  let closestDistKm = null;
  let closestItem = null;
  for (const spot of spots) {
    if (!Number.isFinite(spot.distKm)) continue;
    if (closestDistKm == null || spot.distKm < closestDistKm) {
      closestDistKm = spot.distKm;
      closestItem = spot;
    }
  }
  return {
    total,
    counts,
    closestDistKm,
    closestName: closestItem?.name ? String(closestItem.name).trim() : '',
  };
}

/**
 * @param {{ walk: number, drive: number, far: number, unknown: number }} counts
 */
export function nearbyBandCountsTotal(counts) {
  return counts.walk + counts.drive + counts.far + counts.unknown;
}

/**
 * @param {object[]} pendingSpots
 * @param {Record<string, string>} bandTitles
 * @param {number} groupIndexSeed
 */
function distanceGroupsFromSpots(pendingSpots, bandTitles, groupIndexSeed) {
  /** @type {Map<string, object[]>} */
  const byBand = new Map();
  for (const spot of pendingSpots) {
    const band = nearbyDistanceBand(spot.distKm);
    const list = byBand.get(band) || [];
    list.push(spot);
    byBand.set(band, list);
  }
  /** @type {Array<{ kind: 'distance', band: string, id: string, title: string, items: object[] }>} */
  const out = [];
  let i = groupIndexSeed;
  for (const band of BAND_ORDER) {
    const items = byBand.get(band);
    if (!items?.length) continue;
    out.push({
      kind: 'distance',
      band,
      id: `distance-${band}-${i}`,
      title: bandTitles[band] || band,
      items,
    });
    i += 1;
  }
  return out;
}

/**
 * @param {Array<{ kind: 'spot', spot: object } | { kind: 'heading', title: string, listId: string, venueNote?: string }>} blocks
 * @param {Record<string, string>} bandTitles
 */
export function groupFestivalNearbyBlocks(blocks, bandTitles) {
  /** @type {Array<{ kind: 'distance' | 'heading', band?: string, id: string, title: string, venueNote?: string, items: object[] }>} */
  const displayGroups = [];
  /** @type {object[]} */
  let pendingSpots = [];
  /** @type {{ kind: 'heading', id: string, title: string, venueNote?: string, items: object[] } | null} */
  let currentHeading = null;

  const flushPending = () => {
    if (!pendingSpots.length) return;
    displayGroups.push(
      ...distanceGroupsFromSpots(pendingSpots, bandTitles, displayGroups.length),
    );
    pendingSpots = [];
  };

  const closeHeading = () => {
    if (!currentHeading) return;
    if (currentHeading.items.length) displayGroups.push(currentHeading);
    currentHeading = null;
  };

  for (const block of blocks || []) {
    if (block?.kind === 'heading') {
      flushPending();
      closeHeading();
      currentHeading = {
        kind: 'heading',
        id: `heading-${block.listId}`,
        title: String(block.title || '').trim(),
        venueNote: String(block.venueNote || '').trim(),
        items: [],
      };
      continue;
    }
    if (block?.kind === 'spot' && block.spot) {
      if (currentHeading) currentHeading.items.push(block.spot);
      else pendingSpots.push(block.spot);
    }
  }
  flushPending();
  closeHeading();
  return displayGroups;
}

/**
 * @param {object[]} items
 * @param {Record<string, string>} bandTitles
 */
export function groupFestivalNearbyItems(items, bandTitles) {
  const blocks = (items || []).map((spot) => ({ kind: 'spot', spot }));
  return groupFestivalNearbyBlocks(blocks, bandTitles);
}

/**
 * Flatten item list from display groups (for summary).
 * @param {ReturnType<typeof groupFestivalNearbyBlocks>} groups
 */
export function flattenNearbyDisplayGroups(groups) {
  const out = [];
  for (const g of groups || []) {
    for (const spot of g.items || []) out.push(spot);
  }
  return out;
}
