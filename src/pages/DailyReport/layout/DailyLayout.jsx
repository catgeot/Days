import React from 'react';
import Sidebar from './Sidebar';

const DailyLayout = ({ children }) => {
  return (
    // 🚨 [Fix] text-gray-900 추가: Home(지구본)의 text-white 저주가 하위로 상속되어 입력창 글씨가 투명해지는 스텔스 버그 완벽 차단!
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      
      {/* 1. 왼쪽 고정 사이드바 (DailyReport 전용) */}
      <Sidebar />

      {/* 2. 오른쪽 컨텐츠 영역 */}
      <div className="flex-1 h-full overflow-y-auto relative">
        {children}
      </div>

    </div>
  );
};

export default DailyLayout;