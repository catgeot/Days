// src/pages/DailyReport/layout/DailyLayout.jsx
// 🚨 [Fix/New] 수정 이유:
// 1. [Routing] {children} 렌더링 방식을 React Router v6의 <Outlet />으로 교체하여 중첩 라우팅 정상화.
// 2. [Subtraction] useReport 전역 상태 의존성(closeReport) 완전 제거.
// 3. [Safe Path] 상태 변경 대신 useNavigate를 사용하여 홈('/')으로 강제 회군(Deep Linking).

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar'; // 기존 사이드바 컴포넌트 유지
import { Globe, LogOut } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase'; 
// 🚨 [New] 라우터 제어용 훅 임포트
import { Outlet, useNavigate } from 'react-router-dom';

const DailyLayout = () => {
  const navigate = useNavigate(); // 🚨 [New] URL 네비게이션 훅
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      navigate('/'); // 🚨 [Fix] 로그아웃 시 closeReport() 대신 홈 URL로 라우팅
    }
  };

  const handleGoHome = () => {
    navigate('/'); // 🚨 [Fix] 홈 버튼 클릭 시 closeReport() 대신 홈 URL로 라우팅
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      
      <div className="md:hidden w-full h-14 bg-[#1a1c23] flex items-center justify-between px-4 shrink-0 border-b border-gray-800 z-50">
        <button 
          onClick={handleGoHome} // 🚨 [Fix] 함수 교체
          className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <Globe size={20} />
          <span className="text-sm font-bold tracking-wider">GATEO</span>
        </button>
        
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 truncate max-w-[120px]">
              {user?.email?.split('@')[0]}
            </span>
            <button 
              onClick={handleLogout} 
              className="text-gray-400 hover:text-red-400 transition-colors p-1"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 1. 왼쪽 고정 사이드바 (DailyReport 전용) */}
      <Sidebar />

      {/* 2. 오른쪽 컨텐츠 영역 */}
      <div className="flex-1 h-full overflow-y-auto relative">
        {/* 🚨 [Fix] {children}에서 <Outlet />으로 전면 교체 (자식 라우트 렌더링 공간) */}
        <Outlet />
      </div>

    </div>
  );
};

export default DailyLayout;