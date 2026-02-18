import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 🚨 [Fix] shared/layout 폴더로 이동된 레이아웃 컴포넌트들
import DashboardLayout from '../src/pages/DailyReport/layout/DailyLayout';

// 🚨 [Fix] pages/Home/index.jsx로 변경된 메인 관제탑
import Home from './pages/Home'; 

// 🚨 [New] 일기장 전역 상태 관리를 위한 Provider 추가
import { ReportProvider } from './context/ReportContext'; 

// 🚨 [Fix] Auth 페이지들
import Login from './shared/Auth/Login';
import Signup from './shared/Auth/SignUp'; 
import ForgotPassword from './shared/Auth/ForgotPassWord';
import UpdatePassword from './shared/Auth/UpdatePassword';

function App() {
  return (
    // 🚨 [Fix] BrowserRouter를 최상위로 올림 (Router Context 확보)
    <BrowserRouter>
      {/* 🚨 [Fix] ReportProvider를 Router 내부로 이동 (useNavigate 사용 가능해짐) */}
      <ReportProvider>
        <Routes>
          
          {/* 1. 여행 홈 (전체화면) - 일기장은 이 Home 내부의 팝업 패널로 작동합니다. */}
          <Route path="/" element={<Home />} />
          
          {/* 2. 인증 페이지 (전체화면) */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/update-password" element={<UpdatePassword />} />

          {/* 🚨 [Fix/Subtraction] 기존의 /report 관련 라우터 삭제 (앱 경량화 및 SPA 통합 완료) */}
          
        </Routes>
      </ReportProvider>
    </BrowserRouter>
  );
}

export default App;