import React, { useState, useEffect, useRef } from 'react';
import {
  User, Search, Ticket, MessageSquare, MapPin, X, Trash2,
  Palmtree, Mountain, Building2, Landmark, Compass,
  Eye, EyeOff, Droplet, Sun, Moon,
  PenTool,
  Leaf,
  LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TravelTicker from '../components/TravelTicker';
import Logo from './Logo';
import { useTrendingData } from '../hooks/useTrendingData';
import SearchDiscoveryModal from './SearchDiscoveryModal';

const HomeUI = React.memo(({
  onSearch, onTickerClick, externalInput, savedTrips, onTripClick, onTripDelete, onOpenChat, onLogoClick,
  relatedTags = [], isTagLoading = false, onTagClick,
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
  onLogout
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const navigate = useNavigate();

  const trendingData = useTrendingData();

  useEffect(() => { if (externalInput) setInputValue(externalInput); }, [externalInput]);

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

        <div onClick={onLogoClick} className="md:col-span-2 flex-shrink-0 flex flex-col justify-center animate-fade-in-down pt-2 md:pl-2 pointer-events-auto cursor-pointer group relative z-50">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 group-hover:scale-105 transition-transform origin-left"><Logo /></h1>
        </div>

        <div className="hidden md:flex md:col-span-1 justify-center gap-2 pt-3 animate-fade-in-down delay-75 pointer-events-auto relative z-50">
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
        </div>

        <div className="flex-1 md:col-span-5 flex flex-col items-end md:items-center animate-fade-in-down delay-100 pt-1 md:pt-2 pointer-events-auto relative z-50">
           <div className="relative group w-full max-w-[200px] sm:max-w-xs md:max-w-md">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div
              onClick={() => setIsDiscoveryModalOpen(true)}
              className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/30 shadow-lg transition-all h-10 md:h-12 rounded-full cursor-pointer hover:bg-black/50 hover:border-blue-400/50 group-hover:border-blue-400/50"
            >
              <div className="pl-3 md:pl-4 text-gray-400 transition-colors group-hover:text-blue-400"><Search size={16} className="md:w-[18px] md:h-[18px]" /></div>
              <input
                type="text"
                value={inputValue}
                readOnly
                placeholder="검색 및 탐색"
                className="w-full bg-transparent text-white px-2 md:px-3 text-xs md:text-sm focus:outline-none placeholder-gray-300/80 font-medium cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="hidden md:flex md:col-span-1 justify-center gap-3 pt-3 animate-fade-in-down pointer-events-auto relative z-50">
           <button onClick={onTogglePinVisibility} className={`w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all shadow-lg group ${isPinVisible ? 'text-blue-400 border-blue-500/30' : 'text-gray-500'}`}>
              {isPinVisible ? <Eye size={16} className="group-hover:scale-110 transition-transform" /> : <EyeOff size={16} className="group-hover:scale-110 transition-transform" />}
           </button>
           <button onClick={onClearScouts} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all shadow-lg group"><Trash2 size={16} className="group-hover:scale-110 transition-transform" /></button>
        </div>

        <div className="hidden md:flex md:col-span-3 justify-end animate-fade-in-down pr-24 pointer-events-auto relative z-50">
          <TravelTicker
            data={trendingData}
            onCityClick={onTickerClick}
            isExpanded={isTickerExpanded}
            onToggle={setIsTickerExpanded}
          />
        </div>
      </div>

      <div className="fixed z-50 pointer-events-auto animate-fade-in-left
         bottom-8 left-1/2 -translate-x-1/2 w-auto max-w-[95vw] flex justify-center
         md:absolute md:w-auto md:right-6 md:top-6 md:bottom-auto md:left-auto md:translate-x-0 md:flex-col md:max-w-none">
         <div className="flex items-center gap-2 sm:gap-3 bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl
            flex-row flex-nowrap overflow-x-auto
            md:flex-col md:gap-4 md:overflow-visible">
            {CATEGORIES.map((cat) => {
               const isActive = selectedCategory === cat.id;
               const Icon = cat.icon;
               return (
                 <button key={cat.id} onClick={() => onCategorySelect(cat.id)} className={`relative group w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'hover:bg-white/5 border border-transparent'}`}>
                   <Icon size={18} className={`md:w-5 md:h-5 transition-colors duration-300 ${isActive ? cat.color : 'text-gray-500 group-hover:text-gray-300'}`} />
                   <div className="hidden md:block absolute right-full mr-3 px-3 py-1 bg-black/80 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">{cat.label}</div>
                   {isActive && <div className={`absolute right-1 top-1 w-1.5 h-1.5 rounded-full ${cat.color.replace('text', 'bg')} shadow-[0_0_5px_currentColor]`}></div>}
                 </button>
               )
            })}
         </div>
      </div>

      {(isTagLoading || relatedTags.length > 0) && (
        <div className="flex fixed left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-2 md:gap-3 pointer-events-auto animate-fade-in-right">
              {!isTagLoading && relatedTags.map((tag, idx) => (
              <button key={idx} onClick={() => onTagClick(tag)} className="group relative flex items-center justify-between w-28 p-2 md:w-40 md:p-3 bg-black/30 backdrop-blur-md border border-white/5 rounded-xl hover:bg-white/10 hover:border-blue-500/50 md:hover:w-44 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden">
                    <MapPin size={12} className="flex-shrink-0 text-gray-400 group-hover:text-blue-400 transition-colors md:w-[14px] md:h-[14px]" />
                    <span className="text-[10px] md:text-sm text-gray-200 font-medium group-hover:text-white truncate">{tag}</span>
                  </div>
              </button>
            ))}
        </div>
      )}

      <footer className="hidden md:block fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="absolute bottom-6 left-6 flex items-end gap-4 pointer-events-auto">
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

      <SearchDiscoveryModal
        isOpen={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
        onSelect={(spot) => onTripClick(spot)}
        initialQuery={inputValue}
      />
    </>
  );
});

export default HomeUI;
