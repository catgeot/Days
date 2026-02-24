// src/components/PlaceCard/modes/PlaceCardSummary.jsx
// 🚨 [Fix] 가짜 스위치를 제거하고 재사용 가능한 BookmarkButton 컴포넌트 이식

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Sparkles, Maximize2 } from 'lucide-react'; 
import BookmarkButton from '../common/BookmarkButton'; // 🚨 [New] 컴포넌트 임포트 (경로 주의)

const PlaceCardSummary = ({ location, isBookmarked, onClose, onExpand, onChat, onToggleBookmark }) => { // 🚨 Props 추가
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div className="absolute bottom-6 right-8 w-80 z-[60] animate-fade-in-up transition-all duration-300">
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 relative group">
        
        <div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-blue-400 transition-all cursor-pointer"
          onClick={onExpand}
        ></div>

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
           
           {/* 🚨 [Fix] BookmarkButton 컴포넌트로 교체 */}
           <div className="flex items-center gap-1 -mr-2 -mt-2 z-10">
             <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />
             <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
               <X size={18} />
             </button>
           </div>
        </div>

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

        <div className="grid grid-cols-1 gap-3">
           <button 
             onClick={(e) => { 
               e.stopPropagation(); 
               if(onChat) onChat({ text: "" }); 
             }} 
             className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all z-10 relative"
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