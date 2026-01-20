import React from 'react';
import { X, MapPin } from 'lucide-react';

export default function TripDock({ savedTrips, onTripClick, onTripDelete }) {
  // 데이터가 없으면 렌더링하지 않음 (공간 차지 X)
  if (!savedTrips || savedTrips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 ml-4 animate-fade-in-right">
      {/* 구분선 (티켓 버튼과의 경계) */}
      <div className="w-px h-8 bg-white/20 mx-2"></div>

      {/* 가로 스크롤 영역 */}
      <div className="flex items-center gap-3 overflow-x-auto max-w-[400px] p-2 custom-scrollbar mask-gradient-right">
        {savedTrips.map((trip) => (
          <div 
            key={trip.id}
            onClick={() => onTripClick(trip)}
            className="group relative flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 hover:border-blue-500/50 transition-all hover:scale-105 flex-shrink-0"
          >
            {/* 공항 코드 (큰 글씨) */}
            <span className="text-lg font-black text-blue-400 tracking-tighter">
              {trip.code}
            </span>

            {/* 도시 이름 & 날짜 (작은 글씨) */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white leading-tight truncate max-w-[80px]">
                {trip.destination}
              </span>
              <span className="text-[8px] text-gray-500 font-mono">
                {trip.date.slice(5)} {/* 연도 제외하고 월/일만 표시 */}
              </span>
            </div>

            {/* 삭제 버튼 (호버 시 등장) */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); // 부모 클릭 방지
                onTripDelete(trip.id);
              }}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 scale-75"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}