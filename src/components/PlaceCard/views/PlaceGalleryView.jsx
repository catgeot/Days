import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, X, ImageIcon, Download, RefreshCw, Sparkles } from 'lucide-react';
import { mobilePlaceHeaderScrollPadding } from '../common/mobilePlaceHeaderInset';

const PlaceGalleryView = React.memo(({
  location,
  images,
  isImgLoading,
  selectedImg,
  setSelectedImg,
  isFullScreen,
  toggleFullScreen,
  closeImageKeepFullscreen,
  showUI,
  handleDownload,
  handleRefresh,
  handleRemoveImage,
  mobileSecondaryNav = null
}) => {
  const fullScreenContainerRef = useRef(null);
  const currentIndex = images.findIndex(img => img.id === selectedImg?.id);

  const [isMobileUIHidden, setIsMobileUIHidden] = useState(false);
  const [isRefreshDisabled, setIsRefreshDisabled] = useState(false);

  const onRefreshClick = () => {
    if (isRefreshDisabled || isImgLoading || !handleRefresh) return;
    setIsRefreshDisabled(true);
    handleRefresh();
    setTimeout(() => setIsRefreshDisabled(false), 5000);
  };

  useEffect(() => {
    queueMicrotask(() => setIsMobileUIHidden(false));
  }, [selectedImg]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileUIHidden(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrev = useCallback((e) => {
    e?.stopPropagation();
    if (currentIndex > 0) setSelectedImg(images[currentIndex - 1]);
  }, [currentIndex, images, setSelectedImg]);

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) setSelectedImg(images[currentIndex + 1]);
  }, [currentIndex, images, setSelectedImg]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImg) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImg, handlePrev, handleNext]);

  const isUIHidden = (!showUI && isFullScreen) || isMobileUIHidden;

  const placeOverviewText = useMemo(() => {
    const t = (location?.desc || location?.description || '').trim();
    return t;
  }, [location?.desc, location?.description]);

  const photoCaption = useMemo(() => {
    if (!selectedImg) return '';
    const raw = (selectedImg.alt_description || selectedImg.description || '').trim();
    if (!raw) return '';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [selectedImg]);

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
              if (e.ctrlKey || e.metaKey) return; // 더블클릭을 위해 단일 클릭 방지
              if (window.innerWidth >= 768 && !isFullScreen) {
                setSelectedImg(null);
              } else if (window.innerWidth < 768) {
                setIsMobileUIHidden(prev => !prev);
              }
          }}
          onDoubleClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                  e.stopPropagation();
                  if (handleRemoveImage && selectedImg) {
                      handleRemoveImage(selectedImg);
                      setSelectedImg(null);
                  }
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

          {photoCaption && (
            <div
              className={`md:hidden absolute left-0 right-0 top-16 z-[205] px-4 transition-opacity duration-300 ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-[30vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/55 px-3.5 py-3 backdrop-blur-md shadow-lg">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-300/90 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon size={12} className="shrink-0 opacity-90" aria-hidden />
                  사진 노트
                </p>
                <p className="text-sm text-gray-100/95 leading-relaxed whitespace-pre-line">{photoCaption}</p>
              </div>
            </div>
          )}

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
        <div className={`w-full h-full overflow-y-auto custom-scrollbar-blue relative overscroll-none touch-pan-y ${mobilePlaceHeaderScrollPadding} md:pt-10 pb-28 md:pb-6`}>

          {mobileSecondaryNav && (
            <div className="md:hidden px-2 pb-2 shrink-0">
              {mobileSecondaryNav}
            </div>
          )}

          <div className="px-6 relative">
            <div className="absolute top-0 right-6 md:-top-4 md:right-0 z-10">
               <button
                  onClick={onRefreshClick}
                  disabled={isRefreshDisabled || isImgLoading}
                  className="flex items-center justify-center p-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/50 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/50 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group shadow-lg"
                  title="이미지 새로고침 (DB/캐시 무시 강제 로딩)"
               >
                  <RefreshCw size={18} className={`${isImgLoading || isRefreshDisabled ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
               </button>
            </div>

            {placeOverviewText && (
              <div className="md:hidden mb-4 pr-12">
                <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 backdrop-blur-md shadow-inner">
                  {location?.originalQuery && (
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-200/95">
                      <Sparkles size={12} className="shrink-0 text-violet-300" aria-hidden />
                      <span className="min-w-0 line-clamp-2 normal-case font-semibold tracking-normal text-violet-100/90">
                        「{location.originalQuery}」에서 이 여행지로
                      </span>
                    </p>
                  )}
                  <p className="text-[13px] leading-relaxed text-gray-100/95 whitespace-pre-line">{placeOverviewText}</p>
                  {Array.isArray(location?.keywords) && location.keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
                      {location.keywords.map((tag, idx) => (
                        <span
                          key={`mob-gallery-tag-${idx}`}
                          className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-gray-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`${placeOverviewText ? 'mt-4' : 'mt-12'} md:mt-0`}>
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
                      onClick={(e) => {
                         if (e.ctrlKey || e.metaKey) return;
                         setSelectedImg(img);
                      }}
                      onDoubleClick={(e) => {
                         if (e.ctrlKey || e.metaKey) {
                             e.stopPropagation();
                             if (handleRemoveImage) handleRemoveImage(img);
                         }
                      }}
                      className="break-inside-avoid bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/50 cursor-pointer transition-all duration-300 group relative overflow-hidden"
                    >

                      <img
                        src={img.urls.small || img.urls.regular}
                        className="w-full h-auto object-cover opacity-100 group-hover:scale-105 transition-transform duration-500"
                        alt={`place-img-${i}`}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Maximize2 className="absolute top-4 right-4 text-white/80 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" size={20}/>
                    </div>
                  ))}
                </div>
              )}

              {!isImgLoading && images.length === 0 && (
                <div className="w-full h-[300px] flex flex-col items-center justify-center text-white/20 gap-4">
                  <ImageIcon size={48} />
                  <p className="text-sm">등록된 이미지가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PlaceGalleryView;
