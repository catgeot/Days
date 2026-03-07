// 🚨 [Fix/New] Pessimistic UI(비관적 설계) 적용: 영상 데이터가 없을 때 터지지 않고 Fallback UI 렌더링
// 🚨 [Fix/New] Subtraction over Addition: 복잡한 에러 핸들러 추가 대신 Early Return으로 컴포넌트 보호

import React, { useState, useEffect } from 'react';
import { Play, Crown, AlertCircle, Sparkles } from 'lucide-react';

const VideoInfoView = ({ videoData, onSeekTime }) => {
    const [selectedChapterIdx, setSelectedChapterIdx] = useState(null);

    useEffect(() => {
        setSelectedChapterIdx(null);
    }, [videoData]);

    // 🚨 [Pessimistic First] 안전 경로 탐색: 데이터 자체가 없으면 렌더링 중지
    if (!videoData) return null;

    // 🚨 [Empty State] 로딩 중이거나 데이터가 없을 때의 방어선 렌더링
    if (videoData.isLoading) {
        return (
            <div className="animate-pulse p-4 text-white/50 text-sm flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                영상의 인사이트를 탐색하는 중입니다...
            </div>
        );
    }

    if (videoData.isEmpty || !videoData.ai_context) {
        return (
            <div className="animate-fade-in space-y-4 p-5 border border-white/5 rounded-2xl bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={18} className="text-white/40" />
                    <h3 className="text-sm font-bold text-white/80">영상 인사이트 없음</h3>
                </div>
                <p className="text-xs text-white/40 leading-relaxed mb-4">
                    현재 이 장소에 등록된 영상 정보가 부족합니다.<br/>
                    멋진 영상을 알고 계시다면 우측 플레이어 패널을 통해<br/>
                    첫 번째 추천자가 되어주세요!
                </p>
                {videoData.googleFormUrl && (
                    <a 
                        href={videoData.googleFormUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all active:scale-95"
                    >
                        <Sparkles size={14} />
                        영상 추천하기
                    </a>
                )}
            </div>
        );
    }

    // 데이터 안전성 확보 (Safe Access)
    const aiContext = videoData.ai_context || null;
    const timeChapters = aiContext?.timeline || (aiContext?.best_moment ? [aiContext.best_moment] : []);
    const bestMomentTime = aiContext?.best_moment?.time;

    const parseTime = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    };

    const handleChapterClick = (idx, timeStr) => {
        setSelectedChapterIdx(idx);
        if (onSeekTime) onSeekTime(parseTime(timeStr));
    };

    return (
        <div className="animate-fade-in space-y-6">
             <div className="space-y-3">
                 <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                        VIDEO INSIGHTS
                     </span>
                 </div>
                 
                 <p className="text-[13px] text-gray-200 leading-7 font-normal tracking-wide whitespace-pre-line">
                    {videoData.summary}
                 </p>
                 
                 <div className="flex flex-wrap gap-1.5 pt-2">
                     {videoData.tags && videoData.tags.map((tag, idx) => (
                         <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-gray-400 hover:text-white hover:border-white/20 transition-all cursor-default">
                             #{tag.replace ? tag.replace('#','') : tag}
                         </span>
                     ))}
                 </div>
             </div>

             {timeChapters.length > 0 && (
                 <div className="space-y-4 pt-4 border-t border-white/5">
                     <div className="flex items-center justify-between pl-1">
                       <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Moments</h3>
                     </div>
                     <div className="flex flex-col gap-2">
                         {timeChapters.map((chapter, idx) => {
                             const isBestMoment = bestMomentTime && chapter.time === bestMomentTime;
                             const isSelected = selectedChapterIdx === idx;

                             return (
                               <button 
                                   key={idx}
                                   onClick={() => handleChapterClick(idx, chapter.time)}
                                   className={`group w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left relative overflow-hidden
                                     ${isSelected 
                                       ? 'bg-amber-500/10 border-amber-500/50' 
                                       : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}`}
                               >
                                   {isBestMoment && (
                                       <div className="absolute top-0 right-0 bg-amber-500 text-[9px] text-black font-bold px-2 py-0.5 rounded-bl-lg z-10 shadow-lg">
                                           BEST
                                       </div>
                                   )}
                                   
                                   <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                                       ${isSelected || isBestMoment 
                                            ? 'bg-amber-500/20 text-amber-400' 
                                            : 'bg-[#0F1115] text-gray-400 group-hover:text-gray-200 group-hover:bg-[#1A1D21]'}`}>
                                       <span className="text-[10px] font-bold group-hover:hidden">
                                            {isBestMoment ? <Crown size={14} /> : idx + 1}
                                       </span>
                                       <Play size={12} className="hidden group-hover:block fill-current opacity-80" />
                                   </div>

                                   <div className="flex-1 min-w-0">
                                       <p className={`text-xs font-bold truncate transition-colors ${isSelected ? 'text-amber-200' : 'text-gray-300 group-hover:text-white'}`}>
                                           {chapter.title || "Highlight"}
                                       </p>
                                       <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-500 font-mono bg-black/30 px-1 rounded group-hover:bg-black/50 transition-colors">{chapter.time}</span>
                                            <p className="text-[10px] text-gray-500 truncate max-w-[150px] group-hover:text-gray-400">{chapter.desc}</p>
                                       </div>
                                   </div>
                               </button>
                             );
                         })}
                     </div>
                 </div>
             )}
        </div>
    );
};

export default VideoInfoView;