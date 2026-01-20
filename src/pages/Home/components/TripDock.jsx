import React, { useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TripDock({ savedTrips, onTripClick, onTripDelete }) {
  const scrollRef = useRef(null);

  if (!savedTrips || savedTrips.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 200; // 한 번에 이동할 거리
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="flex items-center gap-2 ml-4 animate-fade-in-right relative group/dock">
      <div className="w-px h-8 bg-white/20 mx-2"></div>

      {/* 좌측 화살표 (Hover시 등장) */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-4 z-10 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover/dock:opacity-100 transition-opacity hover:bg-blue-600 backdrop-blur-md border border-white/10"
      >
        <ChevronLeft size={16} />
      </button>

      {/* 스크롤 영역 */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div 
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto max-w-[400px] p-2 px-8 no-scrollbar mask-gradient-right scroll-smooth"
      >
        {savedTrips.map((trip) => (
          <div 
            key={trip.id}
            onClick={() => onTripClick(trip)}
            className="group relative flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 hover:border-blue-500/50 transition-all hover:scale-105 flex-shrink-0"
          >
            <span className="text-lg font-black text-blue-400 tracking-tighter">
              {trip.code}
            </span>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white leading-tight truncate max-w-[80px]">
                {trip.destination}
              </span>
              <span className="text-[8px] text-gray-500 font-mono">
                {trip.date.slice(5)}
              </span>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                onTripDelete(trip.id);
              }}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 scale-75"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* 우측 화살표 */}
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 z-10 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover/dock:opacity-100 transition-opacity hover:bg-blue-600 backdrop-blur-md border border-white/10"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}