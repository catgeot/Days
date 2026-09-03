import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  // 모바일 100svh — 100vh는 주소창보다 커 fixed 헤더가 URL바 뒤로 깔림. CriOS 56px·html lock 금지.
  return (
    <div
      data-home-viewport-root
      className="w-full h-[100svh] max-h-[100svh] md:h-[100dvh] md:max-h-[100dvh] relative bg-black overflow-hidden flex flex-col"
    >
      <Outlet />
    </div>
  );
};

export default MainLayout;