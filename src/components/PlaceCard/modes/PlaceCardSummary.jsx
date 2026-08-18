import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Maximize2, Cuboid, Plane, Loader2, ChevronRight, ScanSearch, ScanEye, LayoutList } from 'lucide-react';
import BookmarkButton from '../common/BookmarkButton';
import { getPlaceTitleLinesForLocale } from '../common/locationDisplay';
import { useLocale } from '../../../i18n/LocaleProvider';
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
  plannerUrl = null,
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
  tourTab = null,
  tourExpanded = false,
}) => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [glowPhase, setGlowPhase] = useState('enter');
  const [originExpanded, setOriginExpanded] = useState(initialOriginExpanded);
  const [originSearchActive, setOriginSearchActive] = useState(false);
  /** 모바일 몰입 시 컴팩트 바 — X로 장소카드 복귀(줌 유지), 「멀리서 보기」로 원상복구 */
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
  const allowSummaryExpandTap = !isMobileCoarse;
  const allowSummaryIntroExpandTap = !isScanning && !isCompact;
  const isEnterGlow = !isMobileCoarse && glowPhase === 'enter';
  const { primaryName, secondaryName } = getPlaceTitleLinesForLocale(location, locale);
  const canStartTour = canStartGlobeTour(location);
  const flightRouteInteractive = isFlightRouteReady && !isFlightRoutePending;
  const flightRouteBusy = canPreviewFlightRoute && !flightRouteInteractive && !isFlightRoutePending;
  const flightRouteButtonLabel = isFlightRoutePending
    ? t('place.summary.flightLoading')
    : flightRouteBusy
      ? t('place.summary.flightRefreshing')
      : isFlightRouteReady
        ? t('place.summary.flightRoute')
        : t('place.summary.preparing');

  const placeIntro = String(location?.desc || '').trim();
  const hasPlaceIntro =
    Boolean(placeIntro) && !isSyntheticOrEmptyPlaceDesc(location);

  const blurbText = hasPlaceIntro
    ? placeIntro
    : t('place.summary.blurbFallback', { name: location?.name || '' });
  /** 항공 경로 카드는 공간 절약 — 2줄+더보기 / 그 외(국내·명소)는 3줄 */
  const introClampClass = canPreviewFlightRoute ? 'line-clamp-2' : 'line-clamp-3';
  const showIntroMore = hasPlaceIntro
    ? placeIntro.length >= (canPreviewFlightRoute ? 48 : 72)
    : true;

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

  const showPlannerLink = Boolean(plannerUrl) && !isScanning && !isImmersed;
  const showImmerseControls = !isScanning && canToggleImmerse && (!plannerUrl || isImmersed);

  const actionButtonCount =
    (showPlannerLink || showImmerseControls ? 1 : 0) +
    (canPreviewFlightRoute ? 1 : 0) +
    (canStartTour ? 1 : 0) +
    (stayToggle ? 1 : 0);

  const immerseStepChipClass =
    'border-white/20 bg-white/10 text-white/90 hover:border-emerald-400/40 hover:bg-emerald-500/20';

  if (isImmerseCompact) {
    return (
      <div className="z-[60] fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-0 right-0 mx-auto w-[calc(100vw-2.5rem)] max-w-[400px] max-md:animate-none lg:absolute lg:bottom-6 lg:left-auto lg:right-auto lg:mx-0 lg:w-[calc(100vw-2.5rem)]">
        <div className="tour-mobile-bar-shell relative">
          <div className="tour-mobile-bar-halo" aria-hidden="true" />
          <div className="tour-mobile-bar-card relative z-[1] flex items-center gap-3 rounded-2xl border border-white/15 bg-black/80 px-3 py-1.5 backdrop-blur-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExpand?.();
              }}
              className="min-w-0 flex-1 self-stretch py-1 leading-none text-left"
            >
              <p className="text-[9px] font-bold tracking-widest uppercase text-emerald-300/90 truncate leading-none">
                {location?.country || 'Global'}
              </p>
              <p className="mt-0.5 text-sm font-bold text-white truncate leading-none">
                {primaryName || location?.name}
              </p>
            </button>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onImmerseZoomStep?.('x2');
                }}
                className={`flex h-10 min-w-[2.75rem] items-center justify-center rounded-xl border px-3 text-sm font-bold tabular-nums transition-all active:scale-[0.98] ${immerseStepChipClass}`}
                title={t('place.summary.zoom2x')}
              >
                ×2
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onImmerseZoomStep?.('x4');
                }}
                className={`flex h-10 min-w-[2.75rem] items-center justify-center rounded-xl border px-3 text-sm font-bold tabular-nums transition-all active:scale-[0.98] ${immerseStepChipClass}`}
                title={t('place.summary.zoom4x')}
              >
                ×4
              </button>
            </div>
            <span className="h-6 w-px shrink-0 bg-white/20" aria-hidden="true" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setImmerseBarOpen(false);
              }}
              className="tour-mobile-bar-close shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-all hover:bg-white/15 active:scale-[0.96]"
              aria-label={t('place.summary.backToCard')}
              title={t('place.summary.backToCard')}
            >
              <X size={17} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        tourExpanded || stayExpanded ? 'z-[62]' : 'z-[60]'
      } max-md:animate-none transition-all duration-200 ${
        isOriginCompact
          ? 'fixed left-0 right-0 mx-auto w-[calc(100vw-3rem)] max-w-[360px]'
          : tourTab
            ? 'fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-[max(2.2rem,env(safe-area-inset-left,0px))] right-[1.5rem] mx-0 w-auto max-w-[360px] lg:absolute lg:bottom-6 lg:left-auto lg:right-8 lg:mx-0 lg:w-[400px] lg:max-w-[400px] xl:w-[440px] xl:max-w-[440px]'
            : 'fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-0 right-0 mx-auto w-[calc(100vw-3rem)] max-w-[360px] lg:absolute lg:bottom-6 lg:left-auto lg:right-8 lg:mx-0 lg:w-[400px] lg:max-w-[400px] xl:w-[440px] xl:max-w-[440px]'
      }`}
      style={keyboardAnchorStyle}
    >
      <div className={`relative ${isEnterGlow ? 'place-summary-shell-enter' : ''}`}>
        {tourTab}
        {isEnterGlow && (
          <>
            <div className="place-summary-halo" aria-hidden="true" />
            <div className="place-summary-orbit-ring" aria-hidden="true" />
            {!isScanning && (
              <div className="place-summary-open-hint absolute -top-9 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap lg:hidden">
                {t('place.summary.tapToExplore')}
              </div>
            )}
          </>
        )}

        <div
          className={`place-summary-card relative z-[1] border border-white/10 rounded-3xl shadow-2xl group max-md:bg-[#0a0a0a] max-md:backdrop-blur-none md:bg-black/80 md:backdrop-blur-xl ${
            isOriginCompact || stayExpanded || tourTab ? 'overflow-visible' : 'overflow-hidden'
          } ${isOriginCompact ? 'p-2.5' : 'p-4'} ${isEnterGlow ? 'place-summary-card-enter' : glowPhase === 'idle' ? 'place-summary-card-idle' : ''}`}
        >
          <div
            className="place-summary-top-shine absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-blue-400 transition-all duration-500 max-md:pointer-events-none md:cursor-pointer"
            onClick={allowSummaryExpandTap && !isScanning ? onExpand : undefined}
          />

          <div
            className={`flex items-start justify-between gap-2 mb-3 ${isOriginCompact ? 'hidden' : ''}`}
          >
            <div
              className={`flex min-w-0 flex-1 flex-col ${allowSummaryExpandTap && !isScanning ? 'cursor-pointer' : ''}`}
              onClick={allowSummaryExpandTap && !isScanning ? onExpand : undefined}
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

            <div
              className="flex shrink-0 items-center gap-1 -mr-1 -mt-1 z-20 relative pointer-events-auto"
              data-summary-chrome
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {!isScanning && <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />}
              <button
                type="button"
                aria-label={t('place.summary.closeSummary')}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose?.();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose?.();
                }}
                className="relative z-20 inline-flex items-center justify-center min-h-11 min-w-11 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors touch-manipulation"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            className={`${isOriginCompact ? 'hidden' : ''} ${allowSummaryIntroExpandTap ? `cursor-pointer touch-manipulation ${canPreviewFlightRoute ? 'mb-3' : 'mb-6'}` : isCompact ? 'mb-0' : ''}`}
            onClick={allowSummaryIntroExpandTap ? onExpand : undefined}
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
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 hover:bg-white/10 transition-colors">
                <div className="relative min-w-0">
                  <p
                    className={`break-keep text-[13px] md:text-sm text-gray-100 leading-[1.55] ${introClampClass} ${
                      showIntroMore ? 'pr-[3.5rem]' : ''
                    } ${hasPlaceIntro ? '' : 'text-xs text-gray-200 leading-snug'}`}
                  >
                    {blurbText}
                  </p>
                  {showIntroMore ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExpand?.();
                      }}
                      className="absolute bottom-0 right-0 inline-flex items-center gap-0.5 bg-gradient-to-l from-black/85 via-black/70 to-transparent pl-3 text-[12px] font-semibold leading-[1.55] text-sky-300/95 hover:text-sky-200 transition-colors"
                    >
                      {t('place.summary.readMore')}
                      <ChevronRight size={14} className="shrink-0 opacity-80" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
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
                          <span className="ml-1 font-medium text-sky-300/75">· {t('place.summary.flightHoursApprox', { hours: flightRouteHours })}</span>
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
                        ? 'cursor-pointer border-sky-400/40 bg-sky-500/20 hover:border-sky-300/50 hover:bg-sky-500/28'
                        : isFlightRoutePending || flightRouteBusy
                          ? 'cursor-wait pointer-events-none border-sky-400/25 bg-sky-500/10 opacity-90'
                          : 'cursor-not-allowed pointer-events-none border-white/10 bg-white/[0.04] opacity-50'
                    }`}
                    title={
                      isFlightRoutePending
                        ? t('place.summary.flightRouteLoading')
                        : flightRouteBusy
                          ? t('place.summary.flightRouteRefreshing')
                          : isFlightRouteReady
                            ? (flightRouteLabel || t('place.summary.flightRoutePreview'))
                            : t('place.summary.globePreparing')
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
                        flightRouteInteractive || isFlightRoutePending || flightRouteBusy ? 'text-sky-50' : 'text-gray-400'
                      }`}
                    >
                      {flightRouteButtonLabel}
                    </span>
                  </button>
                )}

                {showPlannerLink ? (
                  <Link
                    to={plannerUrl}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="relative z-10 flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-xl border border-cyan-300/50 bg-cyan-500/20 px-2 py-2 transition-all duration-300 hover:border-cyan-200/60 hover:bg-cyan-500/28 lg:min-h-[36px]"
                    title={t('place.summary.openPlanner')}
                  >
                    <LayoutList size={16} className="shrink-0 text-cyan-200" aria-hidden="true" />
                    <span className="min-w-0 truncate text-xs font-bold text-cyan-50">{t('place.nav.planner')}</span>
                  </Link>
                ) : null}

                {showImmerseControls && (
                  isImmersed ? (
                    isMobileCoarse ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleImmerse?.();
                        }}
                        className="relative z-10 flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-2 py-2 hover:bg-emerald-500/25 hover:border-emerald-300/45 transition-all lg:min-h-[36px]"
                        title={t('place.summary.globeFar')}
                      >
                        <ScanEye size={16} className="shrink-0 text-emerald-300" />
                        <span className="min-w-0 truncate text-xs font-bold text-emerald-100">{t('place.summary.globeFar')}</span>
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
                          title={t('place.summary.zoom2x')}
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
                          title={t('place.summary.zoom4x')}
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
                          title={t('place.summary.globeFar')}
                        >
                          <ScanEye size={16} className="shrink-0 text-emerald-300" />
                          <span className="min-w-0 truncate text-xs font-bold text-emerald-100">{t('place.summary.globeFar')}</span>
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
                      className="relative z-10 flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-xl border border-teal-400/40 bg-teal-500/20 px-2 py-2 transition-all duration-300 hover:border-teal-300/50 hover:bg-teal-500/28 lg:min-h-[36px]"
                      title={t('place.summary.regionNear')}
                    >
                      <ScanSearch size={16} className="shrink-0 text-teal-300" />
                      <span className="min-w-0 truncate text-xs font-bold text-teal-50">{t('place.summary.regionNear')}</span>
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
                    className="relative z-10 flex min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-xl border border-violet-300/55 bg-violet-500/22 px-2 py-2 transition-all duration-300 hover:border-violet-200/65 hover:bg-violet-500/30 lg:min-h-[36px]"
                    title={t('place.summary.region3dTour')}
                  >
                    <Cuboid size={16} className="shrink-0 text-violet-200" strokeWidth={2.25} aria-hidden="true" />
                    <span className="min-w-0 truncate text-xs font-bold text-violet-50">
                      <span className="tracking-tight text-violet-100">3D</span>
                      <span className="text-violet-50/90"> {t('place.summary.tour3dLabel')}</span>
                    </span>
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
