import { useEffect, useState } from 'react';
import {
  FESTIVAL_HUB_GRID_CLASS,
  distributeFestivalHubMasonryColumns,
  festivalHubPhotoLayout,
  partitionFestivalHubSegments,
} from '../../../Korea/festivalHubGridLayout.js';
export function useExploreMonthlyMasonryColumnCount() {
  const [columnCount, setColumnCount] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return 2;
    if (window.matchMedia('(min-width: 1024px)').matches) return 4;
    if (window.matchMedia('(min-width: 768px)').matches) return 3;
    return 2;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const lgQuery = window.matchMedia('(min-width: 1024px)');
    const mdQuery = window.matchMedia('(min-width: 768px)');
    const sync = () => {
      if (lgQuery.matches) setColumnCount(4);
      else if (mdQuery.matches) setColumnCount(3);
      else setColumnCount(2);
    };
    sync();
    lgQuery.addEventListener?.('change', sync);
    mdQuery.addEventListener?.('change', sync);
    return () => {
      lgQuery.removeEventListener?.('change', sync);
      mdQuery.removeEventListener?.('change', sync);
    };
  }, []);

  return columnCount;
}

/**
 * @param {Array<{ entry: { slug?: string }, spot: object }>} cards
 */
export function partitionExploreMonthlyPickSegments(cards, columnCount) {
  const list = cards || [];
  return partitionFestivalHubSegments(list, () => false, columnCount);
}

export function renderExploreMonthlyMasonryColumnRuns(entries, columnCount) {
  return distributeFestivalHubMasonryColumns(entries, columnCount);
}

export const EXPLORE_MONTHLY_MASONRY_GRID_CLASS = FESTIVAL_HUB_GRID_CLASS;
