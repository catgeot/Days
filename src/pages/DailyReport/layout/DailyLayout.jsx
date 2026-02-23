// 🚨 [Fix] text-gray-900 추가: Home(지구본)의 text-white 저주가 하위로 상속되어 입력창 글씨가 투명해지는 스텔스 버그 완벽 차단!
// 🚨 [Fix/New] 모바일 대응: 좌우 분할(flex-row)을 모바일에서 상하 분할(flex-col)로 변경. 
// 모바일 전용 얇은 Top Bar를 신설하여 홈(지구본) 복귀 및 로그아웃 기능 이식.

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Globe, LogOut } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase'; 
import { useReport } from '../../../context/ReportContext';

const DailyLayout = ({ children }) => {
  const { closeReport } = useReport();
  const [user, setUser] = useState(null);

  // 🚨 [Safe Path] 모바일 헤더용 유저 상태 독립적 확보 (사이드바 의존성 탈피)
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
      closeReport();
    }
  };

  return (
    // 🚨 모바일에서는 세로 배치(flex-col), PC(md 이상)에서는 기존 가로 배치(flex-row) 유지
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      
      {/* 🚨 [New] 모바일 전용 헤더 (PC에서는 hidden으로 완벽 은닉) */}
      <div className="md:hidden w-full h-14 bg-[#1a1c23] flex items-center justify-between px-4 shrink-0 border-b border-gray-800 z-50">
        <button 
          onClick={closeReport} 
          className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <Globe size={20} />
          <span className="text-sm font-bold tracking-wider">GATEO</span>
        </button>
        
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 truncate max-w-[120px]">
              {user.email.split('@')[0]}
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

      {/* 1. 왼쪽 고정 사이드바 (DailyReport 전용) - 내부에 md:flex로 PC에서만 렌더링되도록 처리됨 */}
      <Sidebar />

      {/* 2. 오른쪽 컨텐츠 영역 */}
      <div className="flex-1 h-full overflow-y-auto relative">
        {children}
      </div>

    </div>
  );
};

export default DailyLayout;