import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import StatsCard from '../../components/Dashboard/StatsCard';
import GraphCard from '../../components/Dashboard/GraphCard';
import CalendarCard from '../../components/Dashboard/CalendarCard';
import RecentList from '../../components/Dashboard/RecentList';

const Dashboard = () => {
  const [reports, setReports] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const today = new Date();
  
  // 1. 기간 선택 상태
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [displayCount, setDisplayCount] = useState(0);

  // 2. 그래프 상태 (모드: total, 6m, 12m)
  const [graphMode, setGraphMode] = useState('total'); 
  const [graphYear, setGraphYear] = useState(today.getFullYear());
  const [trendData, setTrendData] = useState([]); // 그래프에 뿌릴 데이터

  // 3. 달력 상태
  const [calendarDays, setCalendarDays] = useState([]);
  const [availableYears, setAvailableYears] = useState([today.getFullYear()]);

  // --- 데이터 불러오기 ---
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

        const dataYears = fetchedData.map(r => new Date(r.date).getFullYear());
        const currentYear = new Date().getFullYear();
        const baseYears = [currentYear, currentYear - 1, currentYear - 2];
        const allYears = [...new Set([...dataYears, ...baseYears])];
        setAvailableYears(allYears.sort((a, b) => b - a));

      } catch (error) {
        console.error('데이터 에러:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // --- 통계 및 달력 계산 ---
  useEffect(() => {
    if (loading) return;

    // 기간별 통계
    const count = reports.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    }).length;
    setDisplayCount(count);

    // 달력 데이터 생성
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

  // --- ✨ 그래프 데이터 계산 (모드에 따라 다르게) ---
  useEffect(() => {
    if (loading) return;
    
    let trends = [];

    if (graphMode === '6m') {
      // 최근 6개월 (Rolling)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const count = reports.filter(r => {
          const rd = new Date(r.date);
          return rd.getFullYear() === y && rd.getMonth() === m;
        }).length;
        trends.push({ label: `${m + 1}월`, count });
      }
    } else if (graphMode === '12m') {
      // 선택한 연도 1월~12월 (Yearly)
      for (let m = 0; m < 12; m++) {
        const count = reports.filter(r => {
          const d = new Date(r.date);
          return d.getFullYear() === graphYear && d.getMonth() === m;
        }).length;
        trends.push({ label: `${m + 1}월`, count });
      }
    }
    
    setTrendData(trends);
  }, [graphMode, graphYear, reports, loading]);

  const maxCount = Math.max(...trendData.map(t => t.count), 1);

  // --- ✨ 달력 이동 함수 ---
  const handlePrevMonth = () => {
    if (viewMonth === 0) { // 1월에서 뒤로 가면 작년 12월
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { // 12월에서 앞으로 가면 내년 1월
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-stretch">
        <StatsCard 
          viewYear={viewYear} setViewYear={setViewYear}
          viewMonth={viewMonth} setViewMonth={setViewMonth}
          availableYears={availableYears} count={displayCount}
        />
        
        <GraphCard 
          graphMode={graphMode} setGraphMode={setGraphMode}
          graphYear={graphYear} setGraphYear={setGraphYear}
          availableYears={availableYears} 
          trendData={trendData}
          totalCount={reports.length} maxCount={maxCount}
        />
        
        <CalendarCard 
          viewYear={viewYear} viewMonth={viewMonth}
          calendarDays={calendarDays}
          onPrevMonth={handlePrevMonth} // 함수 전달
          onNextMonth={handleNextMonth} // 함수 전달
        />
      </div>

      <RecentList reports={reports} loading={loading} />
    </div>
  );
};

export default Dashboard;