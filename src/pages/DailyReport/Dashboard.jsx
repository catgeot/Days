import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, FileText, Calendar, TrendingUp, Loader2, MapPin, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Dashboard = () => {
  const [reports, setReports] = useState([]); 
  const [loading, setLoading] = useState(true); 
  
  // ✨ [추가] 현재 보고 있는 연도와 월 (기본값: 오늘 날짜)
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0(1월) ~ 11(12월)

  // 화면에 표시할 데이터들
  const [displayStats, setDisplayStats] = useState({ count: 0, streak: 0 });
  const [calendarDays, setCalendarDays] = useState([]);
  const [availableYears, setAvailableYears] = useState([today.getFullYear()]); // 선택 가능한 연도 목록

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

        // ✨ 1. 데이터에서 '작성된 연도'들만 뽑아서 중복 제거 (드롭다운용)
        const years = [...new Set(fetchedData.map(r => new Date(r.date).getFullYear()))];
        // 현재 연도가 없으면 추가해주고 정렬
        if (!years.includes(today.getFullYear())) years.push(today.getFullYear());
        setAvailableYears(years.sort((a, b) => b - a)); // 최신 연도가 위로

      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // ✨ [핵심] 연도(viewYear)나 월(viewMonth)이 바뀌면 통계와 달력을 다시 계산!
  useEffect(() => {
    if (loading) return;

    // 1. 선택된 날짜의 데이터 필터링
    const targetCount = reports.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    }).length;

    setDisplayStats(prev => ({
      ...prev,
      count: targetCount
    }));

    // 2. 선택된 날짜의 달력 그리기
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    const daysArr = [];

    // 빈칸
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArr.push({ day: null }); 
    }

    // 날짜 채우기
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const targetReport = reports.find(r => r.date === dateStr);
      
      // 오늘 날짜인지 확인 (년, 월, 일 모두 같아야 함)
      const isToday = 
        today.getFullYear() === viewYear && 
        today.getMonth() === viewMonth && 
        today.getDate() === i;

      daysArr.push({ 
        day: i, 
        active: !!targetReport, 
        reportId: targetReport?.id,
        isToday: isToday 
      });
    }
    setCalendarDays(daysArr);

  }, [viewYear, viewMonth, reports, loading]);


  return (
    <div className="max-w-5xl mx-auto">
      {/* 1. 상단 인사말 */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">안녕하세요, 사장님 👋</h2>
          <p className="text-gray-500 mt-1">
            {loading ? '데이터를 불러오는 중입니다...' : `선택하신 기간에 총 ${displayStats.count}건의 기록이 있습니다.`}
          </p>
        </div>
        <Link to="/report/write" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all">
          <PenTool size={18} />
          새 일보 작성
        </Link>
      </div>

      {/* 2. 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* ✨ [수정됨] 월별 통계 카드 (드롭다운 추가) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm flex items-center gap-1">
              <Calendar size={14} /> 기간 선택
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></span>
          </div>

          {/* 드롭다운 컨트롤 영역 */}
          <div className="flex gap-2 mb-2">
            {/* 연도 선택 */}
            <div className="relative">
              <select 
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 pl-2 pr-6 rounded text-sm font-bold focus:outline-blue-500 cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1 top-1.5 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* 월 선택 */}
            <div className="relative">
              <select 
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-1 pl-2 pr-6 rounded text-sm font-bold focus:outline-blue-500 cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{i + 1}월</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1 top-1.5 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
          
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-gray-800">{displayStats.count}</p>
            <span className="text-gray-500 mb-1">건 작성</span>
          </div>
        </div>

        {/* 작성 상태 카드 (전체 기준) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">전체 누적 기록</span>
            <span className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></span>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-800">{reports.length}</p>
            <span className="text-gray-500 text-sm">총 누적 작성 수</span>
          </div>
        </div>

        {/* ✨ [수정됨] 달력 카드 (선택한 날짜에 맞춰 바뀜) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative transition-colors">
          
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            {/* 달력 제목도 선택한 날짜로 표시 */}
            <span className="text-sm font-bold text-gray-700">
              {viewYear}년 {viewMonth + 1}월 현황
            </span>
            <Calendar size={16} className="text-purple-600" />
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['일','월','화','수','목','금','토'].map(d => (
              <div key={d} className="text-gray-400 mb-1">{d}</div>
            ))}

            {calendarDays.map((item, index) => (
              <div key={index} className="aspect-square flex items-center justify-center">
                {item.day && (
                  <>
                    {item.active ? (
                      <Link 
                        to={`/report/${item.reportId}`}
                        title={`${item.day}일 일보 보기`}
                        className={`
                          w-6 h-6 flex items-center justify-center rounded-full 
                          bg-blue-600 text-white font-bold cursor-pointer hover:bg-blue-700 hover:scale-110 transition-all
                          ${item.isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                        `}
                      >
                        {item.day}
                      </Link>
                    ) : (
                      <div 
                        className={`
                          w-6 h-6 flex items-center justify-center rounded-full 
                          text-gray-400 bg-gray-50
                          ${item.isToday ? 'ring-2 ring-gray-300 ring-offset-1 font-bold text-gray-600' : ''}
                        `}
                      >
                        {item.day}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* 3. 최근 목록 리스트 (여기는 항상 최신순 유지) */}
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText size={20} /> 최근 작성 목록
      </h3>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 size={40} className="animate-spin text-blue-500" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[200px] flex flex-col justify-center items-center p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">아직 작성된 일보가 없습니다.</p>
          <Link to="/report/write" className="text-blue-600 hover:underline text-sm font-medium">
            첫 기록을 남겨보세요 &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Link 
              to={`/report/${report.id}`} 
              key={report.id} 
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {report.date}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={12} /> {report.location}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {report.title}
                </h4>
                <p className="text-gray-500 text-sm mt-1 truncate">
                  {report.content}
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-blue-500 ml-4">
                &rarr;
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;