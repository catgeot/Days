import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { Plane, Map, BookOpen, Settings, CloudSun } from 'lucide-react';
import { Link } from 'react-router-dom';
import TicketModal from './TicketModal'; // 경로가 맞는지 확인해주세요
import Logo from './Logo'; // 경로가 맞는지 확인해주세요

function Home() {
  // 1. 모달의 열림/닫힘 상태를 관리하는 '스위치'를 만듭니다.
  // 초기값은 false (닫힌 상태)입니다.
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 지구본 제어를 위한 Ref
  const globeEl = useRef();
  
  // 화면 크기 반응형 상태
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  // 윈도우 창 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 지구본 자동 회전 설정
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* 3D 지구본 (배경) */}
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

      {/* UI 레이어 */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* 상단 헤더 */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              <Logo />
            </h1>
            <span className="text-xs text-gray-400 tracking-widest">DEPARTURE LOUNGE</span>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-lg p-3 flex flex-col gap-2 w-64 shadow-xl">
            <div className="text-xs text-gray-400 font-bold mb-1 flex items-center gap-1">
              <Plane size={12} /> LIVE TRENDING
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-700 pb-1">
              <span className="font-medium text-white">01. Osaka</span>
              <span className="flex items-center gap-1 text-yellow-400 text-xs"><CloudSun size={12} /> 18°C</span>
            </div>
          </div>
        </header>

        {/* 중앙 메시지 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-80">
          <h2 className="text-4xl md:text-6xl font-thin tracking-widest text-white/20">
            WHERE TO NEXT?
          </h2>
        </div>

        {/* 하단 컨트롤 바 */}
        <footer className="flex justify-between items-end pointer-events-auto">
          
          {/* 일보 작성 버튼 */}
          <Link to="/report" className="group flex items-center gap-3 bg-gray-900/80 hover:bg-gray-800 text-gray-300 px-5 py-3 rounded-full border border-gray-700 transition-all shadow-lg hover:shadow-blue-500/20">
            <div className="bg-gray-700 p-2 rounded-full group-hover:bg-blue-500 transition-colors">
              <BookOpen size={18} />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs text-gray-400">Logbook</p>
              <p className="text-sm font-semibold">업무 일지 작성</p>
            </div>
          </Link>

          {/* 중앙 티켓 발권 버튼 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <button 
              /* 2. 버튼 클릭 시 스위치를 켭니다 (true로 변경) */
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all hover:scale-105 flex items-center gap-2 font-bold text-lg"
            >
              <Map size={20} />
              {/* 버튼 안에 있던 컴포넌트는 뺐습니다. 대신 글자를 넣습니다. */}
              <span>티켓 발권</span> 
            </button>
          </div>

          <button className="p-3 bg-gray-900/50 hover:bg-gray-800 rounded-full text-gray-400 border border-gray-700 transition-all">
            <Settings size={20} />
          </button>
        </footer>
      </div>

      {/* 3. 모달 컴포넌트를 UI 레이어 밖, 가장 최상단에 배치합니다.
         isOpen: 스위치 상태를 전달 (true면 보이고, false면 안 보임)
         onClose: 모달 내부의 X 버튼을 눌렀을 때 스위치를 끄는 함수 전달
      */}
      <TicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

    </div>
  );
}

export default Home;