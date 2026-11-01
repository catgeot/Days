/** Distance bands for festival nearby cards (flag ON). */
export const NEARBY_BAND_WALK_KM = 1;
export const NEARBY_BAND_DRIVE_KM = 5;
export const NEARBY_PHOTO_WIDE_ASPECT_CLASS = 'aspect-[16/9]';

const BAND_ORDER = ['walk', 'drive', 'far', 'unknown'];

const NEARBY_MASONRY_FOUR_ASPECT_SETS = [
  ['aspect-[3/4]', 'aspect-[4/3]', 'aspect-[5/4]', 'aspect-[4/5]'],
  ['aspect-[4/3]', 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-[5/4]'],
];

const NEARBY_MASONRY_TWO_ASPECT_SETS = [
  ['aspect-[4/5]', 'aspect-[4/3]'],
  ['aspect-[4/3]', 'aspect-[3/4]'],
];

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
/**
 * @param {object[]} items
 * @param {(spot: object) => boolean} [hasPhoto]
 */
export function sortNearbyBandItemsPhotoFirst(items, hasPhoto) {
  const photoFn = typeof hasPhoto === 'function' ? hasPhoto : () => false;
  return [...(items || [])].sort((a, b) => {
    const ap = photoFn(a) ? 0 : 1;
    const bp = photoFn(b) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    const da = Number.isFinite(a?.distKm) ? a.distKm : Number.POSITIVE_INFINITY;
    const db = Number.isFinite(b?.distKm) ? b.distKm : Number.POSITIVE_INFINITY;
    return da - db;
  });
}

function distanceGroupsFromSpots(pendingSpots, bandTitles, groupIndexSeed, hasPhoto) {
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
      items: sortNearbyBandItemsPhotoFirst(items, hasPhoto),
    });
    i += 1;
  }
  return out;
}

/**
 * @param {Array<{ kind: 'spot', spot: object } | { kind: 'heading', title: string, listId: string, venueNote?: string }>} blocks
 * @param {Record<string, string>} bandTitles
 */
export function groupFestivalNearbyBlocks(blocks, bandTitles, hasPhoto) {
  /** @type {Array<{ kind: 'distance' | 'heading', band?: string, id: string, title: string, venueNote?: string, items: object[] }>} */
  const displayGroups = [];
  /** @type {object[]} */
  let pendingSpots = [];
  /** @type {{ kind: 'heading', id: string, title: string, venueNote?: string, items: object[] } | null} */
  let currentHeading = null;

  const flushPending = () => {
    if (!pendingSpots.length) return;
    displayGroups.push(
      ...distanceGroupsFromSpots(
        pendingSpots,
        bandTitles,
        displayGroups.length,
        hasPhoto,
      ),
    );
    pendingSpots = [];
  };

  const closeHeading = () => {
    if (!currentHeading) return;
    if (currentHeading.items.length) {
      currentHeading.items = sortNearbyBandItemsPhotoFirst(
        currentHeading.items,
        hasPhoto,
      );
      displayGroups.push(currentHeading);
    }
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
export function groupFestivalNearbyItems(items, bandTitles, hasPhoto) {
  const blocks = (items || []).map((spot) => ({ kind: 'spot', spot }));
  return groupFestivalNearbyBlocks(blocks, bandTitles, hasPhoto);
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

/**
 * Partition photo card entries into staggered 2-column masonry segments and standalone wide rows
 * while keeping column counts even so no lone half-width card is left next to an empty column.
 */
export function partitionNearbyPhotoMasonrySegments(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const total = list.length;
  const segments = [];
  let cursor = 0;
  let columnBlockIndex = 0;

  while (cursor < total) {
    const remaining = total - cursor;
    if (remaining === 1) {
      segments.push({
        type: 'wide',
        entry: {
          item: list[cursor],
          index: cursor,
          thumbAspectClass: NEARBY_PHOTO_WIDE_ASPECT_CLASS,
          wide: true,
        },
      });
      cursor += 1;
      continue;
    }

    if (remaining === 2 || remaining === 3 || remaining === 6) {
      const aspects =
        NEARBY_MASONRY_TWO_ASPECT_SETS[
          columnBlockIndex % NEARBY_MASONRY_TWO_ASPECT_SETS.length
        ];
      columnBlockIndex += 1;
      const e0 = {
        item: list[cursor],
        index: cursor,
        thumbAspectClass: aspects[0],
        wide: false,
      };
      const e1 = {
        item: list[cursor + 1],
        index: cursor + 1,
        thumbAspectClass: aspects[1],
        wide: false,
      };
      segments.push({
        type: 'columns',
        entries: [e0, e1],
        columns: [[e0], [e1]],
      });
      cursor += 2;

      if (remaining === 3 || remaining === 6) {
        segments.push({
          type: 'wide',
          entry: {
            item: list[cursor],
            index: cursor,
            thumbAspectClass: NEARBY_PHOTO_WIDE_ASPECT_CLASS,
            wide: true,
          },
        });
        cursor += 1;
      }
      continue;
    }

    const aspects =
      NEARBY_MASONRY_FOUR_ASPECT_SETS[
        columnBlockIndex % NEARBY_MASONRY_FOUR_ASPECT_SETS.length
      ];
    columnBlockIndex += 1;
    const block = [0, 1, 2, 3].map((offset) => ({
      item: list[cursor + offset],
      index: cursor + offset,
      thumbAspectClass: aspects[offset],
      wide: false,
    }));
    segments.push({
      type: 'columns',
      entries: block,
      columns: [
        [block[0], block[2]],
        [block[1], block[3]],
      ],
    });
    cursor += 4;

    if (remaining !== 4) {
      segments.push({
        type: 'wide',
        entry: {
          item: list[cursor],
          index: cursor,
          thumbAspectClass: NEARBY_PHOTO_WIDE_ASPECT_CLASS,
          wide: true,
        },
      });
      cursor += 1;
    }
  }

  return segments;
}
