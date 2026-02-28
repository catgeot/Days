// src/components/PlaceCard/modes/PlaceCardSummary.jsx
// 🚨 [Fix] 가짜 스위치를 제거하고 재사용 가능한 BookmarkButton 컴포넌트 이식
// 🚨 [Fix/New] 수정 이유: 
// 1. 부자연스러웠던 Grid 애니메이션을 삭제했습니다.
// 2. '스무스 드롭' 적용: 버튼을 감싸는 Wrapper의 높이(max-h)가 줄어드는 동시에, 내부 버튼이 아래로 밀려 내려가며(translate-y) 사라지도록 하여 훨씬 자연스러운 UI 축소 효과를 구현했습니다.
// 3. 💡 크기 조절 포인트 주석을 유지하여 직접 여백을 세밀하게 튜닝할 수 있도록 했습니다.

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Sparkles, Maximize2 } from 'lucide-react'; 
import BookmarkButton from '../common/BookmarkButton'; 

const PlaceCardSummary = ({ location, isBookmarked, onClose, onExpand, onChat, onToggleBookmark, isTickerExpanded }) => { 
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div className="absolute bottom-6 right-8 w-80 z-[60] animate-fade-in-up transition-all duration-300">
      
      {/* 💡 크기 조절 포인트 1: 전체 패딩. 현재 p-6 (24px). 좀 더 줄이려면 p-5 또는 p-4로 수정 */}
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-4 relative group">
        
        <div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-blue-400 transition-all cursor-pointer"
          onClick={onExpand}
        ></div>

        {/* 💡 크기 조절 포인트 2: 헤더 하단 여백. 현재 mb-4 (16px). 줄이려면 mb-3 또는 mb-2로 수정 */}
        <div className="flex items-start justify-between mb-3">
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
           
           <div className="flex items-center gap-1 -mr-2 -mt-2 z-10">
             <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />
             <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
               <X size={18} />
             </button>
           </div>
        </div>

        {/* 💡 크기 조절 포인트 3: 설명 박스 하단 여백. 기본 mb-6 (24px). (티커가 열리면 mb-0으로 축소됨) */}
        <div 
          className={`cursor-pointer transition-all duration-300 ease-out ${
            isTickerExpanded ? 'mb-0' : 'mb-6'
          }`} 
          onClick={onExpand}
        > 
          {isLoading ? (
            <div className="w-full animate-pulse space-y-3 mt-1">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded w-full"></div>
                <div className="h-3 bg-white/10 rounded w-5/6"></div>
              </div>
            </div>
          ) : (
            // 💡 크기 조절 포인트 4: 설명 박스 내부 패딩. 현재 p-4 (16px). 줄이려면 p-3으로 수정
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
              <p className={`text-xs text-gray-300 leading-relaxed font-light transition-all duration-300 ${
                isTickerExpanded ? 'line-clamp-2' : 'line-clamp-3'
              }`}>
                {location.name}의 숨겨진 매력을 발견하세요. 카드를 클릭하면 고화질 갤러리와 AI 가이드가 시작됩니다.
              </p>
            </div>
          )}
        </div>

        {/* 🚨 [Fix] 스무스 드롭 애니메이션: Wrapper가 마스크 역할을 하고, 내부 버튼이 아래로 밀려 내려감 */}
        <div 
          className={`transition-all duration-300 ease-out overflow-hidden ${
            isTickerExpanded ? 'max-h-0 opacity-0 mt-0' : 'max-h-[60px] opacity-100 mt-2'
          }`}
        >
           <button 
             onClick={(e) => { 
               e.stopPropagation(); 
               if(onChat) onChat({ text: "" }); 
             }} 
             className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 z-10 relative ${
               isTickerExpanded ? 'translate-y-4' : 'translate-y-0'
             }`}
           >
             <MessageSquare size={16} className="text-blue-400" />
             <span className="text-xs font-bold text-gray-200">AI에게 장소 묻기</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceCardSummary;