// 🚨 [Fix] shared에 있던 레이아웃을 DailyReport 영토 내부로 가져왔습니다.
// 🚨 [New] 이제 이 레이아웃은 DailyReport 전용 사이드바를 참조합니다.

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar/'; // 🚨 [Fix] 같은 폴더 내의 Sidebar 참조

const DailyLayout = () => {
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      
      {/* 1. 왼쪽 고정 사이드바 (DailyReport 전용) */}
      <Sidebar />

      {/* 2. 오른쪽 컨텐츠 영역 */}
      <div className="flex-1 h-full overflow-y-auto relative">
        <Outlet />
      </div>

    </div>
  );
};

export default DailyLayout;