import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 페이지 불러오기
import Home from './pages/Travel/Home';
import AdminLayout from './components/Layout/AdminLayout'; // 틀
import Dashboard from './pages/DailyReport/Dashboard';     // 내용 1
import Write from './pages/DailyReport/Write';             // 내용 2

// 아직 안 만들었지만 에러 방지용 임시 컴포넌트
const WritePage = () => <div className="text-2xl font-bold">✍️ 글쓰기 페이지 준비중...</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. 여행 모드 (지구본) */}
        <Route path="/" element={<Home />} />
        
        {/* 2. 업무 모드 (일보) - 중첩 라우팅 */}
        <Route path="/report" element={<AdminLayout />}>
          {/* /report 로 들어오면 대시보드를 보여줌 */}
          <Route index element={<Dashboard />} />
          
          {/* /report/write 로 들어오면 글쓰기를 보여줌 */}
          <Route path="write" element={<Write />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;