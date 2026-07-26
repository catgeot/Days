import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getFaceRegionsForCategory } from '../lib/globeFaceRegions.js';

const CATEGORY_CHIP = {
  paradise: {
    idle: 'border-cyan-400/25 text-cyan-100/90 hover:bg-cyan-500/15',
    active: 'bg-cyan-500/25 border-cyan-400/50 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.28)]',
  },
  nature: {
    idle: 'border-green-400/25 text-green-100/90 hover:bg-green-500/15',
    active: 'bg-green-500/25 border-green-400/50 text-green-100 shadow-[0_0_12px_rgba(74,222,128,0.28)]',
  },
  urban: {
    idle: 'border-purple-400/25 text-purple-100/90 hover:bg-purple-500/15',
    active: 'bg-purple-500/25 border-purple-400/50 text-purple-100 shadow-[0_0_12px_rgba(192,132,252,0.28)]',
  },
  culture: {
    idle: 'border-yellow-400/25 text-yellow-100/90 hover:bg-yellow-500/15',
    active: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-100 shadow-[0_0_12px_rgba(250,204,21,0.25)]',
  },
  adventure: {
    idle: 'border-red-400/25 text-red-100/90 hover:bg-red-500/15',
    active: 'bg-red-500/25 border-red-400/50 text-red-100 shadow-[0_0_12px_rgba(248,113,113,0.28)]',
  },
};

/**
 * 카테고리 면 → 나라/지역 칩 레일 (우선 시드 + 스크롤 스캔)
 */
export default function GlobeFaceRegionRail({
  category,
  selectedRegionId = null,
  onSelectRegion,
  className = '',
}) {
  const regions = getFaceRegionsForCategory(category);
  const listRef = useRef(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  const updateScrollHint = useCallback(() => {
    const el = listRef.current;
    if (!el) {
      setCanScrollMore(false);
      return;
    }
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    setCanScrollMore(remaining > 8);
  }, []);

  useEffect(() => {
    updateScrollHint();
  }, [category, regions.length, updateScrollHint]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => updateScrollHint());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollHint]);

  if (!category || regions.length === 0) return null;

  const tone = CATEGORY_CHIP[category] || CATEGORY_CHIP.paradise;

  return (
    <div className={`pointer-events-auto relative ${className}`}>
      <div
        ref={listRef}
        className="flex flex-col gap-1.5 max-h-[min(58vh,28rem)] overflow-y-auto custom-scrollbar pr-0.5"
        role="listbox"
        aria-label="나라·지역 탐색"
        onScroll={updateScrollHint}
      >
        {regions.map((region) => {
          const isActive = selectedRegionId === region.id;
          return (
            <button
              key={region.id}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => onSelectRegion?.(region)}
              className={`w-[4.75rem] md:w-[5.5rem] shrink-0 rounded-xl border bg-black/55 px-2 py-2 text-left backdrop-blur-md shadow-lg transition-all active:scale-[0.97] ${
                isActive ? tone.active : tone.idle
              }`}
            >
              <span className="block text-[11px] md:text-xs font-bold leading-tight tracking-tight break-keep">
                {region.labelKo}
              </span>
            </button>
          );
        })}
      </div>
      {canScrollMore ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-xl bg-gradient-to-t from-black/55 to-transparent"
        />
      ) : null}
    </div>
  );
}
