import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  distributeFestivalHubMasonryColumns,
  FESTIVAL_HUB_GRID_CLASS,
} from '../Korea/festivalHubGridLayout.js';
import { isFestivalHubGridEagerThumb } from '../Korea/festivalHubGridEagerThumb.js';
import ScenicGridPhotoCard from './ScenicGridPhotoCard.jsx';
import { scenicCardSections } from './scenicCardSections.js';

function useScenicCardColumnCount() {
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

function ScenicCardGroupHeading({ label, tone = 'group' }) {
  const group = tone === 'group';
  return (
    <div
      className={`flex items-center gap-2 text-[12px] font-bold tracking-wide break-keep ${
        group ? 'pb-2 pt-2 text-stone-700' : 'pb-2 pt-3 text-stone-600'
      }`}
    >
      <span
        className={
          group
            ? 'inline-flex items-center rounded-md border border-amber-300/80 bg-amber-100/90 px-2 py-0.5 text-[11px] font-extrabold text-amber-950'
            : 'inline-flex items-center rounded-md border border-stone-200/80 bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-700'
        }
      >
        {label}
      </span>
      <span className="h-px flex-1 bg-stone-200/90" />
    </div>
  );
}

/**
 * 축제 홈과 같은 열 수. 명승 썸네일은 대개 3:2라 축제 wide(전폭) 분리는 쓰지 않는다.
 * 전폭으로 나누면 배너가 쌓이고, 열 안 가로 크롭이 카드 격자를 유지한다.
 */
export default function ScenicSpotCardGrid({
  spots,
  kmById,
  onOpen,
  favoriteIds,
  viewedIds,
  onToggleFavorite,
  locale = 'ko',
  restLabel = '',
  activeId = '',
}) {
  const columnCount = useScenicCardColumnCount();
  const [photoSizesByKey, setPhotoSizesByKey] = useState(() => new Map());
  const sections = useMemo(() => scenicCardSections(spots), [spots]);
  const listEpoch = useMemo(
    () => (spots || []).map((spot) => String(spot?.id || '')).join('|'),
    [spots],
  );

  const handlePhotoSize = useCallback((spot, size) => {
    const key = String(spot?.id || '');
    if (!key || !size?.width || !size?.height) return;
    setPhotoSizesByKey((prev) => {
      const cur = prev.get(key);
      if (cur && cur.width === size.width && cur.height === size.height) return prev;
      const next = new Map(prev);
      next.set(key, size);
      return next;
    });
  }, []);

  const renderCard = (spot, index, layoutOpts = {}) => {
    const id = String(spot?.id || '');
    const priorityThumb = isFestivalHubGridEagerThumb(index);
    const cardKey = priorityThumb ? `${listEpoch}|1|${id}|${index}` : id || `i-${index}`;
    return (
      <ScenicGridPhotoCard
        key={cardKey}
        spot={spot}
        priorityThumb={priorityThumb}
        active={activeId != null && String(activeId) === id}
        favorited={favoriteIds?.has(id)}
        viewed={Boolean(viewedIds?.has(id))}
        onToggleFavorite={onToggleFavorite}
        onOpen={onOpen}
        locale={locale}
        distanceKm={kmById?.get(id)}
        initialPhotoSize={photoSizesByKey.get(id) ?? null}
        onPhotoSize={handlePhotoSize}
        inColumn={Boolean(layoutOpts.inColumn)}
        slotIndex={layoutOpts.slotIndex ?? index}
      />
    );
  };

  let flatIndex = 0;

  return (
    <div className="w-full [overflow-anchor:none]" data-scenic-grid="">
      {sections.map((section, sectionIdx) => {
        const start = flatIndex;
        flatIndex += section.spots.length;
        const entries = section.spots.map((spot, index) => ({
          item: spot,
          index: start + index,
        }));
        const cols = distributeFestivalHubMasonryColumns(entries, columnCount);
        const heading = section.title
          ? section.title
          : section.rest && restLabel
            ? restLabel
            : '';
        return (
          <div key={`${section.title || (section.rest ? 'rest' : 'all')}-${sectionIdx}`}>
            {heading ? (
              <ScenicCardGroupHeading
                label={heading}
                tone={section.title ? 'group' : 'rest'}
              />
            ) : null}
            <div className={FESTIVAL_HUB_GRID_CLASS}>
              {cols.map((colEntries, colIdx) => (
                <div key={`col-${sectionIdx}-${colIdx}`} className="flex min-w-0 flex-col">
                  {colEntries.map(({ item, index }, rowIdx) =>
                    renderCard(item, index, {
                      inColumn: true,
                      slotIndex: colIdx + rowIdx * columnCount + start,
                    }),
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
