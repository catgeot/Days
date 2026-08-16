import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  User, Search, Ticket, MessageSquare, X, Trash2,
  Palmtree, Mountain, Building2, Landmark, Compass,
  Eye, EyeOff, Droplet, Sun, Moon,
  PenTool,
  Leaf,
  LogOut,
  Sparkles,
  CalendarDays,
  Map,
  ChevronUp,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TravelTicker from '../components/TravelTicker';
import Logo from './Logo';
import TourMobileBar from './TourMobileBar';
import GlobeFaceRegionRail, {
  GlobeFaceSubregionBar,
  MobileRegionsMenuSwitch,
  SeaBasinListButton,
} from './GlobeFaceRegionRail';
import { shouldShowFaceSubregionChips } from '../lib/globeFaceSubregions.js';
import { useMobileFaceRegionListHeight } from '../hooks/useMobileFaceRegionListHeight';
import { useTrendingData } from '../hooks/useTrendingData';
import { CATEGORY_LABELS } from './SearchDiscovery/constants';

/** 모바일 좌상단 바로가기 — 테마 국가 리스트 펼침 시 접힘 라벨 */
const MOBILE_QUICK_LINKS = [
  {
    to: '/korea',
    shortLabel: '축제',
    label: '한국의 축제',
    icon: CalendarDays,
    chipClass:
      'border-amber-400/45 bg-[#14110c] shadow-[0_0_18px_rgba(245,158,11,0.22)] hover:border-amber-300/70 hover:bg-[#1c1710]',
    iconWrapClass: 'border-amber-400/35 bg-amber-500/15 text-amber-300 group-hover:bg-amber-500/25',
  },
  {
    to: '/korea/theme/scenic',
    shortLabel: '명승',
    label: '한국의 명승',
    icon: Map,
    chipClass:
      'border-emerald-400/40 bg-[#0f1412] shadow-[0_0_18px_rgba(52,211,153,0.18)] hover:border-emerald-300/65 hover:bg-[#121a16]',
    iconWrapClass: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-300 group-hover:bg-emerald-500/25',
  },
  {
    to: '/blog/curation',
    shortLabel: '추천',
    label: 'AI 큐레이션',
    icon: Sparkles,
    chipClass:
      'border-sky-400/45 bg-[#0c1218] shadow-[0_0_18px_rgba(56,189,248,0.2)] hover:border-sky-300/70 hover:bg-[#101820]',
    iconWrapClass: 'border-sky-400/35 bg-sky-500/15 text-sky-300 group-hover:bg-sky-500/25',
  },
];

const MOBILE_QUICK_LINKS_COLLAPSED_LABEL = MOBILE_QUICK_LINKS.map((item) => item.shortLabel).join(' · ');

/** 모바일 활성 카테고리 — 테마색 글로우 (배포본과 동일) */
const CATEGORY_ACTIVE_MOBILE = {
  paradise: 'bg-cyan-500/25 border-cyan-400/50 shadow-[0_0_14px_rgba(34,211,238,0.35)]',
  nature: 'bg-green-500/25 border-green-400/50 shadow-[0_0_14px_rgba(74,222,128,0.35)]',
  urban: 'bg-purple-500/25 border-purple-400/50 shadow-[0_0_14px_rgba(192,132,252,0.35)]',
  culture: 'bg-yellow-500/20 border-yellow-400/50 shadow-[0_0_14px_rgba(250,204,21,0.3)]',
  adventure: 'bg-red-500/25 border-red-400/50 shadow-[0_0_14px_rgba(248,113,113,0.35)]',
};

