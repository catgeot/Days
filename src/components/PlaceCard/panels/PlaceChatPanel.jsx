import React, { useState, useRef, useEffect } from 'react'; // 🚨 [Fix] Hooks 추가
import { Sparkles, ArrowLeft, Send, Image as ImageIcon, Play, X } from 'lucide-react';
import PlaceChatView from '../views/PlaceChatView';
import VideoInfoView from '../views/VideoInfoView';
import GalleryInfoView from '../views/GalleryInfoView';
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
  const scrollRef = useRef(null); // 🚨 [Fix] 스크롤 컨테이너 제어용 Ref

  // 🚨 [Fix] 콘텐츠(제목/모드)가 변경되면 스크롤을 최상단으로 초기화
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
  }, [activeInfo.title, activeInfo.mode, isChatMode]); 

  const handleSendMessage = (text) => {
      const persona = PERSONA_TYPES.INSPIRER;
      const systemPrompt = getSystemPrompt(persona, location.name);
      chatData.sendMessage(text, systemPrompt);
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
      {/* 🚨 [Fix] ref 연결하여 스크롤 제어 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto relative custom-scrollbar"
      >
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
                {activeInfo.mode === 'VIDEO' ? (
                    <VideoInfoView 
                        videoData={activeInfo} 
                        onSeekTime={onSeekTime}
                    />
                ) : (
                    <GalleryInfoView 
                        infoData={activeInfo} 
                    />
                )}
            </div>
        )}
      </div>

      {/* Footer (Input Trigger) */}
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