import React, { useEffect } from 'react'; // 🚨 [Fix] 세정 로직을 위한 useEffect 추가
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// 🚨 [New] Vercel Web Analytics 연동을 위한 컴포넌트 추가
import { Analytics } from '@vercel/analytics/react';

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
  // 🚨 [New] URL 세정 로직 (Cleanup Logic)
  // 로그인이 성공하거나 에러가 발생하여 리다이렉트 되었을 때, 주소창의 지저분한 파라미터를 즉시 제거합니다.
  useEffect(() => {
    const { pathname, search, hash } = window.location;

    // URL에 에러 메시지나 인증 토큰 해시가 포함되어 있는지 확인 (Fact Check)
    if (search.includes('error') || hash.includes('access_token') || search.includes('code=')) {
      // 🚨 [Fix] 리액트 상태를 변경하지 않고 브라우저 히스토리만 교체하여 성능 저하 방지
      window.history.replaceState(null, '', pathname);
      console.log("🛠️ URL Cleanup: 지저분한 인증 파라미터가 제거되었습니다.");
    }
  }, []); // 의존성 배열을 비워 앱 마운트 시 최초 1회만 실행 (성능 최적화)

  return (
    // 🚨 [Fix] BrowserRouter를 최상위로 올림 (Router Context 확보)
    <BrowserRouter>
      {/* 🚨 [Fix] ReportProvider를 Router 내부로 이동 (useNavigate 사용 가능해짐) */}
      <ReportProvider>
        {/* 🚨 [New] 실시간 트래픽 분석을 위한 신호기(Analytics) 배치 */}
        <Analytics />

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