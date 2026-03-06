// src/pages/DailyReport/Dashboard.jsx
// 🚨 [Fix] Subtraction: 이전 단계에서 추가했던 URL 브릿지 로직(handleCurationSelect)을 깨끗하게 삭제하고 정적 카드로 복귀시켰습니다.

import React from 'react';
import { PenTool, BarChart3 } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

import AICurationCard from './components/AICurationCard';
import CalendarCard from './components/CalendarCard';
import RecentList from './components/RecentList';
import { useDashboardData } from './hooks/useDashboardData';

const Dashboard = () => {
  const navigate = useNavigate();

  const {
    loading, reports, viewYear, viewMonth, 
    displayCount, calendarDays, trendData, maxCount,
    handlePrevMonth, handleNextMonth
  } = useDashboardData();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 pb-20">
        
        <div className="mb-8 flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-slate-800/60 pb-6">
          
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 flex-1">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-sm">LogBook</h2>
              <p className="text-slate-400 mt-1.5 text-sm font-medium">
                 {loading ? '우주의 기록을 동기화하는 중...' : `총 ${displayCount}개의 기억이 빛나고 있습니다.`}
              </p>
            </div>

            {!loading && trendData && trendData.length > 0 && (
              <div className="hidden sm:flex items-end gap-2 h-10 ml-4 pl-6 border-l border-slate-800/80">
                <BarChart3 size={14} className="text-slate-600 mb-1 mr-1" />
                {trendData.slice(-6).map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-end h-full group relative cursor-default">
                    <div 
                      style={{ height: `${maxCount > 0 ? Math.max((item.count / maxCount) * 100, 15) : 15}%` }}
                      className={`w-1.5 rounded-t-sm transition-all duration-500 ${item.count > 0 ? 'bg-blue-500/60 group-hover:bg-blue-400' : 'bg-slate-800'}`}
                    ></div>
                    <span className="absolute -top-7 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 shadow-lg">
                      {item.count}건
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
         	<button 
						onClick={() => navigate('/report/write')}
						className="group relative flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-black rounded-full transition-all hover:scale-105 active:scale-95 w-full lg:w-auto overflow-hidden shadow-lg hover:shadow-blue-500/50"
						>
						{/* 🚨 [New] 광원 스위핑 효과: 호버 시 빛이 왼쪽에서 오른쪽으로 지나감 */}
						<div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 transition-all duration-700 group-hover:left-full"></div>
						
						<PenTool size={18} className="relative z-10 drop-shadow-md" /> 
						<span className="relative z-10 tracking-tight text-sm drop-shadow-md">새로운 기록 시작하기</span>
					</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
          <div className="col-span-1 lg:col-span-2 h-full">
             {/* 🚨 [Fix] 외부 라우팅 프롭스 완전히 제거, 본연의 감상용 카드로 복귀 */}
             <AICurationCard />
          </div>

          <div className="col-span-1 h-full">
            <CalendarCard 
              viewYear={viewYear} viewMonth={viewMonth} 
              calendarDays={calendarDays} 
              onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} 
            />
          </div>
        </div>

        <RecentList reports={reports} loading={loading} />
        
      </div>
    </div>
  );
};

export default Dashboard;