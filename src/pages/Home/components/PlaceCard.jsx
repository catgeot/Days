// src/components/PlaceCard.jsx
import React, { useState, useEffect } from 'react';
import { X, Globe, MessageSquare, Ticket, CloudSun } from 'lucide-react';

// 스켈레톤 컴포넌트 (변경 없음)
const SkeletonLoader = () => (
  <div className="w-full animate-pulse flex flex-col gap-3 mt-1">
    <div className="w-full h-36 bg-white/20 rounded-xl shadow-inner"></div>
    <div className="space-y-2.5 px-1">
      <div className="h-4 bg-white/20 rounded w-3/4"></div>
      <div className="h-4 bg-white/20 rounded w-1/2"></div>
      <div className="h-4 bg-white/20 rounded w-full"></div>
    </div>
  </div>
);

const PlaceCard = ({ 
  location, onClose, onChat, onTicket,
  isCompactMode 
}) => {
  // 1. Hook 선언부 (무조건 최상단 실행)
  const [isLoading, setIsLoading] = useState(true);
  const [placeData, setPlaceData] = useState(null);

  // 🚨 [Critical Fix] useEffect를 Early Return보다 위로 올림!
  useEffect(() => {
    // location이 없으면 로직 수행 안함 (Hook은 실행되지만 내부는 스킵)
    if (!location) return; 

    setIsLoading(true);
    setPlaceData(null);

    const timer = setTimeout(() => {
      setPlaceData({
        description: `${location.name}은(는) 여행자들이 사랑하는 매력적인 도시입니다. 현지의 문화와 맛있는 음식을 경험해보세요.`,
        imageUrl: `https://source.unsplash.com/400x300/?${location.name},travel`,
        temp: '24°C',
        weather: 'Sunny'
      });
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [location]);

  // 2. 조건부 렌더링 (Hook 선언이 끝난 뒤에 위치해야 안전함)
  if (!location) return null;

  // 3. [Yield Mode] (잠시 비켜두기)
  if (isCompactMode) {
    return (
      <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in transition-all duration-300 pointer-events-none">
         <div className="pointer-events-auto bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
               <Globe size={14} className="text-blue-400" />
               <span className="text-sm font-bold text-white">{location.name}</span>
            </div>
            <button onClick={onClose} className="p-1 hover:text-white text-gray-500"><X size={12}/></button>
         </div>
      </div>
    );
  }

  // 4. [Normal Mode]
  return (
    <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in-up transition-all duration-300">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
           <div className="flex flex-col">
             <div className="flex items-center gap-1.5 mb-1">
               <Globe size={12} className="text-blue-400" />
               <span className="text-[10px] text-blue-300 font-bold tracking-wider uppercase">
                 {location.country || "GLOBAL DESTINATION"}
               </span>
             </div>
             <h2 className="text-2xl font-bold text-white leading-none tracking-tight">
               {location.name}
             </h2>
           </div>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors -mr-2 -mt-2">
               <X size={16} />
           </button>
        </div>

        <div className="h-px w-full bg-white/10 my-3"></div>

        {/* Content */}
        <div className="min-h-[160px]"> 
          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-center justify-end gap-2 text-yellow-400 mb-3">
                 <span className="text-[10px] text-gray-400">{placeData.weather}</span>
                 <div className="flex items-center gap-1">
                   <CloudSun size={14} />
                   <span className="text-sm font-bold">{placeData.temp}</span>
                 </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/5">
                <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                  {placeData.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
           <button 
             onClick={() => onChat({ text: `${location.name}에 대해 설명 부탁해!`, persona: 'INSPIRER' })}
             className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-400/50 transition-all group"
           >
             <MessageSquare size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
             <span className="text-xs font-bold text-gray-200 group-hover:text-white">AI 묻기</span>
           </button>

           <button 
             onClick={onTicket}
             className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] transition-all border border-white/10"
           >
             <Ticket size={14} className="text-white" />
             <span className="text-xs font-bold text-white">여행 계획</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;