// src/components/PlaceCard/views/PlaceGalleryView.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fix] 핀터레스트 스타일(Masonry) 도입: 'columns-2'와 'break-inside-avoid'를 사용하여 이미지 본연의 비율을 살린 2열 그리드 구현.
// 2. [Fix] 리얼 톤 복원: 기존의 opacity-60~80 레이어를 제거하여 사진 본연의 선명한 색감 노출.
// 3. [Fix] 모바일 시인성 개선: 4열 기반에서 2열 기반으로 변경하여 모바일에서도 사진을 큼직하고 시원하게 확인 가능.
// 4. [Performance] React.memo 및 loading="lazy" 적용하여 렌더링 성능 향상.

import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, X, ImageIcon, Download } from 'lucide-react';

const PlaceGalleryView = React.memo(({ 
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
  
  const [isMobileUIHidden, setIsMobileUIHidden] = useState(false);

  useEffect(() => {
    setIsMobileUIHidden(false);
  }, [selectedImg]);

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
                setSelectedImg(null); 
              } else if (window.innerWidth < 768) {
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
          
          <button onClick={handleNext} disabled={currentIndex >= images.length - 1} className={`absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${isUIHidden || currentIndex <= 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
        // 🚨 [Fix] 핀터레스트 스타일 2열 레이아웃 적용 (columns-2) 및 리얼 톤 유지 (opacity 제거)
        <div className="w-full h-full p-6 pt-24 md:pt-10 overflow-y-auto custom-scrollbar-blue relative">
          {isImgLoading ? (
            <div className="grid grid-cols-2 gap-4">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="aspect-[3/4] animate-pulse bg-white/5 rounded-2xl border border-white/5" />
               ))}
            </div>
          ) : (
            <div className="columns-2 gap-4 space-y-4">
              {images.map((img, i) => (
                <div 
                  key={img.id || i} 
                  onClick={() => setSelectedImg(img)} 
                  className="break-inside-avoid bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all duration-300 group relative overflow-hidden"
                >
                  {/* 🚨 [Fix] 원본 톤 유지를 위해 opacity-100 적용 */}
                  {/* 🚨 [Performance] loading="lazy" 추가 */}
                  <img 
                    src={img.urls.small || img.urls.regular} 
                    className="w-full h-auto object-cover opacity-100 group-hover:scale-105 transition-transform duration-500" 
                    alt={`place-img-${i}`}
                    loading="lazy"
                  />
                  {/* 🚨 [Fix] 하단 가독성을 위한 최소한의 그라데이션만 유지 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Maximize2 className="absolute top-4 right-4 text-white/80 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" size={20}/>
                </div>
              ))}
            </div>
          )}
          
          {/* 🚨 [Pessimistic First] 이미지가 없을 때의 Default 처리 */}
          {!isImgLoading && images.length === 0 && (
            <div className="w-full h-[300px] flex flex-col items-center justify-center text-white/20 gap-4">
              <ImageIcon size={48} />
              <p className="text-sm">등록된 이미지가 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default PlaceGalleryView;
