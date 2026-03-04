// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

// 🚨 [Fix/New] Supabase 인스턴스 임포트
import { supabase } from './shared/api/supabase';

// 🚨 [Fix/New] Layout 및 중첩 라우팅용 컴포넌트 임포트 추가
import MainLayout from './shared/layout/MainLayout';
import AdminLayout from './shared/layout/AdminLayout';
import DashboardLayout from './pages/DailyReport/layout/DailyLayout';
import Home from './pages/Home'; 
import PlaceCard from './components/PlaceCard/index';

// 🚨 [Fix/New] DailyReport 하위 페이지 명시적 임포트 (Deep Linking 호환용)
import Dashboard from './pages/DailyReport/Dashboard';
import Write from './pages/DailyReport/Write';
import Detail from './pages/DailyReport/Detail';

import { ReportProvider } from './context/ReportContext'; 

import Login from './shared/Auth/Login';
import Signup from './shared/Auth/SignUp'; 
import ForgotPassword from './shared/Auth/ForgotPassWord';
import UpdatePassword from './shared/Auth/UpdatePassword';

function App() {
  // 🚨 [Fix] Safe-Start URL 세정 로직
  useEffect(() => {
    supabase.auth.getSession().then(() => {
      const { pathname, search, hash } = window.location;
      if (search.includes('error') || hash.includes('access_token') || search.includes('code=')) {
        window.history.replaceState(null, '', pathname);
        console.log("🛠️ URL Cleanup: Supabase 인증 확인 후 주소창이 정리되었습니다.");
      }
    });
  }, []); 

  return (
    <BrowserRouter>
      <ReportProvider>
        <Analytics />
        <Routes>
          {/* 🚨 [Fix/New] 1. MainLayout 기반 퍼블릭 중첩 라우팅 (Deep Linking 코어) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />}>
              <Route path="place/:id" element={<PlaceCard />} />
            </Route>
          </Route>

          {/* 🚨 [Fix/New] 2. AdminLayout 기반 관리자/로그북 중첩 라우팅 */}
          {/* 변경점: Auth Guard(AdminLayout) -> UI Shell(DashboardLayout) -> 하위 페이지로 정확히 중첩(Nesting) */}
          <Route element={<AdminLayout />}>
            <Route path="/report" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />       {/* 기본 경로: /report */}
              <Route path="write" element={<Write />} />    {/* 작성 경로: /report/write */}
              <Route path=":id" element={<Detail />} />     {/* 상세 경로: /report/:id */}
            </Route>
          </Route>

          {/* 3. 인증 라우트 (독립 레이아웃) */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/update-password" element={<UpdatePassword />} />
        </Routes>
      </ReportProvider>
    </BrowserRouter>
  );
}

export default App;