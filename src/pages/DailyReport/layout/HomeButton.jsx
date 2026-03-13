// src/pages/DailyReport/layout/HomeButton.jsx
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] useReport 전역 상태(closeReport) 완전 제거 (좀비 코드 청산).
// 2. [Routing] 과거에 제거했던 <Link> 컴포넌트를 다시 복구하여, 클릭 시 URL을 '/'로 변경하는 순수 라우팅 방식으로 회귀(뺄셈의 미학).

import React from 'react';
import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom'; // 🚨 [New] 라우터 이동 컴포넌트 복구

const HomeButton = () => {
  return (
    <div className="px-6 pt-5 pb-0 flex justify-between items-center">
      {/* 🚨 [Fix] button 태그와 onClick=closeReport를 <Link to="/"> 로 완벽 교체 */}
      <Link 
        to="/" 
        className="text-gray-500 hover:text-blue-500 transition-colors p-2 -ml-2 hover:bg-gray-100 rounded-full group" 
        title="Go Home (Return to Globe)"
      >
        <Globe size={20} className="group-hover:rotate-180 transition-transform duration-700 ease-in-out"/>
      </Link>
    </div>
  );
};

export default HomeButton;