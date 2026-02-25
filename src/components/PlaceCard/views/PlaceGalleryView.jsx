// src/components/PlaceCard/views/PlaceGalleryView.jsx
// 🚨 [Deleted] onAiModeChange Prop 제거 (더 이상 필요 없음)
// 🚨 [Fix/New] 모바일 터치 스와이프 기능 추가 (네이티브 감각 존중). 복잡한 Toggle UI 코드는 모두 삭제함(원복).
// 🚨 [Fix] PC/아이패드 환경 완벽 복구: 사진 영역 클릭 시 window.innerWidth >= 768 조건에서만 그리드로 복귀(`setSelectedImg(null)`).
// 🚨 [Fix] 닫기/전체보기 버튼: 모바일에서는 전체화면 버튼 숨김(`hidden md:block`), 닫기 버튼은 위치 변경 없이 원본 상단 배치 유지.

import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react';

const PlaceGalleryView = ({ 
  images, 
  isImgLoading, 
  selectedImg, 
  setSelectedImg,
  isFullScreen,
  toggleFullScreen,
  closeImageKeepFullscreen,
  showUI
}) => {
  const fullScreenContainerRef = useRef(null);
  const currentIndex = images.findIndex(img => img.id === selectedImg?.id);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  
  // 🚨 [New] 모바일 터치 스와이프 전용 상태
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    setIsHighResLoaded(false);
    if (selectedImg?.urls?.regular) {
      const img = new Image();
      img.src = selectedImg.urls.regular;
      img.onload = () => setIsHighResLoaded(true);
    }
  }, [selectedImg]);

  // 내부 네비게이션 핸들러
  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) setSelectedImg(images[currentIndex - 1]);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) setSelectedImg(images[currentIndex + 1]);
  };

  // 🚨 [New] 모바일 스와이프 로직
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && currentIndex < images.length - 1) handleNext();
    if (isRightSwipe && currentIndex > 0) handlePrev();
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImg) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImg, currentIndex, images]);

  return (
    <div 
      ref={fullScreenContainerRef}
      className={`flex-1 h-full bg-[#05070a]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}
    >
      {selectedImg ? (
        // [View 1] Single Image View
        // 🚨 [Fix] 모바일 토글 UI 관련 클래스 모두 제거하고 원본의 깔끔한 구조로 원복. 스와이프 이벤트만 부착.
        <div 
          className="w-full h-full relative animate-fade-in bg-black flex items-center justify-center overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndHandler}
        >
          
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110 transition-all duration-700" 
            style={{ backgroundImage: `url(${selectedImg.urls.thumb})` }} 
          />
          
          {/* 🚨 [Fix] 사진 영역 클릭: 데스크탑/아이패드(768px 이상)일 때만 원본 기능인 그리드 복귀 실행. 모바일은 무반응(오직 닫기 버튼과 스와이프 사용). */}
          <div className="relative w-full h-full flex items-center justify-center cursor-pointer md:cursor-default" onClick={(e) => { 
              e.stopPropagation(); 
              if (window.innerWidth >= 768 && !isFullScreen) setSelectedImg(null); 
          }}>
              <img 
                src={selectedImg.urls.thumb} 
                className={`absolute max-w-[90%] max-h-[90%] object-contain shadow-2xl rounded-lg transition-transform duration-700 select-none blur-lg scale-105 ${isFullScreen ? 'scale-110' : 'scale-100'} ${isHighResLoaded ? 'opacity-0' : 'opacity-100'}`}
                alt="thumbnail"
              />
              <img 
                src={selectedImg.urls.regular} 
                className={`relative max-w-[90%] max-h-[90%] object-contain shadow-2xl rounded-lg transition-all duration-700 select-none ${isFullScreen ? 'scale-105' : 'scale-100'} ${isHighResLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`} 
                alt="full-view"
              />
          </div>

          {/* Controls - 🚨 [Fix] 데스크탑 전용 화살표 (hidden md:block) */}
          <button onClick={handlePrev} disabled={currentIndex <= 0} className={`hidden md:block absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${(!showUI && isFullScreen) || currentIndex <= 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronLeft size={32} />
          </button>
          <button onClick={handleNext} disabled={currentIndex >= images.length - 1} className={`hidden md:block absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${(!showUI && isFullScreen) || currentIndex >= images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronRight size={32} />
          </button>

          {/* 🚨 [Fix] 닫기/확대 버튼 영역. 절대 좌표 위치는 원본으로 복구(top-4 right-4 md:top-8 md:right-8). 모바일에서는 전체보기 버튼만 숨김. */}
          <div className={`absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-3 z-[220] transition-opacity duration-300 ${(!showUI && isFullScreen) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} onClick={(e) => e.stopPropagation()}>
            {/* 전체화면 버튼: 데스크탑, 아이패드에서만 렌더링 */}
            <button onClick={() => toggleFullScreen(fullScreenContainerRef)} className="hidden md:block p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl">
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20}/>}
            </button>
            {/* 닫기 버튼: 모든 환경에서 명시적인 그리드 복귀 역할 수행 */}
            <button onClick={isFullScreen ? closeImageKeepFullscreen : () => setSelectedImg(null)} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl">
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        // [View 2] Grid View
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
        </div>
      )}
    </div>
  );
};

export default PlaceGalleryView;