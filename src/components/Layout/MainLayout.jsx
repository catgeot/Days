import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    // 여행 모드는 지구본(Canvas)이 배경이므로, 
    // 별도의 배경색(bg-color)이나 여백(padding)을 주지 않고 화면을 꽉 채웁니다.
    <div className="w-full h-screen overflow-hidden relative">
      
      {/* 만약 여행 모드의 모든 페이지에 공통으로 띄울 
        로고나 버튼이 있다면 여기에 적으면 됩니다.
        (지금은 없으니 비워둡니다)
      */}

      {/* 실제 페이지(Home.jsx 등)가 들어갈 구멍 */}
      <Outlet />
      
    </div>
  );
};

export default MainLayout;