import React, { useState, useEffect } from 'react';
import { Sparkles, List, Camera, Heart, Calendar, MessageSquare, Video, Image as ImageIcon, Zap } from 'lucide-react';
import PlaceChatView from '../views/PlaceChatView';
import { getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts';

const PlaceChatPanel = ({ location, chatData, selectedImg, setSelectedImg, isFullScreen, mediaMode, setMediaMode }) => {
  const [isChatMode, setIsChatMode] = useState(false);

  useEffect(() => {
    if (selectedImg) {
        setIsChatMode(false);
        setMediaMode('GALLERY'); // 이미지 선택 시 강제로 갤러리 모드로 유지
    }
  }, [selectedImg]);

  const handleSendMessage = (text) => {
     const persona = PERSONA_TYPES.INSPIRER;
     const systemPrompt = getSystemPrompt(persona, location.name);
     chatData.sendMessage(text, systemPrompt);
  };

  return (
    <div className={`w-[35%] h-full backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-500 ${isFullScreen ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'} ${selectedImg ? 'bg-[#020305]/95' : 'bg-[#05070a]/80'}`}>
      
      {/* Header */}
      <div className="pt-20 px-8 pb-4 flex flex-col gap-3 z-10 shrink-0">
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

          {/* 🚨 [New] Photo/Video Toggle Switch */}
          {!selectedImg && (
            <div className="flex bg-black/40 p-1 rounded-full border border-white/10">
                <button 
                    onClick={() => setMediaMode('GALLERY')}
                    className={`p-2 rounded-full transition-all ${mediaMode === 'GALLERY' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <ImageIcon size={14} />
                </button>
                <button 
                    onClick={() => setMediaMode('VIDEO')}
                    className={`p-2 rounded-full transition-all ${mediaMode === 'VIDEO' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Video size={14} />
                </button>
            </div>
          )}

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
              {/* 🚨 [Fix] VIDEO 모드 시 상단 Insight 카드 노출로 공간 활용 */}
              {mediaMode === 'VIDEO' ? (
                <div className="space-y-4 mb-6">
                    <div className="p-5 bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-[1.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:rotate-12 transition-transform">
                            <Video size={40} />
                        </div>
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-tighter mb-2 block">AI Curation Video</span>
                        <h3 className="text-white font-bold text-lg mb-2 leading-tight">이 영상의 핵심 포인트</h3>
                        <p className="text-gray-400 text-sm font-light leading-relaxed">
                            {location.name}의 활기찬 분위기와 현지인들이 사랑하는 숨은 명소들을 4K 고화질 영상으로 확인해보세요.
                        </p>
                    </div>
                    {/* Quick Action Buttons for Space Efficiency */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setIsChatMode(true)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex flex-col gap-2 items-center text-center group">
                            <Zap size={20} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] text-gray-300 font-medium">영상 속 맛집 찾기</span>
                        </button>
                        <button onClick={() => setIsChatMode(true)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex flex-col gap-2 items-center text-center group">
                            <MessageSquare size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] text-gray-300 font-medium">AI에게 일정 묻기</span>
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
                <MessageSquare size={16} /> AI 대화 시작하기
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default PlaceChatPanel;