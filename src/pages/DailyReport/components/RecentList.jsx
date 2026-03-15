import React, { useState } from 'react';
import { MapPin, ChevronRight, Image as ImageIcon, PenTool, ClipboardList, Search, LayoutGrid, List as ListIcon, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecentList = ({ reports, loading }) => {
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
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 p-6 shadow-sm min-h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-50/50 rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col transition-all">
      
      <div className="p-5 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent sticky top-0 z-10">
        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2 self-start sm:self-center tracking-tight">
          <ClipboardList className="text-blue-500" size={20} />
          {isCompact ? '기록 보관소 (요약)' : '최근 기록 보관소'}
        </h3>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input type="text" placeholder="기억 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><XCircle size={14} /></button>}
          </div>

          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 flex-shrink-0">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}><ListIcon size={16} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={16} /></button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 flex-1 bg-transparent">
        {reports.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center pb-10 mt-10">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-400 border border-gray-200"><ClipboardList size={40} /></div>
            <p className="text-gray-900 font-bold text-xl mb-2">기록된 여정이 없습니다.</p>
            <p className="text-gray-500 text-sm mb-8 font-medium">당신만의 첫 번째 이야기를 남겨보세요.</p>
            <button 
              onClick={() => navigate('/blog/write')} 
              className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-8 py-4 rounded-full font-bold border border-blue-200 transition-all shadow-sm hover:shadow-md"
            >
              <PenTool size={18} /> 새 기록 작성하기
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><Search size={40} className="mx-auto mb-4 opacity-30" /><p className="text-lg">"{searchTerm}"에 대한 기억을 찾을 수 없습니다.</p><button onClick={() => setSearchTerm('')} className="text-blue-500 text-sm mt-3 hover:text-blue-600 underline underline-offset-4 transition-colors">전체 목록 보기</button></div>
        ) : (
          <div className={viewMode === 'grid' 
            ? (isCompact ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-5') 
            : `flex flex-col ${isCompact ? 'gap-3' : 'gap-5'}`
          }>
            
            {filteredReports.map((report) => (
              <div 
                key={report.id}
                onClick={() => navigate(`/blog/${report.id}`)}
                className={`
                  group bg-white border border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer overflow-hidden hover:shadow-md
                  ${viewMode === 'grid' ? 'flex flex-col h-full' : (isCompact ? 'p-3 flex gap-4 items-center' : 'p-5 flex gap-5 items-start')}
                `}
              >
                <div className={`
                  bg-gray-100 flex-shrink-0 overflow-hidden relative
                  ${viewMode === 'grid' ? 'w-full aspect-video border-b border-gray-200' : (isCompact ? 'w-16 h-16 rounded-xl border border-gray-200' : 'w-24 h-24 rounded-2xl border border-gray-200')}
                `}>
                  {report.images && report.images.length > 0 ? (
                    <img src={report.images[0]} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                      <ImageIcon size={viewMode === 'grid' ? (isCompact ? 24 : 32) : (isCompact ? 16 : 24)} />
                    </div>
                  )}
                  {viewMode === 'grid' && <div className={`absolute top-2 right-2 bg-white/90 backdrop-blur-md text-gray-700 px-2.5 py-1 rounded-md border border-gray-200/50 font-medium tracking-wide shadow-sm ${isCompact ? 'text-[10px]' : 'text-xs'}`}>{report.date}</div>}
                </div>

                <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? (isCompact ? 'p-4 flex flex-col h-full' : 'p-5 flex flex-col h-full') : ''}`}>
                  <div className={`flex justify-between ${isCompact && viewMode === 'list' ? 'items-center' : 'items-start mb-2'}`}>
                    <h4 className={`font-bold text-gray-900 truncate pr-3 group-hover:text-blue-600 transition-colors tracking-tight ${viewMode === 'grid' ? (isCompact ? 'text-base' : 'text-xl') : (isCompact ? 'text-base' : 'text-xl')}`}>
                      {report.title}
                    </h4>
                    {viewMode === 'list' && (
                      <span className={`text-xs text-gray-500 whitespace-nowrap bg-gray-100 px-2.5 rounded-md border border-gray-200 font-medium tracking-wide ${isCompact ? 'py-1' : 'py-1.5'}`}>
                        {report.date}
                      </span>
                    )}
                  </div>
                  
                  {!(isCompact && viewMode === 'list') && (
                    <p className={`text-sm text-gray-500 leading-relaxed font-light ${viewMode === 'grid' ? (isCompact ? 'line-clamp-2 mb-3 text-xs flex-1' : 'line-clamp-3 mb-4 flex-1') : 'line-clamp-2 h-10'}`}>
                      {report.content}
                    </p>
                  )}
                  
                  <div className={`flex items-center gap-4 text-xs text-gray-400 font-medium ${viewMode === 'list' ? (isCompact ? 'mt-0' : 'mt-4') : (isCompact ? 'mt-auto pt-3 border-t border-gray-100' : 'mt-auto pt-4 border-t border-gray-100')}`}>
                    <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                      <MapPin size={12} className="text-gray-400" /> {report.location}
                    </span>
                    {report.images && report.images.length > 1 && (
                      <span className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md ml-auto sm:ml-0">
                        <ImageIcon size={10} /> +{report.images.length - 1}
                      </span>
                    )}
                  </div>
                </div>

                {viewMode === 'list' && !isCompact && (
                  <div className="self-center text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1.5 transition-all hidden sm:block pr-2">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredReports.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 p-3.5 text-center flex-shrink-0 text-xs text-gray-500 font-medium tracking-wide">
          총 {filteredReports.length}개의 기록 {isCompact && <span className="text-gray-400 ml-1">(요약됨)</span>}
        </div>
      )}
    </div>
  );
};

export default RecentList;