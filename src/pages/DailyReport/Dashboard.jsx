import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PenTool } from 'lucide-react'; 
import { supabase } from '../../lib/supabase';

// 컴포넌트들
import StatsCard from '../../components/Dashboard/StatsCard';
import GraphCard from '../../components/Dashboard/GraphCard';
import CalendarCard from '../../components/Dashboard/CalendarCard';
import RecentList from '../../components/Dashboard/RecentList';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); 
  const [reports, setReports] = useState([]); 
  const [loading, setLoading] = useState(true); 

  // ... (날짜/통계 State 그대로 유지) ...
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [displayCount, setDisplayCount] = useState(0);
  const [graphMode, setGraphMode] = useState('total'); 
  const [graphYear, setGraphYear] = useState(today.getFullYear());
  const [trendData, setTrendData] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);
  const [availableYears, setAvailableYears] = useState([today.getFullYear()]);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReports(data);
        const dataYears = data.map(r => new Date(r.date).getFullYear());
        const baseYears = [today.getFullYear(), today.getFullYear()-1];
        setAvailableYears([...new Set([...dataYears, ...baseYears])].sort((a,b)=>b-a));
      }
    } else {
      setReports([]); 
      setAvailableYears([today.getFullYear()]);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ... (통계 useEffect 그대로 유지) ...
  useEffect(() => { if(loading) return; const count = reports.filter(r => new Date(r.date).getFullYear() === viewYear && new Date(r.date).getMonth() === viewMonth).length; setDisplayCount(count); const firstDay = new Date(viewYear, viewMonth, 1).getDay(); const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate(); const daysArr = []; for (let i = 0; i < firstDay; i++) daysArr.push({ day: null }); for (let i = 1; i <= lastDate; i++) { const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`; const target = reports.find(r => r.date === dateStr); const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === i; daysArr.push({ day: i, active: !!target, reportId: target?.id, isToday }); } setCalendarDays(daysArr); }, [viewYear, viewMonth, reports, loading]);
  useEffect(() => { if(loading) return; let trends = []; if (graphMode === '6m') { for (let i = 5; i >= 0; i--) { const d = new Date(today.getFullYear(), today.getMonth() - i, 1); const count = reports.filter(r => new Date(r.date).getFullYear() === d.getFullYear() && new Date(r.date).getMonth() === d.getMonth()).length; trends.push({ label: `${d.getMonth() + 1}월`, count }); } } else if (graphMode === '12m') { for (let m = 0; m < 12; m++) { const count = reports.filter(r => new Date(r.date).getFullYear() === graphYear && new Date(r.date).getMonth() === m).length; trends.push({ label: `${m + 1}월`, count }); } } setTrendData(trends); }, [graphMode, graphYear, reports, loading]);
  const maxCount = Math.max(...trendData.map(t => t.count), 1);
  const handlePrevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else { setViewMonth(viewMonth - 1); } };
  const handleNextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else { setViewMonth(viewMonth + 1); } };


  return (
    // ✨ 이제 fixed나 sidebar 신경 안 써도 됨. Layout이 알아서 해줌.
    <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
      
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-end mt-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {/* 문구 간소화 (사이드바에 이미 정보가 있으므로) */}
            Dashboard
          </h2>
          <p className="text-gray-500 mt-1">
             {loading ? '로딩 중...' : `총 ${displayCount}건의 기록이 있습니다.`}
          </p>
        </div>
        
        <Link to="/report/write" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all">
          <PenTool size={18} /> 새 일보 작성
        </Link>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 items-stretch">
        <StatsCard viewYear={viewYear} setViewYear={setViewYear} viewMonth={viewMonth} setViewMonth={setViewMonth} availableYears={availableYears} count={displayCount} />
        <GraphCard graphMode={graphMode} setGraphMode={setGraphMode} graphYear={graphYear} setGraphYear={setGraphYear} availableYears={availableYears} trendData={trendData} totalCount={reports.length} maxCount={maxCount} />
        <CalendarCard viewYear={viewYear} viewMonth={viewMonth} calendarDays={calendarDays} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} />
      </div>

      {/* 리스트 */}
      <RecentList reports={reports} loading={loading} />
      
    </div>
  );
};

export default Dashboard;