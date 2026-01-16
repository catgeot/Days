import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PenTool, ArrowLeft } from 'lucide-react'; // LogIn, LogOut 제거 (UserProfile로 이동함)
import { supabase } from '../../lib/supabase';

// 컴포넌트들
import StatsCard from '../../components/Dashboard/StatsCard';
import GraphCard from '../../components/Dashboard/GraphCard';
import CalendarCard from '../../components/Dashboard/CalendarCard';
import RecentList from '../../components/Dashboard/RecentList';
import UserProfile from '../../components/Dashboard/UserProfile'; // ✨ [추가] 프로필 컴포넌트

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); 
  const [reports, setReports] = useState([]); 
  const [loading, setLoading] = useState(true); 

  // ... (날짜, 통계 관련 state들 기존과 동일하게 유지) ...
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [displayCount, setDisplayCount] = useState(0);
  const [graphMode, setGraphMode] = useState('total'); 
  const [graphYear, setGraphYear] = useState(today.getFullYear());
  const [trendData, setTrendData] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);
  const [availableYears, setAvailableYears] = useState([today.getFullYear()]);

  // 데이터 로드 함수 (기존 유지)
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

  useEffect(() => {
    loadData();
  }, []);

  // 로그아웃 함수 (기존 유지)
  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      alert("정상적으로 로그아웃 되었습니다.");
      loadData(); 
    }
  };

  // ... (useEffect 통계 로직들 기존과 동일하게 유지 - 생략 아님, 코드 유지하세요!) ...
  useEffect(() => { if(loading) return; const count = reports.filter(r => new Date(r.date).getFullYear() === viewYear && new Date(r.date).getMonth() === viewMonth).length; setDisplayCount(count); const firstDay = new Date(viewYear, viewMonth, 1).getDay(); const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate(); const daysArr = []; for (let i = 0; i < firstDay; i++) daysArr.push({ day: null }); for (let i = 1; i <= lastDate; i++) { const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`; const target = reports.find(r => r.date === dateStr); const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === i; daysArr.push({ day: i, active: !!target, reportId: target?.id, isToday }); } setCalendarDays(daysArr); }, [viewYear, viewMonth, reports, loading]);
  useEffect(() => { if(loading) return; let trends = []; if (graphMode === '6m') { for (let i = 5; i >= 0; i--) { const d = new Date(today.getFullYear(), today.getMonth() - i, 1); const count = reports.filter(r => new Date(r.date).getFullYear() === d.getFullYear() && new Date(r.date).getMonth() === d.getMonth()).length; trends.push({ label: `${d.getMonth() + 1}월`, count }); } } else if (graphMode === '12m') { for (let m = 0; m < 12; m++) { const count = reports.filter(r => new Date(r.date).getFullYear() === graphYear && new Date(r.date).getMonth() === m).length; trends.push({ label: `${m + 1}월`, count }); } } setTrendData(trends); }, [graphMode, graphYear, reports, loading]);
  const maxCount = Math.max(...trendData.map(t => t.count), 1);
  const handlePrevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else { setViewMonth(viewMonth - 1); } };
  const handleNextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else { setViewMonth(viewMonth + 1); } };


  return (
    <div className="fixed inset-0 w-full h-full bg-gray-50 overflow-y-auto z-0">
      <div className="max-w-5xl mx-auto pt-10 px-4 pb-96 relative">
        
        {/* 탈출구 */}
        <div className="absolute top-0 left-4">
          <Link to="/" className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors text-sm font-bold py-2">
            <ArrowLeft size={16} /> 여행 홈으로
          </Link>
        </div>

        {/* 상단 헤더 영역 */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end mt-4 gap-4">
          
          {/* ✨ [교체] 기존 텍스트 대신 '프로필 카드' 컴포넌트 사용 */}
          <div>
            <UserProfile 
              user={user} 
              loading={loading} 
              onLogout={handleLogout} 
            />
            {/* 총 건수는 프로필 밑에 작게 표시 */}
            <p className="text-gray-400 text-xs mt-2 ml-2">
              {loading ? '데이터 로딩 중...' : `총 ${displayCount}건의 기록이 있습니다.`}
            </p>
          </div>
          
          <Link to="/report/write" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-medium shadow-md transition-all active:scale-95 w-full sm:w-auto justify-center">
            <PenTool size={18} /> 새 일보 작성
          </Link>
        </div>

        {/* 카드 3형제 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-stretch">
          <StatsCard viewYear={viewYear} setViewYear={setViewYear} viewMonth={viewMonth} setViewMonth={setViewMonth} availableYears={availableYears} count={displayCount} />
          <GraphCard graphMode={graphMode} setGraphMode={setGraphMode} graphYear={graphYear} setGraphYear={setGraphYear} availableYears={availableYears} trendData={trendData} totalCount={reports.length} maxCount={maxCount} />
          <CalendarCard viewYear={viewYear} viewMonth={viewMonth} calendarDays={calendarDays} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} />
        </div>

        {/* 리스트 */}
        <RecentList reports={reports} loading={loading} />
      </div>
    </div>
  );
};

export default Dashboard;