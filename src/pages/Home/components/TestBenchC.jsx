import React, { useState, useEffect, useRef } from 'react';
import { 
  X, MessageSquare, Play, Maximize2, Send, ArrowLeft, Video, ChevronLeft, ChevronRight,
  MoreHorizontal, Sparkles, Expand, Minimize2, Image as ImageIcon, Camera, Calendar, Heart
} from 'lucide-react';

/**
 * 🚨 [Fix/New] TestBench B - Expert Edition
 * - 🚨 [New] 좌우 화살표 버튼 및 키보드(ArrowLeft/Right) 이동 기능 추가
 * - 🚨 [Fix] 전체화면/상세보기 시 Esc 안내 토스트 UI 구현
 * - 🚨 [Fix] 좌측 유튜브 영역을 슬림한 가로형 리스트로 개편하여 텍스트 비중 확대
 * - 🚨 [Fix] 전체화면 시 '사진 클릭 시 닫기' 기능을 'X 버튼'으로 일원화하여 오조작 방지
 */

const TestBench = ({ onClose }) => {
  const [isChatting, setIsChatting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null); 
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showEscHint, setShowEscHint] = useState(false);
  const fullScreenContainerRef = useRef(null);

  // 현재 선택된 이미지의 인덱스 계산
  const currentIndex = images.findIndex(img => img.id === selectedImg?.id);

  // 1. Data Fetching (Boracay)
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

  // 2. Navigation Logic (Prev/Next)
  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) setSelectedImg(images[currentIndex - 1]);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) setSelectedImg(images[currentIndex + 1]);
  };

  // 3. Event Handler (Keyboard)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          setSelectedImg(null);
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

  // 4. Fullscreen Hint Logic
  useEffect(() => {
    if (isFullScreen) {
      setShowEscHint(true);
      const timer = setTimeout(() => setShowEscHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isFullScreen]);

  const toggleFullScreen = (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement && fullScreenContainerRef.current) {
      fullScreenContainerRef.current.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
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
      
      {/* Esc Hint Toast */}
      {showEscHint && (
        <div className="fixed top-10 left-10 z-[300] bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full animate-bounce">
          <p className="text-white text-xs font-medium flex items-center gap-2">
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">ESC</span>를 눌러 나갈 수 있습니다
          </p>
        </div>
      )}

      {/* 1. Home Button */}
      <div className={`absolute top-8 left-8 z-[110] transition-opacity ${isFullScreen ? 'opacity-0' : 'opacity-100'}`}>
        <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full text-blue-300 hover:text-white hover:border-blue-500/50 transition-all text-xs font-bold backdrop-blur-md">
          <ArrowLeft size={14} /> Home
        </button>
      </div>

      {/* 2. Left Panel: Narrative & Control (35%) */}
      <div className={`w-[35%] h-full backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-500 ${isFullScreen ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'} ${selectedImg ? 'bg-[#020305]/95' : 'bg-[#05070a]/80'}`}>
        
        {/* [Header] */}
        <div className="pt-20 px-8 pb-6 flex flex-col gap-3 z-10">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={12} className="text-cyan-400" />
                <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">Philippines</span>
              </div>
              <h1 className="font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-blue-400 text-4xl">
                {selectedImg ? 'AI FOCUS' : 'BORACAY'}
              </h1>
            </div>
          </div>

          <div className="relative min-h-[120px]">
            {selectedImg ? (
              <div className="animate-fade-in space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] text-blue-200 font-bold"><Camera size={10} className="inline mr-1"/> {selectedImg.width}x{selectedImg.height}</span>
                  <span className="px-2 py-1 bg-pink-500/20 border border-pink-500/30 rounded text-[10px] text-pink-200 font-bold"><Heart size={10} className="inline mr-1"/> {selectedImg.likes}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed font-light border-l-2 border-cyan-500/50 pl-3">
                  "<span className="text-white font-medium">{selectedImg.user.name}</span> 작가가 포착한 보라카이의 순간입니다. <br/>
                  <span className="text-blue-300/80">도슨트 해설:</span> {selectedImg.alt_description || '보라카이의 평온한 자연'}을 담고 있는 이 사진은 여행자의 시선을 머물게 합니다."
                </p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <p className="text-gray-300 text-sm leading-relaxed font-light">
                  새하얀 화이트 비치와 에메랄드 빛 바다의 낙원.<br/>
                  <span className="text-blue-300/90 font-medium">황홀한 석양과 야자수 아래</span>의 여유 속에서 당신만의 완벽한 휴식을 시작해보세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* [Middle] Slim Content Area */}
        <div className={`flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar-blue transition-opacity ${selectedImg ? 'opacity-20' : 'opacity-100'}`}>
          {isChatting ? (
            <div className="h-full flex flex-col animate-fade-in">
              <div className="flex-1 space-y-4 py-2">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0"><Sparkles size={14} className="text-white" /></div>
                  <div className="bg-white/5 p-4 rounded-2xl text-sm text-gray-200 border border-white/5">
                    {selectedImg ? "이 사진의 구도나 보라카이의 명소에 대해 질문해보세요." : "보라카이에 대해 궁금한 점이 있으신가요?"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">추천 여행 영상</p>
              {/* 🚨 [Fix] 슬림 리스트형 유튜브 아이템 */}
              {[1, 2].map(v => (
                <div key={v} className="flex gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0">
                    <img src={`https://img.youtube.com/vi/q1R22J2wWk4/default.jpg`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-blue-600/40 transition-all"><Play size={12} className="text-white fill-white"/></div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-gray-200 line-clamp-1">보라카이 브이로그 #0{v}</h4>
                    <p className="text-[10px] text-gray-500 mt-1">현지인이 알려주는 꿀팁</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* [Bottom] Input */}
        <div className="p-6 pt-0 mt-auto">
          <div className="relative group">
            <input 
              type="text" 
              placeholder={isChatting ? (selectedImg ? "사진 속 장소는 어디야?" : "질문을 입력하세요...") : "AI 가이드에게 질문하기"}
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
            {/* Background Blur */}
            <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110" style={{ backgroundImage: `url(${selectedImg.urls.regular})` }} />
            
            {/* Main Image */}
            <img src={selectedImg.urls.full} className={`max-w-[85%] max-h-[85%] object-contain shadow-2xl rounded-lg transition-transform duration-700 ${isFullScreen ? 'scale-105' : 'scale-100'}`} />

            {/* 🚨 [New] 좌우 이동 버튼 */}
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className={`absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${currentIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              onClick={handleNext} 
              disabled={currentIndex === images.length - 1}
              className={`absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${currentIndex === images.length - 1 ? 'opacity-0' : 'opacity-100'}`}
            >
              <ChevronRight size={32} />
            </button>

            {/* Controls */}
            <div className="absolute top-8 right-8 flex items-center gap-3 z-[220]" onClick={(e) => e.stopPropagation()}>
              <button onClick={toggleFullScreen} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                {isFullScreen ? <Minimize2 size={20} /> : <Expand size={20} />}
              </button>
              <button onClick={() => setSelectedImg(null)} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl">
                <X size={20} />
              </button>
            </div>
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
            {!isLoading && images.length > 8 && (
              <div className="grid grid-cols-4 gap-4 animate-fade-in-up">
                {images.slice(8).map((img, i) => (
                  <div key={i + 8} onClick={() => setSelectedImg(img)} className="aspect-square bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all group relative overflow-hidden">
                    <img src={img.urls.small} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                ))}
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

export default TestBench;
// 최종