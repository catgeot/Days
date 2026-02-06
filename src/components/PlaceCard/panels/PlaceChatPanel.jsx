import React, { useState, useEffect } from 'react';
import { Sparkles, List, Camera, Heart, Calendar, MessageSquare, Play, Image as ImageIcon, Zap, ChevronRight, Hash, Clock } from 'lucide-react';
import PlaceChatView from '../views/PlaceChatView';
import { getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts';

// 🚨 [Fix] videoData prop 추가
const PlaceChatPanel = ({ location, chatData, selectedImg, setSelectedImg, isFullScreen, mediaMode, setMediaMode, videoData }) => {
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

  // 🚨 [Fix/New] AI Context 데이터 추출 (비관적 접근: 없으면 null)
  const aiContext = videoData?.ai_context || null;

  return (
    <div className={`w-[35%] h-full backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-500 ${isFullScreen ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'} ${selectedImg ? 'bg-[#020305]/95' : 'bg-[#05070a]/80'}`}>
      
      {/* Action Button */}
      {!selectedImg && (
        <div className="absolute top-8 right-8 z-20">
            {mediaMode === 'GALLERY' ? (
                <button 
                    onClick={() => setMediaMode('VIDEO')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:scale-105 active:scale-95 group"
                >
                    <Play size={14} fill="currentColor" className="group-hover:animate-pulse" />
                    <span className="text-[10px] font-bold tracking-tight">시네마 뷰</span>
                    <ChevronRight size={12} className="opacity-50" />
                </button>
            ) : (
                <button 
                    onClick={() => setMediaMode('GALLERY')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white rounded-full transition-all hover:scale-105 active:scale-95 group"
                >
                    <ImageIcon size={14} />
                    <span className="text-[10px] font-bold tracking-tight">사진 갤러리</span>
                </button>
            )}
        </div>
      )}

      {/* Header Info Area */}
      <div className="pt-24 px-8 pb-4 flex flex-col gap-3 z-10 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={12} className="text-cyan-400" />
              <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">{location.country || "Global"}</span>
            </div>
            <h1 className="font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-blue-400 text-4xl truncate pr-2">
              {selectedImg ? 'AI FOCUS' : location.name?.toUpperCase()}
            </h1>
          </div>

          {(selectedImg || isChatMode) && (
            <button onClick={() => { setIsChatMode(false); setSelectedImg(null); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all animate-fade-in shrink-0">
              <List size={14} /> <span>Info</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Switcher */}
      <div className="flex-1 px-6 pb-6 overflow-hidden relative">
        {selectedImg ? (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] text-blue-200 font-bold flex items-center gap-1"><Camera size={10}/> {selectedImg.width}x{selectedImg.height}</span>
                <span className="px-2 py-1 bg-pink-500/20 border border-pink-500/30 rounded text-[10px] text-pink-200 font-bold flex items-center gap-1"><Heart size={10}/> {selectedImg.likes}</span>
                <span className="px-2 py-1 bg-white/10 border border-white/10 rounded text-[10px] text-gray-300 font-bold flex items-center gap-1"><Calendar size={10}/> {new Date(selectedImg.created_at).getFullYear()}</span>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-900/10 to-transparent border-l-2 border-cyan-500/50 rounded-r-xl">
                 <p className="text-gray-300 text-sm leading-relaxed font-light">
                   "<span className="text-white font-medium">{selectedImg.user.name}</span> 작가의 시선.<br/>
                   {selectedImg.alt_description ? ` '${selectedImg.alt_description}'의 분위기가 느껴지는 ` : ''}
                   이 장소에서 특별한 영감을 받아보세요."
                 </p>
              </div>
            </div>
        ) : isChatMode ? (
           <PlaceChatView 
             chatHistory={chatData.chatHistory}
             isAiLoading={chatData.isAiLoading}
             onSendMessage={handleSendMessage}
             locationName={location.name}
             mediaMode={mediaMode}
           />
        ) : (
           <div className="animate-fade-in h-full flex flex-col">
              {mediaMode === 'VIDEO' ? (
                <div className="space-y-4 mb-6">
                    {/* 🚨 [Fix/New] AI Context 유무에 따른 조건부 렌더링 */}
                    {aiContext ? (
                        <div className="p-5 bg-gradient-to-br from-indigo-900/20 to-transparent border border-indigo-500/30 rounded-[1.5rem] relative overflow-hidden group">
                            {/* AI Docent Header */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300">
                                    <Sparkles size={12} fill="currentColor"/>
                                </span>
                                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">AI Docent Analysis</span>
                            </div>

                            {/* Summary */}
                            <p className="text-white font-medium text-sm leading-relaxed mb-4">
                                {aiContext.summary}
                            </p>

                            {/* Best Moment */}
                            {aiContext.best_moment && (
                                <div className="p-3 bg-black/30 rounded-xl border border-white/5 flex gap-3 items-start mb-4">
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded uppercase shrink-0 mt-0.5">
                                        <Clock size={10} /> {aiContext.best_moment.time}
                                    </div>
                                    <span className="text-xs text-gray-300">{aiContext.best_moment.desc}</span>
                                </div>
                            )}

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5">
                                {aiContext.tags && aiContext.tags.map((tag, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-gray-400 flex items-center gap-1">
                                        <Hash size={9} /> {tag.replace('#', '')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Default Fallback UI (데이터가 없을 때)
                        <div className="p-5 bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-[1.5rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:rotate-12 transition-transform">
                                <Play size={40} className="text-red-500" />
                            </div>
                            <span className="text-[10px] text-red-400 font-bold uppercase tracking-tighter mb-2 block">시네마 브리핑</span>
                            <h3 className="text-white font-bold text-lg mb-2 leading-tight">{location.name}의 기록</h3>
                            <p className="text-gray-400 text-sm font-light leading-relaxed">
                                영상을 감상하며 궁금한 점이 생기면 AI에게 바로 물어보세요. 현지의 분위기를 데이터로 분석해드립니다.
                            </p>
                        </div>
                    )}
                    
                    {/* Common Shortcuts */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setIsChatMode(true)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex flex-col gap-2 items-center text-center group">
                            <Zap size={20} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] text-gray-300 font-medium">영상 속 명소 찾기</span>
                        </button>
                        <button onClick={() => setIsChatMode(true)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex flex-col gap-2 items-center text-center group">
                            <MessageSquare size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] text-gray-300 font-medium">AI 맛집 추천</span>
                        </button>
                    </div>
                </div>
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                    <p className="text-gray-300 text-sm leading-relaxed font-light">
                    {location.country}의 보석, <span className="text-blue-300 font-medium">{location.name}</span>.<br/>
                    이곳의 숨겨진 매력을 발견하고 AI와 함께 완벽한 여행을 계획해보세요.
                    </p>
                </div>
              )}
              
              <button 
                onClick={() => setIsChatMode(true)}
                className={`w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 mt-auto ${mediaMode === 'VIDEO' ? 'bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600 hover:text-white' : 'bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white'}`}
              >
                <MessageSquare size={16} /> {mediaMode === 'VIDEO' ? '이 장소에 대해 물어보기' : 'AI 대화 시작하기'}
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default PlaceChatPanel;