import React, { useCallback, useMemo, useState } from 'react';
import ExploreMonthlyPickItem from './ExploreMonthlyPickItem';
import { festivalHubPhotoLayout } from '../../../Korea/festivalHubGridLayout.js';
import { EXPLORE_MONTHLY_PICK_HERO_INTRINSIC_SIZE } from '../../data/exploreMonthlyPickHeroUrls.js';
import {
  EXPLORE_MONTHLY_MASONRY_GRID_CLASS,
  partitionExploreMonthlyPickSegments,
  renderExploreMonthlyMasonryColumnRuns,
  useExploreMonthlyMasonryColumnCount,
} from './exploreMonthlyMasonryLayout.js';

function pickMonthlyPickVariant(isWideSlot) {
  if (isWideSlot) return 'wide';
  return 'tile';
}

const ExploreMonthlyPicksLayoutB = ({ cards, onSelectSpot }) => {
  const columnCount = useExploreMonthlyMasonryColumnCount();
  const [photoSizesBySlug, setPhotoSizesBySlug] = useState(() => new Map());

  const onPhotoNaturalSize = useCallback((slug, width, height) => {
    const key = String(slug || '').toLowerCase();
    if (!key || !width || !height) return;
    setPhotoSizesBySlug((prev) => {
      const cur = prev.get(key);
      if (cur && cur.width === width && cur.height === height) return prev;
      const next = new Map(prev);
      next.set(key, { width, height });
      return next;
    });
  }, []);

  const segments = useMemo(
    () => partitionExploreMonthlyPickSegments(cards, columnCount),
    [cards, columnCount],
  );

  const sizeForSlug = useCallback(
    (slug) => {
      const key = String(slug || '').toLowerCase();
      return photoSizesBySlug.get(key) || EXPLORE_MONTHLY_PICK_HERO_INTRINSIC_SIZE[key] || null;
    },
    [photoSizesBySlug],
  );

  return (
    <div data-testid="explore-v2-monthly-layout-b" className="w-full min-w-0 space-y-1.5 md:space-y-2 lg:space-y-2.5">
      {segments.map((seg, segIdx) => {
        if (seg.type !== 'columns') return null;
        const cols = renderExploreMonthlyMasonryColumnRuns(seg.entries, columnCount);
        return (
          <div
            key={`cols-${segIdx}-${String(seg.entries[0]?.item?.entry?.slug ?? '')}`}
            className={EXPLORE_MONTHLY_MASONRY_GRID_CLASS}
          >
            {cols.map((colEntries, colIdx) => (
              <div key={`col-${segIdx}-${colIdx}`} className="flex min-w-0 flex-col">
                {colEntries.map(({ item: card, index }) => {
                  const slug = String(card.entry?.slug || '').toLowerCase();
                  const sz = sizeForSlug(slug);
                  const wide = festivalHubPhotoLayout(sz?.width, sz?.height, {
                    inColumn: true,
                    slotIndex: colIdx,
                  }).wide;
                  const variant =
                    index === 0 ? 'hero' : pickMonthlyPickVariant(wide);
                  return (
                    <ExploreMonthlyPickItem
                      key={`${slug}-${index}`}
                      spot={card.spot}
                      entry={card.entry}
                      imageUrl={card.imageUrl}
                      onSelect={onSelectSpot}
                      variant={variant}
                      sourcesBelow
                      onPhotoNaturalSize={onPhotoNaturalSize}
                      layoutColumnSlotIndex={colIdx}
                      className="w-full"
                    />
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default ExploreMonthlyPicksLayoutB;
