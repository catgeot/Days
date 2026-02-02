import React, { useState, useEffect, useRef } from 'react';
import { 
  X, MessageSquare, Play, Maximize2, Send, ArrowLeft, Video, ChevronLeft, ChevronRight,
  MoreHorizontal, Sparkles, Expand, Minimize2, Image as ImageIcon, Camera, Calendar, Heart, List, AlertCircle
} from 'lucide-react';

/**
 * 🚨 [Fix/New] TestBench C - Master UX Edition
 * - 🚨 [New] 상단 중앙 '하이브리드 탈출 컨트롤러' ([X] / ESC) 구현
 * - 🚨 [Fix] 사진 클릭 로직 이원화: (전체화면: UI토글) vs (창모드: 그리드 복귀)
 * - 🚨 [Fix] 좌측 패널 '유령 리스트' 제거 -> 명확한 컨텐츠 스위칭 (리스트 <-> 도슨트)
 * - 🚨 [Fix] 'Back to List' 버튼 추가로 확실한 탈출구 확보
 */

const TestBench = ({ onClose }) => {
  const [isChatting, setIsChatting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null); 
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true); // 몰입 모드 제어용
  
  const fullScreenContainerRef = useRef(null);

  // 현재 인덱스
  const currentIndex = images.findIndex(img => img.id === selectedImg?.id);

  // 1. Data Fetching
  useEffect(() => {
    const fetchImages = async () => {
      const CACHE_KEY = 'boracay_images_cache_v1'; 
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setImages(JSON.parse(cachedData));
        setIsLoading(false);
        return;
      }
      try {
        const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
        if (!ACCESS_KEY) return;
        const response = await fetch(
          `https://api.unsplash.com/search/photos?page=1&query=Boracay&per_page=30&orientation=landscape`, 
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
        setIsLoading(false);
      }
    };
    fetchImages();
  }, []);

  // 2. Navigation & View Logic
  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) setSelectedImg(images[currentIndex - 1]);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) setSelectedImg(images[currentIndex + 1]);
  };

  // 사진 클릭 핸들러 (상태에 따라 다른 동작)
  const handleImageClick = () => {
    if (isFullScreen) {
      setShowUI(prev => !prev); // 전체화면이면 UI 토글
    } else {
      setSelectedImg(null); // 창모드면 닫기 (그리드로 복귀)
    }
  };

  const resetView = () => {
    setIsChatting(false);
    setSelectedImg(null);
  };

  // 3. Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          resetView(); // ESC 누르면 초기화
        }
      }
      if (selectedImg) {
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImg, currentIndex]);

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

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex p-6 gap-6 animate-fade-in overflow-hidden font-sans">
      
      {/* 1. Global Home Button (창 모드용) */}
      <div className={`absolute top-8 left-8 z-[110] transition-opacity ${isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full text-blue-300 hover:text-white hover:border-blue-500/50 transition-all text-xs font-bold backdrop-blur-md">
          <ArrowLeft size={14} /> Home
        </button>
      </div>

      {/* 2. Left Panel: Context Area (35%) */}
      {/* 전체화면 시 숨김 */}
      <div className={`w-[35%] h-full backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-500 ${isFullScreen ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'} ${selectedImg ? 'bg-[#020305]/95' : 'bg-[#05070a]/80'}`}>
        
        {/* [Header] */}
        <div className="pt-20 px-8 pb-4 flex flex-col gap-3 z-10">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={12} className="text-cyan-400" />
                <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">Philippines</span>
              </div>
              <h1 className="font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-blue-400 text-4xl truncate pr-2">
                {selectedImg ? 'AI FOCUS' : 'BORACAY'}
              </h1>
            </div>
            
            {/* 🚨 [Fix] 확실한 탈출구 (Back to List) */}
            {selectedImg && (
               <button 
               onClick={resetView}
               className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all animate-fade-in shrink-0"
             >
               <List size={14} /> <span>List</span>
             </button>
            )}
          </div>
        </div>

        {/* [Middle] Content Switching (No more ghosts) */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar-blue relative">
          
          {selectedImg ? (
             // [Mode A] AI Docent & Info (이미지 선택 시)
             <div className="animate-fade-in space-y-6">
                {/* Meta Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] text-blue-200 font-bold flex items-center gap-1"><Camera size={10}/> {selectedImg.width}x{selectedImg.height}</span>
                  <span className="px-2 py-1 bg-pink-500/20 border border-pink-500/30 rounded text-[10px] text-pink-200 font-bold flex items-center gap-1"><Heart size={10}/> {selectedImg.likes}</span>
                  <span className="px-2 py-1 bg-white/10 border border-white/10 rounded text-[10px] text-gray-300 font-bold flex items-center gap-1"><Calendar size={10}/> {new Date(selectedImg.created_at).getFullYear()}</span>
                </div>

                {/* Docent Text */}
                <div className="p-4 bg-gradient-to-br from-blue-900/10 to-transparent border-l-2 border-cyan-500/50 rounded-r-xl">
                    <p className="text-gray-300 text-sm leading-relaxed font-light">
                      "<span className="text-white font-medium">{selectedImg.user.name}</span> 작가가 포착한 순간입니다.<br/><br/>
                      이 사진은 보라카이의 <span className="text-blue-300">시간에 따른 색채 변화</span>를 잘 보여줍니다. 
                      {selectedImg.alt_description ? ` 특히 '${selectedImg.alt_description}'의 느낌이 강하게 묻어납니다.` : ''}
                      <br/>여행자가 가장 사랑하는 뷰포인트 중 하나입니다."
                    </p>
                </div>
             </div>
          ) : (
             // [Mode B] YouTube List (기본 상태)
             <div className="animate-fade-in space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                  <p className="text-gray-300 text-sm leading-relaxed font-light">
                    새하얀 화이트 비치와 에메랄드 빛 바다의 낙원.<br/>
                    <span className="text-blue-300/90 font-medium">황홀한 석양과 야자수 아래</span>의 여유 속에서 당신만의 완벽한 휴식을 시작해보세요.
                  </p>
                </div>

                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Featured Videos</p>
                {[1, 2, 3].map(v => (
                  <div key={v} className="flex gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0">
                      <img src={`https://img.youtube.com/vi/q1R22J2wWk4/default.jpg`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-blue-600/40 transition-all"><Play size={12} className="text-white fill-white"/></div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="text-xs font-bold text-gray-200 line-clamp-1 group-hover:text-blue-300 transition-colors">보라카이 브이로그 #0{v}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">현지인 추천 맛집 & 스팟</p>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </div>

        {/* [Bottom] Chat Input */}
        <div className="p-6 pt-0 mt-auto">
          <div className="relative group">
            <input 
              type="text" 
              placeholder={selectedImg ? "이 사진 위치가 어디야?" : "AI 가이드에게 질문하기..."}
              onFocus={() => setIsChatting(true)}
              className="w-full bg-black/40 border border-white/10 rounded-full py-4 pl-6 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner" 
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-cyan-500 transition-all shadow-lg">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Right Panel: Media Gallery (65%) */}
      <div 
        ref={fullScreenContainerRef} 
        className={`flex-1 h-full bg-[#05070a]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}
      >
        {selectedImg ? (
          <div className="w-full h-full relative animate-fade-in bg-black flex items-center justify-center overflow-hidden">
            
            {/* 🚨 [New] Top Center Controller (Hybrid Escape) */}
            {isFullScreen && (
               <div className={`absolute top-0 left-1/2 -translate-x-1/2 z-[300] transition-transform duration-300 ${showUI ? 'translate-y-0' : '-translate-y-full hover:translate-y-0'}`}>
                 <div onClick={toggleFullScreen} className="mt-4 px-6 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full flex items-center gap-3 cursor-pointer hover:bg-red-500/80 hover:border-red-500 transition-all group shadow-2xl">
                    <X size={16} className="text-white"/>
                    <div className="h-3 w-[1px] bg-white/30"></div>
                    <span className="text-[10px] font-bold text-white tracking-widest">ESC</span>
                 </div>
               </div>
            )}

            {/* Background Blur */}
            <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110" style={{ backgroundImage: `url(${selectedImg.urls.regular})` }} />
            
            {/* Main Image (Click to Toggle UI or Close) */}
            <div className="relative w-full h-full flex items-center justify-center" onClick={handleImageClick}>
               <img src={selectedImg.urls.full} className={`max-w-[90%] max-h-[90%] object-contain shadow-2xl rounded-lg transition-transform duration-700 select-none ${isFullScreen ? 'scale-105' : 'scale-100'}`} />
            </div>

            {/* Navigation Arrows (UI Toggle 영향을 받음) */}
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className={`absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${(!showUI && isFullScreen) || currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              onClick={handleNext} 
              disabled={currentIndex === images.length - 1}
              className={`absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${(!showUI && isFullScreen) || currentIndex === images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <ChevronRight size={32} />
            </button>

            {/* Normal Mode Controls (Top Right) - 전체화면일땐 상단 중앙 컨트롤러가 대신함 */}
            {!isFullScreen && (
                <div className="absolute top-8 right-8 flex items-center gap-3 z-[220]" onClick={(e) => e.stopPropagation()}>
                  <button onClick={toggleFullScreen} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                    <Expand size={20} />
                  </button>
                  <button onClick={() => setSelectedImg(null)} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl">
                    <X size={20} />
                  </button>
                </div>
            )}
          </div>
        ) : (
          /* Bento Gallery */
          <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar-blue">
            <div className="grid grid-cols-4 grid-rows-3 gap-4 min-h-[600px] mb-4">
              <div onClick={() => !isLoading && images[0] && setSelectedImg(images[0])} className="col-span-2 row-span-2 bg-white/5 rounded-[2rem] border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all duration-500 group relative overflow-hidden">
                {isLoading ? (<div className="w-full h-full animate-pulse flex items-center justify-center"><ImageIcon className="text-white/20" size={48} /></div>) : images[0] ? (<><img src={images[0].urls.regular} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" /><Maximize2 className="absolute top-6 right-6 text-white/80 opacity-0 group-hover:opacity-100 transition-all" size={24}/></>) : null}
              </div>
              {[...Array(7)].map((_, i) => {
                const imgData = images[i + 1]; const gridIndex = i + 2; 
                return (<div key={i} onClick={() => !isLoading && imgData && setSelectedImg(imgData)} className={`${gridIndex === 4 ? 'col-span-2' : 'col-span-1'} row-span-1 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all group relative overflow-hidden`}>{imgData ? (<img src={imgData.urls.small} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />) : <div className="w-full h-full animate-pulse bg-white/5" />}</div>);
              })}
            </div>
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

export default TestBench;