import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { FileText, User, Sparkles, Search, Ticket, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import TicketModal from './TicketModal'; 
import ChatModal from '../../components/ChatModal'; 
import TravelTicker from '../../components/TravelTicker'; 
import Logo from './Logo'; 
import { getAddressFromCoordinates } from '../../lib/geocoding';

function Home() {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [isGeoLoading, setIsGeoLoading] = useState(false); 
  
  // ✨ [추가] 지구본에서 선택된 위치 저장을 위한 상태
  const [selectedLocation, setSelectedLocation] = useState(null);

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

  // ✨ [수정] 지구본 클릭 핸들러: 채팅이 아니라 '티켓 모달'을 엽니다.
  const handleGlobeClick = async ({ lat, lng }) => {
    setIsGeoLoading(true); 
    
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
    }

    const result = await getAddressFromCoordinates(lat, lng);

    setIsGeoLoading(false); 

    if (result) {
      // ✨ [변경점] 바로 채팅을 여는 게 아니라, 위치 정보를 담아서 티켓 창을 엽니다.
      // 예: "Japan, Tokyo"
      setSelectedLocation(`${result.country}, ${result.city}`);
      setIsTicketOpen(true);
    } else {
      if (globeEl.current) globeEl.current.controls().autoRotate = true;
      alert("🌊 그곳은 넓은 바다입니다. 육지를 클릭해주세요!");
    }
  };
	// ✨ 2. [추가] 랭킹 리스트 클릭 핸들러
  const handleTickerClick = (cityName) => {
    console.log("Ranking Clicked:", cityName);
    setSelectedLocation(cityName); // 선택된 도시 저장
    setIsTicketOpen(true); // 티켓 모달 열기
  };

  // ✨ [추가] 모달 닫을 때 초기화 및 회전 재개 함수
  const handleCloseTicket = () => {
    setIsTicketOpen(false);
    setSelectedLocation(null); // 위치 정보 초기화
    if (globeEl.current) globeEl.current.controls().autoRotate = true; // 회전 다시 시작
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* 1. 배경: 지구본 */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isChatOpen ? 'opacity-30' : 'opacity-100'}`}>
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor="#7caeea"
          atmosphereAltitude={0.15}
          onGlobeClick={handleGlobeClick} 
        />
      </div>

      {/* 로딩 인디케이터 */}
      {isGeoLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-none">
          <Loader2 size={48} className="text-blue-400 animate-spin mb-4" />
          <span className="text-lg font-bold tracking-widest text-white/90">LOCATING...</span>
          <span className="text-xs text-gray-400 mt-2">위치 확인 중</span>
        </div>
      )}

      {/* 2. UI 레이어 */}
      {/* 상단 헤더 */}
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
                type="text" 
                placeholder="AI에게 여행 계획 물어보기..." 
                className="w-full bg-transparent text-white px-3 text-sm focus:outline-none placeholder-gray-500/80 font-medium"
                onKeyDown={handleSearch}
              />
              <div className="pr-4"><Sparkles size={14} className="text-white/20 group-hover:text-purple-400 transition-colors" /></div>
            </div>
          </div>
        </div>
        
        <div className="col-span-3 flex justify-end animate-fade-in-down pr-2 pointer-events-auto">
             <TravelTicker onCityClick={handleTickerClick} />
				</div>
      </div>

      {/* 중앙 텍스트 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-0 select-none mix-blend-overlay pointer-events-none">
        <h2 className="text-[12vw] font-black tracking-[0.05em] text-white/15 blur-[1px] whitespace-nowrap drop-shadow-2xl">
          WHERE TO?
        </h2>
      </div>

      {/* 하단 푸터 */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 z-20 flex items-end justify-between pointer-events-none">
        <Link to="/report" className="group flex items-center gap-2 pb-2 pl-2 pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-blue-400/50 transition-all shadow-lg group-hover:scale-110">
            <FileText size={18} className="text-gray-400 group-hover:text-blue-300" />
          </div>
          <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0">
            LOGBOOK
          </span>
        </Link>

        <div className="pointer-events-auto mb-2">
          <button 
            onClick={() => setIsTicketOpen(true)}
            className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md text-white px-8 py-3 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all hover:scale-105 flex items-center gap-2 font-bold text-xs border border-white/10 tracking-wide"
          >
            <Ticket size={16} />
            <span>티켓 발권하기</span> 
          </button>
        </div>

        <Link to="/auth/login" className="group flex items-center gap-2 flex-row-reverse pb-2 pr-2 pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-purple-400/50 transition-all shadow-lg group-hover:scale-110">
            <User size={18} className="text-gray-400 group-hover:text-purple-300" />
          </div>
          <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -mr-2 group-hover:mr-0">
            ADMIN
          </span>
        </Link>
      </footer>

      {/* ✨ [핵심] TicketModal에 선택된 위치(preFilledDestination) 전달 */}
      <TicketModal 
        isOpen={isTicketOpen} 
        onClose={handleCloseTicket} // 닫을 때 회전 재개
        onIssue={handleTicketIssue}
        preFilledDestination={selectedLocation} // 지구본에서 클릭한 주소 전달
      />
      
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => {
          setIsChatOpen(false);
          if (globeEl.current) globeEl.current.controls().autoRotate = true;
        }} 
        initialQuery={initialQuery} 
      />

    </div>
  );
}

export default Home;