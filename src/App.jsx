import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 페이지 및 레이아웃 불러오기
import Home from './pages/Travel/Home';
import MainLayout from './components/Layout/MainLayout'; // 방금 만든 투명한 틀
import AdminLayout from './components/Layout/AdminLayout'; // 업무용 틀
import Dashboard from './pages/DailyReport/Dashboard';
import Write from './pages/DailyReport/Write';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* 1. 여행 모드 (지구본) */}
        {/* MainLayout이 감싸고 있으므로, 나중에 여행 페이지가 늘어나도 관리하기 편함 */}
        <Route path="/" element={<MainLayout />}>
           <Route index element={<Home />} />
           {/* 나중에 <Route path="mars" element={<Mars />} /> 같은거 추가 가능 */}
        </Route>

        {/* 2. 업무 모드 (일보) */}
        {/* AdminLayout이 감싸고 있어서 사이드바가 항상 유지됨 */}
        <Route path="/report" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="write" element={<Write />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;