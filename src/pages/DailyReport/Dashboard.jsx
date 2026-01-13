import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, FileText, Calendar, TrendingUp, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase'; // ✨ 연결 도구 가져오기

const Dashboard = () => {
  const [reports, setReports] = useState([]); // 일보 목록
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [stats, setStats] = useState({ count: 0, streak: 0 }); // 통계 데이터

  // ✨ 데이터 가져오기 함수 (Fetch)
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        // 1. Supabase에서 'reports' 테이블의 모든 데이터를 가져옴 (최신순 정렬)
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('date', { ascending: false }); // 날짜 내림차순 (최신이 위로)

        if (error) throw error;

        // 2. 데이터 저장
        setReports(data || []);
        
        // 3. 통계 계산 (이번 달 작성 수 등)
        const currentMonth = new Date().getMonth();
        const thisMonthCount = data.filter(r => new Date(r.date).getMonth() === currentMonth).length;
        
        setStats({
          count: thisMonthCount,
          streak: calculateStreak(data) // 연속 기록 계산 (아래 함수 참고)
        });

      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // 🔥 (보너스 기능) 연속 작성일 계산 로직
  const calculateStreak = (data) => {
    if (!data || data.length === 0) return 0;
    // 간단하게 구현: 오늘부터 거꾸로 날짜가 연속되는지 체크 (복잡하면 패스 가능)
    return data.length > 0 ? "ON" : 0; // 일단 데이터가 있으면 ON으로 표시
  };

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

      {/* 2. 요약 카드 (실제 데이터 반영) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">이번 달 작성</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.count}건</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">작성 상태</span>
            <span className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{reports.length > 0 ? "기록 중 🔥" : "시작 전"}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">오늘 날짜</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={20} /></span>
          </div>
          <p className="text-xl font-bold text-gray-800">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* 3. 최근 목록 리스트 (Real Data) */}
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText size={20} /> 최근 작성 목록
      </h3>

      {loading ? (
        // 로딩 중일 때 보여줄 화면
        <div className="flex justify-center p-12">
          <Loader2 size={40} className="animate-spin text-blue-500" />
        </div>
      ) : reports.length === 0 ? (
        // 데이터가 없을 때 보여줄 화면 (Empty State)
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[200px] flex flex-col justify-center items-center p-8 text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm mb-4">아직 작성된 일보가 없습니다.</p>
          <Link to="/report/write" className="text-blue-600 hover:underline text-sm font-medium">
            첫 기록을 남겨보세요 &rarr;
          </Link>
        </div>
      ) : (
        // ✨ 데이터가 있을 때 보여줄 리스트
        <div className="grid gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {report.date}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={12} /> {report.location}
                  </span>
                  <span className="text-xs text-gray-400">
                    {report.weather}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {report.title}
                </h4>
                <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                  {report.content}
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-blue-500">
                &rarr;
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;