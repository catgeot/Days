import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImageIcon, Play, PenTool, BookOpen, Briefcase, ArrowLeft, CalendarDays } from 'lucide-react';
import { shouldHandlePlaceSpaNavClick } from './placeSpaNavClick.js';
import { isGateoPlaceWorldEventsTabEnabled } from '../../../shared/gateoFeatureFlags';

function activeTabRefForMode(mediaMode, refs) {
  if (mediaMode === 'WIKI') return refs.wikiTabRef;
  if (mediaMode === 'VIDEO') return refs.videoTabRef;
  if (mediaMode === 'WORLD_EVENTS') return refs.worldEventsTabRef;
  if (mediaMode === 'REVIEWS') return refs.reviewsTabRef;
  return null;
}

function scrollActiveSecondaryTabIntoView(rowEl, mediaMode, refs) {
  const activeRef = activeTabRefForMode(mediaMode, refs);
  const tabEl = activeRef?.current;
  if (!tabEl || !rowEl) return;
  if (rowEl.offsetParent === null) return;
  tabEl.scrollIntoView({ block: 'nearest', inline: 'center' });
}

/**
 * placement="header": 데스크톱 PlaceChatPanel 2행 (리뷰 탭 포함).
 * placement="scroll": 모바일 미디어 스크롤 영역 상단 (갤러리·위키·영상·리뷰 공통).
 */
