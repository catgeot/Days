// src/pages/Home/components/PlaceCard.jsx
import React from 'react';
import { X, Globe, MessageSquare, Ticket, CloudSun } from 'lucide-react';

const PlaceCard = ({ 
  location, onClose, onChat, onTicket,
  isCompactMode 
}) => {
  
  if (!location) return null;

  // 정적 데이터
  const placeInfo = {
    temp: '24°C',
    weather: 'Sunny'
  };

  // 1. [Yield Mode] 순위표 열림 (아주 작은 바)
  if (isCompactMode) {
    return (
      <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in transition-all duration-300">
         <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
               <Globe size={14} className="text-blue-400" />
               <span className="text-sm font-bold text-white">{location.name}</span>
            </div>
            <span className="text-[10px] text-gray-500">잠시 비켜두기...</span>
         </div>
      </div>
    );
  }

  // 2. [Compact Normal Mode] 이미지/설명글 제거된 초경량 버전
  return (
    <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in-up transition-all duration-300">
      
      {/* Glass Box */}
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-5">
        
        {/* Row 1: Top Info (Country, Weather, Close) */}
        <div className="flex items-start justify-between mb-2">
           <div className="flex flex-col">
             <div className="flex items-center gap-1.5 mb-1">
               <Globe size={12} className="text-blue-400" />
               <span className="text-[10px] text-blue-300 font-bold tracking-wider uppercase">
                 {location.country || "GLOBAL DESTINATION"}
               </span>
             </div>
             {/* City Name (Main Title) */}
             <h2 className="text-2xl font-bold text-white leading-none tracking-tight">
               {location.name}
             </h2>
           </div>

           {/* Right Side: Weather & Close */}
           <div className="flex items-start gap-3">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-yellow-400">
                  <CloudSun size={14} />
                  <span className="text-sm font-bold">{placeInfo.temp}</span>
                </div>
                <span className="text-[10px] text-gray-400">{placeInfo.weather}</span>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors -mr-2 -mt-2"
              >
                <X size={16} />
              </button>
           </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/10 my-4"></div>

        {/* Row 2: Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
           <button 
             onClick={() => onChat(location.name)}
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