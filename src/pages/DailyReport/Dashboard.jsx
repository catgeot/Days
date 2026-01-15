import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, FileText, Calendar, TrendingUp, Loader2, MapPin, ChevronDown, BarChart2, PieChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Dashboard = () => {
  const [reports, setReports] = useState([]); 
  const [loading, setLoading] = useState(true); 
  
  const today = new Date();
  
  // 1. 왼쪽 카드용 상태 (기간 선택)
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // 2. 가운데 카드용 상태 (그래프)
  const [showGraph, setShowGraph] = useState(false); // 그래프 모드 토글
  const [graphYear, setGraphYear] = useState(today.getFullYear()); // ✨ 그래프용 연도 선택
  const [yearlyTrend, setYearlyTrend] = useState([]); // ✨ 1년치 데이터

  // 공통 데이터
  const [displayStats, setDisplayStats] = useState({ count: 0 });
  const [calendarDays, setCalendarDays] = useState([]);
  const [availableYears, setAvailableYears] = useState([today.getFullYear()]);
  
  // 데이터 불러오기
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

        // 연도 목록 추출
        const years = [...new Set(fetchedData.map(r => new Date(r.date).getFullYear()))];
        if (!years.includes(today.getFullYear())) years.push(today.getFullYear());
        const sortedYears = years.sort((a, b) => b - a);
        setAvailableYears(sortedYears);

      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // 왼쪽 카드 & 오른쪽 달력 데이터 갱신
  useEffect(() => {
    if (loading) return;

    // 기간별 통계
    const targetCount = reports.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    }).length;

    setDisplayStats({ count: targetCount });

    // 달력 데이터
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysArr = [];

    for (let i = 0; i < firstDayOfMonth; i++) daysArr.push({ day: null });

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const targetReport = reports.find(r => r.date === dateStr);
      const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === i;

      daysArr.push({ 
        day: i, 
        active: !!targetReport, 
        reportId: targetReport?.id,
        isToday: isToday 
      });
    }
    setCalendarDays(daysArr);
  }, [viewYear, viewMonth, reports, loading]);


  // ✨ [핵심] 가운데 그래프 데이터 계산 (graphYear 기준 1월~12월)
  useEffect(() => {
    if (loading) return;

    const trends = [];
    // 1월(0) 부터 12월(11) 까지 루프
    for (let m = 0; m < 12; m++) {
      const count = reports.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === graphYear && d.getMonth() === m;
      }).length;

      trends.push({
        label: `${m + 1}월`,
        count: count
      });
    }
    setYearlyTrend(trends);
  }, [graphYear, reports, loading]);


  // 그래프 최대값 (비율 계산용)
  const maxCount = Math.max(...yearlyTrend.map(t => t.count), 1);


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

      {/* 2. 요약 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-stretch">
        
        {/* 카드 1: 기간 선택 통계 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm flex items-center gap-1">
              <Calendar size={14} /> 기간 선택
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></span>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <select 
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-2 pr-6 rounded text-sm font-bold focus:outline-blue-500 cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={14} />
            </div>
            <div className="relative flex-1">
              <select 
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-2 pr-6 rounded text-sm font-bold focus:outline-blue-500 cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{i + 1}월</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
          
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-gray-800">{displayStats.count}</p>
            <span className="text-gray-500 mb-1">건 작성</span>
          </div>
        </div>

        {/* ✨ [완전 개조됨] 카드 2: 몸통 클릭 & 연도 선택 */}
        <div 
          onClick={() => setShowGraph(!showGraph)} // ✨ 몸통 클릭 시 전환
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden cursor-pointer hover:border-blue-400 transition-colors group"
        >
          
          <div className="flex items-center justify-between mb-2 z-10">
            <span className="text-gray-500 text-sm flex items-center gap-1">
              {showGraph ? <BarChart2 size={14} /> : <TrendingUp size={14} />}
              {showGraph ? `${graphYear}년 추이` : '전체 누적 기록'}
            </span>
            
            {/* ✨ 우측 상단: 연도 선택 버튼 (클릭 시 그래프 전환 막기 위해 stopPropagation 사용) */}
            <div 
              className="relative"
              onClick={(e) => e.stopPropagation()} // 이걸 넣어야 드롭다운 눌렀을 때 그래프가 안 꺼짐
            >
              <select 
                value={graphYear}
                onChange={(e) => setGraphYear(Number(e.target.value))}
                className="appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 pl-2 pr-6 rounded-lg text-xs font-bold focus:outline-blue-500 cursor-pointer transition-colors"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1.5 text-gray-500 pointer-events-none" size={12} />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end min-h-[120px]">
            {showGraph ? (
              /* 그래프 모드: 1월~12월 표시 */
              <div className="flex items-end justify-between w-full h-full gap-1 pt-4 animate-in fade-in duration-300">
                {yearlyTrend.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 flex-1 h-full justify-end group/bar">
                    <div className="w-full relative flex items-end h-full">
                       <div 
                        style={{ height: `${(item.count / maxCount) * 100}%` }}
                        className={`w-full rounded-t-sm transition-all duration-500 ${item.count > 0 ? 'bg-blue-400 group-hover/bar:bg-blue-500' : 'bg-gray-100'}`}
                      ></div>
                      {/* 툴팁 */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                        {item.count}건
                      </div>
                    </div>
                    {/* 좁으니까 짝수 달은 숫자 생략하거나 글자 줄임 */}
                    <span className="text-[9px] text-gray-400 font-medium">
                      {idx % 2 === 0 ? item.label : ''} 
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* 기본 모드: 전체 숫자 */
              <div className="flex items-baseline justify-between w-full animate-in fade-in duration-300">
                <div>
                   <p className="text-4xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                     {reports.length}
                   </p>
                   <span className="text-gray-500 text-sm">Total Reports</span>
                </div>
                {/* 장식용 미니바 */}
                <div className="flex items-end gap-1 opacity-20 grayscale group-hover:grayscale-0 transition-all">
                   <div className="w-2 h-4 bg-blue-500 rounded-t"></div>
                   <div className="w-2 h-6 bg-blue-500 rounded-t"></div>
                   <div className="w-2 h-3 bg-blue-500 rounded-t"></div>
                   <div className="w-2 h-8 bg-blue-500 rounded-t"></div>
                </div>
              </div>
            )}
          </div>
          
        </div>

        {/* 카드 3: 달력 (그대로 유지) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative transition-colors flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <span className="text-sm font-bold text-gray-700">
              {viewYear}년 {viewMonth + 1}월 현황
            </span>
            <Calendar size={16} className="text-purple-600" />
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs flex-1">
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

      {/* 3. 최근 목록 리스트 (여기는 이전과 동일) */}
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