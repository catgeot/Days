import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  return (
    // 화면 전체를 가로(row)로 나눔
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      
      {/* 1. 왼쪽 고정 사이드바 */}
      <Sidebar />

      {/* 2. 오른쪽 컨텐츠 영역 (남은 공간 다 차지) */}
      <div className="flex-1 h-full overflow-y-auto relative">
        <Outlet />
      </div>

    </div>
  );
};

export default DashboardLayout;