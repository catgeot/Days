import React, { useState, useEffect } from 'react';
import { Sparkles, List, Camera, Heart, Calendar, Play, Image as ImageIcon, ChevronRight, Hash, Clock, ArrowLeft, Send } from 'lucide-react';
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

  // 🚨 [Safe Path] 데이터가 없을 경우를 대비한 방어 코드
  const aiContext = videoData?.ai_context || null;
  // timestamps가 없으면 best_moment라도 배열로 만듦
  const timeChapters = aiContext?.timestamps || (aiContext?.best_moment ? [aiContext.best_moment] : []);

  return (
    <div className={`w-[35%] h-full backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-500 ${isFullScreen ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'} ${selectedImg ? 'bg-[#020305]/95' : 'bg-[#05070a]/80'}`}>
      
      {/* 🎨 [Header]: Single Row Alignment (Back + Title + Toggle) */}
      <div className="h-20 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-white/0 z-20">
         <div className="flex items-center gap-4 overflow-hidden">
             {/* 1. Back Button */}
             <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:bg-white/20 hover:text-white transition-all shrink-0">
                 <ArrowLeft size={16} />
             </button>

             {/* 2. Title (Collapsed) */}
             <div className="flex flex-col min-w-0">
                 <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase truncate">{location.country}</span>
                 <h1 className="text-xl font-bold text-white truncate leading-none tracking-tight">{location.name}</h1>
             </div>
         </div>

         {/* 3. Toggle Switch */}
         <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shrink-0">
            <button 
                onClick={() => setMediaMode('GALLERY')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 ${mediaMode === 'GALLERY' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <ImageIcon size={12} /> <span className="hidden xl:inline">GALLERY</span>
            </button>
            <button 
                onClick={() => setMediaMode('VIDEO')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 ${mediaMode === 'VIDEO' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Play size={12} fill="currentColor" /> <span className="hidden xl:inline">CINEMA</span>
            </button>
         </div>
      </div>

      {/* 🎨 [Body]: Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide relative">
        {selectedImg ? (
            /* Gallery Detail View */
            <div className="animate-fade-in space-y-6">
               {/* (기존 갤러리 상세 정보 코드 유지) */}
               <div className="flex flex-wrap gap-2">
                 <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] text-blue-200 font-bold flex items-center gap-1"><Camera size={10}/> {selectedImg.width}x{selectedImg.height}</span>
                 <span className="px-2 py-1 bg-pink-500/20 border border-pink-500/30 rounded text-[10px] text-pink-200 font-bold flex items-center gap-1"><Heart size={10}/> {selectedImg.likes}</span>
                 <span className="px-2 py-1 bg-white/10 border border-white/10 rounded text-[10px] text-gray-300 font-bold flex items-center gap-1"><Calendar size={10}/> {new Date(selectedImg.created_at).getFullYear()}</span>
               </div>
               <div className="p-4 bg-gradient-to-br from-blue-900/10 to-transparent border-l-2 border-cyan-500/50 rounded-r-xl">
                  <p className="text-gray-300 text-sm leading-relaxed font-light">
                    "<span className="text-white font-medium">{selectedImg.user.name}</span> 작가의 시선.<br/>
                     이 장소에서 특별한 영감을 받아보세요."
                  </p>
               </div>
               <button onClick={() => setSelectedImg(null)} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 font-bold transition-all">
                   목록으로 돌아가기
               </button>
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
           /* 🎨 [Main]: Docent Mode */
           <div className="animate-fade-in flex flex-col gap-6">
              
              {/* 1. AI Summary */}
              {aiContext ? (
                  <div className="space-y-3">
                      <div className="flex items-center gap-2">
                          <Sparkles size={12} className="text-indigo-400" />
                          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">AI Docent Briefing</span>
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed font-light">
                          {aiContext.summary}
                      </p>
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

              {/* 2. 🎨 Chapter List (Interactive Timestamps) */}
              {mediaMode === 'VIDEO' && timeChapters.length > 0 && (
                  <div className="space-y-3">
                      <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest pl-1">Highlights</h3>
                      <div className="flex flex-col gap-2">
                          {timeChapters.map((chapter, idx) => (
                              <button 
                                key={idx}
                                onClick={() => onSeekTime && onSeekTime(chapter.time)}
                                className="group w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left"
                              >
                                  {/* Time Badge */}
                                  <div className="shrink-0 w-12 h-12 rounded-lg bg-[#0F1115] flex items-center justify-center group-hover:bg-red-600 transition-colors">
                                      <span className="text-[11px] font-bold text-gray-400 group-hover:text-white group-hover:hidden">{chapter.time}</span>
                                      <Play size={16} className="hidden group-hover:block text-white fill-current" />
                                  </div>
                                  
                                  {/* Description */}
                                  <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-300 group-hover:text-white truncate transition-colors">{chapter.desc}</p>
                                      <p className="text-[10px] text-gray-600 group-hover:text-gray-400 truncate">클릭하여 바로 이동</p>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>
              )}
           </div>
        )}
      </div>

      {/* 🎨 [Footer]: Minimal Input Bar (다이어트 완료) */}
      {!selectedImg && !isChatMode && (
          <div className="p-6 pt-2 bg-gradient-to-t from-[#05070a] to-transparent shrink-0 z-20">
              <button 
                onClick={() => setIsChatMode(true)}
                className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-5 flex items-center gap-3 transition-all group"
              >
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