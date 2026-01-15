import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Image as ImageIcon, PenTool, ClipboardList } from 'lucide-react'; // 아이콘 추가

const RecentList = ({ reports, loading }) => {
  const navigate = useNavigate();

  // 로딩 중일 때 (스켈레톤)
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[500px]"> {/* 높이 고정 */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    // ✨ [핵심] min-h-[500px] 추가: 내용이 없어도 이 높이는 무조건 유지합니다. (쪼그라듦 방지)
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
      
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600" size={20} />
          최근 작성된 일보
        </h3>
        <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full">
          최신순
        </span>
      </div>

      {/* 리스트 영역 (남은 공간 꽉 채우기) */}
      <div className="p-6 flex-1">
        {reports.length === 0 ? (
          
          /* ✨ [수정] 데이터가 없을 때: 중앙 정렬 + 버튼 추가 */
          <div className="h-full flex flex-col items-center justify-center text-center pb-10">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
              <ClipboardList size={40} />
            </div>
            <p className="text-gray-500 font-bold text-lg">아직 작성된 일보가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">오늘의 첫 번째 현장 기록을 남겨보세요!</p>
            
            {/* 사장님 아이디어 반영: 직관적인 작성 버튼 */}
            <button 
              onClick={() => navigate('/report/write')}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 transition-all px-6 py-3 rounded-full font-bold shadow-sm border border-blue-100"
            >
              <PenTool size={18} />
              새 일보 작성하기
            </button>
          </div>

        ) : (
          /* 데이터가 있을 때 */
          <div className="flex flex-col gap-4">
            {reports.map((report) => (
              <div 
                key={report.id}
                onClick={() => navigate(`/report/${report.id}`)}
                className="group border border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer flex gap-4 items-start"
              >
                {/* 썸네일 */}
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100 relative">
                  {report.images && report.images.length > 0 ? (
                    <img src={report.images[0]} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-800 text-lg truncate pr-2 group-hover:text-blue-600 transition-colors">
                      {report.title}
                    </h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {report.date}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 h-10 leading-relaxed">
                    {report.content}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {report.location}
                    </span>
                    {report.images && report.images.length > 1 && (
                      <span className="flex items-center gap-1 text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                        <ImageIcon size={10} /> +{report.images.length - 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* 화살표 */}
                <div className="self-center text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all hidden sm:block">
                  <ChevronRight size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer (데이터 있을 때만) */}
      {reports.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-100 p-4 text-center flex-shrink-0">
          <p className="text-xs text-gray-400">
            총 {reports.length}개의 기록이 있습니다.
          </p>
        </div>
      )}

    </div>
  );
};

export default RecentList;