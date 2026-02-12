import React, { useState } from 'react';
import { Sparkles, ArrowLeft, Send, Crown, Play, Image as ImageIcon, X } from 'lucide-react';
import PlaceChatView from '../views/PlaceChatView';
import { getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts';

const PlaceChatPanel = ({ 
    location, 
    onClose, 
    chatData, 
    activeInfo, 
    isFullScreen, 
    mediaMode, 
    setMediaMode, 
    onSeekTime 
}) => {
  const [isChatMode, setIsChatMode] = useState(false);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(null); // 🚨 [New] 선택된 챕터 추적

  const handleSendMessage = (text) => {
     const persona = PERSONA_TYPES.INSPIRER;
     const systemPrompt = getSystemPrompt(persona, location.name);
     chatData.sendMessage(text, systemPrompt);
  };

  const aiContext = activeInfo.ai_context || null;
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
    <div className={`w-[35%] h-full backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-500 
        ${isFullScreen ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'} 
        bg-[#05070a]/80`}> 
      
      {/* Header */}
      <div className="h-20 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-white/0 z-20">
         <div className="flex items-center gap-4 overflow-hidden">
             <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:bg-white/20 hover:text-white transition-all shrink-0">
                 <ArrowLeft size={16} />
             </button>
             <div className="flex flex-col min-w-0">
                 <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase truncate">{location.country}</span>
                 <h1 className="text-xl font-bold text-white truncate leading-none tracking-tight">{location.name}</h1>
             </div>
         </div>

         {/* Mode Toggle Button */}
         <div className="shrink-0">
            {mediaMode === 'VIDEO' ? (
                <button 
                    onClick={() => setMediaMode('GALLERY')}
                    className="px-4 py-2 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 group"
                >
                    <ImageIcon size={14} className="group-hover:scale-110 transition-transform"/> 
                    <span className="text-[11px] font-bold">갤러리 보기</span>
                </button>
            ) : (
                <button 
                    onClick={() => setMediaMode('VIDEO')}
                    className="px-4 py-2 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all flex items-center gap-2 group"
                >
                    <Play size={14} fill="currentColor" className="group-hover:scale-110 transition-transform"/> 
                    <span className="text-[11px] font-bold">영상 보기</span>
                </button>
            )}
         </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* 🚨 [Fix] 스크롤바 상시 노출 (hover 제거) & 디자인 개선 */}
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>

        {isChatMode ? (
           /* Chat View Overlay */
           <div className="h-full flex flex-col p-6">
               <div className="flex items-center justify-between mb-2 shrink-0">
                   <h3 className="text-sm font-bold text-white flex items-center gap-2">
                       <Sparkles size={14} className="text-blue-400"/> AI Assistant
                   </h3>
                   {/* 🚨 [Fix] 닫기 버튼 디자인 개선 (시인성 UP) */}
                   <button 
                        onClick={() => setIsChatMode(false)} 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/20 text-xs text-gray-300 hover:text-white transition-all border border-white/5"
                    >
                       <span>닫기</span>
                       <X size={12} />
                   </button>
               </div>
               
               <div className="flex-1 min-h-0"> 
                   <PlaceChatView 
                     chatHistory={chatData.chatHistory}
                     isAiLoading={chatData.isAiLoading}
                     onSendMessage={handleSendMessage}
                     locationName={location.name}
                     mediaMode={mediaMode}
                   />
               </div>
           </div>
        ) : (
           /* Docent Mode (Unified Info View) */
           <div className="animate-fade-in flex flex-col gap-6 p-8">
             
             {/* 🚨 [Fix] Header Design Restore (심플한 라벨 형태로 복구) */}
             <div className="space-y-3">
                 <div className="flex items-center gap-2 mb-1">
                     <Sparkles size={12} className={activeInfo.mode === 'VIDEO' ? "text-amber-400" : "text-blue-400"} />
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${activeInfo.mode === 'VIDEO' ? "text-amber-300" : "text-blue-300"}`}>
                        {activeInfo.mode === 'VIDEO' ? "VIDEO INSIGHTS" : "ABOUT THIS PLACE"}
                     </span>
                 </div>
                 
                 {/* 🚨 [Design] 설명글 스타일 조정 */}
                 <p className="text-[15px] text-gray-200 leading-7 font-normal tracking-wide whitespace-pre-line">
                    {activeInfo.summary}
                 </p>
                 
                 <div className="flex flex-wrap gap-1.5 pt-2">
                     {activeInfo.tags && activeInfo.tags.map((tag, idx) => (
                         <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-gray-400 hover:text-white hover:border-white/20 transition-all cursor-default">
                             #{tag.replace ? tag.replace('#','') : tag}
                         </span>
                     ))}
                 </div>
             </div>

             {/* Timeline List */}
             {activeInfo.mode === 'VIDEO' && timeChapters.length > 0 && (
                 <div className="space-y-4 pt-4 border-t border-white/5">
                     <div className="flex items-center justify-between pl-1">
                       <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Moments</h3>
                     </div>
                     <div className="flex flex-col gap-2">
                         {timeChapters.map((chapter, idx) => {
                             const isBestMoment = bestMomentTime && chapter.time === bestMomentTime;
                             const isSelected = selectedChapterIdx === idx; // 🚨 선택 여부 확인

                             return (
                               <button 
                                   key={idx}
                                   onClick={() => handleChapterClick(idx, chapter.time)}
                                   // 🚨 [Fix] 타임라인 버튼 디자인 개선 (부드러운 호버, 명확한 선택 상태)
                                   className={`group w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left relative overflow-hidden
                                     ${isSelected 
                                         ? 'bg-amber-500/10 border-amber-500/50' // 선택됨
                                         : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5' // 기본 & 호버(부드럽게)
                                     }`}
                               >
                                   {isBestMoment && (
                                       <div className="absolute top-0 right-0 bg-amber-500 text-[9px] text-black font-bold px-2 py-0.5 rounded-bl-lg z-10 shadow-lg">
                                           BEST
                                       </div>
                                   )}
                                   
                                   {/* 시간 배지 & 아이콘 */}
                                   <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                                       ${isSelected || isBestMoment 
                                            ? 'bg-amber-500/20 text-amber-400' 
                                            : 'bg-[#0F1115] text-gray-400 group-hover:text-gray-200 group-hover:bg-[#1A1D21]'}`}>
                                           <span className="text-[10px] font-bold group-hover:hidden">
                                               {isBestMoment ? <Crown size={14} /> : idx + 1}
                                           </span>
                                           {/* 🚨 [Fix] 호버 시 붉고 거대한 아이콘 제거 -> 작고 깔끔한 아이콘 */}
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
        )}
      </div>

      {/* Footer (Input Trigger) - 디자인 유지 */}
      {!isChatMode && (
          <div className="p-6 pt-4 bg-gradient-to-t from-[#05070a] via-[#05070a] to-transparent shrink-0 z-20">
              <button 
                onClick={() => setIsChatMode(true)} 
                className="w-full h-12 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-full px-1 pl-2 flex items-center gap-3 transition-all group shadow-lg"
              >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-blue-300 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-200 font-medium truncate">이 장소에 대해 더 물어보세요...</span>
                  <div className="ml-auto mr-2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Send size={12} />
                  </div>
              </button>
          </div>
      )}
    </div>
  );
};

export default PlaceChatPanel;