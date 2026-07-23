import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, X, ImageIcon, Download, RefreshCw, Sparkles, ArrowUp } from 'lucide-react';
import { mobilePlaceHeaderSpacerClass, mobilePlaceGalleryFooterScrollPadding, mobileLandscapeChromeHidden } from '../common/mobilePlaceHeaderInset';
import { placeScrollSurfaceClass } from '../common/placeScrollSurface';
import { usePlaceMediaScrollToTop } from '../common/usePlaceMediaScrollToTop';
import { useLightboxPinchTransform } from '../common/useLightboxPinchTransform';
import { getGalleryImageAttribution } from '../common/galleryImageAttribution';
import GalleryAttributionLink from '../common/GalleryAttributionLink';
import { splitPlaceOverview } from '../common/placeOverviewText';

/** 세로·터치 태블릿은 max-width, 가로 회전(높이 짧은 터치 기기)도 모바일 풀스크린 포털 유지 */
const MOBILE_GALLERY_LIGHTBOX_QUERY =
  '(max-width: 767px), ((max-width: 834px) and (hover: none) and (pointer: coarse)), ((max-height: 500px) and (orientation: landscape) and (hover: none) and (pointer: coarse))';

const TOUCH_DEVICE_QUERY = '(hover: none) and (pointer: coarse)';

const MOBILE_LANDSCAPE_IMMERSIVE_QUERY = '(max-width: 767px) and (orientation: landscape)';

/** 모바일 확대 포털 — 가로 스와이프 vs 탭(UI 토글) 구분 */
const MOBILE_SWIPE_THRESHOLD_PX = 48;
const MOBILE_SWIPE_DIRECTION_RATIO = 1.25;

/** 그리드 셀 — URL decode 전 검은 빈칸 방지 */
const GalleryGridTile = React.memo(function GalleryGridTile({
  img,
  index,
  eager = false,
  onOpen,
  onRemove,
  onBroken,
  onPainted,
}) {
  const [loaded, setLoaded] = useState(false);
  const paintedRef = useRef(false);
  const src = img?.urls?.small || img?.urls?.regular;
  const hasAspect = Boolean(img?.width && img?.height);

  useEffect(() => {
    setLoaded(false);
    paintedRef.current = false;
  }, [src]);

  const markPainted = useCallback(() => {
    if (paintedRef.current) return;
    paintedRef.current = true;
    onPainted?.(img);
  }, [img, onPainted]);

  return (
    <div
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) return;
        e.stopPropagation();
        onOpen?.(e);
      }}
      onDoubleClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.stopPropagation();
          if (onRemove) onRemove(img);
        }
      }}
      className="break-inside-avoid bg-white/[0.06] rounded-2xl border border-white/10 hover:border-blue-500/50 cursor-pointer transition-all duration-300 group relative overflow-hidden"
      style={hasAspect ? { aspectRatio: `${img.width} / ${img.height}` } : undefined}
    >
      {!loaded && (
        <div
          className={`absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.12] via-white/[0.05] to-transparent ${hasAspect ? '' : 'min-h-[140px]'}`}
          aria-hidden
        />
      )}
      <img
        src={src}
        className={`w-full transition-[opacity,transform] duration-500 group-hover:scale-105 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${hasAspect ? 'h-full object-cover absolute inset-0' : 'h-auto object-cover relative'}`}
        alt={`place-img-${index}`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        width={img.width || undefined}
        height={img.height || undefined}
        onLoad={() => {
          setLoaded(true);
          markPainted();
        }}
        onError={() => {
          markPainted();
          onBroken?.(img);
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <Maximize2 className="absolute top-4 right-4 text-white/80 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" size={20} />
    </div>
  );
});

