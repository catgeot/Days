import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 레이아웃
import DashboardLayout from './components/Layout/DashboardLayout';

// 페이지들
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup'; 
import Dashboard from './pages/DailyReport/Dashboard';
import Write from './pages/DailyReport/Write';
import Detail from './pages/DailyReport/Detail';
import ForgotPassword from './pages/Auth/ForgotPassword'; // ✨ 추가됨
import UpdatePassword from './pages/Auth/UpdatePassword'; // ✨ 추가됨

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* 1. 여행 홈 (전체화면) */}
        <Route path="/" element={<Home />} />
        
        {/* 2. 인증 페이지 (전체화면) */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />

        {/* 3. ✨ 업무용 대시보드 영역 (사이드바 적용!) */}
        <Route element={<DashboardLayout />}>
          <Route path="/report" element={<Dashboard />} />
          <Route path="/report/write" element={<Write />} />
          <Route path="/report/edit/:id" element={<Write />} />
          <Route path="/report/:id" element={<Detail />} />
        </Route>
				<Route path="/auth/forgot-password" element={<ForgotPassword />} />
				<Route path="/auth/update-password" element={<UpdatePassword />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;