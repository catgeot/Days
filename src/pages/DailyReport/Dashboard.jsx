// src/components/Dashboard.jsx (또는 해당 경로에 맞는 파일명)
// 🚨 [Fix] react-router-dom의 Link 의존성 제거
import React from 'react';
import { PenTool } from 'lucide-react'; 

// 🚨 [New] 일기장 모드 전환을 위한 전역 상태 훅 로드
import { useReport } from '../../context/ReportContext';

import StatsCard from './components/StatsCard';
import GraphCard from './components/GraphCard';
import CalendarCard from './components/CalendarCard';
import RecentList from './components/RecentList';
import { useDashboardData } from './hooks/useDashboardData';

const Dashboard = () => {
  // 🚨 [New] 뷰를 전환할 수 있는 함수 가져오기
  const { setCurrentView } = useReport();

  const {
    loading, reports, viewYear, setViewYear, viewMonth, setViewMonth,
    displayCount, calendarDays, trendData, maxCount,
    graphMode, setGraphMode, graphYear, setGraphYear, availableYears,
    handlePrevMonth, handleNextMonth
  } = useDashboardData();

  return (
    <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
      
      {/* 헤더 */}
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end mt-4 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard</h2>
          <p className="text-gray-500 mt-1 font-medium">
             {loading ? '데이터를 불러오는 중...' : `총 ${displayCount}건의 리포트가 확인되었습니다.`}
          </p>
        </div>
        
        {/* 🚨 [Fix/Subtraction] 정의되지 않은 setSelectedId 호출 삭제 (환각 오류 제거 및 안전한 뷰 전환 보장) */}
        <button 
          onClick={() => setCurrentView('write')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 w-full md:w-auto"
        >
          <PenTool size={18} /> NEW_LOG_BOOK
        </button>
      </div>

      {/* 통계 카드 섹션 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 items-stretch">
        
        {/* 🚨 [Fix/Subtraction] 모바일 환경(md 미만)에서는 공간 낭비 방지를 위해 통계와 그래프를 과감히 숨김 */}
        <div className="hidden md:block">
          <StatsCard 
            viewYear={viewYear} setViewYear={setViewYear} 
            viewMonth={viewMonth} setViewMonth={setViewMonth} 
            availableYears={availableYears} count={displayCount} 
          />
        </div>
        
        <div className="hidden md:block">
          <GraphCard 
            graphMode={graphMode} setGraphMode={setGraphMode} 
            graphYear={graphYear} setGraphYear={setGraphYear} 
            availableYears={availableYears} trendData={trendData} 
            totalCount={reports.length} maxCount={maxCount} 
          />
        </div>

        {/* 🚨 [Safe Path] 달력 카드는 모바일에서도 항상 노출 */}
        <div className="col-span-1 xl:col-span-1">
          <CalendarCard 
            viewYear={viewYear} viewMonth={viewMonth} 
            calendarDays={calendarDays} 
            onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} 
          />
        </div>
      </div>

      {/* 최근 리스트 섹션 */}
      <RecentList reports={reports} loading={loading} />
      
    </div>
  );
};

export default Dashboard;