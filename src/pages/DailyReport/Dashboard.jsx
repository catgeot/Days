// 🚨 [Fix] 컴포넌트 경로를 ./components 내부로 수정했습니다.
// 🚨 [New] 로직을 useDashboardData 훅으로 완전히 분리하여 UI 구조가 훨씬 간결해졌습니다.

import React from 'react';
import { Link } from 'react-router-dom';
import { PenTool } from 'lucide-react'; 

// 🚨 [Fix] 이동된 위치에서 컴포넌트 로드
import StatsCard from './components/StatsCard';
import GraphCard from './components/GraphCard';
import CalendarCard from './components/CalendarCard';
import RecentList from './components/RecentList';

// 🚨 [New] 전용 훅 로드
import { useDashboardData } from './hooks/useDashboardData';

const Dashboard = () => {
  // 훅에서 필요한 데이터와 함수를 가져옵니다.
  const {
    loading, reports, viewYear, setViewYear, viewMonth, setViewMonth,
    displayCount, calendarDays, trendData, maxCount,
    graphMode, setGraphMode, graphYear, setGraphYear, availableYears,
    handlePrevMonth, handleNextMonth
  } = useDashboardData();

  return (
    <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
      
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-end mt-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard</h2>
          <p className="text-gray-500 mt-1 font-medium">
             {loading ? '데이터를 불러오는 중...' : `총 ${displayCount}건의 리포트가 확인되었습니다.`}
          </p>
        </div>
        
        <Link to="/report/write" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95">
          <PenTool size={18} /> 새 일보 작성
        </Link>
      </div>

      {/* 통계 카드 섹션 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 items-stretch">
        <StatsCard 
          viewYear={viewYear} setViewYear={setViewYear} 
          viewMonth={viewMonth} setViewMonth={setViewMonth} 
          availableYears={availableYears} count={displayCount} 
        />
        <GraphCard 
          graphMode={graphMode} setGraphMode={setGraphMode} 
          graphYear={graphYear} setGraphYear={setGraphYear} 
          availableYears={availableYears} trendData={trendData} 
          totalCount={reports.length} maxCount={maxCount} 
        />
        <CalendarCard 
          viewYear={viewYear} viewMonth={viewMonth} 
          calendarDays={calendarDays} 
          onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} 
        />
      </div>

      {/* 최근 리스트 섹션 */}
      <RecentList reports={reports} loading={loading} />
      
    </div>
  );
};

export default Dashboard;