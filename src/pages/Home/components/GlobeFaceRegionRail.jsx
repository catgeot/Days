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
/** 나라·세부칩 — 네이티브 바 숨김 · 커스텀 스크롤바 항시 표시 */
const CUSTOM_SCROLL_CLASS = 'globe-face-custom-scroll';
/** PC 소권역 전환 시 패널 높이 고정 — max-h 대신 h (내용만 교체) */
const RAIL_LIST_HEIGHT_DESKTOP = 'h-[min(68vh,34rem)]';
/** 모바일 — 하단 카테고리·세부칩 위를 남기고도 스크롤이 답답하지 않게 */
const RAIL_LIST_HEIGHT_MOBILE = 'h-[min(50vh,22rem)]';
const RAIL_LIST_HEIGHT_MOBILE_FLAT = 'h-[min(58vh,26rem)]';

function useActiveSubregionId(category, showSubregionChips, selectedSubregionId, subregions) {
  return useMemo(() => {
    if (!showSubregionChips) return null;
    if (selectedSubregionId && subregions.some((s) => s.id === selectedSubregionId)) {
      return selectedSubregionId;
    }
    return getDefaultFaceSubregionId(category);
  }, [showSubregionChips, selectedSubregionId, subregions, category]);
}

function GlassScrollStyles() {
  return (
    <style>{`
      .${GLASS_SCROLL_CLASS} {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.38) rgba(255, 255, 255, 0.1);
      }
      .${GLASS_SCROLL_CLASS}::-webkit-scrollbar {
        width: 7px;
        height: 6px;
      }
      .${GLASS_SCROLL_CLASS}::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        backdrop-filter: blur(8px);
      }
      .${GLASS_SCROLL_CLASS}::-webkit-scrollbar-thumb {
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.48) 0%,
          rgba(255, 255, 255, 0.22) 100%
        );
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.12);
      }
      .${GLASS_SCROLL_CLASS}::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.62) 0%,
          rgba(255, 255, 255, 0.34) 100%
        );
      }
      .${CUSTOM_SCROLL_CLASS} {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .${CUSTOM_SCROLL_CLASS}::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
    `}</style>
  );
}

/**
 * 모바일 하단 — 소권역 가로 선택바 (카테고리 바 바로 위).
 */