const HomeUI = React.memo(({
  onSearch: _onSearch, onTickerClick, externalInput, savedTrips: _savedTrips, onTripClick: _onTripClick, onTripDelete: _onTripDelete, onOpenChat, onLogoClick,
  relatedPlaces = [], isTagLoading = false, onRelatedPlaceClick,
  selectedCategory, onCategorySelect,
  faceRegionsOpen = false,
  onFaceRegionsDismiss,
  selectedFaceRegionId = null,
  onFaceRegionSelect,
  selectedFaceSubregionId = null,
  onFaceSubregionSelect,
  faceRailMode = 'country',
  onFaceRailModeChange,
  visibleSeaBasins = [],
  selectedSeaBasinId = null,
  onSeaBasinSelect,
  onSeaBasinListMaxHeightChange,
  isTickerExpanded, setIsTickerExpanded,
  onClearScouts,
  isPinVisible,
  onTogglePinVisibility,
  globeTheme,
  onThemeToggle,
  isZenMode,
  onToggleZenMode,
  user,
  onLogout,
  isTourCinema = false,
  isFlightCinema = false,
  isPlaceCardVisible = false,
  homeChromeEpoch = 0,
  tourLocation = null,
  tourPivoted = false,
  globeMode = null,
  onTourSkip,
  onTourEnd,
  onTourBarClose,
  onTourBarStartTour,
}) => {
  const [, setInputValue] = useState('');
  const navigate = useNavigate();
  const hideExploreChrome =
    (isPlaceCardVisible && !isFlightCinema) || isFlightCinema;
  /** 모바일 나라 메뉴 — 펼침일 때만 목록 노출 · 숨김 시 지도 탐색 */
  const [mobileRegionsExpanded, setMobileRegionsExpanded] = useState(true);
  /** 모바일 좌상단 바로가기 — 기본 접힘 · 탭으로 펼침 */
  const [mobileQuickLinksExpanded, setMobileQuickLinksExpanded] = useState(false);
  const mobileCategoryBarRef = useRef(null);
  const mobileRegionsAuxRef = useRef(null);
  const showMobileSubregionBar = Boolean(
    selectedCategory
    && shouldShowFaceSubregionChips(selectedCategory)
    && mobileRegionsExpanded,
  );
  const mobileShowRegionList = mobileRegionsExpanded;
  const mobileRegionListHeight = useMobileFaceRegionListHeight({
    enabled: Boolean(
      !hideExploreChrome
      && faceRegionsOpen
      && selectedCategory
      && mobileShowRegionList,
    ),
    hasSubregionBar: showMobileSubregionBar,
    chromeEpoch: homeChromeEpoch,
    faceRegionsOpen: Boolean(faceRegionsOpen && selectedCategory),
    bottomAuxRef: mobileRegionsAuxRef,
    categoryBarRef: mobileCategoryBarRef,
  });

  useLayoutEffect(() => {
    onSeaBasinListMaxHeightChange?.(mobileRegionListHeight?.maxHeightPx ?? null);
  }, [mobileRegionListHeight?.maxHeightPx, onSeaBasinListMaxHeightChange]);

  const handleMobileRegionsExpandedChange = useCallback((expanded) => {
    setMobileRegionsExpanded(expanded);
    if (!expanded && faceRailMode === 'sea') {
      onFaceRailModeChange?.('country');
    }
  }, [faceRailMode, onFaceRailModeChange]);

  const handleSeaBasinListToggle = useCallback(() => {
    if (faceRailMode === 'sea') {
      onFaceRailModeChange?.('country');
      return;
    }
    onFaceRailModeChange?.('sea');
    setMobileRegionsExpanded(true);
  }, [faceRailMode, onFaceRailModeChange]);

  const trendingData = useTrendingData();

  useEffect(() => {
    if (externalInput) {
      queueMicrotask(() => setInputValue(externalInput));
    }
  }, [externalInput]);

  useEffect(() => {
    if (faceRegionsOpen && mobileRegionsExpanded) {
      setMobileQuickLinksExpanded(false);
    }
  }, [faceRegionsOpen, mobileRegionsExpanded]);

  const CATEGORIES = [
    { id: 'paradise', icon: Palmtree, label: 'Paradise', color: 'text-cyan-400' },
    { id: 'nature', icon: Mountain, label: 'Nature', color: 'text-green-400' },
    { id: 'urban', icon: Building2, label: 'Urban', color: 'text-purple-400' },
    { id: 'culture', icon: Landmark, label: 'Culture', color: 'text-yellow-400' },
    { id: 'adventure', icon: Compass, label: 'Adventure', color: 'text-red-400' },
  ];

  const getThemeConfig = () => {
    switch(globeTheme) {
      case 'neon': return { icon: Droplet, color: 'text-cyan-400', border: 'border-cyan-500/30' };
      case 'bright': return { icon: Sun, color: 'text-yellow-400', border: 'border-yellow-500/30' };
      case 'deep': return { icon: Moon, color: 'text-indigo-400', border: 'border-indigo-500/30' };
      default: return { icon: Droplet, color: 'text-cyan-400', border: 'border-cyan-500/30' };
    }
  };
  const ThemeIcon = getThemeConfig().icon;
  const showMobileQuickLinksCollapsed = !hideExploreChrome && !mobileQuickLinksExpanded;

  const renderMobileQuickLink = (item, linkClassName = '') => {
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setMobileQuickLinksExpanded(false)}
        className={`group relative flex w-auto max-w-[14rem] items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-colors touch-manipulation ${item.chipClass} ${linkClassName}`}
        aria-label={`${item.label}로 이동`}
      >
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${item.iconWrapClass}`}>
          <Icon size={15} aria-hidden="true" />
        </span>
        <span className="truncate text-[12px] font-bold tracking-wide text-white break-keep">
          {item.label}
        </span>
      </Link>
    );
  };

  const [mobileQuickLinkFirst, ...mobileQuickLinkRest] = MOBILE_QUICK_LINKS;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] p-4 md:p-6 flex items-start gap-3 md:grid md:grid-cols-12 pointer-events-none w-full">
        <div
          data-site-notice-anchor-mobile
          className="md:hidden absolute inset-x-0 bottom-0 h-px pointer-events-none"
          aria-hidden="true"
        />

        <div
          key={homeChromeEpoch}
          className="md:col-span-2 flex-shrink-0 relative z-[110] pointer-events-auto pt-2 md:pl-2 max-md:animate-none md:animate-fade-in-down"
          data-home-chrome-hit
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/*
            Chrome+WebGL: 반투명/blur만으로는 지도로 클릭이 뚫림 → 불투명 실드·칩 BG.
            translate3d/isolate 레이어 승격은 쓰지 않음 — URL바·resize 후 paint/hit 어긋남(명승→큐레이션) 유발.
          */}
          <div
            aria-hidden="true"
            className={`pointer-events-auto absolute -inset-x-2 -inset-y-2 z-0 rounded-2xl bg-[#070707]/92 ${
              faceRegionsOpen && !isTourCinema ? 'max-md:-bottom-14' : ''
            }`}
          />
          <div className="relative z-10 flex flex-col items-start gap-2">
            <div
              onClick={onLogoClick}
              className="cursor-pointer group touch-manipulation"
            >
              <h1 className="group-hover:opacity-90 transition-opacity origin-left">
                <Logo />
              </h1>
            </div>
            {!isTourCinema && (
              <>
                <div className="md:hidden">
                  {showMobileQuickLinksCollapsed ? (
                    <button
                      type="button"
                      onClick={() => {
                        onFaceRegionsDismiss?.();
                        setMobileQuickLinksExpanded(true);
                      }}
                      className="group relative flex w-auto max-w-[14rem] items-center gap-2 rounded-xl border border-white/25 bg-[#101010] px-2.5 py-1.5 shadow-[0_0_14px_rgba(255,255,255,0.08)] transition-colors hover:border-white/40 hover:bg-[#161616] touch-manipulation"
                      aria-label={`바로가기 메뉴 펼치기 — ${MOBILE_QUICK_LINKS.map((item) => item.label).join(', ')}`}
                      title="바로가기 메뉴 펼치기"
                    >
                      <span className="flex items-center gap-1">
                        {MOBILE_QUICK_LINKS.map((item) => {
                          const Icon = item.icon;
                          return (
                            <span
                              key={item.to}
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${item.iconWrapClass}`}
                              aria-hidden="true"
                            >
                              <Icon size={12} />
                            </span>
                          );
                        })}
                      </span>
                      <span className="truncate text-[11px] font-bold tracking-tight text-white/95 break-keep">
                        {MOBILE_QUICK_LINKS_COLLAPSED_LABEL}
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex max-w-[17.5rem] items-stretch gap-1.5">
                        {renderMobileQuickLink(mobileQuickLinkFirst, 'min-w-0 flex-1 max-w-none')}
                        <button
                          type="button"
                          onClick={() => setMobileQuickLinksExpanded(false)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/35 bg-black/70 text-white shadow-[0_0_14px_rgba(255,255,255,0.14)] touch-manipulation transition-colors hover:border-white/50 hover:bg-black/85 active:scale-[0.97]"
                          aria-label="바로가기 메뉴 접기"
                          title="메뉴 접기"
                        >
                          <ChevronUp size={20} strokeWidth={2.5} aria-hidden="true" />
                        </button>
                      </div>
                      {mobileQuickLinkRest.map((item) => renderMobileQuickLink(item))}
                    </div>
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start gap-2">
                  {MOBILE_QUICK_LINKS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`group relative flex w-auto max-w-[14rem] items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-colors touch-manipulation ${item.chipClass}`}
                        aria-label={`${item.label}로 이동`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${item.iconWrapClass}`}>
                          <Icon size={15} aria-hidden="true" />
                        </span>
                        <span className="truncate text-[12px] font-bold tracking-wide text-white break-keep">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="hidden md:flex md:col-span-1 justify-center gap-3 lg:gap-4 pt-3 animate-fade-in-down delay-75 pointer-events-auto relative z-50">
           <button
             onClick={onThemeToggle}
             className={`w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border flex items-center justify-center transition-all shadow-lg group ${getThemeConfig().color} ${getThemeConfig().border}`}
             title="지구본 무드 변경"
           >
              <ThemeIcon size={16} className="group-hover:scale-110 transition-transform" />
           </button>

           <button
             onClick={onToggleZenMode}
             className={`w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all shadow-lg group hover:bg-emerald-500/20 hover:border-emerald-500/30 ${isZenMode ? 'text-emerald-400 border-emerald-500/30' : 'text-emerald-400'}`}
             title="Zen Mode (전체화면 힐링)"
           >
              <Leaf size={16} className="group-hover:scale-110 transition-transform" />
           </button>

           <button
             onClick={onTogglePinVisibility}
             className={`w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all shadow-lg group ${isPinVisible ? 'text-blue-400 border-blue-500/30' : 'text-gray-500'}`}
             title={isPinVisible ? '마커·지명 숨기기' : '마커·지명 보이기'}
           >
              {isPinVisible ? <Eye size={16} className="group-hover:scale-110 transition-transform" /> : <EyeOff size={16} className="group-hover:scale-110 transition-transform" />}
           </button>
           <button onClick={onClearScouts} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all shadow-lg group"><Trash2 size={16} className="group-hover:scale-110 transition-transform" /></button>
        </div>

        <div className="flex-1 md:col-span-5 flex flex-col items-stretch md:items-center animate-fade-in-down delay-100 pt-1 md:pt-2 pointer-events-none z-50 min-w-0 md:relative">
          {isTourCinema && tourLocation ? (
            <TourMobileBar
              className="w-full md:hidden pointer-events-auto"
              location={tourLocation}
              globeMode={globeMode}
              tourPivoted={tourPivoted}
              onSkip={onTourSkip}
              onEndTour={onTourEnd}
              onStartTour={onTourBarStartTour}
              onClose={onTourBarClose}
            />
          ) : (
           <div data-site-notice-anchor className="group pointer-events-auto w-[min(12.5rem,calc(100vw-5.5rem))] sm:max-w-xs md:max-w-md md:w-full absolute right-3 top-[1.35rem] md:relative md:right-auto md:top-auto md:self-end">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div
              onClick={() => navigate('/explore')}
              className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/30 shadow-lg transition-all h-10 md:h-12 rounded-full cursor-pointer hover:bg-black/50 hover:border-blue-400/50 group-hover:border-blue-400/50"
            >
              <div className="pl-3 md:pl-4 text-gray-400 transition-colors group-hover:text-blue-400"><Search size={16} className="md:w-[18px] md:h-[18px]" /></div>
              <span
                className="w-full bg-transparent text-gray-300/80 px-2 md:px-3 text-xs md:text-sm font-medium cursor-pointer select-none truncate"
              >
                지금 기분, 느낌으로 검색해 보세요
              </span>
            </div>
          </div>
          )}
        </div>

        <div className="hidden md:block md:col-span-1" />

        <div className="hidden md:flex md:col-span-3 justify-end animate-fade-in-down pr-24 pointer-events-none relative z-50">
          <div className="pointer-events-auto">
            <TravelTicker
              data={trendingData}
              onCityClick={onTickerClick}
              isExpanded={isTickerExpanded}
              onToggle={setIsTickerExpanded}
            />
          </div>
        </div>
      </div>

      {/* 모바일 하단 스택 — 나라/세부칩/카테고리 (중분류 바는 뷰포트 폭) */}
      {!isTourCinema && (
      <div className={`fixed z-50 left-[max(0.25rem,env(safe-area-inset-left,0px))] bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))]
         flex flex-col items-start gap-1.5 pointer-events-none overflow-visible md:hidden
         ${isPlaceCardVisible && !isFlightCinema ? 'max-lg:hidden' : ''}
         ${isFlightCinema ? 'max-lg:hidden' : ''}`}
      >
        {!hideExploreChrome && faceRegionsOpen && selectedCategory && (
          <div
            className="flex flex-col items-start gap-1.5 animate-fade-in-right"
            onPointerDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            {mobileShowRegionList ? (
              <GlobeFaceRegionRail
                category={selectedCategory}
                selectedRegionId={selectedFaceRegionId}
                onSelectRegion={onFaceRegionSelect}
                showSubregions
                subregionPlacement="none"
                selectedSubregionId={selectedFaceSubregionId}
                onSelectSubregion={onFaceSubregionSelect}
                listHeightStyle={mobileRegionListHeight?.listHeightStyle ?? null}
                railMode={faceRailMode}
                seaBasins={visibleSeaBasins}
                selectedSeaBasinId={selectedSeaBasinId}
                onSelectSeaBasin={onSeaBasinSelect}
                className="mb-0.5"
              />
            ) : null}
            <div ref={mobileRegionsAuxRef} className="flex flex-col items-start gap-1">
              {mobileRegionsExpanded ? (
                <SeaBasinListButton
                  prominent
                  active={faceRailMode === 'sea'}
                  onClick={handleSeaBasinListToggle}
                />
              ) : null}
              <MobileRegionsMenuSwitch
                expanded={mobileRegionsExpanded}
                onChange={handleMobileRegionsExpandedChange}
              />
            {mobileRegionsExpanded && showMobileSubregionBar ? (
              <GlobeFaceSubregionBar
                key={`subregion-bar-${selectedCategory}`}
                category={selectedCategory}
                selectedSubregionId={selectedFaceSubregionId}
                onSelectSubregion={onFaceSubregionSelect}
                className="w-[calc(100vw-0.5rem-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] min-w-0 animate-fade-in-up"
              />
            ) : null}
            </div>
          </div>
        )}

        <div ref={mobileCategoryBarRef} className="pointer-events-auto relative max-md:home-category-bar-shell animate-fade-in-left">
          <div className="home-category-bar-halo md:hidden" aria-hidden="true" />
          <div className="home-category-bar-card relative z-[1] flex items-end gap-0.5 sm:gap-1
             max-md:bg-black/80 max-md:border-white/20 max-md:backdrop-blur-xl max-md:p-2 max-md:rounded-2xl max-md:border
             md:items-center md:gap-4 md:bg-black/40 md:p-2.5 md:rounded-2xl md:border md:border-white/10 md:shadow-2xl
             flex-row flex-nowrap overflow-x-auto md:flex-col md:overflow-visible">
            {CATEGORIES.map((cat) => {
               const isActive = selectedCategory === cat.id;
               const Icon = cat.icon;
               return (
                 <button
                   key={cat.id}
                   type="button"
                   onClick={() => onCategorySelect(cat.id)}
                   aria-label={CATEGORY_LABELS[cat.id] || cat.label}
                   aria-pressed={isActive && faceRegionsOpen}
                   className={`relative group flex flex-col items-center justify-center gap-0.5 flex-shrink-0 rounded-xl transition-all duration-300
                     w-[3.25rem] py-1.5 md:w-14 md:py-2 max-md:border
                     ${isActive
                       ? `${CATEGORY_ACTIVE_MOBILE[cat.id]} md:bg-white/10 md:border-white/20 md:shadow-[0_0_15px_rgba(255,255,255,0.1)]`
                       : 'max-md:bg-black/45 max-md:border-white/22 max-md:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:hover:bg-white/5 md:border-transparent border-transparent'
                     }`}
                 >
                   <Icon size={18} className={`md:w-5 md:h-5 transition-colors duration-300 ${isActive ? cat.color : 'max-md:text-gray-100 text-gray-500 group-hover:text-gray-300'}`} />
                   <span className={`text-[9px] md:text-[10px] font-bold leading-none tracking-tight pointer-events-none ${isActive ? cat.color : 'text-gray-200/90 md:text-gray-400 md:group-hover:text-gray-300'}`}>
                     {CATEGORY_LABELS[cat.id]}
                   </span>
                 </button>
               )
            })}
          </div>
        </div>
      </div>
      )}

      {/* PC 좌측 — 카테고리 + 나라 칩 + 권역 범례 (투톱 아래 상단 고정 · 하위칩은 아래로만 확장 · 스크롤바 없음) */}
      <div className="hidden md:flex fixed left-6 top-[14.5rem] z-[55] flex-col justify-start gap-3 pointer-events-none animate-fade-in-right">
        {!isTourCinema && (
          <div
            className={`pointer-events-auto flex flex-row items-start gap-2 ${
              (isPlaceCardVisible && !isFlightCinema) || isFlightCinema ? 'max-lg:hidden' : ''
            }`}
          >
            <div className="home-category-bar-card relative z-[1] flex items-center gap-4 bg-black/40 p-2.5 rounded-2xl border border-white/10 shadow-2xl flex-col overflow-visible">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategorySelect(cat.id)}
                    aria-label={CATEGORY_LABELS[cat.id] || cat.label}
                    aria-pressed={isActive && faceRegionsOpen}
                    className={`relative group flex flex-col items-center justify-center gap-0.5 flex-shrink-0 rounded-xl transition-all duration-300
                      w-14 py-2 border
                      ${isActive
                        ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : 'hover:bg-white/5 border-transparent'
                      }`}
                  >
                    <Icon size={20} className={`transition-colors duration-300 ${isActive ? cat.color : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <span className={`text-[10px] font-bold leading-none tracking-tight pointer-events-none ${isActive ? cat.color : 'text-gray-400 group-hover:text-gray-300'}`}>
                      {CATEGORY_LABELS[cat.id]}
                    </span>
                  </button>
                );
              })}
            </div>
            {!isFlightCinema && faceRegionsOpen && selectedCategory ? (
              <GlobeFaceRegionRail
                category={selectedCategory}
                selectedRegionId={selectedFaceRegionId}
                onSelectRegion={onFaceRegionSelect}
                showSubregions
                selectedSubregionId={selectedFaceSubregionId}
                onSelectSubregion={onFaceSubregionSelect}
                railMode={faceRailMode}
                onSeaBasinListToggle={handleSeaBasinListToggle}
                seaBasins={visibleSeaBasins}
                selectedSeaBasinId={selectedSeaBasinId}
                onSelectSeaBasin={onSeaBasinSelect}
                className="pt-0.5"
              />
            ) : null}
          </div>
        )}
        <div id="gateo-cluster-legend-slot" className="pointer-events-auto" />
      </div>

      {/* PC 우측 — 연관 키워드 (티커 확장 시 숨김 · 랭킹 패널과 겹침 방지) */}
      {(isTagLoading || relatedPlaces.length > 0) && !isTickerExpanded && (
        <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-[calc(50%+6.125rem)] z-[55] flex-col gap-2 md:gap-3 pointer-events-none animate-fade-in-left">
          <div className="flex flex-col gap-2 md:gap-3 pointer-events-auto items-end">
            {!isTagLoading && relatedPlaces.map((place, idx) => (
              <button
                key={`${place.name}-${idx}`}
                type="button"
                onClick={() => onRelatedPlaceClick(place.data, place.isBridge)}
                className={`group relative flex items-center justify-between w-28 p-2 md:w-40 md:p-3 backdrop-blur-md border rounded-xl md:hover:w-44 transition-all duration-300 shadow-lg ${
                  place.isBridge
                    ? 'bg-fuchsia-500/10 border-fuchsia-500/30 hover:bg-fuchsia-500/20 hover:border-fuchsia-400/50'
                    : 'bg-black/30 border-white/5 hover:bg-white/10 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden">
                  {place.isBridge ? (
                    <Sparkles size={12} className="flex-shrink-0 text-fuchsia-400 group-hover:animate-pulse md:w-[14px] md:h-[14px]" />
                  ) : (
                    <Compass size={12} className="flex-shrink-0 text-blue-400 group-hover:animate-pulse md:w-[14px] md:h-[14px]" />
                  )}
                  <span className={`text-[10px] md:text-sm font-medium truncate ${
                    place.isBridge ? 'text-fuchsia-200 group-hover:text-white' : 'text-gray-200 group-hover:text-white'
                  }`}>{place.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-[60] pointer-events-none">
        <div className="hidden md:flex absolute bottom-6 left-[8.75rem] items-end gap-4 pointer-events-auto">
          {user ? (
            <button onClick={onLogout} className="group flex items-center gap-2 pb-2 cursor-pointer focus:outline-none">
                <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-red-400/50 transition-all shadow-lg">
                    <LogOut size={18} className="text-gray-200 group-hover:text-red-400 transition-colors" />
                </div>
                <span className="text-[11px] text-gray-300 font-bold tracking-widest group-hover:text-white transition-colors">LOGOUT</span>
            </button>
          ) : (
            <Link to="/auth/login" state={{ from: window.location.pathname + window.location.search }} className="group flex items-center gap-2 pb-2 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-purple-400/50 transition-all shadow-lg">
                    <User size={18} className="text-gray-200 group-hover:text-purple-400 transition-colors" />
                </div>
                <span className="text-[11px] text-gray-300 font-bold tracking-widest group-hover:text-white transition-colors">LOGIN</span>
            </Link>
          )}

          <Link to="/blog" className="group flex items-center gap-2 pb-2 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-emerald-400/50 transition-all shadow-lg">
                  <PenTool size={18} className="text-gray-200 group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-[11px] text-gray-300 font-bold tracking-widest group-hover:text-white transition-colors">LOGBOOK</span>
          </Link>
        </div>

        <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center pointer-events-auto">
          <button
            onClick={() => onOpenChat()}
            className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md text-white px-8 py-3 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center gap-2 font-bold text-xs border border-white/10 hover:scale-105 transition-transform"
          >
            <MessageSquare size={16} /> <span>AI와 대화하기</span>
          </button>
        </div>
      </footer>
    </>
  );
});

export default HomeUI;
