import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
// 🚨 [Fix/New] Supabase 인스턴스 임포트 (경로는 수석님 프로젝트 구조에 맞춤)
import { supabase } from './shared/api/supabase';

import DashboardLayout from '../src/pages/DailyReport/layout/DailyLayout';
import Home from './pages/Home'; 
import { ReportProvider } from './context/ReportContext'; 

import Login from './shared/Auth/Login';
import Signup from './shared/Auth/SignUp'; 
import ForgotPassword from './shared/Auth/ForgotPassWord';
import UpdatePassword from './shared/Auth/UpdatePassword';

function App() {
  // 🚨 [Fix] Safe-Start URL 세정 로직
  useEffect(() => {
    // 🚨 [Fix] Supabase가 URL의 해시(#) 데이터를 먼저 처리할 수 있도록 대기 후 실행
    supabase.auth.getSession().then(() => {
      const { pathname, search, hash } = window.location;

      // 인증 관련 파라미터가 있을 때만 정밀 타격 세정
      if (search.includes('error') || hash.includes('access_token') || search.includes('code=')) {
        window.history.replaceState(null, '', pathname);
        console.log("🛠️ URL Cleanup: Supabase 인증 확인 후 주소창이 정리되었습니다.");
      }
    });
  }, []); // 최초 1회만 실행하여 성능 저하 방지

  return (
    <BrowserRouter>
      <ReportProvider>
        <Analytics />
        <Routes>
          <Route path="/" element={<Home />} />
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