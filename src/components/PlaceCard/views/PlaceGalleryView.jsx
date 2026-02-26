// src/components/PlaceCard/views/PlaceGalleryView.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [Subtraction] 모바일 Safari 메모리 누수(정지 현상)의 핵심 원인인 3중 CSS 필터(blur-3xl) 배경과 트랜지션 애니메이션 완전 제거.
// 2. [Subtraction] 썸네일과 고해상도 이미지를 겹쳐 그리는 이중 렌더링(DOM 과부하) 제거. 불필요해진 isHighResLoaded 상태도 함께 제거.
// 3. [Performance] 단일 이미지(urls.regular)만 즉각 렌더링하도록 경량화하여 모바일 GPU 메모리 해제(Garbage Collection)를 극대화함.
// 4. 🚨 [New] 모바일 몰입형 감상 모드: 모바일(width < 768)에서 사진 터치 시 UI(버튼 등)를 토글(숨김/표시)하는 isMobileUIHidden 상태 추가.
// 5. 🚨 [Fix] 부작용 방어(Pessimistic First): 사진 변경 시 또는 화면이 768px 이상으로 커질 시 UI 숨김 상태를 강제 초기화(false)하여 갇힘 현상 방지.

import React, { useRef, useEffect, useState } from 'react';
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
  handleDownload 
}) => {
  const fullScreenContainerRef = useRef(null);
  const currentIndex = images.findIndex(img => img.id === selectedImg?.id);
  
  // 🚨 [New] 모바일 전용 UI 숨김 상태
  const [isMobileUIHidden, setIsMobileUIHidden] = useState(false);

  // 🚨 [Fix] 부작용 방어 1: 사진이 바뀌면 무조건 UI 다시 표시
  useEffect(() => {
    setIsMobileUIHidden(false);
  }, [selectedImg]);

  // 🚨 [Fix] 부작용 방어 2: 화면을 돌리거나 늘려서 768px 이상이 되면 강제로 UI 복구
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileUIHidden(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) setSelectedImg(images[currentIndex - 1]);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) setSelectedImg(images[currentIndex + 1]);
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

  // 🚨 [New] 전체 UI 숨김 여부를 결정하는 통합 변수 (기존 showUI 로직 + 모바일 터치 숨김 로직)
  const isUIHidden = (!showUI && isFullScreen) || isMobileUIHidden;

  return (
    <div 
      ref={fullScreenContainerRef}
      className={`flex-1 h-full bg-[#05070a]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}
    >
      {selectedImg ? (
        <div 
          className="w-full h-full relative animate-fade-in bg-black flex items-center justify-center overflow-hidden"
        >
          
          <div className="relative w-full h-full flex items-center justify-center cursor-pointer md:cursor-default" onClick={(e) => { 
              e.stopPropagation(); 
              if (window.innerWidth >= 768 && !isFullScreen) {
                // PC 환경: 기존처럼 그리드로 복귀
                setSelectedImg(null); 
              } else if (window.innerWidth < 768) {
                // 🚨 [New] 모바일 환경: 터치 시 UI 토글
                setIsMobileUIHidden(prev => !prev);
              }
          }}>
              <img 
                src={selectedImg.urls.regular} 
                className={`relative max-w-[90%] max-h-[90%] object-contain shadow-2xl rounded-lg select-none animate-fade-in ${isFullScreen ? 'scale-105' : 'scale-100'}`} 
                alt="full-view"
              />
          </div>

          <button onClick={handlePrev} disabled={currentIndex <= 0} className={`absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${isUIHidden || currentIndex <= 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          
          <button onClick={handleNext} disabled={currentIndex >= images.length - 1} className={`absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${isUIHidden || currentIndex >= images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <div className={`absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-3 z-[220] transition-opacity duration-300 ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => toggleFullScreen(fullScreenContainerRef)} className="hidden md:block p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl">
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20}/>}
            </button>
            <button onClick={isFullScreen ? closeImageKeepFullscreen : () => setSelectedImg(null)} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl">
              <X size={20} />
            </button>
          </div>

          {selectedImg.user && (
            <div className={`absolute bottom-4 left-4 md:bottom-8 md:left-8 z-[220] transition-opacity duration-300 ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} onClick={(e) => e.stopPropagation()}>
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

          <div className={`absolute bottom-4 right-4 md:bottom-8 md:right-8 z-[220] transition-opacity duration-300 ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} onClick={(e) => e.stopPropagation()}>
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