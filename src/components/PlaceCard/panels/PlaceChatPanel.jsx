import React, { useState, useEffect } from 'react';
import { Sparkles, Camera, Heart, Calendar, Play, Image as ImageIcon, ArrowLeft, Send, Crown } from 'lucide-react';
import PlaceChatView from '../views/PlaceChatView';
import { getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts';

const PlaceChatPanel = ({ location, onClose, chatData, selectedImg, setSelectedImg, isFullScreen, mediaMode, setMediaMode, videoData, onSeekTime }) => {
  const [isChatMode, setIsChatMode] = useState(false);

  useEffect(() => {
    if (selectedImg) {
        setIsChatMode(false);
        setMediaMode('GALLERY');
    }
  }, [selectedImg]);

  const handleSendMessage = (text) => {
     const persona = PERSONA_TYPES.INSPIRER;
     const systemPrompt = getSystemPrompt(persona, location.name);
     chatData.sendMessage(text, systemPrompt);
  };

  // 🚨 [Data Logic]
  const aiContext = videoData?.ai_context || null;
  const timeChapters = aiContext?.timeline || (aiContext?.best_moment ? [aiContext.best_moment] : []);
  
  // Best Moment의 시간 문자열 추출 (비교용)
  const bestMomentTime = aiContext?.best_moment?.time;

  // 시간 파싱 (문자열 -> 초)
  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  return (
    <div className={`w-[35%] h-full backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-500 ${isFullScreen ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'} ${selectedImg ? 'bg-[#020305]/95' : 'bg-[#05070a]/80'}`}>
      
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

         {/* Integrated Toggle Button */}
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

      {/* Body: Custom Scrollbar Style */}
      <div className="flex-1 overflow-y-auto px-6 py-6 relative custom-scrollbar">
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: transparent; border-radius: 10px; }
            .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); }
        `}</style>

        {selectedImg ? (
            /* Gallery Detail View (생략 - 기존 유지) */
            <div className="animate-fade-in space-y-6">
               <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black/50 border border-white/10 shadow-2xl group relative">
                 <img src={selectedImg.url} alt="Selected" className="w-full h-full object-cover"/>
               </div>
               <button onClick={() => setSelectedImg(null)} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 font-bold transition-all">목록으로 돌아가기</button>
            </div>
        ) : isChatMode ? (
           /* Chat View Overlay */
           <div className="h-full flex flex-col">
               <div className="flex items-center justify-between mb-2">
                   <h3 className="text-sm font-bold text-white">AI Assistant</h3>
                   <button onClick={() => setIsChatMode(false)} className="text-xs text-gray-500 hover:text-white">닫기</button>
               </div>
               <PlaceChatView 
                 chatHistory={chatData.chatHistory}
                 isAiLoading={chatData.isAiLoading}
                 onSendMessage={handleSendMessage}
                 locationName={location.name}
                 mediaMode={mediaMode}
               />
           </div>
        ) : (
           /* Docent Mode */
           <div className="animate-fade-in flex flex-col gap-6 pb-4">
              
              {/* AI Summary */}
              {aiContext ? (
                  <div className="space-y-3">
                      <div className="flex items-center gap-2">
                          <Sparkles size={12} className="text-indigo-400" />
                          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">AI Docent Briefing</span>
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed font-light">{aiContext.summary}</p>
                      <div className="flex flex-wrap gap-1.5">
                          {aiContext.tags && aiContext.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400">#{tag.replace('#','')}</span>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-400">영상 데이터 분석 중입니다...</p>
                  </div>
              )}

              {/* 🚨 Timeline List with Best Moment Highlight */}
              {mediaMode === 'VIDEO' && timeChapters.length > 0 && (
                  <div className="space-y-3">
                      <div className="flex items-center justify-between pl-1">
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Timeline</h3>
                        <span className="text-[10px] text-gray-600">{timeChapters.length} Chapters</span>
                      </div>
                      <div className="flex flex-col gap-2">
                          {timeChapters.map((chapter, idx) => {
                              // 🚨 [Highlight Logic] 현재 챕터가 Best Moment인지 확인
                              const isBestMoment = bestMomentTime && chapter.time === bestMomentTime;

                              return (
                                <button 
                                    key={idx}
                                    onClick={() => onSeekTime && onSeekTime(parseTime(chapter.time))}
                                    // 🚨 [Design] Best Moment일 경우 테두리와 배경색 강조 (Amber/Gold)
                                    className={`group w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left relative overflow-hidden
                                        ${isBestMoment 
                                            ? 'bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20' 
                                            : 'hover:bg-white/5 border-transparent hover:border-white/10'
                                        }`}
                                >
                                    {/* 🚨 [Badge] Best Moment Label */}
                                    {isBestMoment && (
                                        <div className="absolute top-0 right-0 bg-amber-500 text-[9px] text-black font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                            BEST MOMENT
                                        </div>
                                    )}

                                    {/* Time Badge */}
                                    <div className={`shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors
                                        ${isBestMoment ? 'bg-amber-500/20 text-amber-400' : 'bg-[#0F1115] text-gray-400 group-hover:bg-red-600 group-hover:text-white'}`}
                                    >
                                        {/* Hover 시 재생 아이콘, 평소엔 시간/왕관 */}
                                        <span className="text-[11px] font-bold group-hover:hidden">
                                            {isBestMoment ? <Crown size={16} /> : chapter.time}
                                        </span>
                                        <Play size={16} className="hidden group-hover:block fill-current" />
                                    </div>
                                    
                                    {/* Description */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate transition-colors ${isBestMoment ? 'text-amber-200' : 'text-gray-300 group-hover:text-white'}`}>
                                            {chapter.title || "Highlight"}
                                        </p>
                                        <p className="text-[10px] text-gray-500 group-hover:text-gray-400 truncate">
                                            {chapter.desc}
                                        </p>
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

      {/* Footer (Input) */}
      {!selectedImg && !isChatMode && (
          <div className="p-6 pt-2 bg-gradient-to-t from-[#05070a] to-transparent shrink-0 z-20">
              <button onClick={() => setIsChatMode(true)} className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-5 flex items-center gap-3 transition-all group">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Sparkles size={12} className="text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-500 group-hover:text-gray-300 font-medium">이 장소에 대해 궁금한 점이 있나요?</span>
                  <div className="ml-auto w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Send size={12} />
                  </div>
              </button>
          </div>
      )}
    </div>
  );
};

export default PlaceChatPanel;