import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react';

// 🚨 [New] 이미지 갤러리 UI 전담 (풀스크린 및 네비게이션 로직 포함)
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
  
  // 현재 선택된 이미지 인덱스 계산
  const currentIndex = images.findIndex(img => img.id === selectedImg?.id);

  // 내부 네비게이션 핸들러
  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) setSelectedImg(images[currentIndex - 1]);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) setSelectedImg(images[currentIndex + 1]);
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
        <div className="w-full h-full relative animate-fade-in bg-black flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110" style={{ backgroundImage: `url(${selectedImg.urls.regular})` }} />
          
          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => { e.stopPropagation(); if(!isFullScreen) setSelectedImg(null); }}>
             <img src={selectedImg.urls.full} className={`max-w-[90%] max-h-[90%] object-contain shadow-2xl rounded-lg transition-transform duration-700 select-none ${isFullScreen ? 'scale-105' : 'scale-100'}`} />
          </div>

          {/* Controls */}
          <button onClick={handlePrev} disabled={currentIndex <= 0} className={`absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${(!showUI && isFullScreen) || currentIndex <= 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronLeft size={32} />
          </button>
          <button onClick={handleNext} disabled={currentIndex >= images.length - 1} className={`absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${(!showUI && isFullScreen) || currentIndex >= images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronRight size={32} />
          </button>

          {/* Top Right Actions */}
          <div className={`absolute top-8 right-8 flex items-center gap-3 z-[220] transition-opacity ${(!showUI && isFullScreen) ? 'opacity-0' : 'opacity-100'}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => toggleFullScreen(fullScreenContainerRef)} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl">
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20}/>}
            </button>
            <button onClick={isFullScreen ? closeImageKeepFullscreen : () => setSelectedImg(null)} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl">
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        // [View 2] Grid View
        <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar-blue relative">
          <div className="grid grid-cols-4 grid-rows-3 gap-4 min-h-[600px] mb-4">
             {/* Main Hero Image */}
            <div onClick={() => !isImgLoading && images[0] && setSelectedImg(images[0])} className="col-span-2 row-span-2 bg-white/5 rounded-[2rem] border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all duration-500 group relative overflow-hidden">
              {isImgLoading ? (<div className="w-full h-full animate-pulse flex items-center justify-center"><ImageIcon className="text-white/20" size={48} /></div>) : images[0] ? (<><img src={images[0].urls.regular} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" /><Maximize2 className="absolute top-6 right-6 text-white/80 opacity-0 group-hover:opacity-100 transition-all" size={24}/></>) : null}
            </div>
            {/* Sub Images */}
            {[...Array(7)].map((_, i) => {
              const imgData = images[i + 1]; const gridIndex = i + 2; 
              return (<div key={i} onClick={() => !isImgLoading && imgData && setSelectedImg(imgData)} className={`${gridIndex === 4 ? 'col-span-2' : 'col-span-1'} row-span-1 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all group relative overflow-hidden`}>{imgData ? (<img src={imgData.urls.small} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />) : <div className="w-full h-full animate-pulse bg-white/5" />}</div>);
            })}
          </div>
          {/* Extended Grid */}
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