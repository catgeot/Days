import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, ArrowLeft, Send, Image as ImageIcon, X, Briefcase, Globe } from 'lucide-react';
import { useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import VideoInfoView from '../views/VideoInfoView';
import GalleryInfoView from '../views/GalleryInfoView';
import PlaceWikiNavView from '../views/PlaceWikiNavView';
import { PERSONA_TYPES } from '../../../pages/Home/lib/prompts';
import BookmarkButton from '../common/BookmarkButton';
import { getRelatedPlaces } from '../../../pages/Home/hooks/useSearchEngine';
import { getPlaceUrlParam } from '../../../pages/Home/lib/formatUrlName';
import { mergeCanonicalTravelSpot, isPlaceholderCountry } from '../../../utils/travelSpotResolve';
import { getPlaceTitleLinesForLocale, getLocalizedCountryName, getLocalizedPlaceName } from '../common/locationDisplay';
import { useLocale } from '../../../i18n/LocaleProvider';
import { copyToClipboard } from '../common/copyToClipboard';
import PlaceMobileSecondaryNav from '../common/PlaceMobileSecondaryNav';
import { dispatchPlaceScrollToTop } from '../common/placeScrollSurface';
import { relatedPlacePathSuffix, relatedPlaceTabForMediaMode } from '../common/relatedPlaceTab';
import { mobileLandscapeChromeHidden } from '../common/mobilePlaceHeaderInset';
import mooniChar from '../../../assets/MOONI_transparent.webp';
import { getAppHistoryPath } from '../../../shared/navigation/appHistoryPathIndex';
import { peekExploreReturn } from '../../../pages/Home/lib/exploreReturnSnapshot';
import { resolvePlaceCardBack } from '../../../pages/Home/lib/placeCardBack';
import {
  clearPlaceReturnTo,
  peekPlaceReturnTo,
} from '../../../pages/Home/lib/placeReturnTo';
import PlaceWorldEventsSection from '../common/PlaceWorldEventsSection';
import PlaceWorldEventsChatPreview from '../common/PlaceWorldEventsChatPreview';
import PlaceCrossLinksSection from '../common/PlaceCrossLinksSection';
import { isGateoPlaceWorldEventsTabEnabled } from '../../../shared/gateoFeatureFlags';
import { isPlaceCrosslinkWorldEventsRailEnabled } from '../../../pages/Home/lib/placeCrosslinkRollout.js';
import { getWorldEventsForSlug } from '../../../utils/worldEvents';

const HEADER_SCROLL_TOP_MODES = ['PLANNER', 'GALLERY', 'WIKI', 'REVIEWS'];

const HEADER_SCROLL_TOP_TITLE_KEYS = {
  PLANNER: 'place.nav.scrollTopPlanner',
  GALLERY: 'place.nav.scrollTopGallery',
  WIKI: 'place.nav.scrollTopWiki',
  REVIEWS: 'place.nav.scrollTopReviews',
  WORLD_EVENTS: 'place.nav.scrollTopWorldEvents',
};

const PlaceChatPanel = React.memo(({
    location,
    isBookmarked,
    onClose,
    onOpenMooni,
    onNavigateToPlace,
    onGoHome,
    isMooniChatOpen = false,
    activeInfo,
    isFullScreen,
    mediaMode,
    setMediaMode,
    onSeekTime,
    isAiMode,
    selectedImg,
    onToggleBookmark,
    wikiData,
    isWikiLoading,
    matchedPackage,
    onOpenPackage
}) => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const crosslinkWorldEventsRail = isPlaceCrosslinkWorldEventsRailEnabled();
  /** Crosslink events replace WorldEvents only in desktop gallery info (not VIDEO/WIKI). */
  const crosslinkEventsInGalleryInfo =
    crosslinkWorldEventsRail && mediaMode !== 'WIKI' && activeInfo.mode !== 'VIDEO';
  const showWorldEventsSection = !crosslinkEventsInGalleryInfo;
  const [copiedType, setCopiedType] = useState('');
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const routeLocation = useRouteLocation();
  const anchorKeyRef = useRef(null);
  const skipRelatedRefreshRef = useRef(false);
  const [relatedPlaces, setRelatedPlaces] = useState([]);
  const { primaryName, secondaryName } = getPlaceTitleLinesForLocale(location, locale);
  const rawCountry = getLocalizedCountryName(location, locale);
  const countryLabel = isPlaceholderCountry(rawCountry) ? '' : rawCountry;

  const placeSlugKey = String(getPlaceUrlParam(location) || location?.slug || '')
    .trim()
    .toLowerCase();
  const showWorldEventsTab =
    isGateoPlaceWorldEventsTabEnabled() &&
    placeSlugKey &&
    getWorldEventsForSlug(placeSlugKey).length > 0;
  const headerScrollModes = showWorldEventsTab
    ? [...HEADER_SCROLL_TOP_MODES, 'WORLD_EVENTS']
    : HEADER_SCROLL_TOP_MODES;

  const getPlaceKey = (place) => `${place?.id ?? ''}:${place?.name ?? ''}`;

  useEffect(() => {
    const key = getPlaceKey(location);
    if (skipRelatedRefreshRef.current) {
      skipRelatedRefreshRef.current = false;
      return;
    }
    anchorKeyRef.current = key;
    setRelatedPlaces(getRelatedPlaces(location));
  }, [location?.id, location?.name]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
  }, [activeInfo.title, activeInfo.mode, mediaMode, location?.id, location?.name, location?.slug]);

  const openMooni = () => {
    onOpenMooni?.({ persona: PERSONA_TYPES.GENERAL });
  };

  const handleWikiNavClick = (sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  const handleRelatedClick = (targetPlace, isBridge = false) => {
      if (!targetPlace) return;

      if (isBridge) {
        anchorKeyRef.current = getPlaceKey(targetPlace);
        setRelatedPlaces(getRelatedPlaces(targetPlace));
      }
      skipRelatedRefreshRef.current = true;

      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      const relatedTab = relatedPlaceTabForMediaMode(mediaMode);
      if (relatedTab) {
        dispatchPlaceScrollToTop(mediaMode, { behavior: 'auto' });
      }

      const relatedNavOpts = relatedTab ? { tab: relatedTab } : undefined;

      if (onNavigateToPlace) {
          onNavigateToPlace(targetPlace, relatedNavOpts);
          return;
      }

      const param = getPlaceUrlParam(mergeCanonicalTravelSpot(targetPlace));
      const suffix = relatedPlacePathSuffix(mediaMode);
      if (param) {
          navigate(`/place/${param}${suffix}`);
          return;
      }

      if (targetPlace.lat !== undefined && targetPlace.lng !== undefined) {
          navigate(`/place/city-${targetPlace.lat}-${targetPlace.lng}${suffix}`);
          return;
      }

      console.warn("[Safe Path] 라우팅을 위한 식별자(slug, ID 또는 좌표)가 없습니다.", targetPlace);
  };

  const handleGoHomeClick = () => {
      if (onGoHome) {
          onGoHome();
          return;
      }
      navigate('/');
  };

  /** 모바일: 고정 헤더 탭 → 미디어 패널 스크롤 맨 위 (iOS 상태바 탭은 중첩 스크롤에서 동작하지 않음) */
  const supportsHeaderScrollTop = headerScrollModes.includes(mediaMode);

  const handleHeaderScrollTap = (event) => {
      if (!supportsHeaderScrollTop) return;
      const nestedInteractive = event.target.closest('button, a, [role="button"]');
      // 스크롤 영역 자신(role=button)은 제외 — 내부 복사·북마크 버튼만 차단
      if (nestedInteractive && nestedInteractive !== event.currentTarget) return;
      dispatchPlaceScrollToTop(mediaMode);
  };

  const handleCopyName = async (event, text, type) => {
      event.preventDefault();
      event.stopPropagation();

      const copied = await copyToClipboard(text);
      if (!copied) return;

      setCopiedType(type);
      setTimeout(() => setCopiedType(''), 1200);
  };

  return (
    <div className={`flex flex-col transition-all duration-500
        ${isFullScreen ? 'opacity-0 pointer-events-none lg:pointer-events-auto lg:translate-x-[-100%]' : 'opacity-100 translate-x-0 pointer-events-auto'}
        absolute top-0 left-0 w-full z-[180] h-auto bg-[#05070a]/90 backdrop-blur-md border-b border-white/10 pb-1.5 landscape-phone:pb-0 landscape-phone:border-b-0 landscape-phone:bg-transparent landscape-phone:backdrop-blur-none lg:pb-0 lg:border-none lg:rounded-none
        lg:relative lg:w-[35%] lg:h-full lg:backdrop-blur-xl lg:border lg:border-white/10 lg:rounded-[2rem] lg:shadow-2xl lg:overflow-hidden lg:bg-[#05070a]/80 lg:z-auto`}>

      {/* Header — 갤러리·위키·리뷰·플래너: 지명 영역 탭 시 스크롤 맨 위 (뒤로/홈 버튼과 분리) */}
      <div
        className={`shrink-0 px-3 lg:border-b lg:border-white/5 bg-transparent z-20 py-2 lg:py-3 flex flex-col items-stretch justify-between gap-2 lg:gap-3 max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-[180] max-lg:bg-[#05070a] max-lg:backdrop-blur-none max-lg:border-b max-lg:border-white/10 max-lg:pb-1.5 ${mobileLandscapeChromeHidden}`}
      >
         {/* Row 1: Home, Location Info, Bookmark, Toolkit (Killer Tab) */}
         <div
           className="flex flex-col gap-1.5 max-lg:flex-row max-lg:items-center lg:gap-2 min-[1400px]:flex-row min-[1400px]:items-center min-[1400px]:justify-between min-[1400px]:gap-x-4 overflow-hidden w-full min-w-0 pointer-events-auto touch-manipulation"
           data-place-chrome-hit
           onPointerDown={(e) => e.stopPropagation()}
           onClick={(e) => e.stopPropagation()}
         >
             <div className="flex items-center gap-2.5 min-w-0 flex-1">
             <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    const idx = window.history.state?.idx;
                    const prevPath =
                      typeof idx === 'number' ? getAppHistoryPath(idx - 1) : null;
                    const action = resolvePlaceCardBack({
                      historyIdx: typeof idx === 'number' ? idx : null,
                      prevPath,
                      returnTo: peekPlaceReturnTo(routeLocation.state),
                      exploreReturnPath: peekExploreReturn()?.path ?? null,
                    });
                    if (action.type === 'history') {
                      navigate(-1);
                      return;
                    }
                    if (action.type === 'push') {
                      if (action.clearReturnTo) clearPlaceReturnTo();
                      navigate(action.path);
                      return;
                    }
                    onClose?.();
                }}
                className="flex items-center justify-center w-8 h-8 md:w-8 md:h-8 rounded-full bg-white/15 md:bg-white/10 text-white border border-white/25 hover:bg-white/25 transition-all shrink-0 shadow-lg touch-manipulation"
                title={t('place.nav.back')}
                aria-label={t('place.nav.back')}
             >
                 <ArrowLeft className="w-4 h-4 md:w-4 md:h-4 pointer-events-none" />
             </button>
             <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    handleGoHomeClick();
                }}
                className="flex items-center justify-center w-8 h-8 md:w-8 md:h-8 rounded-full bg-white/10 md:bg-white/5 text-white md:text-gray-300 hover:bg-white/20 transition-all shrink-0 shadow-lg touch-manipulation"
                title={t('place.nav.home')}
                aria-label={t('place.nav.home')}
             >
                <Globe className="w-4 h-4 md:w-4 md:h-4 pointer-events-none" />
             </button>
             <div
                className={`flex flex-col flex-1 min-w-[8rem] basis-[45%] justify-center overflow-hidden ${supportsHeaderScrollTop ? 'max-lg:cursor-pointer' : ''}`}
                onClick={handleHeaderScrollTap}
                onKeyDown={(event) => {
                    if (supportsHeaderScrollTop && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        dispatchPlaceScrollToTop(mediaMode);
                    }
                }}
                role={supportsHeaderScrollTop ? 'button' : undefined}
                tabIndex={supportsHeaderScrollTop ? 0 : undefined}
                title={supportsHeaderScrollTop ? t(HEADER_SCROLL_TOP_TITLE_KEYS[mediaMode]) : undefined}
             >
                 <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase truncate drop-shadow-md">{countryLabel}</span>
                 <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                     <button
                        type="button"
                        onClick={(event) => handleCopyName(event, primaryName || location.name, 'primary')}
                        className="text-left text-[clamp(0.8125rem,3.8vw,1rem)] font-black tracking-tighter text-white leading-tight line-clamp-2 whitespace-normal [word-break:keep-all] [overflow-wrap:break-word] drop-shadow-md hover:text-blue-200 active:scale-[0.99] min-w-0 flex-1"
                        title={t('place.nav.copyPrimary')}
                     >
                        {primaryName || location.name}
                     </button>
                     <div className="shrink-0 -mt-0.5 min-[1400px]:mr-0.5">
                         <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />
                     </div>
                 </div>
                 {secondaryName && (
                     <button
                        type="button"
                        onClick={(event) => handleCopyName(event, secondaryName, 'secondary')}
                        className="mt-1 block w-full min-w-0 max-w-full text-left text-xs leading-snug text-gray-200/90 font-semibold tracking-normal truncate whitespace-nowrap hover:text-white"
                        title={t('place.nav.copySecondary')}
                     >
                        ({secondaryName})
                     </button>
                 )}
                 {copiedType && (
                    <span className="mt-1 text-[10px] text-emerald-300 font-semibold">
                        {copiedType === 'primary' ? t('place.nav.copiedPrimary') : t('place.nav.copiedSecondary')}
                    </span>
                 )}
             </div>
             </div>
             <div className="flex shrink-0 items-center gap-1.5 md:gap-2 justify-end w-auto lg:w-full min-[1400px]:w-auto min-[1400px]:flex-none min-[1400px]:ml-auto max-lg:pointer-events-auto">
                 <button
                    type="button"
                    onClick={openMooni}
                    className="place-header-mooni-btn flex h-8 w-8 xl:h-auto xl:w-auto items-center justify-center gap-1 rounded-full border border-cyan-400/45 bg-cyan-500/25 px-0 xl:px-2.5 xl:py-1.5 text-cyan-50 ring-1 ring-cyan-300/30 ring-inset transition-all shrink-0 touch-manipulation hover:border-cyan-300/70 hover:bg-cyan-500/35 active:scale-95"
                    title={t('place.nav.askMooni')}
                    aria-label={t('place.nav.askMooni')}
                 >
                    <img
                      src={mooniChar}
                      alt=""
                      className="h-6 w-6 object-contain drop-shadow-[0_2px_10px_rgba(34,211,238,0.65)] brightness-110 contrast-[1.08] saturate-110"
                      draggable={false}
                    />
                    <span className="hidden xl:inline text-xs font-bold whitespace-nowrap text-cyan-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">MOONi</span>
                 </button>
                 {mediaMode === 'PLANNER' ? (
                    <button
                        onClick={() => setMediaMode('GALLERY')}
                        className="px-2.5 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all flex items-center gap-1.5 group shrink-0"
                    >
                        <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform"/>
                        <span className="text-xs font-bold">{t('place.nav.galleryBack')}</span>
                    </button>
                 ) : (
                    <button
                        onClick={() => setMediaMode('PLANNER')}
                        className="px-2.5 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white shadow-lg shadow-blue-900/30 transition-all flex items-center gap-1.5 group border border-blue-400/30 shrink-0"
                    >
                        <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform"/>
                        <span className="text-xs font-bold whitespace-nowrap">{t('place.nav.planner')}</span>
                    </button>
                 )}
             </div>
         </div>

         {/* Row 2: 데스크톱만 고정 — 모바일 2행은 미디어 패널 스크롤 안으로 이동 */}
         <div className="hidden lg:flex w-full shrink-0 flex-col">
           <PlaceMobileSecondaryNav
             placement="header"
             mediaMode={mediaMode}
             setMediaMode={setMediaMode}
             matchedPackage={matchedPackage}
             onOpenPackage={onOpenPackage}
             placeSlug={getPlaceUrlParam(location)}
             showWorldEventsTab={showWorldEventsTab}
           />
         </div>
      </div>

      {/* Body — gallery: fill leftover height; related chips stay above MOONi */}
      <div
        ref={scrollRef}
        className={`hidden lg:flex flex-col flex-1 min-h-0 relative custom-scrollbar ${
            mediaMode !== 'WIKI' && activeInfo.mode !== 'VIDEO' ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
      >
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>

        {mediaMode === 'WIKI' ? (
            <PlaceWikiNavView
                wikiData={wikiData}
                isWikiLoading={isWikiLoading}
                onNavClick={handleWikiNavClick}
                placeName={getLocalizedPlaceName(location, locale) || location.name}
                matchedPackage={matchedPackage}
                onOpenPackage={onOpenPackage}
            />
        ) : (
            <div
                className={`animate-fade-in flex flex-col ${
                    activeInfo.mode === 'VIDEO'
                        ? 'gap-6 p-6'
                        : 'min-h-0 flex-1 gap-4 px-6 pt-6 pb-3'
                }`}
            >
                {showWorldEventsTab && mediaMode !== 'WORLD_EVENTS' ? (
                  <PlaceWorldEventsChatPreview
                    location={location}
                    onViewAllTab={() => setMediaMode('WORLD_EVENTS')}
                  />
                ) : !showWorldEventsTab && showWorldEventsSection ? (
                  <PlaceWorldEventsSection location={location} variant="dark" className="shrink-0" />
                ) : null}
                {crosslinkEventsInGalleryInfo ? (
                  <PlaceCrossLinksSection
                    location={location}
                    variant="dark"
                    bucketFilter="eventsOnly"
                    className="shrink-0"
                  />
                ) : null}
                {activeInfo.mode === 'VIDEO' ? (
                    <VideoInfoView
                        videoData={activeInfo}
                        onSeekTime={onSeekTime}
                    />
                ) : (
                    <GalleryInfoView
                        selectedPlace={location}
                        selectedImg={selectedImg}
                        isAiMode={isAiMode}
                        relatedPlaces={relatedPlaces}
                        onRelatedClick={handleRelatedClick}
                    />
                )}
            </div>
        )}
      </div>

      {/* Footer — 데스크톱 MOONi 진입 */}
      {mediaMode !== 'WIKI' && (
          <div className="hidden lg:block p-6 pt-4 bg-gradient-to-t from-[#05070a] via-[#05070a] to-transparent shrink-0 z-20">
              <button
                type="button"
                onClick={openMooni}
                className="w-full h-12 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-cyan-400/30 rounded-full px-1 pl-2 flex items-center gap-3 transition-all group shadow-lg"
              >
                  <div className="w-9 h-9 rounded-full bg-cyan-500/15 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={mooniChar} alt="" className="h-8 w-8 object-contain" draggable={false} />
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-200 font-medium truncate">{t('place.nav.askMooni')}</span>
                  <div className="ml-auto mr-2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all">
                      <Send size={12} />
                  </div>
              </button>
          </div>
      )}

      {relatedPlaces.length > 0 && relatedPlaceTabForMediaMode(mediaMode) && !selectedImg && !isFullScreen && !isMooniChatOpen && createPortal(
          <div className={`lg:hidden fixed bottom-0 left-0 w-full z-[160] bg-[#05070a]/90 backdrop-blur-xl border-t border-white/10 p-3 pb-8 animate-fade-in-up shadow-[0_-10px_30px_rgba(0,0,0,0.5)] ${mobileLandscapeChromeHidden}`}>
              <style>{`
                  .no-scrollbar::-webkit-scrollbar { display: none; }
                  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pl-3 pr-4">
                  {relatedPlaces.map((place, idx) => (
                      <button
                          key={`mob-rel-${idx}`}
                          onClick={() => handleRelatedClick(place.data, place.isBridge)}
                          className={`shrink-0 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all active:scale-95 flex items-center gap-1.5 shadow-sm
                              ${place.isBridge
                                ? 'bg-fuchsia-900/20 border-fuchsia-500/30 text-fuchsia-200 hover:bg-fuchsia-800/40 hover:border-fuchsia-400/50'
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
                      >
                          {place.isBridge && <Sparkles size={10} className="text-fuchsia-400" />}
                          {getLocalizedPlaceName(place.data, locale) || place.data.name}
                      </button>
                  ))}
              </div>
          </div>,
          document.body
      )}
    </div>
  );
});

export default PlaceChatPanel;
