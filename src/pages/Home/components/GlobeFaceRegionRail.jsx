import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getDefaultFaceSubregionId,
  getFaceRegionsForSubregion,
  getFaceSubregions,
  shouldShowFaceSubregionChips,
} from '../lib/globeFaceSubregions.js';

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

const GLASS_SCROLL_CLASS = 'globe-face-region-scroll';
/** 소권역 전환 시 패널 높이 고정 — max-h 대신 h (내용만 교체) */
const RAIL_LIST_HEIGHT = 'h-[min(68vh,34rem)]';

/**
 * 카테고리 면 → 권역 나라 칩 레일 (면당 배타 · 스크롤).
 * PC: showSubregions 시 소권역 칩 + 필터된 나라 목록 (「전체」칩 없음 · 기본 첫 소권역).
 */
export default function GlobeFaceRegionRail({
  category,
  selectedRegionId = null,
  onSelectRegion,
  showSubregions = false,
  selectedSubregionId = null,
  onSelectSubregion,
  className = '',
}) {
  const subregions = useMemo(
    () => (showSubregions ? getFaceSubregions(category) : []),
    [category, showSubregions],
  );
  const showSubregionChips = showSubregions && shouldShowFaceSubregionChips(category) && subregions.length > 0;

  const activeSubregionId = useMemo(() => {
    if (!showSubregionChips) return null;
    if (selectedSubregionId && subregions.some((s) => s.id === selectedSubregionId)) {
      return selectedSubregionId;
    }
    return getDefaultFaceSubregionId(category);
  }, [showSubregionChips, selectedSubregionId, subregions, category]);

  const regions = useMemo(
    () => getFaceRegionsForSubregion(category, showSubregionChips ? activeSubregionId : null),
    [category, showSubregionChips, activeSubregionId],
  );

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
    const el = listRef.current;
    if (el) el.scrollTop = 0;
    updateScrollHint();
  }, [category, regions.length, activeSubregionId, updateScrollHint]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => updateScrollHint());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollHint]);

  useEffect(() => {
    if (!showSubregionChips || !activeSubregionId) return;
    if (selectedSubregionId === activeSubregionId) return;
    onSelectSubregion?.(activeSubregionId);
  }, [showSubregionChips, activeSubregionId, selectedSubregionId, onSelectSubregion]);

  if (!category || (regions.length === 0 && !showSubregionChips)) return null;

  const tone = CATEGORY_CHIP[category] || CATEGORY_CHIP.paradise;

  const countryList = (
    <div className={`relative ${RAIL_LIST_HEIGHT}`}>
      <div
        ref={listRef}
        className={`flex h-full flex-col gap-1.5 overflow-y-auto ${GLASS_SCROLL_CLASS} pr-1`}
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

  const scrollStyles = (
    <style>{`
      .${GLASS_SCROLL_CLASS} {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.28) rgba(255, 255, 255, 0.06);
      }
      .${GLASS_SCROLL_CLASS}::-webkit-scrollbar {
        width: 5px;
      }
      .${GLASS_SCROLL_CLASS}::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 999px;
        backdrop-filter: blur(8px);
      }
      .${GLASS_SCROLL_CLASS}::-webkit-scrollbar-thumb {
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.35) 0%,
          rgba(255, 255, 255, 0.14) 100%
        );
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.08);
      }
      .${GLASS_SCROLL_CLASS}::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.45) 0%,
          rgba(255, 255, 255, 0.22) 100%
        );
      }
    `}</style>
  );

  if (!showSubregionChips) {
    return (
      <div className={`pointer-events-auto relative ${className}`}>
        {scrollStyles}
        {countryList}
      </div>
    );
  }

  return (
    <div className={`pointer-events-auto relative flex flex-row items-start gap-2 ${className}`}>
      {scrollStyles}
      <div
        className={`flex ${RAIL_LIST_HEIGHT} flex-col gap-1 overflow-y-auto ${GLASS_SCROLL_CLASS} pr-1`}
        role="listbox"
        aria-label="소권역"
      >
        {subregions.map((sub) => {
          const isActive = activeSubregionId === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => onSelectSubregion?.(sub.id)}
              className={`w-[4.5rem] shrink-0 rounded-lg border bg-black/45 px-1.5 py-1.5 text-left backdrop-blur-md shadow-md transition-all active:scale-[0.97] ${
                isActive ? tone.active : `${tone.idle} opacity-80`
              }`}
            >
              <span className="block text-[10px] font-bold leading-tight tracking-tight break-keep">
                {sub.labelKo}
              </span>
            </button>
          );
        })}
      </div>
      {countryList}
    </div>
  );
}
