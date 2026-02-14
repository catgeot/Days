// src/components/PlaceCard/modes/PlaceCardSummary.jsx
// 🚨 [Fix] Ticket 버튼 삭제 및 'AI 묻기' 버튼 클릭 시 카드 펼쳐짐(이벤트 버블링) 방지
// 🚨 [Fix] onChat 함수 실행 시 기본값(빈 텍스트) 전달로 채팅창만 열리게 연동

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Sparkles, Maximize2 } from 'lucide-react';
// 🚨 [Fix] Ticket 아이콘 Import 제거

const PlaceCardSummary = ({ location, onClose, onExpand, onChat }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Card Appearance Effect
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in-up transition-all duration-300">
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 relative group">
        
        {/* Click Area for Expansion */}
        <div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-blue-400 transition-all cursor-pointer"
          onClick={onExpand}
        ></div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
           <div className="flex flex-col cursor-pointer" onClick={onExpand}>
             <div className="flex items-center gap-1.5 mb-1">
               <Sparkles size={12} className="text-yellow-400" />
               <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">{location.country || "Global"}</span>
             </div>
             <h2 className="text-2xl font-bold text-white leading-none tracking-tight flex items-center gap-2 group-hover:text-blue-200 transition-colors">
               {location.name}
               <Maximize2 size={14} className="text-gray-500 group-hover:text-white transition-colors" />
             </h2>
           </div>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors -mr-2 -mt-2 z-10">
             <X size={18} />
           </button>
        </div>

        {/* Content (with Skeleton Loading) */}
        <div className="min-h-[100px] mb-6 cursor-pointer" onClick={onExpand}> 
          {isLoading ? (
            <div className="w-full animate-pulse space-y-3 mt-1">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded w-full"></div>
                <div className="h-3 bg-white/10 rounded w-5/6"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
              <p className="text-xs text-gray-300 leading-relaxed font-light line-clamp-3">
                {location.name}의 숨겨진 매력을 발견하세요. 카드를 클릭하면 고화질 갤러리와 AI 가이드가 시작됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {/* 🚨 [Fix] grid-cols-2에서 grid-cols-1로 변경하여 메인 버튼 하나만 렌더링 */}
        <div className="grid grid-cols-1 gap-3">
           <button 
             onClick={(e) => { 
               e.stopPropagation(); // 🚨 [Fix] 이벤트 버블링 차단 (onExpand 실행 방지)
               if(onChat) onChat({ text: "" }); // 🚨 [Fix] 빈 텍스트를 넘겨서 채팅창만 열리게 트리거
             }} 
             className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all z-10 relative"
           >
             <MessageSquare size={16} className="text-blue-400" />
             <span className="text-xs font-bold text-gray-200">AI에게 장소 묻기</span>
           </button>
           {/* 🚨 [Fix] Ticket 버튼 컴포넌트 완전 삭제 */}
        </div>
      </div>
    </div>
  );
};

export default PlaceCardSummary;