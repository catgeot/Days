// 🚨 [Fix] 85vh 패널을 제거하고, 100vh(전체화면)로 덮어쓰도록 업그레이드. DailyLayout을 복원하여 사이드바 살림.
import React from 'react';
import { useReport } from '../../../../src/context/ReportContext';

// 부품 조립
import Dashboard from '../../DailyReport/Dashboard';
import Write from '../../DailyReport/Write';
import Detail from '../../DailyReport/Detail';
import DailyLayout from '../../DailyReport/layout/DailyLayout'; // 🚨 [New] 복원된 레이아웃 로드

const ReportPanel = () => {
  const { isOpen, currentView } = useReport();

  return (
    /* 🚨 [Fix] 배경 Dim 딤처리 및 상단 핸들(X버튼) 삭제 -> 화면을 100% 덮는 무결점 패널로 변신. 닫기 버튼은 Sidebar의 HomeButton이 대신함. */
    <div 
      className={`fixed top-0 left-0 w-full h-full bg-black z-[200] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
    >
      {/* 🚨 [New] DailyLayout으로 감싸서 좌측 Sidebar와 우측 컨텐츠를 완벽히 양분 */}
      <DailyLayout>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'write' && <Write />}
        {currentView === 'detail' && <Detail />}
      </DailyLayout>
    </div>
  );
};

export default ReportPanel;