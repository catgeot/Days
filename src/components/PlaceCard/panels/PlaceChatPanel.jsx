import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, ArrowLeft, Send, Image as ImageIcon, Play, X, PenTool, BookOpen, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PlaceChatView from '../views/PlaceChatView';
import VideoInfoView from '../views/VideoInfoView';
import GalleryInfoView from '../views/GalleryInfoView';
import PlaceWikiNavView from '../views/PlaceWikiNavView';
import { getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts';
import BookmarkButton from '../common/BookmarkButton';
import { getRelatedPlaces } from '../../../pages/Home/hooks/useSearchEngine';

const PlaceChatPanel = React.memo(({
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
  const navigate = useNavigate();

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

  const handleRelatedClick = (targetPlace) => {
      if (!targetPlace) return;

      if (targetPlace.slug) {
          navigate(`/place/${targetPlace.slug}`);
          return;
      }

      if (targetPlace.id) {
          navigate(`/place/${targetPlace.id}`);
          return;
      }

      if (targetPlace.lat !== undefined && targetPlace.lng !== undefined) {
          navigate(`/place/city-${targetPlace.lat}-${targetPlace.lng}`);
          return;
      }

      console.warn("[Safe Path] 라우팅을 위한 식별자(slug, ID 또는 좌표)가 없습니다.", targetPlace);
  };

  const relatedPlaces = getRelatedPlaces(location);

  return (
    <div className={`flex flex-col transition-all duration-500
        ${isFullScreen ? 'opacity-0 md:translate-x-[-100%]' : 'opacity-100 translate-x-0'}
        absolute top-0 left-0 w-full z-[150] h-auto bg-[#05070a]/90 backdrop-blur-md border-b border-white/10 pb-1.5 md:pb-0 md:border-none md:rounded-none
        md:relative md:w-[35%] md:h-full md:backdrop-blur-xl md:border md:border-white/10 md:rounded-[2rem] md:shadow-2xl md:overflow-hidden md:bg-[#05070a]/80 md:z-auto`}>

      {/* Header */}
      <div className={`shrink-0 px-3 md:border-b md:border-white/5 bg-transparent z-20 py-2 md:py-3 flex flex-col items-stretch justify-between gap-2 md:gap-3 ${mediaMode === 'GALLERY' && selectedImg ? 'hidden md:flex' : 'flex'}`}>
         {/* Row 1: Home, Location Info, Bookmark, Toolkit (Killer Tab) */}
         <div className="flex items-center gap-2.5 overflow-hidden w-full min-w-0">
             <button onClick={onClose} className="flex items-center justify-center w-8 h-8 md:w-8 md:h-8 rounded-full bg-white/10 md:bg-white/5 text-white md:text-gray-400 hover:bg-white/20 transition-all shrink-0 shadow-lg">
                 <ArrowLeft className="w-4 h-4 md:w-4 md:h-4" />
             </button>
             <div className="flex flex-col flex-1 min-w-0 justify-center">
                 <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase truncate drop-shadow-md">{location?.country || "Global"}</span>
                 <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                     <h1 className="text-base font-black tracking-tighter text-white truncate leading-none drop-shadow-md">{location.name}</h1>
                     <div className="shrink-0 -mt-0.5">
                         <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />
                     </div>
                 </div>
             </div>
             <div className="shrink-0 flex items-center gap-2">
                 {mediaMode === 'PLANNER' ? (
                    <button
                        onClick={() => setMediaMode('GALLERY')}
                        className="px-2.5 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all flex items-center gap-1.5 group shrink-0"
                    >
                        <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform"/>
                        <span className="text-xs font-bold">갤러리 복귀</span>
                    </button>
                 ) : (
                    <button
                        onClick={() => setMediaMode('PLANNER')}
                        className="px-2.5 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white shadow-lg shadow-blue-900/30 transition-all flex items-center gap-1.5 group border border-blue-400/30 shrink-0"
                    >
                        <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform"/>
                        <span className="text-xs font-bold whitespace-nowrap">여행 플래너</span>
                    </button>
                 )}
             </div>
         </div>

         {/* Row 2: Other Tabs Area (Wiki, Video, Review) */}
         <div className={`shrink-0 items-center justify-center md:justify-end gap-2 w-full overflow-x-auto no-scrollbar pb-0.5 px-2 md:px-0 overscroll-contain touch-pan-x ${mediaMode === 'REVIEWS' ? 'hidden md:flex' : 'flex'}`}>
            <button
                onClick={() => setMediaMode(mediaMode === 'WIKI' ? 'GALLERY' : 'WIKI')}
                className={`px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 group shrink-0 active:scale-95 ${mediaMode === 'WIKI' ? 'bg-blue-600/90 text-white font-bold border border-blue-500/50 shadow-lg shadow-blue-900/20' : 'bg-white/[0.06] hover:bg-white/[0.18] text-gray-300 hover:text-white border border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`}
            >
                {mediaMode === 'WIKI' ? <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform"/> : <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform"/>}
                <span className="text-xs font-bold whitespace-nowrap">{mediaMode === 'WIKI' ? '갤러리 복귀' : '여행 위키'}</span>
            </button>
            <button
                onClick={() => setMediaMode(mediaMode === 'VIDEO' ? 'GALLERY' : 'VIDEO')}
                className={`px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 group shrink-0 active:scale-95 ${mediaMode === 'VIDEO' ? 'bg-blue-600/90 text-white font-bold border border-blue-500/50 shadow-lg shadow-blue-900/20' : 'bg-white/[0.06] hover:bg-white/[0.18] text-gray-300 hover:text-white border border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`}
            >
                {mediaMode === 'VIDEO' ? <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform"/> : <Play fill="currentColor" className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform"/>}
                <span className="text-xs font-bold whitespace-nowrap">{mediaMode === 'VIDEO' ? '갤러리 복귀' : '유튜브 영상'}</span>
            </button>
            <button
                onClick={() => setMediaMode(mediaMode === 'REVIEWS' ? 'GALLERY' : 'REVIEWS')}
                className={`px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 group shrink-0 active:scale-95 ${mediaMode === 'REVIEWS' ? 'bg-blue-600/90 text-white font-bold border border-blue-500/50 shadow-lg shadow-blue-900/20' : 'bg-white/[0.06] hover:bg-white/[0.18] text-gray-300 hover:text-white border border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`}
            >
                {mediaMode === 'REVIEWS' ? <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform"/> : <PenTool className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform"/>}
                <span className="text-xs font-bold whitespace-nowrap">{mediaMode === 'REVIEWS' ? '갤러리 복귀' : '리뷰'}</span>
            </button>
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
                        <span className="text-blue-400"><Sparkles size={14} /></span> AI Assistant
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
            <div className="animate-fade-in flex flex-col gap-6 p-6">
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
                        onRelatedClick={handleRelatedClick}
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
                  <span className="text-sm text-gray-400 group-hover:text-gray-200 font-medium truncate">AI에게 장소 묻기</span>
                  <div className="ml-auto mr-2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Send size={12} />
                  </div>
              </button>
          </div>
      )}

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
});

export default PlaceChatPanel;
