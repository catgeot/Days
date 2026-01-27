// 🚨 [Fix] 수정 이유: Home.jsx의 페르소냐 시스템(INSPIRER)과 연동되도록 onChat 호출 인자 수정
import React from 'react';
import { X, Globe, MessageSquare, Ticket, CloudSun } from 'lucide-react';
// 🚨 [New] 페르소냐 타입을 직접 쓰거나 Home에서 넘겨받은 방식을 맞추기 위해 
// 여기서는 Home.jsx에서 정의한 인터페이스에 맞춰 객체로 전달합니다.

const PlaceCard = ({ 
  location, onClose, onChat, onTicket,
  isCompactMode 
}) => {
  
  if (!location) return null;

  const placeInfo = {
    temp: '24°C',
    weather: 'Sunny'
  };

  // 1. [Yield Mode] (기존 유지)
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

  // 2. [Compact Normal Mode]
  return (
    <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in-up transition-all duration-300">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-5">
        
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

        <div className="h-px w-full bg-white/10 my-4"></div>

        <div className="grid grid-cols-2 gap-3">
           {/* 🚨 [Fix] AI 묻기 클릭 시 Home.jsx의 handleOpenChat이 기대하는 객체 형식으로 전달 */}
           <button 
             onClick={() => onChat({ 
               text: `${location.name}에 대해 설명 부탁해!`, 
               persona: 'INSPIRER' // Home.jsx에서 PERSONA_TYPES.INSPIRER와 매칭됨
             })}
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