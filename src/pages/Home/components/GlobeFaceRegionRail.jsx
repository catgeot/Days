import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { placeScrollPanYClass } from '../../../components/PlaceCard/common/placeScrollSurface.js';
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
/** 모바일 나라 리스트 — 지도 pan·스크롤 체이닝 차단 */
const MOBILE_LIST_SCROLL_CLASS = `${placeScrollPanYClass} ${CUSTOM_SCROLL_CLASS}`;
const isolateMapTouchProps = {
  onPointerDown: (event) => event.stopPropagation(),
  onTouchStart: (event) => event.stopPropagation(),
  onTouchMove: (event) => event.stopPropagation(),
};
/** PC — 투톱~LOGIN/LOGBOOK 사이 가용 높이 사용(여유 6.5rem만 하단 확보, 상한으로 과도 축소하지 않음) */
const RAIL_LIST_HEIGHT_DESKTOP = 'h-[calc(100dvh-14.5rem-6.5rem)]';
/** 모바일 — 하단 카테고리·세부칩 위를 남기고도 스크롤이 답답하지 않게 */
const RAIL_LIST_HEIGHT_MOBILE = 'h-[min(50vh,22rem)]';
const RAIL_LIST_HEIGHT_MOBILE_FLAT = 'h-[min(58vh,26rem)]';

/** 모바일·PC — 해역(바다) 목록 진입 버튼 (나라 리스트와 분리) */
export function SeaBasinListButton({ active = false, onClick, compact = false, prominent = false }) {
  const label = prominent ? '바다' : '해역';

  const shellClass = prominent
    ? `w-[4.75rem] min-h-[3rem] rounded-2xl border-2 px-3 py-2.5 text-[13px] tracking-tight ${
        active
          ? 'border-cyan-300/85 bg-gradient-to-b from-cyan-400/50 to-cyan-600/35 text-white shadow-[0_0_22px_rgba(34,211,238,0.62)] ring-1 ring-cyan-200/35'
          : 'border-cyan-400/55 bg-gradient-to-b from-cyan-950/90 to-black/75 text-cyan-50 shadow-[0_0_16px_rgba(34,211,238,0.38)]'
      }`
    : compact
      ? 'w-[4.25rem] rounded-lg px-1.5 py-1.5 text-[10px]'
      : 'mb-1.5 w-[4.75rem] md:w-[5.5rem] rounded-xl px-2 py-2 text-[11px] md:text-xs';

  const idleClass = prominent
    ? ''
    : active
      ? 'border-cyan-400/55 bg-cyan-500/25 text-cyan-50 shadow-[0_0_10px_rgba(34,211,238,0.28)]'
      : 'border-white/20 bg-black/55 text-cyan-100/90 hover:bg-cyan-500/10';

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? '나라·지역 목록으로' : `${label}·해역 목록 보기`}
      title={active ? '나라·지역 목록으로' : '지금 보는 지구본 근처 해역'}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      className={`pointer-events-auto shrink-0 border backdrop-blur-md font-bold leading-tight transition-all active:scale-[0.97] ${shellClass} ${idleClass}`}
      {...isolateMapTouchProps}
    >
      {label}
    </button>
  );
}

