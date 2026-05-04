// 🚨 [New] Dashboard의 뇌(Logic)만 따로 떼어낸 Custom Hook입니다.
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../../shared/api/supabase';
import { attachAuthorLabels } from '../utils/reportAuthor';

export const useDashboardData = () => {
  const location = useLocation();
  const today = new Date();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [graphMode, setGraphMode] = useState('total');
  const [graphYear, setGraphYear] = useState(today.getFullYear());
  const [availableYears, setAvailableYears] = useState([today.getFullYear()]);
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [user, setUser] = useState(null);

  // 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    // 로그인 상태라도 url 파라미터나 상태로 제어할 수 있게 됨
    // 여기서는 기본적으로 user가 없거나 URL에 특정 플래그가 있으면 isPublicMode를 true로 설정
    const searchParams = new URLSearchParams(location.search);
    const isPublicParam = searchParams.get('tab') === 'public';

    // 사용자가 로그인했지만 탭이 public이거나, 아예 로그인하지 않은 경우 publicMode
    const shouldBePublic = !user || isPublicParam;

    setIsPublicMode(shouldBePublic);

    let query = supabase.from('reports').select('*');

    if (shouldBePublic) {
      query = query.eq('is_public', true).eq('is_deleted', false);
    } else {
      query = query.eq('user_id', user.id).eq('is_deleted', false);
    }

    const { data, error } = await query.order('date', { ascending: false });

    let rows = data || [];
    if (!error && shouldBePublic && rows.length) {
      rows = await attachAuthorLabels(rows);
    }

    if (!error && rows) {
      setReports(rows);
      const dataYears = rows.map(r => new Date(r.date).getFullYear());
      const now = new Date();
      const baseYears = [now.getFullYear(), now.getFullYear() - 1];
      setAvailableYears([...new Set([...dataYears, ...baseYears])].sort((a, b) => b - a));
    }
    setLoading(false);
  }, [location.search]);

  useEffect(() => { void loadData(); }, [loadData]);

  // 캘린더 및 통계 계산
  const displayCount = reports.filter(r =>
    new Date(r.date).getFullYear() === viewYear &&
    new Date(r.date).getMonth() === viewMonth
  ).length;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) calendarDays.push({ day: null });
  for (let i = 1; i <= lastDate; i++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const target = reports.find(r => r.date === dateStr);
    const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === i;
    calendarDays.push({ day: i, active: !!target, reportId: target?.id, isToday });
  }

  // 그래프 트렌드 데이터 계산
  let trendData = [];
  if (graphMode === '6m') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const count = reports.filter(r => new Date(r.date).getFullYear() === d.getFullYear() && new Date(r.date).getMonth() === d.getMonth()).length;
      trendData.push({ label: `${d.getMonth() + 1}월`, count });
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const count = reports.filter(r => new Date(r.date).getFullYear() === graphYear && new Date(r.date).getMonth() === m).length;
      trendData.push({ label: `${m + 1}월`, count });
    }
  }

  const maxCount = Math.max(...trendData.map(t => t.count), 1);

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else { setViewMonth(viewMonth - 1); }
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else { setViewMonth(viewMonth + 1); }
  };

  return {
    loading, reports, viewYear, setViewYear, viewMonth, setViewMonth,
    displayCount, calendarDays, trendData, maxCount,
    graphMode, setGraphMode, graphYear, setGraphYear, availableYears,
    handlePrevMonth, handleNextMonth, isPublicMode, user
  };
};
