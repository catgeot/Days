import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, BedDouble, ChevronRight, MapPin, Ticket, X } from 'lucide-react';
import GetYourGuideActivitiesWidget from '../../../components/PlaceCard/tabs/planner/components/GetYourGuideActivitiesWidget';
import MrtTnaActivitiesWidget from '../../../components/PlaceCard/tabs/planner/components/MrtTnaActivitiesWidget';
import { buildGygActivitiesSearchQuery } from '../../../components/PlaceCard/tabs/planner/locationRules';
import { canShowMrtStayStrip } from '../../../utils/mrtStayQuery';
import { canShowMrtTnaStrip } from '../../../utils/mrtTnaQuery';
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
            className={`flex shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-white/15 text-white hover:bg-white/25 hover:border-white active:scale-95 transition-all ${
              mobile ? 'h-10 w-10' : 'mr-10 h-9 w-9'
            }`}
          >
            <X size={mobile ? 20 : 16} strokeWidth={2.5} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </header>
  );
}

function TourPanelIntro() {
  return (
    <div className="mb-5 rounded-2xl border border-orange-400/25 bg-orange-500/10 px-3 py-2.5">
      <p className="text-center text-sm font-semibold leading-snug text-orange-100/80 break-keep">
        현지에서 즐길 투어·액티비티를 골라보세요
      </p>
    </div>
  );
}

/** 투어 → 숙소 모달 전환 (인라인 목록 없음) */
function TourSwitchToStayFooter({ onSwitch }) {
  if (typeof onSwitch !== 'function') return null;
  return (
    <div className="mt-6 flex w-full flex-col items-center border-t border-white/10 pt-5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSwitch();
        }}
        className="inline-flex max-w-full items-center justify-center gap-2 rounded-xl border border-amber-300/40 bg-amber-500/15 px-4 py-3 text-[13px] font-semibold text-amber-50 shadow-[0_2px_12px_rgba(245,158,11,0.12)] backdrop-blur-sm transition-colors hover:border-amber-200/55 hover:bg-amber-500/25 active:scale-[0.98]"
      >
        <BedDouble size={16} className="shrink-0 text-amber-200/90" strokeWidth={2.25} aria-hidden />
        <span className="break-keep">편하게 묵을 숙소를 알아보세요</span>
      </button>
    </div>
  );
}

/**
 * Summary 카드 좌측 「투어 찾기」탭 — 국내=MRT TNA · 해외=GYG q.
 * PC: 숙소와 동일 좌측 포털 · 모바일: fullscreen · 숙소와 상호 배타(peerOpen).
 */
