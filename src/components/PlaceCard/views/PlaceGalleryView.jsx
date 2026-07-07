import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, X, ImageIcon, Download, RefreshCw, Sparkles } from 'lucide-react';
import { mobilePlaceHeaderScrollPadding } from '../common/mobilePlaceHeaderInset';
import { placeScrollSurfaceClass } from '../common/placeScrollSurface';
import { usePlaceMediaScrollToTop } from '../common/usePlaceMediaScrollToTop';
import { usePinchZoomPan } from '../common/usePinchZoomPan';

/** 세로·터치 태블릿은 max-width, 가로 회전(높이 짧은 터치 기기)도 모바일 풀스크린 포털 유지 */
const MOBILE_GALLERY_LIGHTBOX_QUERY =
  '(max-width: 767px), ((max-width: 834px) and (hover: none) and (pointer: coarse)), ((max-height: 500px) and (orientation: landscape) and (hover: none) and (pointer: coarse))';

const TOUCH_DEVICE_QUERY = '(hover: none) and (pointer: coarse)';

/** 모바일 확대 포털 — 가로 스와이프 vs 탭(UI 토글) 구분 */
const MOBILE_SWIPE_THRESHOLD_PX = 48;
const MOBILE_SWIPE_DIRECTION_RATIO = 1.25;

