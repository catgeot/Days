import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { Plane, Map, CloudSun, FileText, User, Sparkles } from 'lucide-react'; // 아이콘 추가
import { Link } from 'react-router-dom'; // 링크 추가
import TicketModal from './TicketModal'; 
import Logo from './Logo'; 

function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const globeEl = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // ... (Resize 및 자동회전 useEffect 코드는 기존과 동일하므로 생략하지 않고 그대로 둡니다) ...
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

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

      {/* 2. UI 레이어 (전체 화면을 덮는 투명판) */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
        
        {/* --- [상단] 헤더 --- */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="flex flex-col animate-fade-in-down">
            <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              <Logo />
            </h1>
            <span className="text-[10px] text-gray-500 tracking-[0.3em] ml-1">DEPARTURE LOUNGE</span>
          </div>
          {/* 날씨 위젯 */}
          <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-3 flex flex-col gap-2 w-48 shadow-2xl animate-fade-in-down">
             {/* ... 날씨 내용 동일 ... */}
             <div className="text-[10px] text-gray-400 font-bold mb-1 flex items-center gap-1"><Plane size={10} /> LIVE TRENDING</div>
             <div className="flex justify-between items-center text-sm"><span className="font-medium text-white/90">01. Osaka</span><span className="flex items-center gap-1 text-yellow-400 text-xs"><CloudSun size={12} /> 18°C</span></div>
          </div>
        </header>


        {/* --- [중앙] 메시지 --- */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-60">
          <h2 className="text-4xl md:text-6xl font-thin tracking-[0.5em] text-white/20 blur-[1px]">
            WHERE TO?
          </h2>
        </div>


        {/* --- [하단] 컨트롤 영역 (여기가 핵심!) --- */}
        <footer className="relative w-full h-24 pointer-events-auto flex items-end justify-between">
          
          {/* 1. 좌측: 일보 시스템 (유리 조각처럼 떠있음) */}
          <Link to="/report" className="group flex items-center gap-2 transition-all hover:scale-110">
            <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-blue-400/50 transition-all shadow-[0_0_15px_rgba(0,0,0,0.3)]">
              <FileText size={18} className="text-gray-400 group-hover:text-blue-300" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0">
              LOGBOOK
            </span>
          </Link>

          {/* 2. 중앙: 티켓 발권 & AI 입력창 컨셉 */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex flex-col items-center gap-6">
            
            {/* 티켓 버튼 */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md text-white px-8 py-3 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] transition-all hover:scale-105 flex items-center gap-2 font-bold text-sm border border-white/10"
            >
              <Map size={16} />
              <span>티켓 발권</span> 
            </button>

            {/* ✨ AI 입력창 (컨셉 디자인) */}
            {/* 마치 우주선 콘솔에 텍스트를 입력하듯 은은하게 */}
            <div className="relative w-[400px] h-10 hidden md:flex items-center justify-center">
              <input 
                type="text" 
                placeholder="AI에게 여행지 추천을 물어보세요..." 
                className="w-full h-full bg-transparent border-b border-white/20 text-center text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-400/50 transition-colors"
              />
              <Sparkles size={14} className="absolute right-2 text-purple-400 animate-pulse" />
            </div>

          </div>

          {/* 3. 우측: 관리자 (유리 조각) */}
          <Link to="/auth/login" className="group flex items-center gap-2 flex-row-reverse transition-all hover:scale-110">
            <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-purple-400/50 transition-all shadow-[0_0_15px_rgba(0,0,0,0.3)]">
              <User size={18} className="text-gray-400 group-hover:text-purple-300" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -mr-2 group-hover:mr-0">
              ADMIN
            </span>
          </Link>

        </footer>
      </div>

      {/* 모달 */}
      <TicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
}

export default Home;