export default function GlobeTourStrip({
  location,
  children,
  onExpandedChange,
  peerOpen = false,
  /** 외부에서 투어 모달 열기 (숙소→투어 CTA). 0 무시, 증가 시에만 */
  openSignal = 0,
  /** 숙소 스트립 가능 시 하단 전환 */
  onSwitchToStay = null,
}) {
  const isLg = useIsLg();
  const [expanded, setExpanded] = useState(false);
  const [listFullscreen, setListFullscreen] = useState(false);
  const [showDesktopScrollTop, setShowDesktopScrollTop] = useState(false);
  const [showMobileScrollTop, setShowMobileScrollTop] = useState(false);
  const desktopListScrollRef = useRef(null);
  const mobileListScrollRef = useRef(null);

  const useMrtTna = useMemo(
    () => canShowMrtTnaStrip(location),
    [
      location?.slug,
      location?.name,
      location?.name_en,
      location?.name_ko,
      location?.country,
      location?.country_en,
      location?.parentCity,
      location?.isScanning,
    ]
  );
  const gygQuery = useMemo(
    () => (useMrtTna ? null : buildGygActivitiesSearchQuery(location)),
    [
      useMrtTna,
      location?.slug,
      location?.name,
      location?.name_en,
      location?.curation_data?.locationEn,
    ]
  );
  const eligible =
    !location?.isScanning && (useMrtTna || Boolean(gygQuery));
  const peerStayEligible = useMemo(
    () => canShowMrtStayStrip(location) && !location?.isScanning,
    [
      location?.slug,
      location?.name,
      location?.country,
      location?.country_en,
      location?.isScanning,
      location?.lat,
      location?.lng,
    ]
  );
  const showPeerStayCta = Boolean(onSwitchToStay) && peerStayEligible;
  const name = location?.name || '';
  const placeKey = `${location?.slug || ''}|${name}|${location?.lat}|${location?.lng}|${useMrtTna ? 'mrt' : 'gyg'}`;
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
    if (!openSignal || !eligible) return;
    if (!isLg) {
      setExpanded(true);
      setListFullscreen(true);
      return;
    }
    setExpanded(true);
  }, [openSignal, eligible, isLg]);

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

  /** PC 모달 열림: 써머리 쪽으로 접혀 모달 위에 보이며, 클릭 시 닫기 */
  const tourTabFolded = Boolean(expanded && isLg);

  const tourTab = (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls="globe-tour-strip-panel"
      aria-label={tourTabFolded ? '투어 목록 닫기' : '투어 찾기'}
      onClick={(e) => {
        e.stopPropagation();
        toggleOpen();
      }}
      className={`absolute top-1/2 z-[2] flex h-[7.25rem] w-[2.15rem] -translate-y-1/2 flex-col items-center justify-center gap-1.5 border shadow-[0_4px_16px_rgba(249,115,22,0.28)] backdrop-blur-md transition-all duration-300 ${
        tourTabFolded
          ? '-left-[2.15rem] rounded-l-xl border-r-0 border-orange-100/80 bg-orange-500/55 text-orange-50 hover:bg-orange-500/65'
          : `-left-[2.15rem] rounded-l-xl border-r-0 ${
              expanded
                ? 'border-orange-200/70 bg-orange-500/42 text-orange-50'
                : 'border-orange-300/55 bg-orange-500/30 text-orange-50 hover:border-orange-200/70 hover:bg-orange-500/40'
            }`
      }`}
    >
      {tourTabFolded ? (
        <ChevronRight size={16} className="shrink-0" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <Ticket size={16} className="shrink-0" strokeWidth={2.25} aria-hidden="true" />
      )}
      <span
        className="text-[12px] font-bold tracking-wide"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {tourTabFolded ? '닫기' : '투어 찾기'}
      </span>
    </button>
  );

  const widget = useMrtTna ? (
    <MrtTnaActivitiesWidget
      key={placeKey}
      location={location}
      variant="open"
      showMoreLink
      linkSponsoredLabel
    />
  ) : (
    <GetYourGuideActivitiesWidget
      location={location}
      query={gygQuery}
      variant="open"
      showMoreLink
      linkSponsoredLabel
    />
  );

  const tourScrollCss = `
      .globe-tour-strip-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgba(249, 115, 22, 0.45) rgba(255, 255, 255, 0.08);
      }
      .globe-tour-strip-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .globe-tour-strip-scroll::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.06);
        border-radius: 9999px;
      }
      .globe-tour-strip-scroll::-webkit-scrollbar-thumb {
        background: rgba(249, 115, 22, 0.45);
        border-radius: 9999px;
      }
    `;

  const desktopPortal =
    desktopOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            id="globe-tour-strip-panel"
            role="region"
            aria-label="투어 목록"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[61] left-0 top-0 bottom-0 right-[calc(2rem+400px+0.75rem)] xl:right-[calc(2rem+440px+0.75rem)] flex flex-col overflow-hidden border-2 border-orange-200/35 bg-black/85 shadow-[0_0_28px_rgba(249,115,22,0.16)] backdrop-blur-xl"
          >
            <TourPanelHeader placeName={name} onClose={close} density="desktop" />
            <div
              ref={desktopListScrollRef}
              className="globe-tour-strip-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-16"
            >
              <style>{tourScrollCss}</style>
              {useMrtTna ? null : <TourPanelIntro />}
              {widget}
              {showPeerStayCta ? (
                <TourSwitchToStayFooter onSwitch={onSwitchToStay} />
              ) : null}
            </div>
            <button
              type="button"
              aria-label="맨 위로"
              onClick={() => {
                desktopListScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`absolute bottom-7 right-4 z-10 flex h-10 items-center gap-1 rounded-full border border-orange-300/50 bg-orange-500 px-3 text-black shadow-[0_4px_20px_rgba(249,115,22,0.45)] transition-all duration-300 hover:bg-orange-400 active:scale-95 ${
                showDesktopScrollTop
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-3 opacity-0'
              }`}
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
              className="globe-tour-strip-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+3.75rem))]"
            >
              <style>{tourScrollCss}</style>
              {useMrtTna ? null : <TourPanelIntro />}
              {widget}
              {showPeerStayCta ? (
                <TourSwitchToStayFooter onSwitch={onSwitchToStay} />
              ) : null}
            </div>
            <button
              type="button"
              aria-label="맨 위로"
              onClick={() => {
                mobileListScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`absolute bottom-[max(2.25rem,calc(env(safe-area-inset-bottom)+1rem))] right-3 z-10 flex h-11 items-center gap-1 rounded-full border border-orange-300/50 bg-orange-500 px-3.5 text-black shadow-[0_4px_20px_rgba(249,115,22,0.45)] transition-all duration-300 active:scale-95 ${
                showMobileScrollTop
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-3 opacity-0'
              }`}
            >
              <ArrowUp size={18} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
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