export function GlobeFaceSubregionBar({
  category,
  selectedSubregionId = null,
  onSelectSubregion,
  className = '',
}) {
  const subregions = useMemo(() => getFaceSubregions(category), [category]);
  const show = shouldShowFaceSubregionChips(category) && subregions.length > 0;
  const activeSubregionId = useActiveSubregionId(category, show, selectedSubregionId, subregions);
  const barRef = useRef(null);
  const [scrollUi, setScrollUi] = useState({
    scrollable: false,
    thumbLeft: 0,
    thumbWidth: 100,
  });

  const updateScrollUi = useCallback(() => {
    const el = barRef.current;
    if (!el) {
      setScrollUi({ scrollable: false, thumbLeft: 0, thumbWidth: 100 });
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const scrollable = maxScroll > 8;
    const thumbWidth = scrollable
      ? Math.min(92, Math.max(18, (clientWidth / scrollWidth) * 100))
      : 100;
    const thumbLeft = scrollable && maxScroll > 0
      ? (scrollLeft / maxScroll) * (100 - thumbWidth)
      : 0;
    setScrollUi({ scrollable, thumbLeft, thumbWidth });
  }, []);

  useEffect(() => {
    if (!show || !activeSubregionId) return;
    if (selectedSubregionId === activeSubregionId) return;
    onSelectSubregion?.(activeSubregionId);
  }, [show, activeSubregionId, selectedSubregionId, onSelectSubregion]);

  useEffect(() => {
    updateScrollUi();
  }, [category, subregions.length, updateScrollUi]);

  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => updateScrollUi());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollUi, show]);

  if (!category || !show) return null;

  const tone = CATEGORY_CHIP[category] || CATEGORY_CHIP.paradise;

  return (
    <div className={`pointer-events-auto inline-flex max-w-full flex-col ${className}`}>
      <GlassScrollStyles />
      <div
        className={`inline-flex max-w-full flex-col rounded-2xl border border-white/15 bg-black/55 px-2 pt-1.5 backdrop-blur-xl shadow-lg ${
          scrollUi.scrollable ? 'pb-2' : 'pb-1.5'
        }`}
      >
        <div
          ref={barRef}
          className={`inline-flex max-w-full gap-1.5 overflow-x-scroll ${CUSTOM_SCROLL_CLASS}`}
          role="listbox"
          aria-label="소권역"
          onScroll={updateScrollUi}
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
                className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-left transition-all active:scale-[0.97] ${
                  isActive ? tone.active : `${tone.idle} bg-black/30 opacity-85`
                }`}
              >
                <span className="block whitespace-nowrap text-[11px] font-bold leading-tight tracking-tight break-keep">
                  {sub.labelKo}
                </span>
              </button>
            );
          })}
        </div>
        {scrollUi.scrollable ? (
          <div
            aria-hidden="true"
            className="pointer-events-none relative mt-1.5 h-[5px] w-full min-w-0 rounded-full bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
          >
            <div
              className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-white/65 to-white/30 shadow-[0_0_6px_rgba(255,255,255,0.2)]"
              style={{
                left: `${scrollUi.thumbLeft}%`,
                width: `${scrollUi.thumbWidth}%`,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * 카테고리 면 → 권역 나라 칩 레일 (면당 배타 · 스크롤).
 * PC: subregionPlacement=side 시 소권역 칩 + 필터된 나라 목록 (「전체」칩 없음 · 기본 첫 소권역).
 * 모바일: subregionPlacement=none + 하단 GlobeFaceSubregionBar 조합.
 */
export default function GlobeFaceRegionRail({
  category,
  selectedRegionId = null,
  onSelectRegion,
  showSubregions = false,
  selectedSubregionId = null,
  onSelectSubregion,
  /** 'side' = PC 세로 칩 · 'none' = 칩 UI 없음(필터만 · 하단 바 등과 조합) */
  subregionPlacement = 'side',
  listHeightClass,
  className = '',
}) {
  const subregions = useMemo(
    () => (showSubregions ? getFaceSubregions(category) : []),
    [category, showSubregions],
  );
  const showSubregionChips = showSubregions && shouldShowFaceSubregionChips(category) && subregions.length > 0;
  const renderSideChips = showSubregionChips && subregionPlacement === 'side';

  const activeSubregionId = useActiveSubregionId(
    category,
    showSubregionChips,
    selectedSubregionId,
    subregions,
  );

  const regions = useMemo(
    () => getFaceRegionsForSubregion(category, showSubregionChips ? activeSubregionId : null),
    [category, showSubregionChips, activeSubregionId],
  );

  const resolvedListHeight =
    listHeightClass
    || (subregionPlacement === 'none'
      ? (showSubregionChips ? RAIL_LIST_HEIGHT_MOBILE : RAIL_LIST_HEIGHT_MOBILE_FLAT)
      : RAIL_LIST_HEIGHT_DESKTOP);

  const listRef = useRef(null);
  const [scrollUi, setScrollUi] = useState({
    scrollable: false,
    moreAbove: false,
    moreBelow: false,
    thumbTop: 0,
    thumbHeight: 100,
  });
  /** 모바일: 짧은 목록은 하단 고정 배치 유지 · 스크롤은 항상 상단에서 시작 */
  const anchorListToBottom = subregionPlacement === 'none';

  const updateScrollHint = useCallback(() => {
    const el = listRef.current;
    if (!el) {
      setScrollUi({
        scrollable: false,
        moreAbove: false,
        moreBelow: false,
        thumbTop: 0,
        thumbHeight: 100,
      });
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const scrollable = maxScroll > 8;
    const thumbHeight = scrollable
      ? Math.min(92, Math.max(16, (clientHeight / scrollHeight) * 100))
      : 100;
    const thumbTop = scrollable && maxScroll > 0
      ? (scrollTop / maxScroll) * (100 - thumbHeight)
      : 0;
    setScrollUi({
      scrollable,
      moreAbove: scrollTop > 8,
      moreBelow: maxScroll - scrollTop > 8,
      thumbTop,
      thumbHeight,
    });
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = 0;
    }
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

  const moreHintClass =
    'inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-full border border-amber-300/70 bg-amber-500/90 px-2 text-[9px] font-bold leading-none tracking-tight text-black shadow-[0_0_12px_rgba(245,158,11,0.55)]';

  const countryList = (
    <div className="flex flex-col items-center overflow-visible">
      {scrollUi.scrollable ? (
        <div className="flex h-5 w-full shrink-0 items-center justify-center" aria-hidden="true">
          {scrollUi.moreAbove ? <span className={moreHintClass}>↑ 더보기</span> : null}
        </div>
      ) : null}
      <div className={`relative w-full ${resolvedListHeight}`}>
        <div
          ref={listRef}
          className={`h-full overflow-y-scroll ${CUSTOM_SCROLL_CLASS} pl-2.5`}
          role="listbox"
          aria-label="나라·지역 탐색"
          onScroll={updateScrollHint}
        >
          <div
            className={`flex min-h-full flex-col gap-1.5 ${
              anchorListToBottom ? 'justify-end' : ''
            }`}
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
        </div>
        {scrollUi.scrollable ? (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-1 bottom-1 w-[5px] rounded-full bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
            >
              <div
                className="absolute inset-x-0 rounded-full bg-gradient-to-b from-white/65 to-white/30 shadow-[0_0_6px_rgba(255,255,255,0.2)]"
                style={{
                  top: `${scrollUi.thumbTop}%`,
                  height: `${scrollUi.thumbHeight}%`,
                }}
              />
            </div>
            {scrollUi.moreAbove ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-7 rounded-t-xl bg-gradient-to-b from-black/55 via-black/20 to-transparent"
              />
            ) : null}
            {scrollUi.moreBelow ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-7 rounded-b-xl bg-gradient-to-t from-black/55 via-black/20 to-transparent"
              />
            ) : null}
          </>
        ) : null}
      </div>
      {scrollUi.scrollable ? (
        <div className="flex h-5 w-full shrink-0 items-center justify-center" aria-hidden="true">
          {scrollUi.moreBelow ? <span className={moreHintClass}>↓ 더보기</span> : null}
        </div>
      ) : null}
    </div>
  );

  if (!renderSideChips) {
    return (
      <div className={`pointer-events-auto relative ${className}`}>
        <GlassScrollStyles />
        {countryList}
      </div>
    );
  }

  return (
    <div className={`pointer-events-auto relative flex flex-row items-start gap-2 ${className}`}>
      <GlassScrollStyles />
      <div
        className={`flex ${resolvedListHeight} flex-col gap-1 overflow-y-auto ${GLASS_SCROLL_CLASS} pr-1`}
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
