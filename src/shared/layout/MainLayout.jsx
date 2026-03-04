// src/shared/layout/MainLayout.jsx
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] 과거의 잔재인 하단 네비게이션(좀비 UI) 완전 제거.
// 2. [Safe Path] 화면 렌더링 권한을 HomeUI 등 자식 컴포넌트에게 온전히 돌려주고, 자신은 투명한 라우팅 껍데기 역할만 수행.

import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="w-full h-screen relative bg-black overflow-hidden flex flex-col">
      {/* 구형 하단 메뉴바를 완전히 도려내고, 오직 자식 컴포넌트만 렌더링합니다. */}
      <Outlet />
    </div>
  );
};

export default MainLayout;