const mobileNavButtonClass = (enabled) =>
  `flex shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/80 text-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] ring-2 ring-white/25 backdrop-blur-md transition-all touch-manipulation active:scale-95 ${
    enabled ? 'hover:bg-blue-600/90 hover:border-blue-300/60' : 'opacity-45'
  }`;

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
  getRefreshCooldownRemaining,
  refreshCooldownSec = 30,
  handleRemoveImage,
  mobileSecondaryNav = null
}) => {
  const fullScreenContainerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const mobileSwipeStartRef = useRef(null);
  const suppressMobileTapRef = useRef(false);
  usePlaceMediaScrollToTop('GALLERY', scrollContainerRef, !selectedImg);
  usePinchZoomPan(scrollContainerRef, !selectedImg);
  const currentIndex = useMemo(() => {
    if (!selectedImg || images.length === 0) return -1;
    const byId = images.findIndex((img) => img.id === selectedImg.id);
    if (byId >= 0) return byId;
    const byReference = images.findIndex((img) => img === selectedImg);
    if (byReference >= 0) return byReference;
    const selectedUrl = selectedImg.urls?.regular || selectedImg.urls?.small;
    if (!selectedUrl) return -1;
    return images.findIndex(
      (img) => (img.urls?.regular || img.urls?.small) === selectedUrl
    );
  }, [images, selectedImg]);

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < images.length - 1;
  const showNavControls = images.length > 1;

  const [isMobileUIHidden, setIsMobileUIHidden] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_GALLERY_LIGHTBOX_QUERY).matches
  );
  const [isTouchDevice, setIsTouchDevice] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(TOUCH_DEVICE_QUERY).matches
  );
  const [refreshCooldownLeft, setRefreshCooldownLeft] = useState(0);

  /** 그리드·확대·회전 중에도 터치 기기는 body 포털 유지 (헤더 z-index 겹침 방지) */
  const shouldUseMobilePortal = Boolean(selectedImg && (isMobileViewport || isTouchDevice));

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_GALLERY_LIGHTBOX_QUERY);
    const sync = () => setIsMobileViewport(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(TOUCH_DEVICE_QUERY);
    const sync = () => setIsTouchDevice(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!shouldUseMobilePortal) return undefined;
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [shouldUseMobilePortal]);

  useEffect(() => {
    if (!getRefreshCooldownRemaining) return undefined;
    const tick = () => setRefreshCooldownLeft(getRefreshCooldownRemaining());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [getRefreshCooldownRemaining, isImgLoading]);

  const onRefreshClick = useCallback(() => {
    if (isImgLoading || refreshCooldownLeft > 0 || !handleRefresh) return;
    const started = handleRefresh();
    if (started && getRefreshCooldownRemaining) {
      setRefreshCooldownLeft(getRefreshCooldownRemaining());
    }
  }, [handleRefresh, getRefreshCooldownRemaining, isImgLoading, refreshCooldownLeft]);

  useEffect(() => {
    queueMicrotask(() => setIsMobileUIHidden(false));
  }, [selectedImg]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_GALLERY_LIGHTBOX_QUERY);
    const handleResize = () => {
      if (!mq.matches) setIsMobileUIHidden(false);
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

  const onMobilePhotoTouchStart = useCallback((e) => {
    if (!showNavControls || e.touches.length !== 1) return;
    const t = e.touches[0];
    mobileSwipeStartRef.current = { x: t.clientX, y: t.clientY };
    suppressMobileTapRef.current = false;
  }, [showNavControls]);

  const onMobilePhotoTouchEnd = useCallback((e) => {
    const start = mobileSwipeStartRef.current;
    mobileSwipeStartRef.current = null;
    if (!start || !showNavControls) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < MOBILE_SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * MOBILE_SWIPE_DIRECTION_RATIO) return;

    suppressMobileTapRef.current = true;
    if (dx > 0) handlePrev();
    else handleNext();
  }, [showNavControls, handlePrev, handleNext]);

  const onMobilePhotoTouchCancel = useCallback(() => {
    mobileSwipeStartRef.current = null;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImg) return;
      if (e.key === 'Escape') setSelectedImg(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImg, handlePrev, handleNext, setSelectedImg]);

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

  const renderPhotoViewer = (wrapperClassName, { mobilePortal = false } = {}) => {
    if (mobilePortal) {
      return (
        <div
          className="fixed inset-0 z-[9999] h-[100dvh] min-h-[100svh] w-screen overflow-hidden bg-black animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="갤러리 사진 확대 보기"
        >
          <div className="relative h-full w-full portrait:flex portrait:flex-col">
          <div
            className={`relative z-[220] flex shrink-0 items-start gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] transition-opacity duration-300 portrait:static landscape:absolute landscape:inset-x-0 landscape:top-0 landscape:bg-gradient-to-b landscape:from-black/85 landscape:to-transparent landscape:px-3 landscape:pb-1 landscape:pt-[max(0.5rem,env(safe-area-inset-top,0px))] ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {photoCaption ? (
              <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/55 px-3 py-2.5 backdrop-blur-md shadow-lg landscape:rounded-xl landscape:border-white/10 landscape:bg-black/45 landscape:px-2.5 landscape:py-1.5">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300/90 landscape:sr-only">
                  <ImageIcon size={11} className="shrink-0 opacity-90" aria-hidden />
                  사진 노트
                </p>
                <p className="max-h-[2.75rem] overflow-y-auto text-sm leading-snug text-gray-100/95 whitespace-pre-line landscape:max-h-none landscape:overflow-hidden landscape:text-xs landscape:truncate">
                  {photoCaption}
                </p>
              </div>
            ) : (
              <div className="min-w-0 flex-1" aria-hidden />
            )}
            <button
              onClick={() => setSelectedImg(null)}
              aria-label="닫기"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] ring-2 ring-white/25 backdrop-blur-md transition-all touch-manipulation active:scale-95 hover:border-red-300/60 hover:bg-red-500/90 hover:ring-red-300/40 landscape:h-10 landscape:w-10"
            >
              <X size={26} strokeWidth={2.5} className="landscape:h-6 landscape:w-6" />
            </button>
          </div>

          <div
            className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 portrait:flex-1 landscape:absolute landscape:inset-0 landscape:z-0 landscape:px-14 landscape:py-1 touch-none"
            onTouchStart={onMobilePhotoTouchStart}
            onTouchEnd={onMobilePhotoTouchEnd}
            onTouchCancel={onMobilePhotoTouchCancel}
            onClick={(e) => {
              e.stopPropagation();
              if (suppressMobileTapRef.current) {
                suppressMobileTapRef.current = false;
                return;
              }
              if (e.ctrlKey || e.metaKey) return;
              setIsMobileUIHidden((prev) => !prev);
            }}
            onDoubleClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.stopPropagation();
                if (handleRemoveImage && selectedImg) {
                  handleRemoveImage(selectedImg);
                  setSelectedImg(null);
                }
              }
            }}
          >
            <img
              src={selectedImg.urls.regular}
              className="max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl animate-fade-in landscape:h-full landscape:w-full landscape:max-h-[100dvh] landscape:max-w-[100vw] landscape:rounded-none landscape:shadow-none"
              alt="full-view"
            />
          </div>

          {showNavControls && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={!canGoPrev}
                aria-label="이전 사진"
                className={`${mobileNavButtonClass(canGoPrev)} portrait:hidden landscape:absolute landscape:left-[max(0.5rem,env(safe-area-inset-left,0px))] landscape:top-1/2 landscape:z-[220] landscape:h-11 landscape:w-11 landscape:-translate-y-1/2 ${isUIHidden ? 'opacity-0 pointer-events-none' : ''}`}
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label="다음 사진"
                className={`${mobileNavButtonClass(canGoNext)} portrait:hidden landscape:absolute landscape:right-[max(0.5rem,env(safe-area-inset-right,0px))] landscape:top-1/2 landscape:z-[220] landscape:h-11 landscape:w-11 landscape:-translate-y-1/2 ${isUIHidden ? 'opacity-0 pointer-events-none' : ''}`}
              >
                <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
              </button>
            </>
          )}

          <div
            className={`relative z-[220] shrink-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-4 transition-opacity duration-300 portrait:static landscape:absolute landscape:inset-x-0 landscape:bottom-0 landscape:bg-gradient-to-t landscape:from-black/85 landscape:to-transparent landscape:px-3 landscape:pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] landscape:pt-2 ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedImg.user && (
              <div className="mb-3 flex justify-center portrait:flex landscape:hidden">
                <a
                  href={`${selectedImg.user.links?.html || '#' }?utm_source=Project_Days&utm_medium=referral`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs text-white/85 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white"
                >
                  <span>Photo by</span>
                  <span className="truncate font-semibold text-white">{selectedImg.user.name || 'Unknown'}</span>
                  <span>on Unsplash</span>
                </a>
              </div>
            )}

            <div className="flex items-center gap-3 landscape:justify-center landscape:gap-3">
              {showNavControls ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canGoPrev}
                  aria-label="이전 사진"
                  className={`${mobileNavButtonClass(canGoPrev)} h-12 w-12 portrait:flex landscape:hidden`}
                >
                  <ChevronLeft className="h-7 w-7" strokeWidth={2.5} />
                </button>
              ) : (
                <div className="h-12 w-12 shrink-0 portrait:block landscape:hidden" aria-hidden />
              )}

              <div className="flex min-w-0 flex-1 items-center justify-center gap-3 landscape:flex-none landscape:gap-2.5">
                {showNavControls && currentIndex >= 0 && (
                  <span className="shrink-0 text-sm font-semibold tabular-nums tracking-wide text-white/85 landscape:text-xs">
                    {currentIndex + 1} / {images.length}
                  </span>
                )}
                {selectedImg.user && (
                  <a
                    href={`${selectedImg.user.links?.html || '#' }?utm_source=Project_Days&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden max-w-[min(42vw,14rem)] shrink truncate rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] leading-none text-white/75 backdrop-blur-sm transition-all hover:bg-white/15 hover:text-white landscape:inline"
                    title={`Photo by ${selectedImg.user.name || 'Unknown'} on Unsplash`}
                  >
                    Photo by{' '}
                    <span className="font-semibold text-white/90">{selectedImg.user.name || 'Unknown'}</span>
                    {' '}on Unsplash
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDownload && handleDownload(selectedImg)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/90 backdrop-blur-md transition-all hover:bg-blue-600 hover:text-white landscape:h-10 landscape:w-10"
                  title="이미지 다운로드"
                  aria-label="이미지 다운로드"
                >
                  <Download size={20} />
                </button>
              </div>

              {showNavControls ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  aria-label="다음 사진"
                  className={`${mobileNavButtonClass(canGoNext)} h-12 w-12 portrait:flex landscape:hidden`}
                >
                  <ChevronRight className="h-7 w-7" strokeWidth={2.5} />
                </button>
              ) : (
                <div className="h-12 w-12 shrink-0 portrait:block landscape:hidden" aria-hidden />
              )}
            </div>
          </div>
          </div>
        </div>
      );
    }

    return (
    <div className={wrapperClassName}>
      <div className="relative w-full h-full flex items-center justify-center cursor-pointer md:cursor-default" onClick={(e) => {
          e.stopPropagation();
          if (e.ctrlKey || e.metaKey) return;
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

      {showNavControls && (
        <>
          <button onClick={handlePrev} disabled={!canGoPrev} aria-label="이전 사진" className={`absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${isUIHidden || !canGoPrev ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <button onClick={handleNext} disabled={!canGoNext} aria-label="다음 사진" className={`absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-black/40 border border-white/10 text-white rounded-full hover:bg-blue-600 transition-all z-[210] ${isUIHidden || !canGoNext ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </>
      )}

      <div
        className={`absolute flex items-center gap-3 z-[220] top-4 right-4 md:top-8 md:right-8 transition-opacity duration-300 ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => toggleFullScreen(fullScreenContainerRef)} className="hidden md:block p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl">
          {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20}/>}
        </button>
        <button
          onClick={isFullScreen ? closeImageKeepFullscreen : () => setSelectedImg(null)}
          aria-label="닫기"
          className="rounded-full border border-white/10 bg-black/50 p-3 text-white/50 shadow-xl transition-all hover:bg-red-500 hover:text-white"
        >
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
    );
  };

  return (
    <div
      ref={fullScreenContainerRef}
      className={`flex-1 h-full bg-[#05070a]/80 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}
    >
      {selectedImg ? (
        shouldUseMobilePortal
          ? createPortal(renderPhotoViewer(null, { mobilePortal: true }), document.body)
          : renderPhotoViewer(
              'w-full h-full relative animate-fade-in bg-black flex items-center justify-center overflow-hidden'
            )
      ) : (
        <div
          ref={scrollContainerRef}
          className={`w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar-blue relative ${placeScrollSurfaceClass} ${mobilePlaceHeaderScrollPadding} landscape:pt-[calc(3.25rem+env(safe-area-inset-top,0px))] md:pt-10 pb-28 landscape:pb-14 md:pb-6`}
        >

          {mobileSecondaryNav && (
            <div className="md:hidden shrink-0 px-2 pb-2 landscape:px-1.5 landscape:pb-1 landscape:pt-0 [&_button]:landscape:px-2.5 [&_button]:landscape:py-1 [&_span]:landscape:text-[10px]">
              {mobileSecondaryNav}
            </div>
          )}

          <div className="px-6 landscape:px-3">
            {placeOverviewText && (
              <div className="md:hidden mb-4 landscape:hidden">
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
                </div>
              </div>
            )}

            <div className={`${placeOverviewText ? 'mt-4' : 'mt-12'} landscape:mt-1 md:mt-0`}>
              {isImgLoading ? (
                <div className="grid grid-cols-2 gap-4 landscape:gap-2">
                   {[...Array(6)].map((_, i) => (
                     <div key={i} className="aspect-[3/4] animate-pulse bg-white/5 rounded-2xl border border-white/5" />
                   ))}
                </div>
              ) : (
                <div className="columns-2 gap-4 space-y-4 landscape:gap-2 landscape:space-y-2">
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

              {!isImgLoading && images.length > 0 && handleRefresh && (
                <div className="mt-8 landscape:mt-4 mb-2 flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onRefreshClick}
                    disabled={isImgLoading || refreshCooldownLeft > 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-white/45 hover:bg-blue-500/10 hover:text-blue-300/90 hover:border-blue-500/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
                    title={refreshCooldownLeft > 0 ? `${refreshCooldownLeft}초 후 다시 시도 가능` : 'Unsplash·Pexels에서 추가 사진 불러오기'}
                  >
                    <RefreshCw
                      size={14}
                      className={isImgLoading ? 'animate-spin' : refreshCooldownLeft > 0 ? '' : 'group-hover:rotate-180 transition-transform duration-500'}
                    />
                    {refreshCooldownLeft > 0
                      ? `${refreshCooldownLeft}초 후 다시 불러올 수 있어요`
                      : '더 많은 사진 불러오기'}
                  </button>
                  <p className="text-[10px] text-white/25">Unsplash · Pexels · {refreshCooldownSec}초에 한 번</p>
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
