import React, { useState } from 'react';
import { PenTool, Globe, Sparkles, Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import AICurationCard from './components/AICurationCard';
import CalendarCard from './components/CalendarCard';
import RecentList from './components/RecentList';
import { useDashboardData } from './hooks/useDashboardData';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const locationFilter = searchParams.get('location');

  const [showCuration, setShowCuration] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const isMobileViewport = () => window.matchMedia('(max-width: 1023px)').matches;

  const handleCurationToggle = () => {
    setShowCuration((prev) => {
      const next = !prev;
      if (next && isMobileViewport()) setShowCalendar(false);
      return next;
    });
  };

  const handleCalendarToggle = () => {
    setShowCalendar((prev) => {
      const next = !prev;
      if (next && isMobileViewport()) setShowCuration(false);
      return next;
    });
  };

  const {
    loading, reports, viewYear, viewMonth,
    calendarDays,
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
                  {isPublicMode ? t('logbook.dashboard.titlePublic') : t('logbook.dashboard.title')}
                </h2>
              </div>
              <p className="text-gray-500 mt-1.5 text-sm font-medium flex flex-wrap gap-2 items-center">
                 {loading ? t('logbook.dashboard.syncing') : (
                   isPublicMode
                    ? (locationFilter ? t('logbook.dashboard.countPublicFiltered', { location: locationFilter, count: filteredReports.length }) : t('logbook.dashboard.countPublic', { count: reports.length }))
                    : t('logbook.dashboard.countPrivate', { count: reports.length })
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
                  {t('logbook.dashboard.tabMine')}
                </button>
                <button
                  onClick={() => handleTabChange('public')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isPublicMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {t('logbook.dashboard.tabFeed')}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-nowrap items-center gap-1.5 sm:gap-3 w-full lg:w-auto min-w-0">
            <button
              onClick={handleWriteClick}
              className="group relative flex shrink-0 items-center justify-center gap-1.5 sm:gap-3 px-3.5 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-black rounded-full transition-all hover:scale-105 active:scale-95 overflow-hidden shadow-lg hover:shadow-blue-500/50"
            >
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 transition-all duration-700 group-hover:left-full"></div>
              <PenTool size={16} className="relative z-10 shrink-0 drop-shadow-md sm:w-[18px] sm:h-[18px]" />
              <span className="relative z-10 tracking-tight text-xs sm:text-sm drop-shadow-md whitespace-nowrap">
                {t('logbook.dashboard.write')}
              </span>
            </button>

            <button
              onClick={handleCurationToggle}
              aria-pressed={showCuration}
              className={`flex shrink-0 items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-3 rounded-full font-semibold sm:font-medium transition-all whitespace-nowrap ${
                showCuration
                  ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-xs sm:text-sm">{t('logbook.dashboard.curation')}</span>
            </button>

            <button
              onClick={handleCalendarToggle}
              aria-pressed={showCalendar}
              className={`flex shrink-0 items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-3 rounded-full font-semibold sm:font-medium transition-all whitespace-nowrap ${
                showCalendar
                  ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-xs sm:text-sm">{t('logbook.dashboard.calendar')}</span>
            </button>
          </div>
        </div>

        {(showCuration || showCalendar) && (
          <div
            className={`grid gap-4 sm:gap-6 mb-6 items-stretch animate-fade-in ${
              showCuration && showCalendar ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
            }`}
          >
            {showCuration && (
              <div className={showCalendar ? 'col-span-1 lg:col-span-2 h-full' : 'h-full'}>
                <AICurationCard />
              </div>
            )}

            {showCalendar && (
              <div className={`h-full ${showCuration ? 'col-span-1' : 'max-w-md'}`}>
                <CalendarCard
                  viewYear={viewYear} viewMonth={viewMonth}
                  calendarDays={calendarDays}
                  onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth}
                  isPublicMode={isPublicMode}
                />
              </div>
            )}
          </div>
        )}

        <RecentList reports={filteredReports} loading={loading} isPublicMode={isPublicMode} />

      </div>
    </div>
  );
};

export default Dashboard;
