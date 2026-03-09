// src/components/PlaceCard/panels/PlaceChatPanel.jsx
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] useReport 전역 상태 의존성 완전 제거.
// 2. [Routing] Log 버튼을 <button>에서 <Link to="/report">로 전면 교체하여 딥링킹 통합.
// 3. [Safe Path] 기존 openReport로 전달하던 location.id는 Router의 state={{ placeId: location.id }}로 안전하게 이관.
// 4. [New] 꼬꼬무 추천 장소 클릭 시 안전하게 이동하기 위한 handleRelatedClick 라우팅 어댑터 로직 추가.

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, ArrowLeft, Send, Image as ImageIcon, Play, X, PenTool, BookOpen } from 'lucide-react'; 
import { Link, useNavigate } from 'react-router-dom'; // 🚨 [Fix] useNavigate 훅 추가
import PlaceChatView from '../views/PlaceChatView';
import VideoInfoView from '../views/VideoInfoView';
import GalleryInfoView from '../views/GalleryInfoView';
import PlaceWikiNavView from '../views/PlaceWikiNavView'; 
import { getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts';
import BookmarkButton from '../common/BookmarkButton';
import { getRelatedPlaces } from '../../../pages/Home/hooks/useSearchEngine'; // 🚨 [New] 꼬꼬무 연관 장소 로직 가져오기

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
  const navigate = useNavigate(); // 🚨 [New] 라우팅 객체 초기화

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

  // 🚨 [New] 꼬꼬무 장소 클릭 시 안전한 라우팅을 위한 분기 처리기 (Pessimistic Adapter)
  const handleRelatedClick = (targetPlace) => {
      if (!targetPlace) return;

      // 1. travelSpots 출신: 고유 ID가 존재하는 경우
      if (targetPlace.id) {
          navigate(`/place/${targetPlace.id}`);
          return;
      }
      
      // 2. citiesData 출신: ID는 없지만 위경도가 존재하는 경우 (city-lat-lng 포맷 활용)
      if (targetPlace.lat && targetPlace.lng) {
          navigate(`/place/city-${targetPlace.lat}-${targetPlace.lng}`);
          return;
      }

      // 3. 최악의 경우 (데이터 누락): 이동하지 않고 에러 방어
      console.warn("[Safe Path] 라우팅을 위한 식별자(ID 또는 좌표)가 없습니다.", targetPlace);
  };

  const relatedPlaces = getRelatedPlaces(location); // 🚨 [New] 꼬꼬무 연관 장소 데이터

  return (
    <div className={`flex flex-col transition-all duration-500
        ${isFullScreen ? 'opacity-0 md:translate-x-[-100%]' : 'opacity-100 translate-x-0'} 
        absolute top-0 left-0 w-full z-[150] h-auto bg-[#05070a]/90 backdrop-blur-md border-b border-white/10 pb-2 md:pb-0 md:border-none md:rounded-none
        md:relative md:w-[35%] md:h-full md:backdrop-blur-xl md:border md:border-white/10 md:rounded-[2rem] md:shadow-2xl md:overflow-hidden md:bg-[#05070a]/80 md:z-auto`}> 
      
      {/* Header */}
      <div className={`shrink-0 px-3 md:px-3 md:border-b md:border-white/5 bg-transparent z-20 py-3 2xl:py-0 2xl:h-20 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3 2xl:gap-4 ${mediaMode === 'GALLERY' && selectedImg ? 'hidden md:flex' : 'flex'}`}>
         {/* Top Tier: Home, Location Info */}
         <div className="flex items-center gap-3 md:gap-2 overflow-hidden w-full 2xl:w-auto 2xl:flex-1 min-w-0">
             <button onClick={onClose} className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded-full bg-white/10 md:bg-white/5 text-white md:text-gray-400 hover:bg-white/20 transition-all shrink-0 shadow-lg">
                 <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" />
             </button>
             <div className="flex flex-col flex-1 min-w-0 justify-center">
                 <span className="text-[9px] md:text-[10px] text-blue-300 font-bold tracking-widest uppercase truncate drop-shadow-md">{location.country}</span>
                 <div className="flex items-center gap-2 min-w-0">
                     <h1 className="text-base md:text-base font-black tracking-tighter text-white truncate leading-none drop-shadow-md">{location.name}</h1>
                     <div className="shrink-0">
                         <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />
                     </div>
                 </div>
             </div>
         </div>

         {/* Bottom Tier: Buttons Area */}
         <div className="shrink-0 flex items-center gap-2 md:gap-1.5 w-full 2xl:w-auto overflow-x-auto no-scrollbar">
            <Link 
                to="/report"
                state={{ placeId: location.id }} 
                className="px-2.5 py-1.5 md:px-4 md:py-2 rounded-full bg-white/10 md:bg-white/5 hover:bg-white/20 text-white shadow-lg border border-white/20 md:border-white/10 transition-all flex items-center gap-1.5 md:gap-2 group shrink-0"
            >
                <PenTool className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 text-emerald-400 group-hover:scale-110 transition-transform"/> 
                <span className="text-[11px] font-bold tracking-wider">Log</span>
            </Link>

            <button 
                onClick={() => setMediaMode(mediaMode === 'WIKI' ? 'GALLERY' : 'WIKI')}
                className={`px-2.5 py-1.5 md:px-4 md:py-2 rounded-full transition-all flex items-center gap-1.5 md:gap-2 group shadow-lg shrink-0
                    ${mediaMode === 'WIKI' ? 'bg-amber-600/90 text-white shadow-amber-900/20' : 'bg-white/10 md:bg-white/5 hover:bg-white/20 text-white border border-white/20 md:border-white/10'}`}
            >
                <BookOpen className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 group-hover:scale-110 transition-transform"/> 
                <span className="text-[11px] font-bold">{mediaMode === 'WIKI' ? '닫기' : '백과'}</span>
            </button>

            {mediaMode === 'VIDEO' ? (
                <button 
                    onClick={() => setMediaMode('GALLERY')}
                    className="px-2.5 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all flex items-center gap-1.5 md:gap-2 group shrink-0"
                >
                    <ImageIcon className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 group-hover:scale-110 transition-transform"/> 
                    <span className="text-[11px] font-bold">갤러리</span>
                </button>
            ) : (
                <button 
                    onClick={() => setMediaMode('VIDEO')}
                    className="px-2.5 py-1.5 md:px-4 md:py-2 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all flex items-center gap-1.5 md:gap-2 group shrink-0"
                >
                    <Play fill="currentColor" className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 group-hover:scale-110 transition-transform"/> 
                    <span className="text-[11px] font-bold">영상</span>
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
                placeName={location.name} 
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
                        onRelatedClick={handleRelatedClick} // 🚨 [Fix] 이벤트를 하위 컴포넌트로 주입 완료
                    />
                )}
            </div>
        )}
      </div>

      {/* Footer */}
      {!isChatMode && mediaMode !== 'WIKI' && (
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

      {/* 🚨 [New] 모바일 전용 꼬꼬무 연관 여행지 푸터 */}
      {relatedPlaces.length > 0 && !isChatMode && mediaMode === 'GALLERY' && !selectedImg && !isFullScreen && createPortal(
          <div className="md:hidden fixed bottom-0 left-0 w-full z-[160] bg-[#05070a]/90 backdrop-blur-xl border-t border-white/10 p-3 pb-8 animate-fade-in-up shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              <style>{`
                  .no-scrollbar::-webkit-scrollbar { display: none; }
                  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pl-3 pr-4">
                  {relatedPlaces.map((place, idx) => (
                      <button 
                          key={`mob-rel-${idx}`}
                          onClick={() => handleRelatedClick(place.data)}
                          className={`shrink-0 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all active:scale-95 flex items-center gap-1.5 shadow-sm
                              ${place.isBridge 
                                ? 'bg-fuchsia-900/20 border-fuchsia-500/30 text-fuchsia-200 hover:bg-fuchsia-800/40 hover:border-fuchsia-400/50' 
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
                      >
                          {place.isBridge && <Sparkles size={10} className="text-fuchsia-400" />}
                          {place.data.name}
                      </button>
                  ))}
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default PlaceChatPanel;