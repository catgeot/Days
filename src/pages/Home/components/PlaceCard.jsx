import React, { useState, useEffect, useRef } from 'react';
import { 
  X, MessageSquare, Play, Maximize2, Send, ArrowLeft, ChevronLeft, ChevronRight,
  Sparkles, Minimize2, Image as ImageIcon, Camera, Calendar, Heart, List, Ticket, Globe,
  Loader2, Bot, User // 🚨 [Add] 로딩 및 채팅용 아이콘 추가
} from 'lucide-react';
import { TRAVEL_SPOTS } from '../data/travelSpots';
// 🚨 [Brain Transplant] 프롬프트 엔진 임포트 (Brain 연결)
import { getSystemPrompt, PERSONA_TYPES } from '../lib/prompts';

// --- [Helper] 아이콘 렌더링 헬퍼 ---
const ExpandWrapper = ({isFullScreen}) => (isFullScreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>);

// --- [Sub Component] 상세 보기 모드 (Deep Dive) ---
const PlaceDetail = ({ location, onClose }) => {
  const [isChatting, setIsChatting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null); 
  const [images, setImages] = useState([]);
  const [isImgLoading, setIsImgLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  
  // 🚨 [Brain Transplant] 로컬 AI 대화 상태 관리 (모달 의존성 제거)
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]); // { role: 'user' | 'model', text: string }
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // API Key 가져오기
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const fullScreenContainerRef = useRef(null);
  const currentIndex = images.findIndex(img => img.id === selectedImg?.id);

  // 🚨 [Data] 현재 장소에 매칭되는 Video ID 찾기
  const matchedSpot = TRAVEL_SPOTS.find(s => s.name === location?.name);
  const videoId = matchedSpot?.videoId || "q1R22J2wWk4"; 

  // 1. Data Fetching (Unsplash)
  useEffect(() => {
    const fetchImages = async () => {
      const CACHE_KEY = `${location.name}_images_cache_v1`; 
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      
      if (cachedData) {
        setImages(JSON.parse(cachedData));
        setIsImgLoading(false);
        return;
      }

      try {
        const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
        if (!ACCESS_KEY) return;
        
        const response = await fetch(
          `https://api.unsplash.com/search/photos?page=1&query=${location.name} travel&per_page=30&orientation=landscape`, 
          { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
        );
        const data = await response.json();
        if (data.results) {
          setImages(data.results);
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.results));
        }
      } catch (error) {
        console.error("Failed to fetch images:", error);
      } finally {
        setIsImgLoading(false);
      }
    };
    fetchImages();
    
    // 장소 변경 시 상태 초기화
    setChatHistory([]); 
    setIsChatting(false);
    setSelectedImg(null);
    setChatInput("");
  }, [location.name]);

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isAiLoading]);

  // 2. Navigation Logic
  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) setSelectedImg(images[currentIndex - 1]);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) setSelectedImg(images[currentIndex + 1]);
  };

  const handleImageClick = () => {
    if (isFullScreen) {
      setShowUI(prev => !prev); 
    } else {
      setSelectedImg(null); 
    }
  };

  const resetView = () => {
    setIsChatting(false);
    setSelectedImg(null);
  };

  const toggleFullScreen = (e) => {
    e?.stopPropagation();
    if (!document.fullscreenElement && fullScreenContainerRef.current) {
      fullScreenContainerRef.current.requestFullscreen();
      setIsFullScreen(true);
      setShowUI(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const closeImageKeepFullscreen = (e) => {
    e?.stopPropagation();
    setSelectedImg(null);
  };

  // 🚨 [Brain Transplant] 핵심 이식 로직: 모달 없이 직접 Gemini 호출
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;

    const userText = chatInput;
    setChatInput("");
    setIsChatting(true); // 채팅 뷰로 전환
    
    // 1. 유저 메시지 즉시 표시
    const newHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(newHistory);
    setIsAiLoading(true);

    try {
      // 2. 시스템 프롬프트 생성 (INSPIRER 페르소나)
      const persona = PERSONA_TYPES.INSPIRER;
      const systemInstruction = getSystemPrompt(persona, location.name);

      // 3. Gemini API 호출 (ChatModal 로직 복제)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
                role: "user", 
                parts: [{ text: `${systemInstruction}\n\n사용자 질문: ${userText}` }] 
            }]
          })
        }
      );

      const data = await response.json();
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 정보를 불러오지 못했습니다.";

      // 4. AI 답변 표시
      setChatHistory(prev => [...prev, { role: 'model', text: aiReply }]);

    } catch (error) {
      console.error("AI Fetch Error:", error);
      setChatHistory(prev => [...prev, { role: 'model', text: `오류가 발생했습니다: ${error.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!document.fullscreenElement) resetView();
      }
      if (selectedImg) {
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
      }
      // Chat Enter Key
      if (e.key === 'Enter' && !e.shiftKey && document.activeElement.tagName === 'INPUT') {
          handleSendMessage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImg, currentIndex, chatInput]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex p-6 gap-6 animate-fade-in overflow-hidden font-sans">
      
      {/* 1. Global Home Button */}
      <div className={`absolute top-8 left-8 z-[110] transition-opacity ${isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full text-blue-300 hover:text-white hover:border-blue-500/50 transition-all text-xs font-bold backdrop-blur-md">
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* 2. Left Panel (Chat & Info) */}
      <div className={`w-[35%] h-full backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-500 ${isFullScreen ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'} ${selectedImg ? 'bg-[#020305]/95' : 'bg-[#05070a]/80'}`}>
        
        {/* [Header] */}
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
            
            {(selectedImg || isChatting) && (
               <button onClick={resetView} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all animate-fade-in shrink-0">
                 <List size={14} /> <span>List</span>
               </button>
            )}
          </div>
        </div>

        {/* [Middle] Content Area */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar-blue relative">
          {selectedImg ? (
             // --- Image Info View ---
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
          ) : isChatting ? (
             // --- 🚨 [Brain Transplant] Inline Chat View ---
             <div className="animate-fade-in h-full flex flex-col gap-4">
                {chatHistory.length === 0 && !isAiLoading ? (
                   // Empty State
                   <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0"><Bot size={14} className="text-white" /></div>
                     <div className="bg-white/5 p-4 rounded-2xl text-sm text-gray-200 border border-white/5">
                        <span className="text-blue-300 font-bold">{location.name}</span> 여행 계획을 도와드릴까요? 맛집, 숙소, 액티비티 등 무엇이든 물어보세요.
                     </div>
                   </div>
                ) : (
                  // Message List
                  chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                       {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0"><Bot size={14} className="text-white" /></div>}
                       {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0"><User size={14} className="text-gray-300" /></div>}
                       
                       <div className={`p-4 rounded-2xl text-sm border max-w-[85%] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600/20 border-blue-500/30 text-white' : 'bg-white/5 border-white/5 text-gray-200'}`}>
                         {/* Markdown-like simple rendering */}
                         <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                       </div>
                    </div>
                  ))
                )}
                
                {/* Loading Indicator */}
                {isAiLoading && (
                   <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0 animate-pulse"><Loader2 size={14} className="text-white animate-spin" /></div>
                      <div className="bg-white/5 p-4 rounded-2xl text-sm text-gray-400 border border-white/5 animate-pulse">
                         답변을 생성하고 있습니다...
                      </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
             </div>
          ) : (
             // --- Default Info View ---
             <div className="animate-fade-in space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                  <p className="text-gray-300 text-sm leading-relaxed font-light">
                    {location.country}의 보석, <span className="text-blue-300 font-medium">{location.name}</span>.<br/>
                    이곳의 숨겨진 매력을 발견하고 AI와 함께 완벽한 여행을 계획해보세요.
                  </p>
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trending Now</p>
                {[1, 2].map(v => (
                  <div key={v} className="flex gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0">
                      <img src={`https://img.youtube.com/vi/${videoId}/default.jpg`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-blue-600/40 transition-all"><Play size={12} className="text-white fill-white"/></div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="text-xs font-bold text-gray-200 line-clamp-1">{location.name} Vlog Part {v}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">인기 급상승</p>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </div>

        {/* [Bottom] Chat Input */}
        <div className="p-6 pt-0 mt-auto shrink-0">
          <div className="relative group">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={selectedImg ? "이 사진에 대해 질문하기..." : `${location.name} 맛집 알려줘...`}
              onFocus={() => setIsChatting(true)} 
              disabled={isAiLoading}
              className="w-full bg-black/40 border border-white/10 rounded-full py-4 pl-6 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner disabled:opacity-50" 
            />
            <button 
              onClick={handleSendMessage}
              disabled={isAiLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-cyan-500 transition-all shadow-lg disabled:bg-gray-700"
            >
              {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Right Panel (Fullscreen Container - Unchanged) */}
      <div 
        ref={fullScreenContainerRef} 
        className={`flex-1 h-full bg-[#05070a]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}
      >
        {selectedImg ? (
          <div className="w-full h-full relative animate-fade-in bg-black flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110" style={{ backgroundImage: `url(${selectedImg.urls.regular})` }} />
            <div className="relative w-full h-full flex items-center justify-center" onClick={handleImageClick}>
               <img src={selectedImg.urls.full} className={`max-w-[90%] max-h-[90%] object-contain shadow-2xl rounded-lg transition-transform duration-700 select-none ${isFullScreen ? 'scale-105' : 'scale-100'}`} />
            </div>
            <button onClick={handlePrev} disabled={currentIndex === 0} className={`absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${(!showUI && isFullScreen) || currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <ChevronLeft size={32} />
            </button>
            <button onClick={handleNext} disabled={currentIndex === images.length - 1} className={`absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${(!showUI && isFullScreen) || currentIndex === images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <ChevronRight size={32} />
            </button>
            <div className={`absolute top-8 right-8 flex items-center gap-3 z-[220] transition-opacity ${(!showUI && isFullScreen) ? 'opacity-0' : 'opacity-100'}`} onClick={(e) => e.stopPropagation()}>
              <button onClick={toggleFullScreen} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl" title="Exit Fullscreen">
                {isFullScreen ? <Minimize2 size={20} /> : <ExpandWrapper isFullScreen={isFullScreen}/>}
              </button>
              <button onClick={isFullScreen ? closeImageKeepFullscreen : () => setSelectedImg(null)} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl" title="Close Image">
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar-blue relative">
            <div className="grid grid-cols-4 grid-rows-3 gap-4 min-h-[600px] mb-4">
              <div onClick={() => !isImgLoading && images[0] && setSelectedImg(images[0])} className="col-span-2 row-span-2 bg-white/5 rounded-[2rem] border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all duration-500 group relative overflow-hidden">
                {isImgLoading ? (<div className="w-full h-full animate-pulse flex items-center justify-center"><ImageIcon className="text-white/20" size={48} /></div>) : images[0] ? (<><img src={images[0].urls.regular} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" /><Maximize2 className="absolute top-6 right-6 text-white/80 opacity-0 group-hover:opacity-100 transition-all" size={24}/></>) : null}
              </div>
              {[...Array(7)].map((_, i) => {
                const imgData = images[i + 1]; const gridIndex = i + 2; 
                return (<div key={i} onClick={() => !isImgLoading && imgData && setSelectedImg(imgData)} className={`${gridIndex === 4 ? 'col-span-2' : 'col-span-1'} row-span-1 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all group relative overflow-hidden`}>{imgData ? (<img src={imgData.urls.small} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />) : <div className="w-full h-full animate-pulse bg-white/5" />}</div>);
              })}
            </div>
            {!isImgLoading && images.length > 8 && (
              <div className="grid grid-cols-4 gap-4 animate-fade-in-up">
                {images.slice(8).map((img, i) => (
                  <div key={i + 8} onClick={() => setSelectedImg(img)} className="aspect-square bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all group relative overflow-hidden">
                    <img src={img.urls.small} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                ))}
              </div>
            )}
            {isFullScreen && (
                <div className="absolute top-8 right-8 z-[220]">
                   <button onClick={toggleFullScreen} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                      <Minimize2 size={20} />
                   </button>
                </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-blue::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-blue::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-blue::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.2), transparent); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}} />
    </div>
  );
};

// --- [Main Component] 기존 카드 (Peek) ---
const PlaceCard = ({ location, onClose, onChat, onTicket, isCompactMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!location) return; 
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  if (!location) return null;

  // [Mode 1] 상세 보기 (Deep Dive)
  if (isExpanded) {
    return (
      <PlaceDetail 
        location={location} 
        onClose={() => setIsExpanded(false)} 
        // 🚨 onChat prop은 필요 없지만, 하위 호환성을 위해 남겨둠 (하지만 사용하진 않음)
      />
    );
  }

  // [Mode 2] 컴팩트 모드 (Peek)
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

  // [Mode 3] 기본 카드 (Peek)
  return (
    <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in-up transition-all duration-300">
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 relative group">
        
        {/* 상단 장식 및 확대 힌트 */}
        <div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-blue-400 transition-all cursor-pointer"
          onClick={() => setIsExpanded(true)}
        ></div>

        <div className="flex items-start justify-between mb-4">
           <div className="flex flex-col cursor-pointer" onClick={() => setIsExpanded(true)}>
             <div className="flex items-center gap-1.5 mb-1">
               <Sparkles size={12} className="text-yellow-400" />
               <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">
                 {location.country || "Global"}
               </span>
             </div>
             <h2 className="text-2xl font-bold text-white leading-none tracking-tight flex items-center gap-2 group-hover:text-blue-200 transition-colors">
               {location.name}
               <Maximize2 size={14} className="text-gray-500 group-hover:text-white transition-colors" />
             </h2>
           </div>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors -mr-2 -mt-2">
               <X size={18} />
           </button>
        </div>

        {/* 텍스트 영역 */}
        <div className="min-h-[100px] mb-6 cursor-pointer" onClick={() => setIsExpanded(true)}> 
          {isLoading ? (
            <div className="w-full animate-pulse space-y-3 mt-1">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded w-full"></div>
                <div className="h-3 bg-white/10 rounded w-5/6"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
              <p className="text-xs text-gray-300 leading-relaxed font-light line-clamp-3">
                {location.name}의 숨겨진 매력을 발견하세요. 
                카드를 클릭하면 고화질 갤러리와 엄선된 여행 영상으로 떠날 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-3">
           <button 
             onClick={() => {
                // 🚨 [Change] 모달을 여는 대신 카드를 확장하고 채팅 탭으로 유도할 수 있음
                // 현재는 기존 동작 유지를 위해 onChat(Modal) 호출을 유지하되,
                // 만약 여기서도 인라인 채팅을 원하면 setIsExpanded(true) 후 내부 로직 트리거 필요
                onChat({ text: `${location.name} 정보 알려줘`, persona: 'INSPIRER' });
             }}
             className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
           >
             <MessageSquare size={16} className="text-blue-400" />
             <span className="text-xs font-bold text-gray-200">AI 묻기</span>
           </button>
           <button 
             onClick={onTicket}
             className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-blue-500/20 hover:scale-[1.05] transition-all"
           >
             <Ticket size={16} className="text-white" />
             <span className="text-xs font-bold text-white">여행 계획</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;