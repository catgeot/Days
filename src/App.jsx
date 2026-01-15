import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 페이지들
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup'; 
import Dashboard from './pages/DailyReport/Dashboard';
import Write from './pages/DailyReport/Write';
import Detail from './pages/DailyReport/Detail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✨ MainLayout 제거! 
           이제 모든 페이지는 독립적이며, 하단 배너가 따라다니지 않습니다.
        */}

        {/* 1. 여행 홈 (지구본) - 100% 몰입형 */}
        <Route path="/" element={<Home />} />
        
        {/* 2. 일보 시스템 (독립된 페이지) */}
        <Route path="/report" element={<Dashboard />} />
        <Route path="/report/write" element={<Write />} />
        <Route path="/report/edit/:id" element={<Write />} />
        <Route path="/report/:id" element={<Detail />} />

        {/* 3. 인증 관련 */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;