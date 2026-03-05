// src/pages/DailyReport/components/RecentList.jsx
// 🚨 [Fix/Subtraction] useReport 의존성 완전 제거 및 useNavigate 도입
// 🚨 [Fix] 빈 상태(Empty State) 및 아이템 클릭 시 URL 기반 직접 라우팅으로 전환

import React, { useState } from 'react';
import { MapPin, ChevronRight, Image as ImageIcon, PenTool, ClipboardList, Search, LayoutGrid, List as ListIcon, XCircle } from 'lucide-react';
// 🚨 [New] 라우터 훅 임포트
import { useNavigate } from 'react-router-dom';

const RecentList = ({ reports, loading }) => {
  // 🚨 [Fix] Context 대신 네비게이터 사용
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCompact = filteredReports.length > 5;

  if (loading) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-2xl min-h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
          <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-800/50 rounded-2xl animate-pulse border border-slate-700/30" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden min-h-[500px] flex flex-col transition-all">
      
      {/* 헤더 */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent sticky top-0 z-10">
        <h3 className="font-bold text-lg text-white flex items-center gap-2 self-start sm:self-center tracking-tight">
          <ClipboardList className="text-blue-400" size={20} />
          {isCompact ? '기록 저장소 (요약)' : '최근 기록 저장소'}
        </h3>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input type="text" placeholder="기억 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-8 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><XCircle size={14} /></button>}
          </div>

          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex-shrink-0">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><ListIcon size={16} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={16} /></button>
          </div>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="p-5 sm:p-6 flex-1 bg-transparent">
        {reports.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center pb-10 mt-10">
            <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 text-slate-600 border border-slate-700/50"><ClipboardList size={40} /></div>
            <p className="text-slate-300 font-bold text-xl mb-2">기록된 우주가 없습니다.</p>
            <p className="text-slate-500 text-sm mb-8 font-medium">당신만의 첫 번째 이야기를 남겨보세요.</p>
            <button 
              // 🚨 [Fix] URL 직접 이동
              onClick={() => navigate('/report/write')} 
              className="flex items-center gap-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-8 py-4 rounded-full font-bold border border-blue-500/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              <PenTool size={18} /> 새 일보 작성하기
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20 text-slate-500"><Search size={40} className="mx-auto mb-4 opacity-30" /><p className="text-lg">"{searchTerm}"에 대한 기억을 찾을 수 없습니다.</p><button onClick={() => setSearchTerm('')} className="text-blue-400 text-sm mt-3 hover:text-blue-300 underline underline-offset-4 transition-colors">전체 목록 보기</button></div>
        ) : (
          <div className={viewMode === 'grid' 
            ? (isCompact ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-5') 
            : `flex flex-col ${isCompact ? 'gap-3' : 'gap-5'}`
          }>
            
            {filteredReports.map((report) => (
              <div 
                key={report.id}
                // 🚨 [Fix] URL 파라미터를 포함한 디테일 페이지 직접 이동
                onClick={() => navigate(`/report/${report.id}`)}
                className={`
                  group bg-slate-800/40 border border-slate-700 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer overflow-hidden hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]
                  ${viewMode === 'grid' ? 'flex flex-col h-full' : (isCompact ? 'p-3 flex gap-4 items-center' : 'p-5 flex gap-5 items-start')}
                `}
              >
                <div className={`
                  bg-slate-900 flex-shrink-0 overflow-hidden relative
                  ${viewMode === 'grid' ? 'w-full aspect-video border-b border-slate-700/50' : (isCompact ? 'w-16 h-16 rounded-xl border border-slate-700/50' : 'w-24 h-24 rounded-2xl border border-slate-700/50')}
                `}>
                  {report.images && report.images.length > 0 ? (
                    <img src={report.images[0]} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800/50">
                      <ImageIcon size={viewMode === 'grid' ? (isCompact ? 24 : 32) : (isCompact ? 16 : 24)} />
                    </div>
                  )}
                  {viewMode === 'grid' && <div className={`absolute top-2 right-2 bg-black/70 backdrop-blur-md text-slate-200 px-2.5 py-1 rounded-md border border-slate-700/50 font-medium tracking-wide ${isCompact ? 'text-[10px]' : 'text-xs'}`}>{report.date}</div>}
                </div>

                <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? (isCompact ? 'p-4 flex flex-col h-full' : 'p-5 flex flex-col h-full') : ''}`}>
                  <div className={`flex justify-between ${isCompact && viewMode === 'list' ? 'items-center' : 'items-start mb-2'}`}>
                    <h4 className={`font-bold text-slate-100 truncate pr-3 group-hover:text-blue-400 transition-colors tracking-tight ${viewMode === 'grid' ? (isCompact ? 'text-base' : 'text-xl') : (isCompact ? 'text-base' : 'text-xl')}`}>
                      {report.title}
                    </h4>
                    {viewMode === 'list' && (
                      <span className={`text-xs text-slate-400 whitespace-nowrap bg-slate-900/50 px-2.5 rounded-md border border-slate-700/50 font-medium tracking-wide ${isCompact ? 'py-1' : 'py-1.5'}`}>
                        {report.date}
                      </span>
                    )}
                  </div>
                  
                  {!(isCompact && viewMode === 'list') && (
                    <p className={`text-sm text-slate-400 leading-relaxed font-light ${viewMode === 'grid' ? (isCompact ? 'line-clamp-2 mb-3 text-xs flex-1' : 'line-clamp-3 mb-4 flex-1') : 'line-clamp-2 h-10'}`}>
                      {report.content}
                    </p>
                  )}
                  
                  <div className={`flex items-center gap-4 text-xs text-slate-500 font-medium ${viewMode === 'list' ? (isCompact ? 'mt-0' : 'mt-4') : (isCompact ? 'mt-auto pt-3 border-t border-slate-700/50' : 'mt-auto pt-4 border-t border-slate-700/50')}`}>
                    <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                      <MapPin size={12} className="text-slate-600" /> {report.location}
                    </span>
                    {report.images && report.images.length > 1 && (
                      <span className="flex items-center gap-1 text-blue-400 font-bold bg-blue-900/30 border border-blue-800/30 px-2 py-0.5 rounded-md ml-auto sm:ml-0">
                        <ImageIcon size={10} /> +{report.images.length - 1}
                      </span>
                    )}
                  </div>
                </div>

                {viewMode === 'list' && !isCompact && (
                  <div className="self-center text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1.5 transition-all hidden sm:block pr-2">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredReports.length > 0 && (
        <div className="bg-slate-900 border-t border-slate-800/80 p-3.5 text-center flex-shrink-0 text-xs text-slate-500 font-medium tracking-wide">
          총 {filteredReports.length}개의 기록 {isCompact && <span className="text-slate-600 ml-1">(요약 뷰)</span>}
        </div>
      )}
    </div>
  );
};

export default RecentList;