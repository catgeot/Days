// src/components/Dashboard.jsx 
// 🚨 [Fix] react-router-dom의 Link 의존성 제거 유지
// 🚨 [New] Midnight Canvas 프레임 적용

import React from 'react';
import { PenTool } from 'lucide-react'; 
import { useReport } from '../../context/ReportContext';

import StatsCard from './components/StatsCard';
import GraphCard from './components/GraphCard';
import CalendarCard from './components/CalendarCard';
import RecentList from './components/RecentList';
import { useDashboardData } from './hooks/useDashboardData';

const Dashboard = () => {
  const { setCurrentView } = useReport();

  const {
    loading, reports, viewYear, setViewYear, viewMonth, setViewMonth,
    displayCount, calendarDays, trendData, maxCount,
    graphMode, setGraphMode, graphYear, setGraphYear, availableYears,
    handlePrevMonth, handleNextMonth
  } = useDashboardData();

  return (
    // 🚨 [New] 최상위 컨테이너에 다크 테마(Midnight Canvas) 적용
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
        
        {/* 헤더 */}
        <div className="mb-10 flex flex-col md:flex-row justify-between md:items-end mt-4 gap-6">
          <div>
            <h2 className="text-4xl font-bold text-white tracking-tight">LogBook 성좌</h2>
            <p className="text-slate-400 mt-2 font-medium">
               {loading ? '우주의 기록을 동기화하는 중...' : `총 ${displayCount}개의 기억이 빛나고 있습니다.`}
            </p>
          </div>
          
          <button 
            onClick={() => setCurrentView('write')}
            className="bg-blue-600/90 backdrop-blur-md hover:bg-blue-500 text-white px-6 py-3.5 rounded-full flex items-center justify-center gap-2 font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all active:scale-95 w-full md:w-auto"
          >
            <PenTool size={18} /> 기록 남기기
          </button>
        </div>

        {/* 통계 카드 섹션 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 items-stretch">
          
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
    </div>
  );
};

export default Dashboard;