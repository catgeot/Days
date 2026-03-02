// src/components/PlaceCard/panels/PlaceChatPanel.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fix] isWikiLoading Props를 추가 수신하여 PlaceWikiNavView에 전달 유지
// 2. [Fix] 로드맵 Phase 2 적용: 모바일 헤더 영역의 간격(gap)과 패딩(padding)을 압축하여 여행지명 노출 폭 최대화 (Subtraction over Addition).
// 3. [Fix] 타이틀(h1)에 중복 적용되어 있던 tracking 클래스 정리 및 시인성(font-black) 강화.

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowLeft, Send, Image as ImageIcon, Play, X, PenTool, BookOpen } from 'lucide-react'; 
import PlaceChatView from '../views/PlaceChatView';
import VideoInfoView from '../views/VideoInfoView';
import GalleryInfoView from '../views/GalleryInfoView';
import PlaceWikiNavView from '../views/PlaceWikiNavView'; 
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
    onToggleBookmark,
    wikiData,
    isWikiLoading 
}) => {
  const [isChatMode, setIsChatMode] = useState(false);
  const scrollRef = useRef(null);
  const { openReport } = useReport();

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
  }, [activeInfo.title, activeInfo.mode, isChatMode, mediaMode]); 

  const handleSendMessage = (text) => {
      const persona = PERSONA_TYPES.INSPIRER;
      const systemPrompt = getSystemPrompt(persona, location.name);
      chatData.sendMessage(text, systemPrompt);
  };

  const handleWikiNavClick = (sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  return (
    <div className={`flex flex-col transition-all duration-500
        ${isFullScreen ? 'opacity-0 md:translate-x-[-100%]' : 'opacity-100 translate-x-0'} 
        absolute top-0 left-0 w-full z-[150] h-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-4 border-none rounded-none
        md:relative md:w-[35%] md:h-full md:backdrop-blur-xl md:border md:border-white/10 md:rounded-[2rem] md:shadow-2xl md:overflow-hidden md:bg-[#05070a]/80 md:pb-0 md:z-auto`}> 
      
      {/* Header */}
      {/* 🚨 [Fix] px-2.5 -> px-2, gap-3 -> gap-2 로 모바일 공간 최적화 */}
      <div className={`h-16 md:h-20 shrink-0 items-center justify-between px-2 md:px-3 md:border-b md:border-white/5 bg-transparent z-20 mt-2 md:mt-0 gap-2 md:gap-4 ${mediaMode === 'GALLERY' && selectedImg ? 'hidden md:flex' : 'flex'}`}>
         
         <div className="flex items-center gap-2 md:gap-4 overflow-hidden flex-1 min-w-0">
             <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 md:bg-white/5 text-white md:text-gray-400 hover:bg-white/20 transition-all shrink-0 shadow-lg">
                 <ArrowLeft size={16} />
             </button>
             <div className="flex flex-col flex-1 min-w-0">
                 <span className="text-[9px] md:text-[10px] text-blue-300 font-bold tracking-widest uppercase truncate drop-shadow-md">{location.country}</span>
                 <div className="flex items-center gap-2 min-w-0">
                     {/* 🚨 [Fix] 중복된 tracking-tight 제거, tracking-tighter만 남겨 시인성 확보 */}
                     <h1 className="text-base md:text-xl font-black tracking-tighter text-white truncate leading-none drop-shadow-md">{location.name}</h1>
                     <div className="shrink-0">
                         <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />
                     </div>
                 </div>
             </div>
         </div>

         {/* Buttons Area */}
         {/* 🚨 [Fix] 버튼 gap 압축 및 모바일 px, py 최소화 */}
         <div className="shrink-0 flex items-center gap-1 md:gap-1.5">
            <button 
                onClick={() => openReport('dashboard', location.id)}
                className="px-1.5 py-1 md:px-4 md:py-2 rounded-full bg-white/10 md:bg-white/5 hover:bg-white/20 text-white shadow-lg border border-white/20 md:border-white/10 transition-all flex items-center gap-1 md:gap-2 group"
            >
                <PenTool size={12} className="md:w-3.5 md:h-3.5 text-emerald-400 group-hover:scale-110 transition-transform"/> 
                <span className="hidden md:inline text-[11px] font-bold tracking-wider">Log</span>
            </button>

            <button 
                onClick={() => setMediaMode(mediaMode === 'WIKI' ? 'GALLERY' : 'WIKI')}
                className={`px-1.5 py-1 md:px-4 md:py-2 rounded-full transition-all flex items-center gap-1 md:gap-2 group shadow-lg 
                    ${mediaMode === 'WIKI' ? 'bg-amber-600/90 text-white shadow-amber-900/20' : 'bg-white/10 md:bg-white/5 hover:bg-white/20 text-white border border-white/20 md:border-white/10'}`}
            >
                <BookOpen size={12} className="md:w-3.5 md:h-3.5 group-hover:scale-110 transition-transform"/> 
                <span className="hidden md:inline text-[11px] font-bold">{mediaMode === 'WIKI' ? '닫기' : '백과'}</span>
                <span className="inline md:hidden text-[10px] font-bold">백과</span>
            </button>

            {mediaMode === 'VIDEO' ? (
                <button 
                    onClick={() => setMediaMode('GALLERY')}
                    className="px-1.5 py-1 md:px-4 md:py-2 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all flex items-center gap-1 md:gap-2 group"
                >
                    <ImageIcon size={12} className="md:w-3.5 md:h-3.5 group-hover:scale-110 transition-transform"/> 
                    <span className="hidden md:inline text-[11px] font-bold">갤러리</span>
                </button>
            ) : (
                <button 
                    onClick={() => setMediaMode('VIDEO')}
                    className="px-1.5 py-1 md:px-4 md:py-2 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all flex items-center gap-1 md:gap-2 group"
                >
                    <Play size={12} fill="currentColor" className="md:w-3.5 md:h-3.5 group-hover:scale-110 transition-transform"/> 
                    <span className="hidden md:inline text-[11px] font-bold">영상</span>
                </button>
            )}
         </div>
      </div>

      {/* Body */}
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
        ) : mediaMode === 'WIKI' ? ( 
            <PlaceWikiNavView 
                wikiData={wikiData} 
                isWikiLoading={isWikiLoading} 
                onNavClick={handleWikiNavClick} 
            />
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

      {/* Footer */}
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