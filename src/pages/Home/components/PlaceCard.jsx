// src/pages/Home/components/PlaceCard.jsx
// 🚨 [Fix] 상태 동기화 추가: 확대/축소 상태를 부모(Home)에게 실시간 보고

import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Ticket, Globe, Sparkles, Maximize2, 
  ArrowLeft, List, Camera, Heart, Calendar 
} from 'lucide-react';
import { TRAVEL_SPOTS } from '../data/travelSpots';

import { usePlaceChat } from '../hooks/usePlaceChat';
import { usePlaceGallery } from '../hooks/usePlaceGallery';
import PlaceChatView from './PlaceChatView';
import PlaceGalleryView from './PlaceGalleryView';
import { getSystemPrompt, PERSONA_TYPES } from '../lib/prompts';

// 🚨 [Fix] onExpandChange Props 추가
const PlaceCard = ({ location, onClose, onTicket, isCompactMode, onExpandChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Detail Mode States
  const [isChatMode, setIsChatMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);

  const { chatHistory, isAiLoading, sendMessage, clearChat } = usePlaceChat();
  const { images, isImgLoading, selectedImg, setSelectedImg } = usePlaceGallery(location?.name);

  // Init
  useEffect(() => {
    if (!location) return;
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  // Reset when closed or location changed
  useEffect(() => {
    if(!isExpanded) {
      setIsChatMode(false);
      setIsFullScreen(false);
      clearChat();
    }
  }, [isExpanded, location, clearChat]);

  // 🚨 [New] 상태 동기화: 내부의 isExpanded 상태가 변할 때마다 부모에게 보고
  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  // Fullscreen Handlers
  const toggleFullScreen = (elementRef) => {
    if (!document.fullscreenElement && elementRef.current) {
      elementRef.current.requestFullscreen();
      setIsFullScreen(true);
      setShowUI(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const handleSendMessage = (text) => {
     const persona = PERSONA_TYPES.INSPIRER;
     const systemPrompt = getSystemPrompt(persona, location.name);
     sendMessage(text, systemPrompt);
  };

  if (!location) return null;

  // --- [Mode 1] 상세 보기 (Deep Dive) ---
  if (isExpanded) {
    const matchedSpot = TRAVEL_SPOTS.find(s => s.name === location?.name);
    
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex p-6 gap-6 animate-fade-in overflow-hidden font-sans">
        
        {/* Global Back Button */}
        <div className={`absolute top-8 left-8 z-[110] transition-opacity ${isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button onClick={() => setIsExpanded(false)} className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full text-blue-300 hover:text-white hover:border-blue-500/50 transition-all text-xs font-bold backdrop-blur-md">
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* 1. Left Panel (Chat & Info) */}
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
                  {selectedImg ? 'AI FOCUS' : location.name.toUpperCase()}
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
                  chatHistory={chatHistory}
                  isAiLoading={isAiLoading}
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

        {/* 2. Right Panel (Gallery) */}
        <PlaceGalleryView 
          images={images}
          isImgLoading={isImgLoading}
          selectedImg={selectedImg}
          setSelectedImg={setSelectedImg}
          isFullScreen={isFullScreen}
          toggleFullScreen={toggleFullScreen}
          closeImageKeepFullscreen={(e) => { e.stopPropagation(); setSelectedImg(null); }}
          showUI={showUI}
        />
      </div>
    );
  }

  // --- [Mode 2] Compact Mode (Ticker Style) ---
  if (isCompactMode) {
    return (
      <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in transition-all duration-300 pointer-events-none">
         <div className="pointer-events-auto bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
               <Globe size={14} className="text-blue-400" />
               <span className="text-sm font-bold text-white">{location.name}</span>
            </div>
            <button onClick={onClose} className="p-1 hover:text-white text-gray-500"><X size={12}/></button>
         </div>
      </div>
    );
  }

  // --- [Mode 3] Card Mode (Default) ---
  return (
    <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in-up transition-all duration-300">
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 relative group">
        <div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-blue-400 transition-all cursor-pointer"
          onClick={() => setIsExpanded(true)}
        ></div>
        <div className="flex items-start justify-between mb-4">
           <div className="flex flex-col cursor-pointer" onClick={() => setIsExpanded(true)}>
             <div className="flex items-center gap-1.5 mb-1">
               <Sparkles size={12} className="text-yellow-400" />
               <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">{location.country || "Global"}</span>
             </div>
             <h2 className="text-2xl font-bold text-white leading-none tracking-tight flex items-center gap-2 group-hover:text-blue-200 transition-colors">
               {location.name}
               <Maximize2 size={14} className="text-gray-500 group-hover:text-white transition-colors" />
             </h2>
           </div>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors -mr-2 -mt-2"><X size={18} /></button>
        </div>

        <div className="min-h-[100px] mb-6 cursor-pointer" onClick={() => setIsExpanded(true)}> 
          {isLoading ? (
            <div className="w-full animate-pulse space-y-3 mt-1"><div className="h-4 bg-white/10 rounded w-1/3"></div><div className="space-y-2"><div className="h-3 bg-white/10 rounded w-full"></div><div className="h-3 bg-white/10 rounded w-5/6"></div></div></div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
              <p className="text-xs text-gray-300 leading-relaxed font-light line-clamp-3">{location.name}의 숨겨진 매력을 발견하세요. 카드를 클릭하면 고화질 갤러리와 AI 가이드가 시작됩니다.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
           <button onClick={() => { setIsExpanded(true); setIsChatMode(true); }} className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
             <MessageSquare size={16} className="text-blue-400" />
             <span className="text-xs font-bold text-gray-200">AI 묻기</span>
           </button>
           <button onClick={onTicket} className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-blue-500/20 hover:scale-[1.05] transition-all">
             <Ticket size={16} className="text-white" />
             <span className="text-xs font-bold text-white">여행 계획</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;