// src/pages/DailyReport/Dashboard.jsx
// 🚨 [Fix/Subtraction] 대제목 축소, 뭉툭한 버튼을 세련된 고스트(Ghost) 버튼으로 세공
// 🚨 [New] 헤더의 광활한 여백에 트렌드 데이터를 활용한 '미니 스파크라인 그래프' 삽입
// 🚨 [Fix] 1열 통계 카드를 완전 삭제하고, 큐레이션 카드가 2칸(col-span-2)을 차지하도록 그리드 개편

import React from 'react';
import { PenTool, BarChart3 } from 'lucide-react'; 
import { useReport } from '../../context/ReportContext';

import AICurationCard from './components/AICurationCard';
import CalendarCard from './components/CalendarCard';
import RecentList from './components/RecentList';
import { useDashboardData } from './hooks/useDashboardData';

const Dashboard = () => {
  const { setCurrentView } = useReport();

  const {
    loading, reports, viewYear, viewMonth, 
    displayCount, calendarDays, trendData, maxCount,
    handlePrevMonth, handleNextMonth
  } = useDashboardData();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 pb-20">
        
        {/* 🚨 [Fix] 헤더 영역 압축 및 다기능화 */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-slate-800/60 pb-6">
          
          {/* 좌측: 대제목(축소) 및 미니 그래프 */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 flex-1">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-sm">LogBook 성좌</h2>
              <p className="text-slate-400 mt-1.5 text-sm font-medium">
                 {loading ? '우주의 기록을 동기화하는 중...' : `총 ${displayCount}개의 기억이 빛나고 있습니다.`}
              </p>
            </div>

            {/* 🚨 [New] 헤더 빈 공간을 활용한 미니 스파크라인 (최근 6개월) */}
            {!loading && trendData && trendData.length > 0 && (
              <div className="hidden sm:flex items-end gap-2 h-10 ml-4 pl-6 border-l border-slate-800/80">
                <BarChart3 size={14} className="text-slate-600 mb-1 mr-1" />
                {trendData.slice(-6).map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-end h-full group relative cursor-default">
                    <div 
                      style={{ height: `${maxCount > 0 ? Math.max((item.count / maxCount) * 100, 15) : 15}%` }}
                      className={`w-1.5 rounded-t-sm transition-all duration-500 ${item.count > 0 ? 'bg-blue-500/60 group-hover:bg-blue-400' : 'bg-slate-800'}`}
                    ></div>
                    {/* 호버 시 툴팁 */}
                    <span className="absolute -top-7 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 shadow-lg">
                      {item.count}건
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 우측: 고스트(Ghost) 버튼으로 엣지있게 깎아냄 */}
          <button 
            onClick={() => setCurrentView('write')}
            className="group relative flex items-center justify-center gap-2 px-6 py-2.5 bg-transparent border border-blue-500/40 text-blue-400 font-bold rounded-full hover:bg-blue-500/10 hover:border-blue-400 transition-all active:scale-95 w-full lg:w-auto overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <PenTool size={16} className="relative z-10" /> 
            <span className="relative z-10 tracking-wide text-sm">기록 남기기</span>
          </button>
        </div>

        {/* 🚨 [Fix] 2-Column 와이드 큐레이션 & 1-Column 달력 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
          
          {/* 1~2열: 와이드 지능형 큐레이션 카드 */}
          <div className="col-span-1 lg:col-span-2 h-full">
             <AICurationCard />
          </div>

          {/* 3열: 달력 카드 */}
          <div className="col-span-1 h-full">
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