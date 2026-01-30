import React, { useState, useEffect } from 'react';
import { X, Globe, MessageSquare, Ticket, Sparkles, Maximize2 } from 'lucide-react';

// 🚨 [Fix/New] 가독성을 높인 텍스트 스켈레톤
const SkeletonLoader = () => (
  <div className="w-full animate-pulse space-y-3 mt-1">
    <div className="h-4 bg-white/10 rounded w-1/3"></div>
    <div className="space-y-2">
      <div className="h-3 bg-white/10 rounded w-full"></div>
      <div className="h-3 bg-white/10 rounded w-5/6"></div>
      <div className="h-3 bg-white/10 rounded w-4/6"></div>
    </div>
  </div>
);

const PlaceCard = ({ 
  location, onClose, onChat, onTicket,
  isCompactMode 
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!location) return; 
    setIsLoading(true);
    // 🚨 [Fix] 복잡한 API 호출을 제거하고 UI 안정성 우선
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  if (!location) return null;

  // [Compact Mode] 티커 확장 시 하단에 작게 표시되는 모드
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

  return (
    <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in-up transition-all duration-300">
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 relative">
        
        {/* 🚨 [New] 상단 장식 요소: 확대 모드를 암시하는 미세한 디자인 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
           <div className="flex flex-col">
             <div className="flex items-center gap-1.5 mb-1">
               <Sparkles size={12} className="text-yellow-400" />
               <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">
                 {location.country || "Global Destination"}
               </span>
             </div>
             <h2 className="text-2xl font-bold text-white leading-none tracking-tight flex items-center gap-2">
               {location.name}
               {/* 🚨 [New] 클릭 시 확대를 암시하는 아이콘 (기능은 추후 구현) */}
               <Maximize2 size={14} className="text-gray-500 cursor-pointer hover:text-white transition-colors" />
             </h2>
           </div>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors -mr-2 -mt-2">
               <X size={18} />
           </button>
        </div>

        {/* Content Section: 텍스트 정보 강화 */}
        <div className="min-h-[100px] mb-6"> 
          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <div className="animate-fade-in">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  {/* 🚨 [New] 풍성한 여행지 설명 (추후 데이터 연동) */}
                  {location.name}은(는) 새로운 영감을 찾는 여행자들에게 완벽한 장소입니다. 
                  현지의 독특한 분위기와 숨겨진 명소들을 탐험하며 나만의 'Days'를 기록해 보세요.
                  현재 좌표 ({location.lat.toFixed(2)}, {location.lng.toFixed(2)})를 기반으로 최적의 루트를 설계할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
           <button 
             onClick={() => onChat({ 
               text: `${location.name}에 대해 깊이 있는 이야기를 들려줘!`, 
               persona: 'INSPIRER' 
             })}
             className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all group"
           >
             <MessageSquare size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
             <span className="text-xs font-bold text-gray-200 group-hover:text-white">AI 묻기</span>
           </button>

           <button 
             onClick={onTicket}
             className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] transition-all border border-white/10"
           >
             <Ticket size={16} className="text-white" />
             <span className="text-xs font-bold text-white">여행 계획</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;