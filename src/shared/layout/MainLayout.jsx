import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Globe, FileText, User } from 'lucide-react';

// 🚨 [Fix] 뺄셈의 미학: 전역 상태(useReport) 의존성 완전 제거. (라우터가 모든 것을 통제함)

const MainLayout = () => {
  const location = useLocation();
  
  // 현재 경로가 place(여행지 상세)이거나 홈(/)일 때 중앙 버튼 활성화
  const isHomeOrPlace = location.pathname === '/' || location.pathname.startsWith('/place');

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden flex flex-col">
      
      {/* 1. 컨텐츠 영역 */}
      <div className="flex-1 w-full h-full overflow-y-auto pb-20"> 
        <Outlet />
      </div>

      {/* 2. ✨ [디자인 수정] 투명한 유리(Glass) 스타일 메뉴바 (Midnight Canvas 톤앤매너 유지) */}
      <div className="fixed bottom-0 left-0 right-0 z-[100]
        bg-black/30 backdrop-blur-xl 
        border-t border-white/10 
        px-8 py-4 flex justify-between items-center 
        shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      >
        
        {/* 🚨 [Fix] LOGBOOK 버튼: button 태그를 Link로 교체하고 URL(/report) 라우팅으로 전환 */}
        <Link 
          to="/report" 
          className={`flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110 group ${location.pathname.startsWith('/report') ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          <div className={`p-1 rounded-full ${location.pathname.startsWith('/report') ? 'bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}`}>
            <FileText size={24} />
          </div>
          <span className="text-[10px] font-medium tracking-wider">LOGBOOK</span>
        </Link>

        {/* 🚨 [Fix] [중앙] 여행 홈: 활성화 조건을 isHomeOrPlace로 확장 */}
        <Link 
          to="/" 
          className="relative -top-8 group"
        >
          <div className={`
            p-4 rounded-full border border-white/20 
            backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)]
            transition-all duration-500 ease-out
            group-hover:scale-110 group-hover:border-blue-400/50 group-hover:shadow-[0_0_50px_rgba(59,130,246,0.6)]
            ${isHomeOrPlace ? 'bg-blue-600/80 text-white' : 'bg-gray-900/60 text-gray-300'}
          `}>
             <Globe size={28} className={isHomeOrPlace ? 'animate-spin-slow' : ''} />
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