/** 모바일 — 세부 메뉴 펼침 스위치 */
export function MobileRegionsMenuSwitch({ expanded, onChange }) {
  return (
    <div
      className={`pointer-events-auto flex w-[4.25rem] flex-col gap-0.5 rounded-lg border px-1.5 py-1 backdrop-blur-md transition-all ${
        expanded
          ? 'border-white/20 bg-black/70 shadow-lg'
          : 'border-amber-400/60 bg-black/85 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
      }`}
      {...isolateMapTouchProps}
    >
      <span
        className={`text-center text-[9px] font-bold leading-none tracking-tight ${
          expanded ? 'text-gray-200/90' : 'text-amber-100'
        }`}
      >
        {expanded ? '세부 메뉴' : '메뉴 숨김'}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={expanded}
        aria-label={expanded ? '세부 메뉴 숨기기' : '세부 메뉴 펼치기'}
        title={expanded ? '숨기고 지도 보기' : '나라·세부 칩 보기'}
        onClick={(event) => {
          event.stopPropagation();
          onChange?.(!expanded);
        }}
        className="flex w-full items-center justify-center active:scale-[0.97]"
      >
        <span
          aria-hidden="true"
          className={`relative h-4 w-9 shrink-0 overflow-hidden rounded-full border transition-colors ${
            expanded
              ? 'border-cyan-400/50 bg-cyan-500/40'
              : 'border-amber-300/80 bg-amber-500/40 shadow-[0_0_8px_rgba(251,191,36,0.45)]'
          }`}
        >
          <span
            className={`absolute top-0.5 h-3 w-3 rounded-full shadow transition-[left] duration-200 ${
              expanded ? 'left-[calc(100%-0.75rem-2px)] bg-white' : 'left-0.5 bg-amber-100'
            }`}
          />
        </span>
      </button>
    </div>
  );
}

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
    <div className={`pointer-events-auto flex min-w-0 flex-col ${className}`}>
      <GlassScrollStyles />
      <div
        className={`flex w-full min-w-0 flex-col rounded-2xl border border-white/15 bg-black/55 px-2 pt-1.5 backdrop-blur-xl shadow-lg ${
          scrollUi.scrollable ? 'pb-2' : 'pb-1.5'
        }`}
      >
        <div
          ref={barRef}
          className={`flex w-full min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain touch-pan-x ${CUSTOM_SCROLL_CLASS}`}
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
  listHeightStyle = null,
  className = '',
  railMode = 'country',
  seaBasins = [],
  selectedSeaBasinId = null,
  onSelectSeaBasin,
  onSeaBasinListToggle = null,
}) {
  const isSeaMode = railMode === 'sea';
  const subregions = useMemo(
    () => (!isSeaMode && showSubregions ? getFaceSubregions(category) : []),
    [category, showSubregions, isSeaMode],
  );
  const showSubregionChips = !isSeaMode && showSubregions && shouldShowFaceSubregionChips(category) && subregions.length > 0;
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

  if (!category || (!isSeaMode && regions.length === 0 && !showSubregionChips)) return null;

  const tone = CATEGORY_CHIP[category] || CATEGORY_CHIP.paradise;

  const listShellClass = listHeightStyle ? 'relative w-full' : `relative w-full ${resolvedListHeight}`;
  const listShellStyle = listHeightStyle || undefined;

  const seaBasinEntry = onSeaBasinListToggle && subregionPlacement !== 'none' ? (
    <SeaBasinListButton active={isSeaMode} onClick={onSeaBasinListToggle} />
  ) : null;

  const seaList = (
    <div
      className={`flex flex-col items-center ${anchorListToBottom ? 'overflow-hidden' : 'overflow-visible'}`}
      {...(anchorListToBottom ? isolateMapTouchProps : {})}
    >
      {seaBasinEntry}
      <div className={listShellClass} style={listShellStyle}>
        <div
          ref={listRef}
          className={`h-full overflow-y-auto ${anchorListToBottom ? MOBILE_LIST_SCROLL_CLASS : GLASS_SCROLL_CLASS} pl-2.5`}
          role="listbox"
          aria-label="해역 탐색"
          onScroll={updateScrollHint}
          {...(anchorListToBottom ? isolateMapTouchProps : {})}
        >
          <div
            className={`flex min-h-full flex-col gap-1.5 ${
              anchorListToBottom ? 'justify-end' : ''
            }`}
          >
            {seaBasins.map((basin) => {
              const isActive = selectedSeaBasinId === basin.id;
              return (
                <button
                  key={basin.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onSelectSeaBasin?.(basin)}
                  className={`w-[4.75rem] md:w-[5.5rem] shrink-0 rounded-xl border bg-black/55 px-2 py-2 text-left backdrop-blur-md shadow-lg transition-all active:scale-[0.97] ${
                    isActive ? tone.active : tone.idle
                  }`}
                >
                  <span className="block text-[11px] md:text-xs font-bold leading-tight tracking-tight break-keep">
                    {basin.name}
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
    </div>
  );

  const countryList = (
    <div
      className={`flex flex-col items-center ${anchorListToBottom ? 'overflow-hidden' : 'overflow-visible'}`}
      {...(anchorListToBottom ? isolateMapTouchProps : {})}
    >
      {seaBasinEntry}
      <div className={listShellClass} style={listShellStyle}>
        <div
          ref={listRef}
          className={`h-full overflow-y-auto ${anchorListToBottom ? MOBILE_LIST_SCROLL_CLASS : GLASS_SCROLL_CLASS} pl-2.5`}
          role="listbox"
          aria-label="나라·지역 탐색"
          onScroll={updateScrollHint}
          {...(anchorListToBottom ? isolateMapTouchProps : {})}
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
    </div>
  );

  if (!renderSideChips) {
    return (
      <div
        className={`pointer-events-auto relative ${className}`}
        {...(anchorListToBottom ? isolateMapTouchProps : {})}
      >
        <GlassScrollStyles />
        {isSeaMode ? seaList : countryList}
      </div>
    );
  }

  return (
    <div className={`pointer-events-auto relative flex flex-row items-start gap-2 ${className}`}>
      <GlassScrollStyles />
      {!isSeaMode ? (
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
      ) : null}
      {isSeaMode ? seaList : countryList}
    </div>
  );
}
