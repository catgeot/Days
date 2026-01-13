import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PenTool, Globe, Settings, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();

  // 현재 메뉴가 선택되었는지 확인하는 함수 (디자인용)
  const isActive = (path) => location.pathname === path 
    ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600" 
    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900";

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* [좌측 사이드바] 고정된 메뉴 영역 */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex">
        <div>
          {/* 로고 영역 */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-800">Gate 0 <span className="text-xs text-blue-500">Logbook</span></h1>
          </div>

          {/* 메뉴 리스트 */}
          <nav className="mt-6 flex flex-col gap-1 px-3">
            <Link to="/report" className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive('/report')}`}>
              <LayoutDashboard size={20} />
              대시보드
            </Link>
            
            <Link to="/report/write" className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive('/report/write')}`}>
              <PenTool size={20} />
              일보 작성
            </Link>

            <Link to="/report/settings" className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive('/report/settings')}`}>
              <Settings size={20} />
              설정
            </Link>
          </nav>
        </div>

        {/* 하단: 지구본으로 돌아가기 */}
        <div className="p-4 border-t border-gray-100">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <Globe size={20} />
            지구본으로 복귀
          </Link>
        </div>
      </aside>

      {/* [우측 콘텐츠 영역] 페이지마다 내용이 바뀌는 곳 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 모바일용 헤더 (PC에선 숨김) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:hidden">
          <span className="font-bold">Logbook</span>
          <Link to="/" className="p-2"><Globe size={20} /></Link>
        </header>

        {/* 실제 페이지 내용이 들어가는 구멍 (Outlet) */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet /> 
        </div>
      </main>
      
    </div>
  );
};

export default AdminLayout;