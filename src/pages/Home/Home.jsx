import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { FileText, User, Sparkles, Search, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import TicketModal from './TicketModal'; 
import ChatModal from '../../components/ChatModal'; 
import TravelTicker from '../../components/TravelTicker'; 
import Logo from './Logo'; 

function Home() {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2.5 }); 
    }
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      setInitialQuery(e.target.value);
      setIsChatOpen(true);
      e.target.value = '';
    }
  };

  const handleTicketIssue = (prompt) => {
    setInitialQuery(prompt);
    setIsChatOpen(true);
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* 1. 배경: 지구본 */}
      <div className="absolute inset-0 z-0">
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor="#7caeea"
          atmosphereAltitude={0.15}
        />
      </div>

      {/* 2. UI 레이어 */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
        
        {/* --- [상단] 헤더 --- */}
        {/* ✨ [수정됨] items-center -> items-start : 우측 리스트가 길어져도 로고/채팅바는 상단 고정 */}
        <header className="grid grid-cols-12 items-start pointer-events-auto relative z-20">
          
          {/* [좌측] 로고 (상단 패딩 추가로 높이 맞춤) */}
          <div className="col-span-3 flex flex-col justify-center animate-fade-in-down pt-2 pl-2">
            <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              <Logo />
            </h1>
            <span className="text-[10px] text-gray-500 tracking-[0.3em] ml-1">DEPARTURE LOUNGE</span>
          </div>

          {/* [중앙] 채팅/검색 바 (상단 패딩 추가) */}
          <div className="col-span-6 flex justify-center animate-fade-in-down delay-100 pt-2">
            <div className="relative group w-full max-w-md">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative flex items-center bg-black/20 backdrop-blur-md border border-white/10 rounded-full shadow-lg transition-all group-focus-within:bg-black/50 group-focus-within:border-blue-400/50 hover:bg-black/30 h-10">
                <div className="pl-4 text-gray-400 group-focus-within:text-blue-400 transition-colors"><Search size={16} /></div>
                <input 
                  type="text" 
                  placeholder="AI에게 여행 계획 물어보기..." 
                  className="w-full bg-transparent text-white px-3 text-sm focus:outline-none placeholder-gray-500/80 font-medium"
                  onKeyDown={handleSearch}
                />
                <div className="pr-4"><Sparkles size={14} className="text-white/20 group-hover:text-purple-400 transition-colors" /></div>
              </div>
            </div>
          </div>
          
          {/* [우측] 여행 랭킹 리스트 (Top 10) */}
          <div className="col-span-3 flex justify-end animate-fade-in-down pr-2">
            <TravelTicker />
          </div>

        </header>


        {/* --- [중앙 배경] WHERE TO? --- */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-50 z-0 select-none mix-blend-overlay">
          <h2 className="text-[12vw] font-black tracking-[0.05em] text-white/15 blur-[1px] whitespace-nowrap drop-shadow-2xl">
            WHERE TO?
          </h2>
        </div>


        {/* --- [하단] 컨트롤 영역 --- */}
        <footer className="relative w-full h-24 pointer-events-auto flex items-end justify-between z-20">
          
          {/* 좌측: 일보 */}
          <Link to="/report" className="group flex items-center gap-2 transition-all hover:scale-110 pb-4 pl-2">
            <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-blue-400/50 transition-all shadow-lg">
              <FileText size={18} className="text-gray-400 group-hover:text-blue-300" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0">
              LOGBOOK
            </span>
          </Link>

          {/* 중앙: 티켓 버튼 */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-6">
            <button 
              onClick={() => setIsTicketOpen(true)}
              className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md text-white px-8 py-3 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all hover:scale-105 flex items-center gap-2 font-bold text-xs border border-white/10 tracking-wide"
            >
              <Ticket size={16} />
              <span>티켓 발권하기</span> 
            </button>
          </div>

          {/* 우측: 관리자 */}
          <Link to="/auth/login" className="group flex items-center gap-2 flex-row-reverse transition-all hover:scale-110 pb-4 pr-2">
            <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-purple-400/50 transition-all shadow-lg">
              <User size={18} className="text-gray-400 group-hover:text-purple-300" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -mr-2 group-hover:mr-0">
              ADMIN
            </span>
          </Link>

        </footer>
      </div>

      <TicketModal 
        isOpen={isTicketOpen} 
        onClose={() => setIsTicketOpen(false)} 
        onIssue={handleTicketIssue}
      />
      
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        initialQuery={initialQuery} 
      />

    </div>
  );
}

export default Home;