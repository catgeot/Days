import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, FileText, Calendar, TrendingUp, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Dashboard = () => {
  const [reports, setReports] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [stats, setStats] = useState({ count: 0, streak: 0 });
  
  // 달력 그리기용 데이터
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        // Supabase에서 데이터 가져오기
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;

        setReports(data || []);
        
        // --- 통계 및 달력 데이터 생성 로직 ---
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); 

        // 1. 이번 달 통계
        const thisMonthCount = data.filter(r => new Date(r.date).getMonth() === currentMonth).length;
        setStats({
          count: thisMonthCount,
          streak: data.length > 0 ? "ON" : 0
        });

        // 2. 달력 데이터 생성
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 1일의 요일
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // 마지막 날짜
        
        const daysArr = [];

        // 빈칸 채우기
        for (let i = 0; i < firstDayOfMonth; i++) {
          daysArr.push({ day: null }); 
        }

        // 날짜 채우기
        for (let i = 1; i <= daysInMonth; i++) {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          
          // ✨ [핵심] 해당 날짜에 쓴 글 찾기
          const targetReport = data.find(r => r.date === dateStr); // find로 글 정보 찾기
          const isToday = dateStr === today.toISOString().split('T')[0];

          daysArr.push({ 
            day: i, 
            active: !!targetReport, // 글이 있으면 true
            reportId: targetReport?.id, // ✨ 글의 ID 저장 (링크 연결용)
            isToday: isToday 
          });
        }
        setCalendarDays(daysArr);
        // --------------------------------

      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* 1. 상단 인사말 */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">안녕하세요, 사장님 👋</h2>
          <p className="text-gray-500 mt-1">
            {loading ? '데이터를 불러오는 중입니다...' : `이번 달 총 ${stats.count}건의 기록이 있습니다.`}
          </p>
        </div>
        <Link to="/report/write" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all">
          <PenTool size={18} />
          새 일보 작성
        </Link>
      </div>

      {/* 2. 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* 통계 카드 1 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">이번 달 작성</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.count}건</p>
        </div>

        {/* 통계 카드 2 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">작성 상태</span>
            <span className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{reports.length > 0 ? "기록 중 🔥" : "시작 전"}</p>
        </div>

        {/* 3. ✨ [업그레이드] 클릭 가능한 달력 카드 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative transition-colors">
          
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <span className="text-sm font-bold text-gray-700">
              {new Date().getFullYear()}.{new Date().getMonth() + 1}
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
                    {/* A. 글이 있는 날 (Active): 클릭 가능한 링크로 만듦 */}
                    {item.active ? (
                      <Link 
                        to={`/report/${item.reportId}`} // ✨ 클릭 시 해당 글로 이동
                        title="작성한 일보 보기"
                        className={`
                          w-6 h-6 flex items-center justify-center rounded-full 
                          bg-blue-600 text-white font-bold cursor-pointer hover:bg-blue-700 hover:scale-110 transition-all
                          ${item.isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                        `}
                      >
                        {item.day}
                      </Link>
                    ) : (
                      /* B. 글이 없는 날: 그냥 숫자만 표시 */
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

      {/* 3. 최근 목록 리스트 */}
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