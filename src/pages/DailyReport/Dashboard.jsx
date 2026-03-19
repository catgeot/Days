import React, { useState } from 'react';
import { PenTool, BarChart3, LogIn, Globe, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import AICurationCard from './components/AICurationCard';
import CalendarCard from './components/CalendarCard';
import RecentList from './components/RecentList';
import { useDashboardData } from './hooks/useDashboardData';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const locationFilter = searchParams.get('location');
  const activeTab = searchParams.get('tab') || 'private';

  const [showTools, setShowTools] = useState(false);

  const {
    loading, reports, viewYear, viewMonth,
    displayCount, calendarDays, trendData, maxCount,
    handlePrevMonth, handleNextMonth, isPublicMode, user
  } = useDashboardData() || {};

  // URL 파라미터가 있을 경우 리포트 필터링
  const filteredReports = locationFilter
    ? (reports || []).filter(r => r.location && r.location.includes(locationFilter))
    : (reports || []);

  const handleWriteClick = () => {
    navigate('/blog/write');
  };

  const handleLoginClick = () => {
    navigate('/auth/login', { state: { from: '/blog' } });
  };

  const handleTabChange = (tab) => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'public') {
      newParams.set('tab', 'public');
    } else {
      newParams.delete('tab');
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      {!user && isPublicMode && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-sm sticky top-0 z-40">
          <span className="text-xs sm:text-sm font-medium">로그인하고 나만의 여행 기록을 남겨보세요!</span>
          <button
            onClick={handleLoginClick}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm"
          >
            <LogIn size={14} /> 로그인
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 pb-20">

        <div className="mb-6 flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-gray-100 pb-6">

          <div className="flex flex-col sm:flex-row sm:items-end gap-6 flex-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isPublicMode && <Globe className="text-blue-500" size={24} />}
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight drop-shadow-sm">
                  {isPublicMode ? 'Public LogBook' : 'LogBook'}
                </h2>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm font-medium flex flex-wrap gap-2 items-center">
                 {loading ? '우주의 기록을 동기화하는 중...' : (
                   isPublicMode
                    ? (locationFilter ? `'${locationFilter}' 지역의 공개된 기록 ${filteredReports.length}개` : `우주 여행자들의 ${reports.length}개 기록이 공유되고 있습니다.`)
                    : `총 ${displayCount}개의 기억이 빛나고 있습니다.`
                 )}
              </p>
            </div>

            {user && (
              <div className="flex bg-gray-100 p-1 rounded-lg ml-0 sm:ml-4">
                <button
                  onClick={() => handleTabChange('private')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    !isPublicMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  내 기록
                </button>
                <button
                  onClick={() => handleTabChange('public')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isPublicMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Globe size={14} /> 탐험 피드
                  </span>
                </button>
              </div>
            )}

            {!loading && !isPublicMode && trendData && trendData.length > 0 && (
              <div className="hidden sm:flex items-end gap-2 h-10 ml-4 pl-6 border-l border-gray-200">
                <BarChart3 size={14} className="text-gray-400 mb-1 mr-1" />
                {trendData.slice(-6).map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-end h-full group relative cursor-default">
                    <div
                      style={{ height: `${maxCount > 0 ? Math.max((item.count / maxCount) * 100, 15) : 15}%` }}
                      className={`w-1.5 rounded-t-sm transition-all duration-500 ${item.count > 0 ? 'bg-blue-500/80 group-hover:bg-blue-400' : 'bg-gray-200'}`}
                    ></div>
                    <span className="absolute -top-7 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700 shadow-sm">
                      {item.count}개
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
             <button
               onClick={() => setShowTools(!showTools)}
               className={`flex items-center gap-2 px-4 py-3 rounded-full font-medium transition-all ${
                 showTools ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
               }`}
             >
               <Sparkles size={16} />
               <span className="text-sm">인사이트 도구</span>
             </button>

            <button
              onClick={handleWriteClick}
              className="group relative flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-black rounded-full transition-all hover:scale-105 active:scale-95 w-full lg:w-auto overflow-hidden shadow-lg hover:shadow-blue-500/50"
            >
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 transition-all duration-700 group-hover:left-full"></div>
              <PenTool size={18} className="relative z-10 drop-shadow-md" />
              <span className="relative z-10 tracking-tight text-sm drop-shadow-md">
                기록 남기기
              </span>
            </button>
          </div>
        </div>

        {/* 토글형 도구 패널 (AI 큐레이션 및 달력) */}
        {showTools && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch animate-fade-in">
            <div className="col-span-1 lg:col-span-2 h-full">
               <AICurationCard />
            </div>

            <div className="col-span-1 h-full">
              <CalendarCard
                viewYear={viewYear} viewMonth={viewMonth}
                calendarDays={calendarDays}
                onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth}
                isPublicMode={isPublicMode}
              />
            </div>
          </div>
        )}

        <RecentList reports={filteredReports} loading={loading} isPublicMode={isPublicMode} />

      </div>
    </div>
  );
};

export default Dashboard;
