import React, { useState, useEffect } from 'react';
import {
  User, Search, Ticket, MessageSquare, X, Trash2,
  Palmtree, Mountain, Building2, Landmark, Compass,
  Eye, EyeOff, Droplet, Sun, Moon,
  PenTool,
  Leaf,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TravelTicker from '../components/TravelTicker';
import Logo from './Logo';
import TourMobileBar from './TourMobileBar';
import { useTrendingData } from '../hooks/useTrendingData';
import { CATEGORY_LABELS } from './SearchDiscovery/constants';

/** 모바일 활성 카테고리 — 테마색 글로우 */
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

  const trendingData = useTrendingData();

  useEffect(() => {
    if (externalInput) {
      queueMicrotask(() => setInputValue(externalInput));
    }
  }, [externalInput]);

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

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex items-start gap-3 md:grid md:grid-cols-12 pointer-events-none w-full">
        <div
          data-site-notice-anchor-mobile
          className="md:hidden absolute inset-x-0 bottom-0 h-px pointer-events-none"
          aria-hidden="true"
        />

        <div onClick={onLogoClick} className="md:col-span-2 flex-shrink-0 flex flex-col justify-center animate-fade-in-down pt-2 md:pl-2 pointer-events-auto cursor-pointer group relative z-50">
          <h1 className="group-hover:scale-105 transition-transform origin-left"><Logo /></h1>
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

        <div className="flex-1 md:col-span-5 flex flex-col items-stretch md:items-center animate-fade-in-down delay-100 pt-1 md:pt-2 pointer-events-auto relative z-50 min-w-0">
          {isTourCinema && tourLocation ? (
            <TourMobileBar
              className="w-full md:hidden"
              location={tourLocation}
              globeMode={globeMode}
              tourPivoted={tourPivoted}
              onSkip={onTourSkip}
              onEndTour={onTourEnd}
              onStartTour={onTourBarStartTour}
              onClose={onTourBarClose}
            />
          ) : (
           <div data-site-notice-anchor className="relative group w-full max-w-[200px] sm:max-w-xs md:max-w-md self-end">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
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

      {!isTourCinema && (
      <div className={`fixed z-50 pointer-events-auto animate-fade-in-left
         bottom-8 left-4 w-auto max-w-[calc(100vw-7rem)] flex justify-start
         md:absolute md:w-auto md:right-6 md:top-6 md:bottom-auto md:left-auto md:max-w-none md:flex-col
         ${isPlaceCardVisible && !isFlightCinema ? 'max-lg:hidden' : ''}
         ${isFlightCinema ? 'max-lg:hidden' : ''}`}
      >
         <div className="relative max-md:home-category-bar-shell">
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
                   aria-pressed={isActive}
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

      {(isTagLoading || relatedPlaces.length > 0) && (
        <div className="hidden md:flex fixed left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-2 md:gap-3 pointer-events-auto animate-fade-in-right">
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
      )}

      <footer className="hidden md:block fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="absolute bottom-6 left-6 md:left-[8.75rem] flex items-end gap-4 pointer-events-auto">
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

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center pointer-events-auto">
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
