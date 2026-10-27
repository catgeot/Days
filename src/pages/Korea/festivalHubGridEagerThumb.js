import { FESTIVAL_HUB_GRID_EAGER_THUMB_COUNT } from './festivalHubGridLayout.js';

/**
 * @param {number} index — position in the current filtered flat grid list
 * @param {number} [eagerCount]
 */
export function isFestivalHubGridEagerThumb(
  index,
  eagerCount = FESTIVAL_HUB_GRID_EAGER_THUMB_COUNT,
) {
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < eagerCount
  );
}

/**
 * Stable key segment so thumb priority resets when hub filters change (chip switch).
 * @param {{ listEpoch: string, index: number, contentId?: string | number }} p
 */
export function festivalHubGridThumbLoadKey({ listEpoch, index, contentId = '' }) {
  const eager = isFestivalHubGridEagerThumb(index) ? '1' : '0';
  return `${String(listEpoch)}|${eager}|${String(contentId)}`;
}
