import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="w-full h-screen relative bg-black overflow-hidden flex flex-col">
      <Outlet />
    </div>
  );
};

export default MainLayout;