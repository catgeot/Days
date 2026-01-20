import React, { useState, useEffect, useRef } from 'react';
import { FileText, User, Sparkles, Search, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom'; 
import TravelTicker from '../../../components/TravelTicker';
import Logo from './Logo';
import TripDock from './TripDock'; // 🚨 [추가]

const HomeUI = ({ 
  onSearch, 
  onTickerClick, 
  onTicketClick, 
  externalInput, 
  // 🚨 [추가] TripDock에 전달할 데이터와 함수들
  savedTrips, 
  onTripClick, 
  onTripDelete 
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (externalInput) {
      setInputValue(externalInput);
      setTimeout(() => { inputRef.current?.focus(); }, 100);
    }
  }, [externalInput]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (!e.nativeEvent.isComposing) {
        if (inputValue.trim() !== '') {
          onSearch(inputValue);
          setInputValue('');
          inputRef.current?.blur();
        }
      }
    }
  };

  const handleChange = (e) => { setInputValue(e.target.value); };

  return (
    <>
      {/* 1. 상단 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 grid grid-cols-12 items-start pointer-events-none">
        <div className="col-span-3 flex flex-col justify-center animate-fade-in-down pt-2 pl-2 pointer-events-auto">
          <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            <Logo />
          </h1>
          <span className="text-[10px] text-gray-500 tracking-[0.3em] ml-1">DEPARTURE LOUNGE</span>
        </div>

        <div className="col-span-6 flex justify-center animate-fade-in-down delay-100 pt-2 pointer-events-auto">
          <div className="relative group w-full max-w-md">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative flex items-center bg-black/20 backdrop-blur-md border border-white/10 rounded-full shadow-lg transition-all group-focus-within:bg-black/50 group-focus-within:border-blue-400/50 hover:bg-black/30 h-10">
              <div className="pl-4 text-gray-400 group-focus-within:text-blue-400 transition-colors"><Search size={16} /></div>
              <input 
                ref={inputRef}
                type="text" 
                value={inputValue}
                onChange={handleChange}
                placeholder="AI에게 여행 계획 물어보기..." 
                className="w-full bg-transparent text-white px-3 text-sm focus:outline-none placeholder-gray-500/80 font-medium"
                onKeyDown={handleKeyDown}
              />
              <div className="pr-4"><Sparkles size={14} className="text-white/20 group-hover:text-purple-400 transition-colors" /></div>
            </div>
          </div>
        </div>
        
        <div className="col-span-3 flex justify-end animate-fade-in-down pr-2 pointer-events-auto">
          <TravelTicker onCityClick={onTickerClick} />
        </div>
      </div>

      {/* 2. 하단 푸터 */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 z-20 flex items-end justify-between pointer-events-none">
        
        {/* 좌측: 리포트 이동 */}
        <Link to="/report" className="group flex items-center gap-2 pb-2 pl-2 pointer-events-auto cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-blue-400/50 transition-all shadow-lg group-hover:scale-110">
            <FileText size={18} className="text-gray-400 group-hover:text-blue-300" />
          </div>
          <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0">
            LOGBOOK
          </span>
        </Link>

        {/* 🚨 [중앙 핵심]: 티켓 버튼 + 여행 기록 도크(TripDock) */}
        <div className="pointer-events-auto mb-2 flex items-center">
          <button 
            onClick={onTicketClick}
            className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md text-white px-8 py-3 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all hover:scale-105 flex items-center gap-2 font-bold text-xs border border-white/10 tracking-wide flex-shrink-0"
          >
            <Ticket size={16} />
            <span>티켓 발권하기</span> 
          </button>

          {/* 🚨 여기에 도크 장착! */}
          <TripDock 
            savedTrips={savedTrips} 
            onTripClick={onTripClick} 
            onTripDelete={onTripDelete} 
          />
        </div>

        {/* 우측: 어드민 이동 */}
        <Link to="/auth/login" className="group flex items-center gap-2 flex-row-reverse pb-2 pr-2 pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-purple-400/50 transition-all shadow-lg group-hover:scale-110">
            <User size={18} className="text-gray-400 group-hover:text-purple-300" />
          </div>
          <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -mr-2 group-hover:mr-0">
            ADMIN
          </span>
        </Link>
      </footer>
    </>
  );
};

export default HomeUI;