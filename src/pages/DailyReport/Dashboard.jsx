import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ✨ 방금 만든 부품들 불러오기
import StatsCard from '../../components/Dashboard/StatsCard';
import GraphCard from '../../components/Dashboard/GraphCard';
import CalendarCard from '../../components/Dashboard/CalendarCard';
import RecentList from '../../components/Dashboard/RecentList';

const Dashboard = () => {
  // 1. 상태(변수) 관리
  const [reports, setReports] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const today = new Date();
  
  // 왼쪽 카드용
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [displayCount, setDisplayCount] = useState(0);

  // 가운데 카드용
  const [showGraph, setShowGraph] = useState(false);
  const [graphYear, setGraphYear] = useState(today.getFullYear());
  const [yearlyTrend, setYearlyTrend] = useState([]);

  // 오른쪽 카드용
  const [calendarDays, setCalendarDays] = useState([]);
  
  // 공통
  const [availableYears, setAvailableYears] = useState([today.getFullYear()]);

  // 2. 데이터 가져오기 (Logic)
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        const fetchedData = data || [];
        setReports(fetchedData);

        const years = [...new Set(fetchedData.map(r => new Date(r.date).getFullYear()))];
        if (!years.includes(today.getFullYear())) years.push(today.getFullYear());
        setAvailableYears(years.sort((a, b) => b - a));

      } catch (error) {
        console.error('데이터 에러:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // 3. 통계 및 달력 계산 (Logic)
  useEffect(() => {
    if (loading) return;

    // 통계
    const count = reports.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    }).length;
    setDisplayCount(count);

    // 달력
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysArr = [];

    for (let i = 0; i < firstDay; i++) daysArr.push({ day: null });
    for (let i = 1; i <= lastDate; i++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const target = reports.find(r => r.date === dateStr);
      const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === i;
      daysArr.push({ day: i, active: !!target, reportId: target?.id, isToday });
    }
    setCalendarDays(daysArr);
  }, [viewYear, viewMonth, reports, loading]);

  // 4. 그래프 데이터 계산 (Logic)
  useEffect(() => {
    if (loading) return;
    const trends = [];
    for (let m = 0; m < 12; m++) {
      const count = reports.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === graphYear && d.getMonth() === m;
      }).length;
      trends.push({ label: `${m + 1}월`, count });
    }
    setYearlyTrend(trends);
  }, [graphYear, reports, loading]);

  const maxCount = Math.max(...yearlyTrend.map(t => t.count), 1);

  // 5. 화면 그리기 (UI) - 이제 정말 깔끔하죠?
  return (
    <div className="max-w-5xl mx-auto">
      {/* 상단 헤더 */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">안녕하세요, 사장님 👋</h2>
          <p className="text-gray-500 mt-1">
            {loading ? '로딩 중...' : `선택하신 기간에 총 ${displayCount}건의 기록이 있습니다.`}
          </p>
        </div>
        <Link to="/report/write" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all">
          <PenTool size={18} />
          새 일보 작성
        </Link>
      </div>

      {/* 카드 3형제 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-stretch">
        <StatsCard 
          viewYear={viewYear} setViewYear={setViewYear}
          viewMonth={viewMonth} setViewMonth={setViewMonth}
          availableYears={availableYears} count={displayCount}
        />
        
        <GraphCard 
          showGraph={showGraph} setShowGraph={setShowGraph}
          graphYear={graphYear} setGraphYear={setGraphYear}
          availableYears={availableYears} yearlyTrend={yearlyTrend}
          totalCount={reports.length} maxCount={maxCount}
        />
        
        <CalendarCard 
          viewYear={viewYear} viewMonth={viewMonth}
          calendarDays={calendarDays}
        />
      </div>

      {/* 하단 리스트 */}
      <RecentList reports={reports} loading={loading} />
    </div>
  );
};

export default Dashboard;