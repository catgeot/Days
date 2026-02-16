// src/pages/Home/components/HomeUI.jsx
// 🚨 [Fix/New] 여행 계획(Ticket) 버튼 제거 및 'AI 대화하기' 단일 메인 버튼으로 UI 통합 (뺄셈의 미학)
// 🚨 [New] 좌측 하단 Admin 버튼 옆에 LogBook 전용 다이렉트 진입 버튼 추가

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Search, Ticket, MessageSquare, MapPin, X, Trash2,
  Palmtree, Mountain, Building2, Plane, Compass, 
  Eye, EyeOff, Droplet, Sun, Moon,
  PenTool // 🚨 [New] LogBook 아이콘 추가
} from 'lucide-react'; 
import { Link } from 'react-router-dom'; 
import TravelTicker from '../components/TravelTicker'; 
import Logo from './Logo';
import { useTrendingData } from '../hooks/useTrendingData';

// 🚨 [New] 일기장 전역 상태를 제어하기 위한 훅 로드
import { useReport } from '../../../context/ReportContext';

const HomeUI = ({ 
  onSearch, onTickerClick, externalInput, savedTrips, onTripClick, onTripDelete, onOpenChat, onLogoClick, 
  relatedTags = [], isTagLoading = false, onTagClick,
  selectedCategory, onCategorySelect,
  isTickerExpanded, setIsTickerExpanded,
  onClearScouts,
  isPinVisible, 
  onTogglePinVisibility,
  globeTheme, 
  onThemeToggle 
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const trendingData = useTrendingData();

  // 🚨 [New] 일기장 오픈 함수 꺼내기
  const { openReport } = useReport();

  useEffect(() => { if (externalInput) setInputValue(externalInput); }, [externalInput]);
  const handleKeyDown = (e) => { if (e.key === 'Enter' && inputValue.trim() !== '') { onSearch(inputValue); inputRef.current?.blur(); } };
  const handleChange = (e) => { setInputValue(e.target.value); };
  const handleClear = () => { setInputValue(''); inputRef.current?.focus(); };

  const CATEGORIES = [
    { id: 'paradise', icon: Palmtree, label: 'Paradise', color: 'text-cyan-400' },
    { id: 'nature', icon: Mountain, label: 'Nature', color: 'text-green-400' },
    { id: 'urban', icon: Building2, label: 'Urban', color: 'text-purple-400' },
    { id: 'nearby', icon: Plane, label: 'Nearby', color: 'text-yellow-400' },
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
      <div className="absolute top-0 left-0 right-0 z-20 p-6 grid grid-cols-12 items-start pointer-events-none">
        {/* 1. Logo */}
        <div onClick={onLogoClick} className="col-span-2 flex flex-col justify-center animate-fade-in-down pt-2 pl-2 pointer-events-auto cursor-pointer group">
          <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 group-hover:scale-105 transition-transform origin-left"><Logo /></h1>
        </div>

        {/* 2. Globe Theme Toggle */}
        <div className="col-span-1 flex justify-center pt-3 animate-fade-in-down delay-75 pointer-events-auto">
           <button 
             onClick={onThemeToggle} 
             className={`w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border flex items-center justify-center transition-all shadow-lg group ${getThemeConfig().color} ${getThemeConfig().border}`}
             title="지구본 무드 변경"
           >
              <ThemeIcon size={16} className="group-hover:scale-110 transition-transform" />
           </button>
        </div>

        {/* 3. Omni-box */}
        <div className="col-span-5 flex flex-col items-center animate-fade-in-down delay-100 pt-2 pointer-events-auto relative">
           <div className="relative group w-full max-w-md z-50">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg transition-all h-12 rounded-full group-focus-within:bg-black/60 group-focus-within:border-blue-400/50 hover:bg-black/50">
              <div className="pl-4 text-gray-400 group-focus-within:text-blue-400 transition-colors"><Search size={18} /></div>
              <input ref={inputRef} type="text" value={inputValue} onChange={handleChange} placeholder="어디로 떠나시나요?" className="w-full bg-transparent text-white px-3 text-sm focus:outline-none placeholder-gray-500/80 font-medium" onKeyDown={handleKeyDown} />
              {inputValue && (<button onClick={handleClear} className="p-1 mr-2 text-gray-400 hover:text-white transition-colors"><X size={16} /></button>)}
            </div>
          </div>
        </div>
        
        {/* 4. Controls: Toggle + Cleaner */}
        <div className="col-span-1 flex justify-center gap-3 pt-3 animate-fade-in-down pointer-events-auto">
           <button onClick={onTogglePinVisibility} className={`w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all shadow-lg group ${isPinVisible ? 'text-blue-400 border-blue-500/30' : 'text-gray-500'}`}>
              {isPinVisible ? <Eye size={16} className="group-hover:scale-110 transition-transform" /> : <EyeOff size={16} className="group-hover:scale-110 transition-transform" />}
           </button>
           <button onClick={onClearScouts} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all shadow-lg group"><Trash2 size={16} className="group-hover:scale-110 transition-transform" /></button>
        </div>

        {/* 5. Ticker */}
        <div className="col-span-3 flex justify-end animate-fade-in-down pr-24 pointer-events-auto">
          <TravelTicker 
            data={trendingData} 
            onCityClick={onTickerClick} 
            isExpanded={isTickerExpanded}
            onToggle={setIsTickerExpanded}
          />
        </div>
      </div>

      {/* --- Filters & Footer --- */}
      <div className="absolute right-6 top-6 z-20 flex flex-col gap-3 pointer-events-auto animate-fade-in-left">
         <div className="flex flex-col items-center gap-4 bg-black/30 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
            {CATEGORIES.map((cat) => {
               const isActive = selectedCategory === cat.id;
               const Icon = cat.icon;
               return (
                 <button key={cat.id} onClick={() => onCategorySelect(cat.id)} className={`relative group w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'hover:bg-white/5 border border-transparent'}`}>
                   <Icon size={20} className={`transition-colors duration-300 ${isActive ? cat.color : 'text-gray-500 group-hover:text-gray-300'}`} />
                   <div className="absolute right-full mr-3 px-3 py-1 bg-black/80 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">{cat.label}</div>
                   {isActive && <div className={`absolute right-1 top-1 w-1.5 h-1.5 rounded-full ${cat.color.replace('text', 'bg')} shadow-[0_0_5px_currentColor]`}></div>}
                 </button>
               )
            })}
         </div>
      </div>

      {(isTagLoading || relatedTags.length > 0) && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 pointer-events-auto animate-fade-in-right">
              {!isTagLoading && relatedTags.map((tag, idx) => (
              <button key={idx} onClick={() => onTagClick(tag)} className="group relative flex items-center justify-between w-40 p-3 bg-black/30 backdrop-blur-md border border-white/5 rounded-xl hover:bg-white/10 hover:border-blue-500/50 hover:w-44 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400 group-hover:text-blue-400 transition-colors" /><span className="text-sm text-gray-200 font-medium group-hover:text-white">{tag}</span></div>
              </button>
            ))}
        </div>
      )}

      <footer className="absolute bottom-0 left-0 right-0 p-6 z-20 pointer-events-none">
        
        {/* 🚨 [Fix] 좌측 하단 메뉴 영역: ADMIN 및 LOGBOOK 버튼 나란히 배치 */}
        <div className="absolute bottom-6 left-6 flex items-end gap-4 pointer-events-auto">
          <Link to="/auth/login" className="group flex items-center gap-2 pb-2 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-purple-400/50 transition-all shadow-lg"><User size={18} /></div>
              <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">ADMIN</span>
          </Link>
          
          {/* 🚨 [New] LogBook 다이렉트 진입 버튼 신설 */}
          <button onClick={() => openReport('dashboard')} className="group flex items-center gap-2 pb-2 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-emerald-400/50 transition-all shadow-lg">
                  <PenTool size={18} className="text-white group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">LOGBOOK</span>
          </button>
        </div>

        {/* 🚨 중앙 하단 메인 버튼 */}
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
};
export default HomeUI;