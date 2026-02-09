import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 🚨 [Fix] shared/layout 폴더로 이동된 레이아웃 컴포넌트들
import DashboardLayout from '../src/pages/DailyReport/layout/DailyLayout';
// import AdminLayout from './shared/layout/AdminLayout'; // 나중에 관리자 페이지 확장 시 사용

// 🚨 [Fix] pages/Home/index.jsx로 변경된 메인 관제탑
import Home from './pages/Home'; 

// 🚨 [Fix] Auth 및 DailyReport 페이지들 (기존 위치 유지 혹은 추후 정리 예정)
import Login from './shared/Auth/Login';
import Signup from './shared/Auth/SignUp'; 
import ForgotPassword from './shared/Auth/ForgotPassWord';
import UpdatePassword from './shared/Auth/UpdatePassword';

import Dashboard from './pages/DailyReport/Dashboard';
import Write from './pages/DailyReport/Write';
import Detail from './pages/DailyReport/Detail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* 1. 여행 홈 (전체화면) - MainLayout 적용 여부는 Home 내부에서 결정하거나 추후 확장 가능 */}
        <Route path="/" element={<Home />} />
        
        {/* 2. 인증 페이지 (전체화면) */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/update-password" element={<UpdatePassword />} />

        {/* 3. 업무용 대시보드 영역 (DashboardLayout + Sidebar 적용) */}
        <Route element={<DashboardLayout />}>
          <Route path="/report" element={<Dashboard />} />
          <Route path="/report/write" element={<Write />} />
          <Route path="/report/edit/:id" element={<Write />} />
          <Route path="/report/:id" element={<Detail />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;