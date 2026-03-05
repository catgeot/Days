// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

import { supabase } from './shared/api/supabase';

import MainLayout from './shared/layout/MainLayout';
import AdminLayout from './shared/layout/AdminLayout';
import DashboardLayout from './pages/DailyReport/layout/DailyLayout';
import Home from './pages/Home'; 
import PlaceCard from './components/PlaceCard/index';

import Dashboard from './pages/DailyReport/Dashboard';
import Write from './pages/DailyReport/Write';
import Detail from './pages/DailyReport/Detail';

import { ReportProvider } from './context/ReportContext'; 

import Login from './shared/Auth/Login';
import Signup from './shared/Auth/SignUp'; 
import ForgotPassword from './shared/Auth/ForgotPassWord';
import UpdatePassword from './shared/Auth/UpdatePassword';

function App() {
  // 🚨 [Safe Path] URL 세정 로직 (Pessimistic First)
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
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />}>
              <Route path="place/:id" element={<PlaceCard />} />
            </Route>
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/report" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="write" element={<Write />} />
              {/* 🚨 [New] 기존 글 수정을 위한 명시적 Deep Link 라우트 추가 */}
              <Route path="write/:id" element={<Write />} /> 
              <Route path=":id" element={<Detail />} />
            </Route>
          </Route>

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