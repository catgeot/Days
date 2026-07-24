import React, { useState, useEffect } from 'react';
import { X, Sparkles, Maximize2, Mountain, Plane, Loader2, ChevronRight, ScanSearch, ScanEye } from 'lucide-react';
import BookmarkButton from '../common/BookmarkButton';
import { getPlaceTitleLines } from '../common/locationDisplay';
import { canStartGlobeTour } from '../../../pages/Home/lib/globeTourEngine';
import FlightOriginSelector from '../../../pages/Home/components/FlightOriginSelector.jsx';
import {
  useCoarsePointer,
  useMobileOverlayViewport,
  useVisualViewportBottomAnchor,
} from '../../../shared/hooks/useMobileInputViewport.js';
import { isSyntheticOrEmptyPlaceDesc } from '../../../pages/Home/lib/placeDescText.js';

const PlaceCardSummary = ({
  location,
  isBookmarked,
  onClose,
  onExpand,
  onChat,
  onToggleBookmark,
  onStartTour,
  onToggleImmerse,
  onImmerseZoomStep,
  isImmersed = false,
  canToggleImmerse = true,
  onPreviewFlightRoute,
  canPreviewFlightRoute = false,
  isFlightRouteReady = false,
  isFlightRoutePending = false,
  flightRouteLabel = null,
  flightRouteHours = null,
  selectedFlightOriginIata = 'ICN',
  flightBrowserOriginHint = null,
  onSelectFlightOrigin,
  onApplyBrowserOriginSuggestion,
  initialOriginExpanded = false,
  isCompact = false,
  belowCard = null,
  stayToggle = null,
  stayExpanded = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [glowPhase, setGlowPhase] = useState('enter');
  const [originExpanded, setOriginExpanded] = useState(initialOriginExpanded);
  const [originSearchActive, setOriginSearchActive] = useState(false);
  /** 모바일 몰입 시 컴팩트 바 — X로 장소카드 복귀(줌 유지), 「넓게 보기」로 원상복구 */
  const [immerseBarOpen, setImmerseBarOpen] = useState(false);
  const isMobileCoarse = useCoarsePointer();
  const isOriginCompact = isMobileCoarse && originExpanded;
  const isOriginSearchMode = isOriginCompact && originSearchActive;
  const isImmerseCompact = Boolean(
    isImmersed && isMobileCoarse && immerseBarOpen && !location?.isScanning
  );
  const keyboardAnchorStyle = useVisualViewportBottomAnchor(isOriginCompact, { pad: 8 });

  useMobileOverlayViewport(isOriginSearchMode);

  useEffect(() => {
    if (!originExpanded) setOriginSearchActive(false);
  }, [originExpanded]);

  useEffect(() => {
    if (!isOriginSearchMode || typeof window === 'undefined') return;
    window.scrollTo(0, 0);
  }, [isOriginSearchMode]);

  useEffect(() => {
    if (isImmersed) setImmerseBarOpen(true);
    else setImmerseBarOpen(false);
  }, [isImmersed, location?.id]);

  const isScanning = location?.isScanning;
  const isEnterGlow = glowPhase === 'enter';
  const { primaryName, secondaryName } = getPlaceTitleLines(location);
  const canStartTour = canStartGlobeTour(location);
  const flightRouteInteractive = isFlightRouteReady && !isFlightRoutePending;
  const flightRouteBusy = canPreviewFlightRoute && !flightRouteInteractive && !isFlightRoutePending;
  const flightRouteButtonLabel = isFlightRoutePending
    ? '조회 중…'
    : flightRouteBusy
      ? '갱신 중…'
      : isFlightRouteReady
        ? '항공 경로'
        : '준비 중…';

  const placeIntro = String(location?.desc || '').trim();
  const hasPlaceIntro =
    Boolean(placeIntro) && !isSyntheticOrEmptyPlaceDesc(location);

  const blurbText = canPreviewFlightRoute
    ? '탭하고 여행정보 확인하기'
    : hasPlaceIntro
      ? placeIntro
      : `${location?.name}의 숨겨진 매력을 발견하세요. 카드를 클릭하면 고화질 갤러리와 AI 가이드가 시작됩니다.`;

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    queueMicrotask(() => {
      setIsLoading(true);
      setGlowPhase(prefersReducedMotion ? 'idle' : 'enter');
    });

    const loadTimer = setTimeout(() => setIsLoading(false), 500);
    const glowTimer = prefersReducedMotion
      ? null
      : setTimeout(() => setGlowPhase('idle'), 3800);

    return () => {
      clearTimeout(loadTimer);
      if (glowTimer) clearTimeout(glowTimer);
    };
  }, [location?.id, location?.name, location?.lat, location?.lng]);

  useEffect(() => {
    setOriginExpanded(initialOriginExpanded);
  }, [location?.id, location?.slug, initialOriginExpanded]);

  const actionButtonCount =
    (!isScanning && canToggleImmerse ? 1 : 0) +
    (canPreviewFlightRoute ? 1 : 0) +
    (canStartTour ? 1 : 0) +
    (stayToggle ? 1 : 0);

  const immerseStepChipClass =
    'border-white/20 bg-white/10 text-white/90 hover:border-emerald-400/40 hover:bg-emerald-500/20';

  if (isImmerseCompact) {
    return (
      <div className="z-[60] absolute bottom-[calc(6.75rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[calc(100vw-3rem)] max-w-[400px] animate-fade-in-up">
        <div className="tour-mobile-bar-shell relative">
          <div className="tour-mobile-bar-halo" aria-hidden="true" />
          <div className="tour-mobile-bar-card relative z-[1] flex items-center gap-2.5 rounded-2xl border border-white/15 bg-black/80 px-2.5 py-1.5 backdrop-blur-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExpand?.();
              }}
              className="min-w-0 flex-1 leading-none pr-1 text-left"
            >
              <p className="text-[9px] font-bold tracking-widest uppercase text-emerald-300/90 truncate leading-none">
                {location?.country || 'Global'}
              </p>
              <p className="mt-px text-sm font-bold text-white truncate leading-none">
                {primaryName || location?.name}
              </p>
            </button>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onImmerseZoomStep?.('x2');
                }}
                className={`flex h-8 min-w-[2.5rem] items-center justify-center rounded-lg border px-2.5 text-xs font-bold tabular-nums transition-all active:scale-[0.98] ${immerseStepChipClass}`}
                title="현재 배율에서 ×2 확대"
              >
                ×2
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onImmerseZoomStep?.('x4');
                }}
                className={`flex h-8 min-w-[2.5rem] items-center justify-center rounded-lg border px-2.5 text-xs font-bold tabular-nums transition-all active:scale-[0.98] ${immerseStepChipClass}`}
                title="현재 배율에서 ×4 확대"
              >
                ×4
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setImmerseBarOpen(false);
              }}
              className="tour-mobile-bar-close shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition-all hover:bg-white/15 active:scale-[0.96]"
              aria-label="장소 카드로 돌아가기"
              title="장소 카드로 돌아가기"
            >
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`z-[60] animate-fade-in-up transition-all duration-200 ${
        isOriginCompact
          ? 'fixed left-1/2 -translate-x-1/2 w-[calc(100vw-3rem)] max-w-[360px]'
          : 'absolute bottom-[calc(6.75rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[calc(100vw-3rem)] max-w-[360px] lg:bottom-6 lg:translate-x-0 lg:left-auto lg:right-8 lg:w-[400px] lg:max-w-[400px] xl:w-[440px] xl:max-w-[440px]'
      }`}
      style={keyboardAnchorStyle}
    >
      <div className={`relative ${isEnterGlow ? 'place-summary-shell-enter' : ''}`}>
        {isEnterGlow && (
          <>
            <div className="place-summary-halo" aria-hidden="true" />
            <div className="place-summary-orbit-ring" aria-hidden="true" />
            {!isScanning && (
              <div className="place-summary-open-hint absolute -top-9 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap lg:hidden">
                클릭하여 탐색 시작
              </div>
            )}
          </>
        )}

        <div
          className={`place-summary-card relative z-[1] bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl group ${
            isOriginCompact || stayExpanded ? 'overflow-visible' : 'overflow-hidden'
          } ${isOriginCompact ? 'p-2.5' : 'p-4'} ${isEnterGlow ? 'place-summary-card-enter' : glowPhase === 'idle' ? 'place-summary-card-idle' : ''}`}
        >
          <div
            className="place-summary-top-shine absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-blue-400 transition-all duration-500 cursor-pointer"
            onClick={!isScanning ? onExpand : undefined}
          />

          <div
            className={`flex items-start justify-between gap-2 mb-3 ${isOriginCompact ? 'hidden' : ''}`}
          >
            <div
              className={`flex min-w-0 flex-1 flex-col ${!isScanning ? 'cursor-pointer' : ''}`}
              onClick={!isScanning ? onExpand : undefined}
            >
              <div className="flex items-center gap-1.5 mb-1 min-w-0">
                <Sparkles size={12} className={`shrink-0 ${isScanning ? 'text-blue-400 animate-pulse' : 'text-yellow-400'}`} />
                <span className="min-w-0 truncate text-[10px] text-blue-300 font-bold tracking-widest uppercase">
                  {isScanning ? 'SEARCHING...' : (location?.country || 'Global')}
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span
                  title={primaryName || location?.name || undefined}
                  className={`text-left min-w-0 flex-1 truncate text-2xl font-bold leading-none tracking-tight transition-colors ${isScanning ? 'text-blue-300 animate-pulse' : 'text-white group-hover:text-blue-100'}`}
                >
                  {primaryName || location?.name}
                </span>
                {!isScanning && <Maximize2 size={14} className="text-gray-500 group-hover:text-white transition-colors shrink-0" />}
              </div>
              {!isScanning && secondaryName && (
                <span
                  title={secondaryName}
                  className="mt-1 block min-w-0 max-w-full truncate text-left text-xs leading-none text-gray-200/90 font-semibold tracking-normal"
                >
                  ({secondaryName})
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1 -mr-2 -mt-2 z-10">
              {!isScanning && <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            className={`${isOriginCompact ? 'hidden' : ''} ${!isScanning && !isCompact ? `cursor-pointer ${canPreviewFlightRoute ? 'mb-3' : 'mb-6'}` : isCompact ? 'mb-0' : ''}`}
            onClick={!isScanning && !isCompact ? onExpand : undefined}
          >
            {!isCompact && (isLoading || isScanning ? (
              <div className="w-full animate-pulse space-y-3 mt-1 px-1">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-5/6" />
                </div>
              </div>
            ) : (
              <div className={`rounded-2xl border transition-colors ${
                canPreviewFlightRoute
                  ? 'flex items-center justify-between gap-2 border-sky-400/35 bg-sky-500/15 px-3 py-2 hover:border-sky-300/50 hover:bg-sky-500/20'
                  : 'border-white/10 bg-white/[0.07] p-4 hover:bg-white/10'
              }`}>
                <p className={`break-keep ${
                  canPreviewFlightRoute
                    ? 'text-sm font-semibold text-white leading-snug'
                    : hasPlaceIntro
                      ? 'text-[13px] md:text-sm text-gray-100 leading-[1.65] line-clamp-4'
                      : 'text-xs text-gray-200 leading-snug line-clamp-3'
                }`}>
                  {blurbText}
                </p>
                {canPreviewFlightRoute ? (
                  <ChevronRight size={16} className="shrink-0 text-sky-300/90" aria-hidden="true" />
                ) : null}
              </div>
            ))}
          </div>

          <div
            className={`${
              isScanning || isCompact
                ? 'max-h-0 opacity-0 mt-0 overflow-hidden'
                : isOriginCompact
                  ? 'max-h-[280px] opacity-100 mt-0 overflow-visible'
                  : stayExpanded
                    ? 'max-h-[min(70vh,560px)] opacity-100 mt-2 overflow-y-auto overscroll-contain'
                    : 'max-h-[220px] opacity-100 mt-2 overflow-hidden'
            }`}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {canPreviewFlightRoute && (
              <div className={isOriginCompact ? 'mb-0' : 'mb-2'}>
                {!isOriginCompact && !originExpanded ? (
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <FlightOriginSelector
                      variant="summary-header"
                      selectedIata={selectedFlightOriginIata}
                      disabled={isFlightRoutePending}
                      onExpandRequest={() => setOriginExpanded(true)}
                    />
                    {flightRouteLabel ? (
                      <p className="min-w-0 flex-1 truncate text-right text-xs font-semibold text-sky-200/90 break-keep tabular-nums">
                        {flightRouteLabel}
                        {typeof flightRouteHours === 'number' ? (
                          <span className="ml-1 font-medium text-sky-300/75">· 약 {flightRouteHours}h</span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {originExpanded ? (
                  <FlightOriginSelector
                    variant="summary-panel"
                    selectedIata={selectedFlightOriginIata}
                    disabled={isFlightRoutePending}
                    browserOriginHint={flightBrowserOriginHint}
                    onSelect={onSelectFlightOrigin}
                    onApplyBrowserOriginSuggestion={onApplyBrowserOriginSuggestion}
                    onCollapseRequest={() => setOriginExpanded(false)}
                    onSearchActiveChange={setOriginSearchActive}
                  />
                ) : null}
              </div>
            )}

            {!isOriginCompact ? (
              <div
                className={`grid isolate gap-2 ${
                  actionButtonCount >= 3 ? 'grid-cols-2' : actionButtonCount === 2 ? 'grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {/* PC·모바일 동일: 숙소 | 항공 / 이 지역 | 3D 투어 */}
                {stayToggle ? (
                  <div className="col-span-1 min-w-0">
                    {stayToggle}
                  </div>
                ) : null}

                {canPreviewFlightRoute && (
                  <button
                    type="button"
                    disabled={!flightRouteInteractive}
                    aria-busy={flightRouteBusy || isFlightRoutePending}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!flightRouteInteractive) return;
                      onPreviewFlightRoute?.();
                    }}
                    className={`relative z-10 flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 transition-all duration-300 lg:min-h-[36px] ${
                      flightRouteInteractive
                        ? 'bg-sky-500/15 border-sky-400/35 hover:bg-sky-500/25 hover:border-sky-300/45 cursor-pointer'
                        : isFlightRoutePending || flightRouteBusy
                          ? 'bg-sky-500/10 border-sky-400/25 opacity-90 cursor-wait pointer-events-none'
                          : 'bg-white/[0.04] border-white/10 opacity-50 cursor-not-allowed pointer-events-none'
                    }`}
                    title={
                      isFlightRoutePending
                        ? '항공 경로 조회 중…'
                        : flightRouteBusy
                          ? '경로 갱신 중…'
                          : isFlightRouteReady
                            ? (flightRouteLabel || '항공 경로 미리보기')
                            : '지구본 준비 중…'
                    }
                  >
                    {isFlightRoutePending || flightRouteBusy ? (
                      <Loader2 size={16} className="shrink-0 animate-spin text-sky-300" />
                    ) : (
                      <Plane
                        size={16}
                        className={`shrink-0 ${flightRouteInteractive ? 'text-sky-300' : 'text-gray-500'}`}
                      />
                    )}
                    <span
                      className={`min-w-0 truncate text-xs font-bold ${
                        flightRouteInteractive || isFlightRoutePending || flightRouteBusy ? 'text-sky-100' : 'text-gray-400'
                      }`}
                    >
                      {flightRouteButtonLabel}
                    </span>
                  </button>
                )}

                {!isScanning && canToggleImmerse && (
                  isImmersed ? (
                    isMobileCoarse ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleImmerse?.();
                        }}
                        className="relative z-10 flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-2 py-2 hover:bg-emerald-500/25 hover:border-emerald-300/45 transition-all lg:min-h-[36px]"
                        title="지구본을 넓게 보기"
                      >
                        <ScanEye size={16} className="shrink-0 text-emerald-300" />
                        <span className="min-w-0 truncate text-xs font-bold text-emerald-100">넓게 보기</span>
                      </button>
                    ) : (
                      <div className="col-span-2 relative z-10 flex min-h-[40px] min-w-0 items-center gap-1.5 lg:min-h-[36px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onImmerseZoomStep?.('x2');
                          }}
                          className={`flex min-h-[40px] flex-1 items-center justify-center rounded-xl border px-2 py-2 text-xs font-bold tabular-nums transition-all lg:min-h-[36px] ${immerseStepChipClass}`}
                          title="현재 배율에서 ×2 확대"
                        >
                          ×2
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onImmerseZoomStep?.('x4');
                          }}
                          className={`flex min-h-[40px] flex-1 items-center justify-center rounded-xl border px-2 py-2 text-xs font-bold tabular-nums transition-all lg:min-h-[36px] ${immerseStepChipClass}`}
                          title="현재 배율에서 ×4 확대"
                        >
                          ×4
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleImmerse?.();
                          }}
                          className="relative z-10 flex min-h-[40px] min-w-0 flex-[1.35] items-center justify-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-2 py-2 hover:bg-emerald-500/25 hover:border-emerald-300/45 transition-all lg:min-h-[36px]"
                          title="지구본을 넓게 보기"
                        >
                          <ScanEye size={16} className="shrink-0 text-emerald-300" />
                          <span className="min-w-0 truncate text-xs font-bold text-emerald-100">넓게 보기</span>
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleImmerse?.();
                      }}
                      className="relative z-10 flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-xl border border-teal-400/30 bg-teal-500/15 px-2 py-2 hover:bg-teal-500/25 hover:border-teal-300/40 transition-all duration-300 lg:min-h-[36px]"
                      title="이 지역을 확대해 보기"
                    >
                      <ScanSearch size={16} className="shrink-0 text-teal-300" />
                      <span className="min-w-0 truncate text-xs font-bold text-teal-100">이 지역 보기</span>
                    </button>
                  )
                )}

                {canStartTour && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onStartTour) onStartTour(location);
                    }}
                    className="relative z-10 flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-xl bg-violet-500/15 border border-violet-400/30 px-2 py-2 hover:bg-violet-500/25 hover:border-violet-300/40 transition-all duration-300 lg:min-h-[36px]"
                  >
                    <Mountain size={16} className="shrink-0 text-violet-300" />
                    <span className="min-w-0 truncate text-xs font-bold text-violet-100">3D 투어</span>
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {!isScanning && !isOriginCompact && belowCard ? (
          <div className="relative z-[1] mt-0 lg:contents">{belowCard}</div>
        ) : null}
      </div>
    </div>
  );
};

export default PlaceCardSummary;
