import React, { useState, useEffect } from 'react';
import { Play, Crown } from 'lucide-react';

const VideoInfoView = ({ videoData, onSeekTime }) => {
    // 🚨 [State Separation] 타임라인 선택 상태를 독립적으로 관리
    const [selectedChapterIdx, setSelectedChapterIdx] = useState(null);

    // 🚨 [Bug Fix] 영상 데이터(videoData)가 바뀌면 선택된 타임라인 초기화
    // (부모 컴포넌트에서 객체를 새로 생성해서 내려주므로, 객체 변경 시 리셋됨)
    useEffect(() => {
        setSelectedChapterIdx(null);
    }, [videoData]);

    if (!videoData) return null;

    // 데이터 안전성 확보 (Safe Access)
    const aiContext = videoData.ai_context || null;
    const timeChapters = aiContext?.timeline || (aiContext?.best_moment ? [aiContext.best_moment] : []);
    const bestMomentTime = aiContext?.best_moment?.time;

    // 시간 파싱 로직 (기존 로직 유지)
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
             {/* 1. Video Summary Section (기존 디자인 유지) */}
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

             {/* 2. Timeline Section (기존 로직 및 스타일 복제) */}
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