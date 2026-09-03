import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div
      data-home-viewport-root
      className="w-full h-[100dvh] max-h-[100dvh] relative bg-black overflow-hidden flex flex-col"
    >
      <Outlet />
    </div>
  );
};

export default MainLayout;