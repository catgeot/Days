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
    // !user 체크 시, Dashboard 마운트 초기에는 user가 null일 수 있으므로 localStorage의 토큰 등으로 교차 검증하거나
    // 혹은 Dashboard의 user 객체가 완전히 로드될 때까지 대기하지 않는다면 단순히 /blog/write로 보내서 Write.jsx에서 처리하게 하는 것이 안전합니다.
    // 기존에 user === null 이라서 두번 클릭해야 동작했을 수 있습니다.
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
                    탐험 피드
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
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

            <button
              onClick={() => setShowTools(!showTools)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all ${
                showTools ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles size={16} />
              <span className="text-sm">인사이트</span>
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
