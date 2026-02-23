// src/components/PlaceCard/panels/PlaceChatPanel.jsx
// 🚨 [Fix] 상위에서 전달된 onToggleBookmark Props를 수신하도록 매개변수 추가 (ReferenceError 해결)
// 🚨 [Fix] LogBook 버튼 클릭 시 'write'(작성)가 아닌 'dashboard'(메인) 페이지로 연결되도록 파라미터 수정
// 🚨 [Fix] 모바일 대응 (Shape-Shifting): 모바일에서는 absolute 속성을 가진 얇은 투명 Top-Bar로 변신. Body와 Footer는 모바일에서 숨김 처리 (뺄셈의 미학)

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowLeft, Send, Image as ImageIcon, Play, X, PenTool } from 'lucide-react';
import PlaceChatView from '../views/PlaceChatView';
import VideoInfoView from '../views/VideoInfoView';
import GalleryInfoView from '../views/GalleryInfoView';
import { getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts';
import BookmarkButton from '../common/BookmarkButton';
import { useReport } from '../../../context/ReportContext';

const PlaceChatPanel = ({ 
    location,
    isBookmarked, 
    onClose, 
    chatData, 
    activeInfo, 
    isFullScreen, 
    mediaMode, 
    setMediaMode, 
    onSeekTime,
    isAiMode,
    selectedImg,
    onToggleBookmark 
}) => {
  const [isChatMode, setIsChatMode] = useState(false);
  const scrollRef = useRef(null);
  const { openReport } = useReport();

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
    // 🚨 [Fix] 모바일: absolute로 상단 덮어쓰기 & 배경 투명 그라데이션 / 데스크탑: 기존 w-[35%]의 solid 패널 유지
    <div className={`flex flex-col transition-all duration-500
        ${isFullScreen ? 'opacity-0 md:translate-x-[-100%]' : 'opacity-100 translate-x-0'} 
        absolute top-0 left-0 w-full z-[150] h-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-4 border-none rounded-none
        md:relative md:w-[35%] md:h-full md:backdrop-blur-xl md:border md:border-white/10 md:rounded-[2rem] md:shadow-2xl md:overflow-hidden md:bg-[#05070a]/80 md:pb-0 md:z-auto`}> 
      
      {/* Header */}
      {/* 🚨 [Fix] 모바일: 간격 최적화(h-16, mt-2) / 데스크탑: 기존 h-20 유지 */}
      <div className="h-16 md:h-20 shrink-0 flex items-center justify-between px-4 md:px-6 md:border-b md:border-white/5 bg-transparent z-20 mt-2 md:mt-0">
         <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
             <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 md:bg-white/5 text-white md:text-gray-400 hover:bg-white/20 transition-all shrink-0 shadow-lg">
                 <ArrowLeft size={16} />
             </button>
             <div className="flex flex-col min-w-0">
                 <span className="text-[9px] md:text-[10px] text-blue-300 font-bold tracking-widest uppercase truncate drop-shadow-md">{location.country}</span>
                 <div className="flex items-center gap-2">
                     <h1 className="text-lg md:text-xl font-bold text-white truncate leading-none tracking-tight drop-shadow-md">{location.name}</h1>
                     <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />
                 </div>
             </div>
         </div>

         <div className="shrink-0 flex items-center gap-2">
            <button 
                onClick={() => openReport('dashboard', location.id)}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 md:bg-white/5 hover:bg-white/20 text-white shadow-lg border border-white/20 md:border-white/10 transition-all flex items-center gap-1.5 md:gap-2 group"
            >
                <PenTool size={12} className="md:w-3.5 md:h-3.5 text-emerald-400 group-hover:scale-110 transition-transform"/> 
                <span className="text-[10px] md:text-[11px] font-bold tracking-wider">LogBook</span>
            </button>

            {mediaMode === 'VIDEO' ? (
                <button 
                    onClick={() => setMediaMode('GALLERY')}
                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all flex items-center gap-1.5 md:gap-2 group"
                >
                    <ImageIcon size={12} className="md:w-3.5 md:h-3.5 group-hover:scale-110 transition-transform"/> 
                    <span className="hidden md:inline text-[11px] font-bold">갤러리 보기</span>
                    <span className="inline md:hidden text-[10px] font-bold">갤러리</span>
                </button>
            ) : (
                <button 
                    onClick={() => setMediaMode('VIDEO')}
                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all flex items-center gap-1.5 md:gap-2 group"
                >
                    <Play size={12} fill="currentColor" className="md:w-3.5 md:h-3.5 group-hover:scale-110 transition-transform"/> 
                    <span className="hidden md:inline text-[11px] font-bold">영상 보기</span>
                    <span className="inline md:hidden text-[10px] font-bold">영상</span>
                </button>
            )}
         </div>
      </div>

      {/* Body: Chat & Info (🚨 모바일 숨김 처리: hidden md:flex) */}
      <div 
        ref={scrollRef}
        className="hidden md:flex flex-col flex-1 overflow-y-auto relative custom-scrollbar"
      >
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>

        {isChatMode ? (
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
            <div className="animate-fade-in flex flex-col gap-6 p-8">
                {activeInfo.mode === 'VIDEO' ? (
                    <VideoInfoView 
                        videoData={activeInfo} 
                        onSeekTime={onSeekTime}
                    />
                ) : (
                    <GalleryInfoView 
                        selectedPlace={location}
                        selectedImg={selectedImg}
                        isAiMode={isAiMode}      
                    />
                )}
            </div>
        )}
      </div>

      {/* Footer (Input Trigger) (🚨 모바일 숨김 처리: hidden md:block) */}
      {!isChatMode && (
          <div className="hidden md:block p-6 pt-4 bg-gradient-to-t from-[#05070a] via-[#05070a] to-transparent shrink-0 z-20">
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