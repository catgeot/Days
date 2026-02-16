import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Globe, FileText, User } from 'lucide-react';

// 🚨 [New] 일기장 패널을 열기 위한 전역 상태 훅 로드
import { useReport } from '../../context/ReportContext'; 

const MainLayout = () => {
  const location = useLocation();
  
  // 🚨 [New] 패널 조작 리모컨(isOpen, openReport) 가져오기
  const { isOpen, openReport } = useReport();

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden flex flex-col">
      
      {/* 1. 컨텐츠 영역 */}
      <div className="flex-1 w-full h-full overflow-y-auto pb-20"> 
        <Outlet />
      </div>

      {/* 2. ✨ [디자인 수정] 투명한 유리(Glass) 스타일 메뉴바 */}
      <div className="fixed bottom-0 left-0 right-0 z-[100]
        bg-black/30 backdrop-blur-xl 
        border-t border-white/10 
        px-8 py-4 flex justify-between items-center 
        shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      >
        
        {/* 🚨 [Fix] LOGBOOK 버튼: Link를 button으로 변경하고, 라우터(location) 대신 전역 상태(isOpen)로 활성화 여부 판단 */}
        <button 
          onClick={() => openReport('dashboard')} 
          className={`flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110 group ${isOpen ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          {/* 아이콘에 은은한 광택 효과 추가 */}
          <div className={`p-1 rounded-full ${isOpen ? 'bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}`}>
            <FileText size={24} />
          </div>
          <span className="text-[10px] font-medium tracking-wider">LOGBOOK</span>
        </button>

        {/* [중앙] 여행 홈 (떠있는 버튼) - 기존 유지 */}
        <Link 
          to="/" 
          className="relative -top-8 group"
        >
          {/* 버튼 배경: 반투명한 유리 구슬 느낌 */}
          <div className={`
            p-4 rounded-full border border-white/20 
            backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]
            transition-all duration-500 ease-out
            group-hover:scale-110 group-hover:border-blue-400/50 group-hover:shadow-[0_0_50px_rgba(59,130,246,0.6)]
            ${location.pathname === '/' ? 'bg-blue-600/80 text-white' : 'bg-gray-900/60 text-gray-300'}
          `}>
             <Globe size={28} className={location.pathname === '/' ? 'animate-spin-slow' : ''} />
          </div>
        </Link>

        {/* [우측] 관리자 - 기존 유지 */}
        <Link 
          to="/auth/login" 
          className={`flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110 group ${location.pathname.startsWith('/auth') ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
           <div className={`p-1 rounded-full ${location.pathname.startsWith('/auth') ? 'bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}`}>
            <User size={24} />
          </div>
          <span className="text-[10px] font-medium tracking-wider">ADMIN</span>
        </Link>

      </div>
    </div>
  );
};

export default MainLayout;