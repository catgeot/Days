import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, MapPin, Loader2, LayoutGrid, List as ListIcon, Search, ChevronRight, CalendarClock } from 'lucide-react';

const RecentList = ({ reports, loading }) => {
  // 1. 상태 관리 (뷰 모드 & 검색어)
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [searchTerm, setSearchTerm] = useState(''); 

  // 2. ✨ [핵심] 최근 1달 데이터만 추려내기
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1); // 정확히 1달 전 날짜 계산

  const filteredReports = reports.filter(report => {
    const reportDate = new Date(report.date);
    
    // 조건 1: 최근 1달 이내인가?
    const isRecent = reportDate >= oneMonthAgo;
    
    // 조건 2: 검색어가 포함되어 있는가? (제목, 내용, 위치)
    const isMatch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase());

    return isRecent && isMatch;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* --- 헤더 --- */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white z-10">
        
        {/* 제목 */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CalendarClock size={20} className="text-blue-600" /> 
            최근 1개월 활동
          </h3>
          <p className="text-xs text-gray-400 mt-1 pl-7">
            지난달 {oneMonthAgo.getMonth() + 1}.{oneMonthAgo.getDate()} 부터의 기록입니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 검색창 */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="빠른 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-blue-500 w-40 transition-all focus:w-56"
            />
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="리스트 보기"
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="바둑판 보기"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* --- 본문: 스크롤 영역 (최대 높이 제한) --- */}
      {/* max-h-[600px]: 내용이 많아지면 600px 까지만 늘어나고 그 뒤론 스크롤 생김 */}
      <div className="p-5 overflow-y-auto max-h-[600px] min-h-[200px] custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={30} className="animate-spin text-blue-500" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            {searchTerm ? (
              <>
                <Search size={40} className="mb-2 opacity-20" />
                <p>검색 결과가 없습니다.</p>
              </>
            ) : (
              <>
                <FileText size={40} className="mb-2 opacity-20" />
                <p>최근 1달간 작성된 일보가 없습니다.</p>
                <Link to="/report/write" className="text-blue-600 text-sm mt-2 font-bold hover:underline">
                  새 일보 작성하기
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {/* 🅰️ 리스트 뷰 */}
            {viewMode === 'list' && (
              <div className="flex flex-col gap-3">
                {filteredReports.map((report) => (
                  <Link 
                    to={`/report/${report.id}`} 
                    key={report.id} 
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all group bg-white"
                  >
                    {/* 날짜 박스 */}
                    <div className="flex flex-col items-center justify-center bg-gray-50 group-hover:bg-white w-14 h-14 rounded-lg border border-gray-200 group-hover:border-blue-200 transition-colors flex-shrink-0">
                      <span className="text-[10px] text-gray-500">{report.date.split('-')[1]}월</span>
                      <span className="text-lg font-bold text-gray-800 leading-none">{report.date.split('-')[2]}</span>
                    </div>
                    
                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-base font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                          {report.title}
                        </h4>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2 mt-1">
                          {report.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {report.location}</span>
                        <span className="w-px h-2 bg-gray-300"></span>
                        <span className="truncate max-w-[400px]">{report.content}</span>
                      </div>
                    </div>
                    
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </Link>
                ))}
              </div>
            )}

            {/* 🅱️ 그리드 뷰 */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report) => (
                  <Link 
                    to={`/report/${report.id}`} 
                    key={report.id} 
                    className="flex flex-col p-5 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group bg-white h-44 justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                          {report.date}
                        </span>
                        <MapPin size={14} className="text-gray-400" />
                      </div>
                      <h4 className="font-bold text-gray-800 text-base mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {report.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {report.content}
                      </p>
                    </div>
                    <div className="pt-3 mt-2 border-t border-gray-50 text-xs text-gray-400 text-right group-hover:text-blue-500 font-medium">
                      상세보기 &rarr;
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default RecentList;