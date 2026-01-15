import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LogOut, LayoutDashboard, PenTool, Globe, User } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 현재 어디 페이지에 있는지 확인용
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100">로딩 중...</div>;

  if (!session) {
    window.location.href = '/login'; 
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // 메뉴 아이템을 위한 공통 스타일 함수
  const getMenuClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' // 활성 상태: 파란색 + 그림자
        : 'text-gray-400 hover:bg-slate-800 hover:text-white'   // 비활성: 어두운 배경에 호버 효과
    }`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* ✨ [업그레이드된 사이드바] */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        
        {/* 1. 로고 영역 */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl">D</div>
            <h1 className="text-2xl font-bold tracking-tight">Days<span className="text-blue-500">.</span></h1>
          </div>
          <p className="text-slate-500 text-xs pl-1">Daily Report System</p>
        </div>

        {/* 2. 메뉴 리스트 */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          <Link to="/report" className={getMenuClass('/report')}>
            <LayoutDashboard size={20} />
            <span>대시보드</span>
          </Link>
          
          <Link to="/report/write" className={getMenuClass('/report/write')}>
            <PenTool size={20} />
            <span>일보 작성</span>
          </Link>
        </nav>

        {/* 3. 하단 프로필 영역 */}
        <div className="p-4 m-4 bg-slate-800 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">관리자</p>
              <p className="text-xs text-slate-400 truncate w-32">{session.user.email}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link to="/" className="flex-1 text-center py-2 text-xs bg-slate-700 rounded hover:bg-slate-600 text-slate-300 transition-colors flex items-center justify-center gap-1">
              <Globe size={12} /> 여행홈
            </Link>
            <button 
              onClick={handleLogout}
              className="flex-1 py-2 text-xs bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <LogOut size={12} /> 로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* 오른쪽 콘텐츠 영역 */}
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;