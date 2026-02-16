// 🚨 [Fix/New] 라우터 이동(navigate)을 모두 제거하고 Context API(useReport)의 화면 전환으로 교체 완료.

import React, { useState } from 'react';
import { MapPin, ChevronRight, Image as ImageIcon, PenTool, ClipboardList, Search, LayoutGrid, List as ListIcon, XCircle } from 'lucide-react';

// 🚨 [New] 전역 리모컨 로드
import { useReport } from '../../../context/ReportContext';

const RecentList = ({ reports, loading }) => {
  // 🚨 [Fix] useNavigate 제거, 패널 스위치 장착
  const { setCurrentView, setSelectedId } = useReport();
  
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✨ [핵심 변경 1] 뷰 모드 상관없이 갯수가 많으면 무조건 '압축 모드' 발동!
  const isCompact = filteredReports.length > 5;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col transition-all">
      
      {/* 헤더 */}
      <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white sticky top-0 z-10">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 self-start sm:self-center">
          <ClipboardList className="text-blue-600" size={20} />
          {isCompact ? '최근 일보 (요약 보기)' : '최근 작성된 일보'}
        </h3>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input type="text" placeholder="검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><XCircle size={14} /></button>}
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 flex-shrink-0">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}><ListIcon size={18} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
          </div>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="p-4 sm:p-6 flex-1 bg-gray-50/30">
        {reports.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center pb-10 mt-10">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300"><ClipboardList size={40} /></div>
            <p className="text-gray-500 font-bold text-lg">아직 작성된 일보가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">오늘의 첫 번째 현장 기록을 남겨보세요!</p>
            {/* 🚨 [Fix] 새 일보 작성 파이프 교체 */}
            <button 
              onClick={() => { setCurrentView('write'); setSelectedId(null); }} 
              className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-6 py-3 rounded-full font-bold shadow-sm border border-blue-100"
            >
              <PenTool size={18} /> 새 일보 작성하기
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><Search size={40} className="mx-auto mb-3 opacity-20" /><p>"{searchTerm}"에 대한 검색 결과가 없습니다.</p><button onClick={() => setSearchTerm('')} className="text-blue-500 text-sm mt-2 hover:underline">전체 목록 보기</button></div>
        ) : (
          
          /* ✨ [핵심 변경 2] 바둑판 모드일 때, isCompact면 더 촘촘하게 배치 */
          <div className={viewMode === 'grid' 
            ? (isCompact ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4') 
            : `flex flex-col ${isCompact ? 'gap-2' : 'gap-4'}`
          }>
            
            {filteredReports.map((report) => (
              <div 
                key={report.id}
                // 🚨 [Fix] 리스트 클릭 시 Detail 화면으로 전환하며 ID 전달
                onClick={() => {
                  setSelectedId(report.id);
                  setCurrentView('detail');
                }}
                className={`
                  group border border-gray-100 bg-white rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden
                  ${viewMode === 'grid' 
                    /* ✨ [핵심 변경 3] 그리드 내용 여백 축소 (p-4 -> p-3) */
                    ? (isCompact ? 'flex flex-col h-full' : 'flex flex-col h-full') 
                    : (isCompact ? 'p-3 flex gap-3 items-center' : 'p-4 flex gap-4 items-start')
                  }
                `}
              >
                {/* 썸네일 영역 */}
                <div className={`
                  bg-gray-100 flex-shrink-0 overflow-hidden relative
                  ${viewMode === 'grid' ? 'w-full aspect-video border-b border-gray-100' : (isCompact ? 'w-12 h-12 rounded-md border border-gray-100' : 'w-20 h-20 rounded-lg border border-gray-100')}
                `}>
                  {report.images && report.images.length > 0 ? (
                    <img src={report.images[0]} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                      <ImageIcon size={viewMode === 'grid' ? (isCompact ? 24 : 32) : (isCompact ? 16 : 20)} />
                    </div>
                  )}
                  {viewMode === 'grid' && <div className={`absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded backdrop-blur-sm ${isCompact ? 'text-[10px]' : 'text-xs'}`}>{report.date}</div>}
                </div>

                {/* 텍스트 내용 영역 */}
                <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? (isCompact ? 'p-3 flex flex-col h-full' : 'p-4 flex flex-col h-full') : ''}`}>
                  
                  {/* 제목 & 날짜 */}
                  <div className={`flex justify-between ${isCompact && viewMode === 'list' ? 'items-center' : 'items-start mb-1'}`}>
                    {/* ✨ [핵심 변경 4] 그리드 제목 크기 축소 (text-lg -> text-sm) */}
                    <h4 className={`font-bold text-gray-800 truncate pr-2 group-hover:text-blue-600 transition-colors ${viewMode === 'grid' ? (isCompact ? 'text-sm' : 'text-lg') : (isCompact ? 'text-sm' : 'text-lg')}`}>
                      {report.title}
                    </h4>
                    {viewMode === 'list' && (
                      <span className={`text-xs text-gray-500 whitespace-nowrap bg-gray-50 px-2 rounded border border-gray-100 ${isCompact ? 'py-0.5' : 'py-1'}`}>
                        {report.date}
                      </span>
                    )}
                  </div>
                  
                  {/* 본문 미리보기 (리스트 압축일 땐 숨김 / 그리드 압축일 땐 1줄만) */}
                  {!(isCompact && viewMode === 'list') && (
                    // ✨ [핵심 변경 5] 그리드 본문 줄 수 축소 (line-clamp-3 -> line-clamp-1)
                    <p className={`text-sm text-gray-500 leading-relaxed ${viewMode === 'grid' ? (isCompact ? 'line-clamp-1 mb-2 text-xs flex-1' : 'line-clamp-3 mb-4 flex-1') : 'line-clamp-2 h-10'}`}>
                      {report.content}
                    </p>
                  )}
                  
                  {/* 하단 정보 */}
                  <div className={`flex items-center gap-4 text-xs text-gray-400 ${viewMode === 'list' ? (isCompact ? 'mt-0' : 'mt-3') : (isCompact ? 'mt-auto pt-2 border-t border-gray-50' : 'mt-auto pt-3 border-t border-gray-50')}`}>
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin size={12} /> {report.location}
                    </span>
                    {report.images && report.images.length > 1 && (
                      <span className="flex items-center gap-1 text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded ml-auto sm:ml-0">
                        <ImageIcon size={10} /> +{report.images.length - 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* 화살표 (리스트 모드 전용) */}
                {viewMode === 'list' && !isCompact && (
                  <div className="self-center text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all hidden sm:block">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredReports.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-100 p-3 text-center flex-shrink-0 text-xs text-gray-400">
          총 {filteredReports.length}개의 기록 {isCompact && '(요약 보기 적용됨)'}
        </div>
      )}

    </div>
  );
};

export default RecentList;