const PlaceMobileSecondaryNav = ({
  mediaMode,
  setMediaMode,
  matchedPackage,
  onOpenPackage,
  placement = 'scroll',
  placeSlug = '',
  showWorldEventsTab = false,
}) => {
  const { t } = useTranslation();
  const galleryHref = placeSlug ? `/place/${placeSlug}` : '';
  const reviewsHref = placeSlug ? `/place/${placeSlug}/reviews` : '';
  const worldEventsNavFlagOn = isGateoPlaceWorldEventsTabEnabled();

  const scrollRowRef = useRef(null);
  const wikiTabRef = useRef(null);
  const videoTabRef = useRef(null);
  const worldEventsTabRef = useRef(null);
  const reviewsTabRef = useRef(null);

  const tabRefs = { wikiTabRef, videoTabRef, worldEventsTabRef, reviewsTabRef };

  useLayoutEffect(() => {
    if (!worldEventsNavFlagOn) return;

    const scrollAfterLayout = () => {
      scrollActiveSecondaryTabIntoView(scrollRowRef.current, mediaMode, tabRefs);
    };

    scrollAfterLayout();
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(scrollAfterLayout);
    });
    return () => cancelAnimationFrame(raf);
  }, [worldEventsNavFlagOn, mediaMode, showWorldEventsTab, placement]);

  if (mediaMode === 'PLANNER') {
    if (placement === 'header') return null;
    if (!matchedPackage) return null;
    return (
      <div className="flex items-center justify-center w-full pb-0.5 px-2">
        <button
          type="button"
          onClick={onOpenPackage}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:from-purple-500 hover:to-blue-500 transition-colors"
        >
          <Briefcase size={14} />
          {t('place.nav.packageBrowse')}
        </button>
      </div>
    );
  }

  /** 리뷰 탭은 흰 배경 스크롤 안에 들어가므로 다크 bar 없이 pill만 노출 */
  const isLightScrollChrome = placement === 'scroll' && mediaMode === 'REVIEWS';

  const inactivePill = isLightScrollChrome
    ? 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 shadow-sm'
    : 'bg-white/[0.06] hover:bg-white/[0.18] text-gray-300 hover:text-white border border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]';

  const activePill = isLightScrollChrome
    ? 'bg-blue-600 text-white font-bold border border-blue-600 shadow-md shadow-blue-600/20'
    : 'bg-blue-600/90 text-white font-bold border border-blue-500/50 shadow-lg shadow-blue-900/20';

  const galleryBackGhostPill = isLightScrollChrome
    ? 'bg-transparent text-gray-600 font-semibold border border-transparent hover:bg-gray-100 hover:text-gray-900'
    : 'bg-transparent text-gray-300 font-medium border border-transparent hover:bg-white/10 hover:text-white';

  const reviewsPillClass = `px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 group shrink-0 active:scale-95 ${
    mediaMode === 'REVIEWS' ? activePill : inactivePill
  }`;

  const reviewsNav =
    reviewsHref && galleryHref ? (
      mediaMode === 'REVIEWS' ? (
        <Link
          ref={worldEventsNavFlagOn ? reviewsTabRef : undefined}
          to={galleryHref}
          className={reviewsPillClass}
          onClick={(event) => {
            if (!shouldHandlePlaceSpaNavClick(event)) return;
            event.preventDefault();
            setMediaMode('GALLERY');
          }}
        >
          <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold whitespace-nowrap">{t('place.nav.galleryBack')}</span>
        </Link>
      ) : (
        <Link
          ref={worldEventsNavFlagOn ? reviewsTabRef : undefined}
          to={reviewsHref}
          className={reviewsPillClass}
          onClick={(event) => {
            if (!shouldHandlePlaceSpaNavClick(event)) return;
            event.preventDefault();
            setMediaMode('REVIEWS');
          }}
        >
          <PenTool
            className={`w-4 h-4 group-hover:scale-110 transition-transform ${isLightScrollChrome ? 'text-purple-600' : 'text-purple-400'}`}
          />
          <span className="text-xs font-bold whitespace-nowrap">{t('place.nav.reviews')}</span>
        </Link>
      )
    ) : (
      <button
        ref={worldEventsNavFlagOn ? reviewsTabRef : undefined}
        type="button"
        onClick={() => setMediaMode(mediaMode === 'REVIEWS' ? 'GALLERY' : 'REVIEWS')}
        className={reviewsPillClass}
      >
        {mediaMode === 'REVIEWS' ? (
          <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
        ) : (
          <PenTool
            className={`w-4 h-4 group-hover:scale-110 transition-transform ${isLightScrollChrome ? 'text-purple-600' : 'text-purple-400'}`}
          />
        )}
        <span className="text-xs font-bold whitespace-nowrap">
          {mediaMode === 'REVIEWS' ? t('place.nav.galleryBack') : t('place.nav.reviews')}
        </span>
      </button>
    );

  const rowJustifyClass = worldEventsNavFlagOn ? 'justify-start' : 'justify-center';
  const headerMdChrome =
    placement === 'header'
      ? worldEventsNavFlagOn && showWorldEventsTab
        ? 'md:justify-start md:px-0 md:border-b-0 md:bg-transparent'
        : 'md:justify-end md:px-0 md:border-b-0 md:bg-transparent'
      : '';

  return (
    <div
      ref={worldEventsNavFlagOn ? scrollRowRef : undefined}
      className={`items-center ${rowJustifyClass} gap-2 w-full overflow-x-auto no-scrollbar pb-0.5 px-2 overscroll-contain touch-pan-x flex ${
        isLightScrollChrome
          ? 'bg-transparent border-0'
          : 'border-b border-white/10 bg-[#05070a]/95'
      } ${headerMdChrome}`}
    >
      <button
        ref={worldEventsNavFlagOn ? wikiTabRef : undefined}
        type="button"
        onClick={() => setMediaMode(mediaMode === 'WIKI' ? 'GALLERY' : 'WIKI')}
        className={`px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 group shrink-0 active:scale-95 ${
          mediaMode === 'WIKI' ? activePill : inactivePill
        }`}
      >
        {mediaMode === 'WIKI' ? (
          <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
        ) : (
          <BookOpen
            className={`w-4 h-4 group-hover:scale-110 transition-transform ${isLightScrollChrome ? 'text-emerald-600' : 'text-emerald-400'}`}
          />
        )}
        <span className="text-xs font-bold whitespace-nowrap">
          {mediaMode === 'WIKI' ? t('place.nav.galleryBack') : t('place.nav.travelSketch')}
        </span>
      </button>
      <button
        ref={worldEventsNavFlagOn ? videoTabRef : undefined}
        type="button"
        onClick={() => setMediaMode(mediaMode === 'VIDEO' ? 'GALLERY' : 'VIDEO')}
        className={`py-1.5 transition-all duration-300 flex items-center group shrink-0 active:scale-95 ${
          mediaMode === 'VIDEO'
            ? `gap-1 rounded-lg px-2.5 ${galleryBackGhostPill}`
            : `gap-1.5 rounded-full px-3 ${inactivePill}`
        }`}
      >
        {mediaMode === 'VIDEO' ? (
          <ArrowLeft className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
        ) : (
          <Play fill="currentColor" className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
        )}
        <span
          className={`text-xs whitespace-nowrap ${mediaMode === 'VIDEO' ? 'font-medium' : 'font-bold'}`}
        >
          {mediaMode === 'VIDEO' ? t('place.nav.galleryBack') : t('place.nav.youtube')}
        </span>
      </button>
      {showWorldEventsTab ? (
        <button
          ref={worldEventsNavFlagOn ? worldEventsTabRef : undefined}
          type="button"
          onClick={() => setMediaMode(mediaMode === 'WORLD_EVENTS' ? 'GALLERY' : 'WORLD_EVENTS')}
          className={`px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 group shrink-0 active:scale-95 ${
            mediaMode === 'WORLD_EVENTS' ? activePill : inactivePill
          }`}
          data-place-secondary-tab="world-events"
          aria-current={mediaMode === 'WORLD_EVENTS' ? 'page' : undefined}
        >
          <CalendarDays
            className={`w-4 h-4 group-hover:scale-110 transition-transform shrink-0 ${
              mediaMode === 'WORLD_EVENTS'
                ? 'text-amber-100'
                : isLightScrollChrome
                  ? 'text-amber-600'
                  : 'text-amber-300'
            }`}
          />
          <span className="text-xs font-bold whitespace-nowrap">{t('place.nav.worldEvents')}</span>
        </button>
      ) : null}
      {reviewsNav}
    </div>
  );
};

export default PlaceMobileSecondaryNav;
