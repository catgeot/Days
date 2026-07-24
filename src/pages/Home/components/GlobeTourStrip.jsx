import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, MapPin, Ticket, X } from 'lucide-react';
import GetYourGuideActivitiesWidget from '../../../components/PlaceCard/tabs/planner/components/GetYourGuideActivitiesWidget';
import { buildGygActivitiesSearchQuery } from '../../../components/PlaceCard/tabs/planner/locationRules';
import Logo from './Logo';

const LG_MQ = '(min-width: 1024px)';

function useIsLg() {
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LG_MQ).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(LG_MQ);
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return isLg;
}

function TourPanelHeader({ placeName = '', onClose, density = 'desktop' }) {
  const title = String(placeName || '').trim();
  const mobile = density === 'mobile';
  return (
    <header
      className={`shrink-0 border-b border-white/10 bg-black/90 backdrop-blur-md ${
        mobile
          ? 'px-3 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]'
          : 'px-4 py-3'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Logo size="stay" className="shrink-0" />
        <span
          className="hidden h-5 w-px shrink-0 bg-white/20 sm:block"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            {title ? (
              <MapPin
                size={mobile ? 15 : 14}
                className="shrink-0 text-orange-200/85"
                aria-hidden="true"
              />
            ) : null}
            <p
              className={`min-w-0 truncate font-bold text-orange-50 ${
                mobile ? 'text-sm' : 'text-[15px]'
              }`}
            >
              {title ? `${title} 투어` : '투어 찾기'}
            </p>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="투어 목록 닫기"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`flex shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white hover:bg-white/25 hover:border-white/50 active:scale-95 transition-all ${
              mobile ? 'h-10 w-10' : 'h-9 w-9'
            }`}
          >
            <X size={mobile ? 20 : 16} strokeWidth={2.5} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </header>
  );
}

/**
 * Summary 카드 좌측 「투어 찾기」탭 — q 있을 때만.
 * PC: 숙소와 동일 좌측 포털 · 모바일: fullscreen · 숙소와 상호 배타(peerOpen).
 */
export default function GlobeTourStrip({
  location,
  children,
  onExpandedChange,
  peerOpen = false,
}) {
  const isLg = useIsLg();
  const [expanded, setExpanded] = useState(false);
  const [listFullscreen, setListFullscreen] = useState(false);
  const [showDesktopScrollTop, setShowDesktopScrollTop] = useState(false);
  const [showMobileScrollTop, setShowMobileScrollTop] = useState(false);
  const desktopListScrollRef = useRef(null);
  const mobileListScrollRef = useRef(null);

  const gygQuery = useMemo(
    () => buildGygActivitiesSearchQuery(location),
    [
      location?.slug,
      location?.name,
      location?.name_en,
      location?.curation_data?.locationEn,
    ]
  );
  const eligible = Boolean(gygQuery) && !location?.isScanning;
  const name = location?.name || '';
  const placeKey = `${location?.slug || ''}|${name}|${location?.lat}|${location?.lng}`;
  const mobileOpen = !isLg && listFullscreen;
  const desktopOpen = Boolean(expanded && isLg);

  useEffect(() => {
    setExpanded(false);
    setListFullscreen(false);
  }, [placeKey]);

  useEffect(() => {
    if (!expanded) setListFullscreen(false);
  }, [expanded]);

  useEffect(() => {
    if (!peerOpen) return;
    setExpanded(false);
    setListFullscreen(false);
  }, [peerOpen]);

  useEffect(() => {
    onExpandedChange?.(Boolean(eligible && expanded));
  }, [eligible, expanded, onExpandedChange]);

  useEffect(() => {
    return () => {
      onExpandedChange?.(false);
    };
  }, [onExpandedChange]);

  useEffect(() => {
    if (!listFullscreen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [listFullscreen]);

  useEffect(() => {
    if (!desktopOpen) {
      setShowDesktopScrollTop(false);
      return undefined;
    }
    const el = desktopListScrollRef.current;
    if (!el) return undefined;
    const onScroll = () => setShowDesktopScrollTop(el.scrollTop > 180);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [desktopOpen, placeKey]);

  useEffect(() => {
    if (!mobileOpen) {
      setShowMobileScrollTop(false);
      return undefined;
    }
    const el = mobileListScrollRef.current;
    if (!el) return undefined;
    const onScroll = () => setShowMobileScrollTop(el.scrollTop > 180);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [mobileOpen, placeKey]);

  if (!eligible) {
    if (typeof children === 'function') {
      return children({
        tourTab: null,
        eligible: false,
        expanded: false,
        close: () => {},
      });
    }
    return null;
  }

  const open = () => {
    if (!isLg) {
      setExpanded(true);
      setListFullscreen(true);
      return;
    }
    setExpanded(true);
  };

  const close = () => {
    setListFullscreen(false);
    setExpanded(false);
  };

  const toggleOpen = () => {
    if (expanded) close();
    else open();
  };

  const tourTab = (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls="globe-tour-strip-panel"
      aria-label="투어 찾기"
      onClick={(e) => {
        e.stopPropagation();
        toggleOpen();
      }}
      className={`absolute -left-[2.15rem] top-1/2 z-[2] flex h-[7.25rem] w-[2.15rem] -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-l-xl border border-r-0 shadow-lg backdrop-blur-md transition-all ${
        expanded
          ? 'border-orange-300/50 bg-orange-500/30 text-orange-50'
          : 'border-orange-400/40 bg-orange-500/18 text-orange-100 hover:border-orange-300/50 hover:bg-orange-500/28'
      }`}
    >
      <Ticket size={15} className="shrink-0" aria-hidden="true" />
      <span
        className="text-[11px] font-bold tracking-wide"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        투어 찾기
      </span>
    </button>
  );

  const widget = (
    <GetYourGuideActivitiesWidget
      location={location}
      query={gygQuery}
      variant="open"
      showMoreLink
      linkSponsoredLabel
    />
  );

  const scrollTopBtnClass = (visible) =>
    `absolute bottom-7 right-4 z-10 flex h-10 items-center gap-1 rounded-full border border-sky-200/70 bg-sky-500 px-3 text-white shadow-[0_4px_20px_rgba(14,165,233,0.5)] transition-all duration-300 hover:bg-sky-400 hover:border-sky-100 active:scale-95 ${
      visible
        ? 'pointer-events-auto translate-y-0 opacity-100'
        : 'pointer-events-none translate-y-3 opacity-0'
    }`;

  const desktopPortal =
    desktopOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            id="globe-tour-strip-panel"
            role="region"
            aria-label="투어 목록"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[61] left-0 top-0 bottom-0 right-[calc(2rem+400px+0.75rem)] xl:right-[calc(2rem+440px+0.75rem)] flex flex-col overflow-hidden border-r border-white/10 bg-black/85 shadow-2xl backdrop-blur-xl"
          >
            <TourPanelHeader placeName={name} onClose={close} density="desktop" />
            <div
              ref={desktopListScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-16"
            >
              {widget}
            </div>
            <button
              type="button"
              aria-label="맨 위로"
              onClick={() => {
                desktopListScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={scrollTopBtnClass(showDesktopScrollTop)}
            >
              <ArrowUp size={16} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold">맨 위</span>
            </button>
          </div>,
          document.body
        )
      : null;

  const fullscreenPortal =
    mobileOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            id="globe-tour-strip-panel"
            role="dialog"
            aria-modal="true"
            aria-label="투어 전체 목록"
            className="fixed inset-0 z-[80] flex flex-col bg-black/95"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <TourPanelHeader placeName={name} onClose={close} density="mobile" />
            <div
              ref={mobileListScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-20"
            >
              {widget}
            </div>
            <button
              type="button"
              aria-label="맨 위로"
              onClick={() => {
                mobileListScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={scrollTopBtnClass(showMobileScrollTop)}
            >
              <ArrowUp size={16} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold">맨 위</span>
            </button>
          </div>,
          document.body
        )
      : null;

  if (typeof children === 'function') {
    return (
      <>
        {children({ tourTab, eligible: true, expanded, close })}
        {desktopPortal}
        {fullscreenPortal}
      </>
    );
  }

  return (
    <>
      {tourTab}
      {desktopPortal}
      {fullscreenPortal}
    </>
  );
}
