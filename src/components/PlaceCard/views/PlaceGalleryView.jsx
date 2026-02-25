// src/components/PlaceCard/views/PlaceGalleryView.jsx
// 🚨 [Deleted] onAiModeChange Prop 제거 (더 이상 필요 없음)
// 🚨 [Fix/New] 모바일 터치 스와이프 기능 추가 (네이티브 감각 존중). 복잡한 Toggle UI 코드는 모두 삭제함(원복).
// 🚨 [Fix] PC/아이패드 환경 완벽 복구: 사진 영역 클릭 시 window.innerWidth >= 768 조건에서만 그리드로 복귀(`setSelectedImg(null)`).
// 🚨 [Fix] 닫기/전체보기 버튼: 모바일에서는 전체화면 버튼 숨김(`hidden md:block`), 닫기 버튼은 위치 변경 없이 원본 상단 배치 유지.
// 🚨 [New] lucide-react에서 Download 아이콘 임포트. 하단 좌/우측에 Unsplash 저작권 표기 및 다운로드 버튼 추가.

import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, X, ImageIcon, Download } from 'lucide-react';

const PlaceGalleryView = ({ 
  images, 
  isImgLoading, 
  selectedImg, 
  setSelectedImg,
  isFullScreen,
  toggleFullScreen,
  closeImageKeepFullscreen,
  showUI,
  handleDownload // 🚨 [New] 트래킹 및 다운로드 로직을 실행할 Prop 추가
}) => {
  const fullScreenContainerRef = useRef(null);
  const currentIndex = images.findIndex(img => img.id === selectedImg?.id);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  
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

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) setSelectedImg(images[currentIndex - 1]);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) setSelectedImg(images[currentIndex + 1]);
  };

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

          <button onClick={handlePrev} disabled={currentIndex <= 0} className={`hidden md:block absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${(!showUI && isFullScreen) || currentIndex <= 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronLeft size={32} />
          </button>
          <button onClick={handleNext} disabled={currentIndex >= images.length - 1} className={`hidden md:block absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${(!showUI && isFullScreen) || currentIndex >= images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronRight size={32} />
          </button>

          <div className={`absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-3 z-[220] transition-opacity duration-300 ${(!showUI && isFullScreen) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => toggleFullScreen(fullScreenContainerRef)} className="hidden md:block p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl">
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20}/>}
            </button>
            <button onClick={isFullScreen ? closeImageKeepFullscreen : () => setSelectedImg(null)} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl">
              <X size={20} />
            </button>
          </div>

          {/* 🚨 [New] 좌측 하단: Unsplash 저작권자 표기 (Attribution Guideline) */}
          {selectedImg.user && (
            <div className={`absolute bottom-4 left-4 md:bottom-8 md:left-8 z-[220] transition-opacity duration-300 ${(!showUI && isFullScreen) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} onClick={(e) => e.stopPropagation()}>
              <a 
                href={`${selectedImg.user.links?.html || '#' }?utm_source=Project_Days&utm_medium=referral`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-black/50 backdrop-blur-md border border-white/10 text-white/80 text-xs md:text-sm rounded-full hover:bg-white/20 hover:text-white transition-all shadow-xl"
              >
                <span>Photo by</span>
                <span className="font-semibold text-white truncate max-w-[100px] md:max-w-[200px]">{selectedImg.user.name || 'Unknown'}</span>
                <span>on Unsplash</span>
              </a>
            </div>
          )}

          {/* 🚨 [New] 우측 하단: 다운로드 버튼 (Tracking Trigger) */}
          <div className={`absolute bottom-4 right-4 md:bottom-8 md:right-8 z-[220] transition-opacity duration-300 ${(!showUI && isFullScreen) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => handleDownload && handleDownload(selectedImg)} 
              className="flex items-center gap-2 p-3 md:px-4 md:py-2 bg-black/50 backdrop-blur-md border border-white/10 text-white/80 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl"
              title="이미지 다운로드"
            >
              <Download size={20} />
              <span className="hidden md:block text-sm font-medium pr-1">다운로드</span>
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
        </div>
      )}
    </div>
  );
};

export default PlaceGalleryView;