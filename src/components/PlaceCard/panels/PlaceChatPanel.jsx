// src/components/PlaceCard/PlaceChatPanel.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, List, Camera, Heart, Calendar, MessageSquare } from 'lucide-react';
import PlaceChatView from '../views/PlaceChatView'; // 🚨 기존 컴포넌트 재사용
import { getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts';

const PlaceChatPanel = ({ location, chatData, selectedImg, setSelectedImg, isFullScreen }) => {
  const [isChatMode, setIsChatMode] = useState(false);

  // Reset chat mode when image is selected
  useEffect(() => {
    if (selectedImg) setIsChatMode(false);
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
           // [Case A] Image Info
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
           // [Case B] Chat View
           <PlaceChatView 
             chatHistory={chatData.chatHistory}
             isAiLoading={chatData.isAiLoading}
             onSendMessage={handleSendMessage}
             locationName={location.name}
           />
        ) : (
           // [Case C] Default Info
           <div className="animate-fade-in space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                <p className="text-gray-300 text-sm leading-relaxed font-light">
                  {location.country}의 보석, <span className="text-blue-300 font-medium">{location.name}</span>.<br/>
                  이곳의 숨겨진 매력을 발견하고 AI와 함께 완벽한 여행을 계획해보세요.
                </p>
              </div>
              <button 
                onClick={() => setIsChatMode(true)}
                className="w-full py-4 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-300 text-sm font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} /> AI에게 여행 정보 물어보기
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default PlaceChatPanel;