const GalleryLoadingChrome = () => (
  <div
    className="sticky top-0 z-[40] mb-4 flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-blue-400/20 bg-[#0b1018]/92 px-4 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label="사진을 불러오는 중"
  >
    <div className="h-10 w-10 rounded-full border-[3px] border-blue-300/35 border-t-blue-300 animate-spin" />
    <p className="text-sm font-semibold text-white/85">사진을 불러오는 중...</p>
    <p className="text-center text-[11px] leading-relaxed text-white/45">
      국내 명소는 관광 사진 API를 준비하고 있어요
    </p>
  </div>
);

const mobileNavButtonClass = (enabled) =>
  `flex shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/80 text-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] ring-2 ring-white/25 backdrop-blur-md transition-all touch-manipulation active:scale-95 ${
    enabled ? 'hover:bg-blue-600/90 hover:border-blue-300/60' : 'opacity-45'
  }`;

const PlaceGalleryView = React.memo(({
  location,
  images,
  isImgLoading,
  isRefreshing = false,
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
  handleDropBrokenImage,
  mobileSecondaryNav = null
}) => {
  const fullScreenContainerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const mobileSwipeStartRef = useRef(null);
  const suppressMobileTapRef = useRef(false);
  /** 그리드 클릭 직후 라이트박스에 같은 클릭이 전달되어 즉시 닫히는 것 방지 */
  const suppressOpenClickRef = useRef(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollGalleryToTop = usePlaceMediaScrollToTop('GALLERY', scrollContainerRef, !selectedImg);
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
  const [isMobileLandscapeImmersive, setIsMobileLandscapeImmersive] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_LANDSCAPE_IMMERSIVE_QUERY).matches
  );
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_GALLERY_LIGHTBOX_QUERY).matches
  );
  const [isTouchDevice, setIsTouchDevice] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(TOUCH_DEVICE_QUERY).matches
  );
  const [refreshCooldownLeft, setRefreshCooldownLeft] = useState(0);
  /** 최초 진입 decode 전용 — 더보기로 목록이 늘어도 다시 스켈레톤/크롬을 띄우지 않음 */
  const [paintedCount, setPaintedCount] = useState(0);
  const [galleryVisuallyReady, setGalleryVisuallyReady] = useState(false);
  const galleryPlaceKey = useMemo(
    () => location?.slug || location?.id || location?.name || '',
    [location?.slug, location?.id, location?.name],
  );
  const paintTarget = Math.min(2, images?.length || 0);
  const hasImages = images.length > 0;
  /** 초기 로드만 전체 스켈레톤 — 더보기(isRefreshing) 중에는 기존 그리드 유지 */
  const showInitialSkeleton = Boolean(isImgLoading && !hasImages && !isRefreshing);
  const isPaintPending = Boolean(
    !isImgLoading &&
      !isRefreshing &&
      !galleryVisuallyReady &&
      paintTarget > 0 &&
      paintedCount < paintTarget,
  );
  const showLoadingChrome = Boolean(showInitialSkeleton || isPaintPending);
  const showRefreshButton = Boolean(hasImages && handleRefresh && !showInitialSkeleton);

  useEffect(() => {
    setPaintedCount(0);
    setGalleryVisuallyReady(false);
  }, [galleryPlaceKey]);

  useEffect(() => {
    if (paintedCount >= paintTarget && paintTarget > 0) {
      setGalleryVisuallyReady(true);
    }
  }, [paintedCount, paintTarget]);

  /** decode/onLoad 누락 시 스피너·버튼 숨김이 고착되지 않게 */
  useEffect(() => {
    if (!isPaintPending || paintTarget <= 0) return undefined;
    const t = window.setTimeout(() => {
      setPaintedCount((n) => Math.max(n, paintTarget));
      setGalleryVisuallyReady(true);
    }, 8000);
    return () => window.clearTimeout(t);
  }, [isPaintPending, paintTarget, galleryPlaceKey]);

  const onTilePainted = useCallback(() => {
    setPaintedCount((n) => n + 1);
  }, []);

  const {
    transformStyle,
    isZoomed,
    onPinchTouchStart,
    onPinchTouchMove,
    onPinchTouchEnd,
    onPinchTouchCancel,
  } = useLightboxPinchTransform(selectedImg?.id);

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
  }, [getRefreshCooldownRemaining, isImgLoading, galleryPlaceKey]);

  const onRefreshClick = useCallback(() => {
    if (isImgLoading || isRefreshing || refreshCooldownLeft > 0 || !handleRefresh) return;
    const started = handleRefresh();
    if (started && getRefreshCooldownRemaining) {
      setRefreshCooldownLeft(getRefreshCooldownRemaining());
    }
  }, [handleRefresh, getRefreshCooldownRemaining, isImgLoading, isRefreshing, refreshCooldownLeft]);

  useEffect(() => {
    queueMicrotask(() => setIsMobileUIHidden(false));
  }, [selectedImg]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_LANDSCAPE_IMMERSIVE_QUERY);
    const sync = () => setIsMobileLandscapeImmersive(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_GALLERY_LIGHTBOX_QUERY);
    const handleResize = () => {
      if (!mq.matches) setIsMobileUIHidden(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedImg) {
      setShowScrollToTop(false);
      return;
    }
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 280;
    const onScroll = () => setShowScrollToTop(el.scrollTop > threshold);
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [selectedImg, images.length, isImgLoading]);

  const handlePrev = useCallback((e) => {
    e?.stopPropagation();
    if (currentIndex > 0) setSelectedImg(images[currentIndex - 1]);
  }, [currentIndex, images, setSelectedImg]);

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) setSelectedImg(images[currentIndex + 1]);
  }, [currentIndex, images, setSelectedImg]);

  const onMobilePhotoTouchStart = useCallback((e) => {
    onPinchTouchStart(e);
    if (!showNavControls || e.touches.length !== 1 || isZoomed()) return;
    const t = e.touches[0];
    mobileSwipeStartRef.current = { x: t.clientX, y: t.clientY };
    suppressMobileTapRef.current = false;
  }, [showNavControls, isZoomed, onPinchTouchStart]);

  const onMobilePhotoTouchEnd = useCallback((e) => {
    onPinchTouchEnd(e);
    const start = mobileSwipeStartRef.current;
    mobileSwipeStartRef.current = null;
    if (!start || !showNavControls || isZoomed()) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < MOBILE_SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * MOBILE_SWIPE_DIRECTION_RATIO) return;

    suppressMobileTapRef.current = true;
    if (dx > 0) handlePrev();
    else handleNext();
  }, [showNavControls, handlePrev, handleNext, isZoomed, onPinchTouchEnd]);

  const onMobilePhotoTouchCancel = useCallback(() => {
    onPinchTouchCancel();
    mobileSwipeStartRef.current = null;
  }, [onPinchTouchCancel]);

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

  const isUIHidden = (!showUI && isFullScreen) || isMobileUIHidden || isMobileLandscapeImmersive;

  const { curation: curationOverview, fixed: fixedOverview, originalQuery: overviewQuery } =
    useMemo(() => splitPlaceOverview(location), [location]);
  const hasPlaceOverview = Boolean(curationOverview || fixedOverview);

  const photoCaption = useMemo(() => {
    if (!selectedImg) return '';
    const raw = (selectedImg.alt_description || selectedImg.description || '').trim();
    if (!raw) return '';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [selectedImg]);

  const photoAttribution = useMemo(
    () => (selectedImg ? getGalleryImageAttribution(selectedImg) : null),
    [selectedImg],
  );

  const renderAttributionLinks = (wrapperClassName, linkClassName = '') => {
    if (!photoAttribution || !selectedImg) return null;
    return (
      <span className={wrapperClassName} title={photoAttribution.title}>
        <span>Photo by</span>
        <GalleryAttributionLink
          href={photoAttribution.photographerHref || photoAttribution.href}
          location={location}
          image={selectedImg}
          context="gallery"
          className={`truncate font-semibold text-white hover:underline ${linkClassName}`}
        >
          {photoAttribution.authorName}
        </GalleryAttributionLink>
        <span>on</span>
        <GalleryAttributionLink
          href={photoAttribution.providerHref}
          location={location}
          image={selectedImg}
          context="gallery"
          className={`shrink-0 font-semibold text-white hover:underline ${linkClassName}`}
        >
          {photoAttribution.providerName}
        </GalleryAttributionLink>
      </span>
    );
  };

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
            onTouchMove={onPinchTouchMove}
            onTouchEnd={onMobilePhotoTouchEnd}
            onTouchCancel={onMobilePhotoTouchCancel}
            onClick={(e) => {
              e.stopPropagation();
              if (suppressOpenClickRef.current) return;
              if (suppressMobileTapRef.current) {
                suppressMobileTapRef.current = false;
                return;
              }
              if (e.ctrlKey || e.metaKey) return;
              if (isMobileLandscapeImmersive) return;
              if (isZoomed()) return;
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
              style={transformStyle}
              alt="full-view"
              referrerPolicy="no-referrer"
              onError={() => handleDropBrokenImage?.(selectedImg)}
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
            {photoAttribution && (
              <div className="mb-3 flex justify-center portrait:flex landscape:hidden">
                {renderAttributionLinks(
                  'flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs text-white/85 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white'
                )}
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
                {photoAttribution && (
                  renderAttributionLinks(
                    'hidden max-w-[min(42vw,14rem)] shrink truncate rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] leading-none text-white/75 backdrop-blur-sm transition-all hover:bg-white/15 hover:text-white landscape:inline'
                  )
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
      <div className="relative w-full h-full flex items-center justify-center cursor-pointer" onClick={(e) => {
          e.stopPropagation();
          if (suppressOpenClickRef.current) return;
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
      }}>
          <img
            src={selectedImg.urls.regular}
            className={`relative max-w-[90%] max-h-[90%] object-contain shadow-2xl rounded-lg select-none animate-fade-in ${isFullScreen ? 'scale-105' : 'scale-100'}`}
            alt="full-view"
            referrerPolicy="no-referrer"
            onError={() => handleDropBrokenImage?.(selectedImg)}
          />
      </div>

      {showNavControls && (
        <div
          className={`absolute inset-x-0 z-[220] flex items-center px-4 transition-opacity duration-300 ${
            isFullScreen
              ? 'bottom-4 justify-center gap-[calc(0.75rem+3rem)] md:bottom-0 md:gap-[calc(1rem+2.75rem)] md:px-6 md:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:pt-2'
              : 'bottom-4 gap-3 md:bottom-8 md:px-8'
          } ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoPrev}
            aria-label="이전 사진"
            className={`${mobileNavButtonClass(canGoPrev)} h-12 w-12 md:h-11 md:w-11`}
          >
            <ChevronLeft className="h-7 w-7 md:h-6 md:w-6" strokeWidth={2.5} />
          </button>

          <div className={`flex min-w-0 items-center justify-center gap-3 ${isFullScreen ? '' : 'flex-1'}`}>
            {currentIndex >= 0 && (
              <span
                className="shrink-0 rounded-full border border-white/10 bg-black/50 px-3.5 py-1.5 text-sm font-semibold tabular-nums tracking-wide text-white/90 shadow-xl backdrop-blur-md"
                aria-live="polite"
                aria-atomic="true"
              >
                {currentIndex + 1} / {images.length}
              </span>
            )}
            <button
              type="button"
              onClick={() => handleDownload && handleDownload(selectedImg)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/90 backdrop-blur-md transition-all hover:bg-blue-600 hover:text-white"
              title="이미지 다운로드"
              aria-label="이미지 다운로드"
            >
              <Download size={20} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="다음 사진"
            className={`${mobileNavButtonClass(canGoNext)} h-12 w-12 md:h-11 md:w-11`}
          >
            <ChevronRight className="h-7 w-7 md:h-6 md:w-6" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {!showNavControls && currentIndex >= 0 && (
        <div
          className={`absolute bottom-4 left-1/2 z-[220] -translate-x-1/2 transition-opacity duration-300 ${isFullScreen ? 'md:bottom-0 md:mb-[max(0.75rem,env(safe-area-inset-bottom,0px))]' : 'md:bottom-8'} ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onClick={(e) => e.stopPropagation()}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="rounded-full border border-white/10 bg-black/50 px-3.5 py-1.5 text-sm font-semibold tabular-nums tracking-wide text-white/90 shadow-xl backdrop-blur-md">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {isFullScreen && photoAttribution && (
        <div
          className={`absolute z-[220] max-w-[min(calc(100%-7.5rem),38rem)] transition-opacity duration-300 top-4 left-4 md:top-[max(0.5rem,env(safe-area-inset-top,0px))] md:left-[max(0.75rem,5%)] ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {renderAttributionLinks(
            'inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white md:px-4 md:py-2 md:text-sm'
          )}
        </div>
      )}

      <div
        className={`absolute z-[220] flex items-start gap-3 transition-opacity duration-300 top-4 right-4 md:top-[max(0.5rem,env(safe-area-inset-top,0px))] md:right-3 justify-end ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={() => toggleFullScreen(fullScreenContainerRef)}
          aria-label={isFullScreen ? '전체화면 종료' : '전체화면'}
          className="hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/75 text-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] ring-2 ring-white/25 backdrop-blur-md transition-all hover:border-blue-300/60 hover:bg-blue-600/90 hover:ring-blue-300/40"
        >
          {isFullScreen ? <Minimize2 size={22} strokeWidth={2.25} /> : <Maximize2 size={22} strokeWidth={2.25} />}
        </button>
        <button
          type="button"
          onClick={isFullScreen ? closeImageKeepFullscreen : () => setSelectedImg(null)}
          aria-label="닫기"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/75 text-white shadow-[0_4px_24px_rgba(0,0,0,0.55)] ring-2 ring-white/25 backdrop-blur-md transition-all hover:border-red-300/60 hover:bg-red-500/90 hover:ring-red-300/40 md:h-11 md:w-11"
        >
          <X size={22} strokeWidth={2.5} />
        </button>
        </div>
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

      {!showNavControls && (
      <div className={`absolute bottom-4 right-4 z-[220] transition-opacity duration-300 ${isFullScreen ? 'md:bottom-0 md:right-3 md:mb-[max(0.75rem,env(safe-area-inset-bottom,0px))]' : 'md:bottom-8 md:right-8'} ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => handleDownload && handleDownload(selectedImg)}
          className="flex items-center gap-2 p-3 md:px-4 md:py-2 bg-black/50 backdrop-blur-md border border-white/10 text-white/80 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl"
          title="이미지 다운로드"
        >
          <Download size={20} />
          <span className="hidden md:block text-sm font-medium pr-1">다운로드</span>
        </button>
      </div>
      )}
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
        <div className="w-full h-full flex flex-col min-h-0">
          <div className={mobilePlaceHeaderSpacerClass} aria-hidden="true" />
          <div
            ref={scrollContainerRef}
            className={`flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden custom-scrollbar-blue relative ${placeScrollSurfaceClass} md:pt-10 ${mobilePlaceGalleryFooterScrollPadding} md:pb-6`}
          >

          {mobileSecondaryNav && (
            <div className={`md:hidden shrink-0 px-2 pb-2 ${mobileLandscapeChromeHidden}`}>
              {mobileSecondaryNav}
            </div>
          )}

          <div className="px-6 max-md:landscape:px-3">
            {hasPlaceOverview && (
              <div className={`md:hidden mb-4 ${mobileLandscapeChromeHidden}`}>
                <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3.5 backdrop-blur-md shadow-inner space-y-3">
                  {(overviewQuery || curationOverview) && (
                    <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2.5">
                      {overviewQuery && (
                        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-violet-200/95">
                          <Sparkles size={12} className="shrink-0 text-violet-300" aria-hidden />
                          <span className="min-w-0 line-clamp-2">
                            「{overviewQuery}」에서 이 여행지로
                          </span>
                        </p>
                      )}
                      {curationOverview && (
                        <p className="text-[13px] leading-relaxed text-violet-50/95 whitespace-pre-line">
                          {curationOverview}
                        </p>
                      )}
                    </div>
                  )}
                  {fixedOverview && (
                    <p className="text-[13px] leading-relaxed text-gray-100/95 whitespace-pre-line">
                      {fixedOverview}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className={`${hasPlaceOverview ? 'mt-4' : 'mt-12'} max-md:landscape:mt-0 md:mt-0`}>
              {showLoadingChrome && <GalleryLoadingChrome />}

              {showInitialSkeleton ? (
                <div className="grid grid-cols-2 gap-4" aria-hidden>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] animate-pulse rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.14] via-white/[0.06] to-white/[0.02]"
                      style={{ animationDelay: `${i * 90}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="columns-2 gap-4 space-y-4">
                  {images.map((img, i) => (
                    <GalleryGridTile
                      key={img.id || i}
                      img={img}
                      index={i}
                      eager={i < 4}
                      onPainted={onTilePainted}
                      onOpen={() => {
                        suppressOpenClickRef.current = true;
                        setSelectedImg(img);
                        window.requestAnimationFrame(() => {
                          suppressOpenClickRef.current = false;
                        });
                      }}
                      onRemove={handleRemoveImage}
                      onBroken={handleDropBrokenImage}
                    />
                  ))}
                </div>
              )}

              {showRefreshButton && (
                <div className="mt-8 mb-2 flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onRefreshClick}
                    disabled={isRefreshing || refreshCooldownLeft > 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-white/45 hover:bg-blue-500/10 hover:text-blue-300/90 hover:border-blue-500/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
                    title={
                      isRefreshing
                        ? '추가 사진을 불러오는 중'
                        : refreshCooldownLeft > 0
                          ? `${refreshCooldownLeft}초 후 다시 시도 가능`
                          : 'Unsplash·Pexels에서 추가 사진 불러오기'
                    }
                  >
                    <RefreshCw
                      size={14}
                      className={
                        isRefreshing
                          ? 'animate-spin'
                          : refreshCooldownLeft > 0
                            ? ''
                            : 'group-hover:rotate-180 transition-transform duration-500'
                      }
                    />
                    {isRefreshing
                      ? '추가 사진을 불러오는 중...'
                      : refreshCooldownLeft > 0
                        ? `${refreshCooldownLeft}초 후 다시 불러올 수 있어요`
                        : '더 많은 사진 불러오기'}
                  </button>
                  <p className="text-[10px] text-white/25">Unsplash · Pexels · {refreshCooldownSec}초에 한 번</p>
                </div>
              )}

              {!showInitialSkeleton && !isPaintPending && images.length === 0 && (
                <div className="w-full h-[300px] flex flex-col items-center justify-center text-white/20 gap-4">
                  <ImageIcon size={48} />
                  <p className="text-sm">등록된 이미지가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
      {showScrollToTop && !selectedImg && createPortal(
        <button
          type="button"
          onClick={scrollGalleryToTop}
          className={`fixed z-[170] flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.55)] ring-2 ring-white transition-colors hover:bg-blue-500 active:scale-95 bottom-24 right-3 sm:right-4 md:bottom-8 md:right-8 md:h-auto md:w-auto md:gap-1.5 md:px-4 md:py-2.5 touch-manipulation ${mobileLandscapeChromeHidden}`}
          aria-label="갤러리 맨 위로"
        >
          <ArrowUp size={22} className="shrink-0" strokeWidth={2.5} />
          <span className="hidden md:inline text-sm font-bold">맨 위</span>
        </button>,
        document.body
      )}
    </div>
  );
});

export default PlaceGalleryView;
