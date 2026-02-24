// src/pages/Home/components/HomeUI.jsx
// 🚨 [Fix/New] 여행 계획(Ticket) 버튼 제거 및 'AI 대화하기' 단일 메인 버튼으로 UI 통합 (뺄셈의 미학)
// 🚨 [New] 좌측 하단 Admin 버튼 옆에 LogBook 전용 다이렉트 진입 버튼 추가
// 🚨 [New] 좌측 상단 테마 버튼 옆에 Zen Mode (Leaf) 버튼 추가 및 연동 완료.
// 🚨 [Fix] 모바일 대응: 검색바, Ticker, View 컨트롤 모바일 숨김 / 카테고리 하단 이동 / 주요 기능 우측 상단 묶음
// 🚨 [Fix] 모바일 UI 증발(Z-index) 및 레이아웃 붕괴 방지: fixed 포지션 변경, 하단 안전 여백(bottom-8) 추가, 아이콘 순서 변경(테마->AI->로그북)
// 🚨 [Fix] 모바일 검색 안전 설계 도입: Overlay 구조(DOM 붕괴 차단), 투명 방어막(Backdrop) 클릭 시 닫힘 처리, Ref 분리

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Search, Ticket, MessageSquare, MapPin, X, Trash2,
  Palmtree, Mountain, Building2, Plane, Compass, 
  Eye, EyeOff, Droplet, Sun, Moon,
  PenTool,
  Leaf
} from 'lucide-react'; 
import { Link } from 'react-router-dom'; 
import TravelTicker from '../components/TravelTicker'; 
import Logo from './Logo';
import { useTrendingData } from '../hooks/useTrendingData';
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
  onThemeToggle,
  isZenMode, 
  onToggleZenMode 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  // 🚨 [Fix] 데스크탑과 모바일 Input의 Ref를 분리하여 포커스 충돌 방지
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  
  const trendingData = useTrendingData();
  const { openReport } = useReport();

  useEffect(() => { if (externalInput) setInputValue(externalInput); }, [externalInput]);
  
  // 모바일 검색창 열릴 때 자동 포커스
  useEffect(() => {
    if (isMobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  const handleKeyDown = (e) => { 
    if (e.key === 'Enter' && inputValue.trim() !== '') { 
      onSearch(inputValue); 
      inputRef.current?.blur(); 
      mobileInputRef.current?.blur();
      setIsMobileSearchOpen(false); 
    } 
  };
  
  const handleChange = (e) => { setInputValue(e.target.value); };
  
  const handleClear = () => { 
    setInputValue(''); 
    inputRef.current?.focus(); 
    mobileInputRef.current?.focus();
  };

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
      {/* 🚨 [New] 투명 방어막: 모바일 검색창 활성화 시 바탕 화면 터치 감지 후 닫기 */}
      {isMobileSearchOpen && (
        <div 
          className="fixed inset-0 z-[45] pointer-events-auto touch-none" 
          onClick={() => setIsMobileSearchOpen(false)} 
        />
      )}

      <div className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between md:grid md:grid-cols-12 items-start pointer-events-none w-full">
        
        {/* 1. Logo */}
        <div onClick={onLogoClick} className="md:col-span-2 flex flex-col justify-center animate-fade-in-down pt-2 md:pl-2 pointer-events-auto cursor-pointer group relative z-50">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 group-hover:scale-105 transition-transform origin-left"><Logo /></h1>
        </div>

        {/* 🚨 [Fix] 모바일 우측 상단 버튼 그룹: Overlay 방식으로 레이아웃 붕괴 원천 차단 */}
        <div className="flex md:hidden items-center gap-2 pt-2 pointer-events-auto animate-fade-in-down delay-75 h-10 relative">
            
            {/* 기본 우측 상단 아이콘들은 숨기거나 DOM에서 지우지 않음 (Safe Path) */}
            <button onClick={() => setIsMobileSearchOpen(true)} className="w-9 h-9 flex-shrink-0 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow-lg">
              <Search size={14} />
            </button>
            <button onClick={onThemeToggle} className={`w-9 h-9 flex-shrink-0 rounded-full bg-white/5 backdrop-blur-md border flex items-center justify-center transition-all shadow-lg ${getThemeConfig().color} ${getThemeConfig().border}`}>
              <ThemeIcon size={14} />
            </button>
            <button onClick={() => onOpenChat()} className="w-9 h-9 flex-shrink-0 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-500/30 flex items-center justify-center shadow-lg">
              <MessageSquare size={14} className="text-blue-400" />
            </button>
            <button onClick={() => openReport('dashboard')} className="w-9 h-9 flex-shrink-0 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center shadow-lg">
              <PenTool size={14} className="text-emerald-400" />
            </button>

            {/* 🚨 [New] 오버레이 확장형 검색바 (기존 버튼 위를 절대 좌표로 덮음) */}
            <div className={`absolute right-0 top-2 flex items-center bg-black/90 backdrop-blur-2xl border border-white/10 rounded-full transition-all duration-300 overflow-hidden shadow-2xl z-50 origin-right ${isMobileSearchOpen ? 'w-[75vw] opacity-100 h-9 px-2' : 'w-0 opacity-0 h-9 px-0 pointer-events-none'}`}>
              <Search size={14} className="text-blue-400 flex-shrink-0 ml-1" />
              <input 
                ref={mobileInputRef}
                type="text" 
                value={inputValue} 
                onChange={handleChange} 
                onKeyDown={handleKeyDown} 
                placeholder="어디로 떠나시나요?" 
                className="w-full bg-transparent text-white text-xs focus:outline-none ml-2 placeholder-gray-500/80"
              />
              {inputValue && (
                <button onClick={handleClear} className="p-1 mr-1 text-gray-400 hover:text-white transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
        </div>

        {/* 2. Globe Theme & Zen Mode Toggle (데스크탑 전용 렌더링) */}
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

        {/* 3. Omni-box (데스크탑 전용 렌더링) */}
        <div className="hidden md:flex md:col-span-5 flex-col items-center animate-fade-in-down delay-100 pt-2 pointer-events-auto relative z-50">
           <div className="relative group w-full max-w-md">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg transition-all h-12 rounded-full group-focus-within:bg-black/60 group-focus-within:border-blue-400/50 hover:bg-black/50">
              <div className="pl-4 text-gray-400 group-focus-within:text-blue-400 transition-colors"><Search size={18} /></div>
              <input ref={inputRef} type="text" value={inputValue} onChange={handleChange} placeholder="어디로 떠나시나요?" className="w-full bg-transparent text-white px-3 text-sm focus:outline-none placeholder-gray-500/80 font-medium" onKeyDown={handleKeyDown} />
              {inputValue && (<button onClick={handleClear} className="p-1 mr-2 text-gray-400 hover:text-white transition-colors"><X size={16} /></button>)}
            </div>
          </div>
        </div>
        
        {/* 4. Controls: Toggle + Cleaner (모바일 숨김) */}
        <div className="hidden md:flex md:col-span-1 justify-center gap-3 pt-3 animate-fade-in-down pointer-events-auto relative z-50">
           <button onClick={onTogglePinVisibility} className={`w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all shadow-lg group ${isPinVisible ? 'text-blue-400 border-blue-500/30' : 'text-gray-500'}`}>
              {isPinVisible ? <Eye size={16} className="group-hover:scale-110 transition-transform" /> : <EyeOff size={16} className="group-hover:scale-110 transition-transform" />}
           </button>
           <button onClick={onClearScouts} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all shadow-lg group"><Trash2 size={16} className="group-hover:scale-110 transition-transform" /></button>
        </div>

        {/* 5. Ticker (모바일 숨김) */}
        <div className="hidden md:flex md:col-span-3 justify-end animate-fade-in-down pr-24 pointer-events-auto relative z-50">
          <TravelTicker 
            data={trendingData} 
            onCityClick={onTickerClick} 
            isExpanded={isTickerExpanded}
            onToggle={setIsTickerExpanded}
          />
        </div>
      </div>

      {/* --- Filters (Category) --- */}
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

      {/* 태그 리스트: 모바일 활성화 및 컴팩트화 */}
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

      {/* --- Footer Controls --- */}
      <footer className="hidden md:block fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="absolute bottom-6 left-6 flex items-end gap-4 pointer-events-auto">
          <Link to="/auth/login" className="group flex items-center gap-2 pb-2 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-purple-400/50 transition-all shadow-lg"><User size={18} /></div>
              <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">ADMIN</span>
          </Link>
          
          <button onClick={() => openReport('dashboard')} className="group flex items-center gap-2 pb-2 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-emerald-400/50 transition-all shadow-lg">
                  <PenTool size={18} className="text-white group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">LOGBOOK</span>
          </button>
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
};
export default HomeUI;