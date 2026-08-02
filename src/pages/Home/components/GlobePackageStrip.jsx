import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ExternalLink, Luggage, MapPin, X } from 'lucide-react';
import {
  buildMrtPkcHomeUrl,
  buildMrtPkcUrlForLocation,
  resolveMrtPackageThemeForLocation,
} from '../../../utils/mrtPackageLinks';
import {
  canShowMrtPackageStrip,
  resolveMrtPackageSearchKeyword,
} from '../../../utils/mrtPackageQuery';
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

function PackagePanelHeader({ placeName = '', onClose, density = 'desktop' }) {
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
                className="shrink-0 text-teal-200/85"
                aria-hidden="true"
              />
            ) : null}
            <p
              className={`min-w-0 truncate font-bold text-teal-50 ${
                mobile ? 'text-sm' : 'text-[15px]'
              }`}
            >
              {title ? `${title} 패키지` : '패키지 찾기'}
            </p>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="패키지 패널 닫기"
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

function PackageCtaButton({ href, label, primary = false }) {
  if (!href || !label) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-semibold transition-colors active:scale-[0.98] ${
        primary
          ? 'border-teal-300/45 bg-teal-500/25 text-teal-50 shadow-[0_2px_12px_rgba(20,184,166,0.18)] hover:border-teal-200/60 hover:bg-teal-500/35'
          : 'border-white/15 bg-white/[0.06] text-white/90 hover:border-white/25 hover:bg-white/[0.1]'
      }`}
    >
      <span className="min-w-0 break-keep text-center">{label}</span>
      <ExternalLink size={14} className="shrink-0 opacity-80" aria-hidden />
    </a>
  );
}

/**
 * Summary 카드 좌측 「패키지」탭 — /pkc 딥링크 모달 (목록 API 없음).
 * 투어 탭 위쪽에 나란히 배치 · 숙소·투어와 상호 배타(peerOpen).
 */
export default function GlobePackageStrip({
  location,
  children,
  onExpandedChange,
  peerOpen = false,
  openSignal = 0,
}) {
  const isLg = useIsLg();
  const [expanded, setExpanded] = useState(false);
  const [listFullscreen, setListFullscreen] = useState(false);
  const desktopListScrollRef = useRef(null);
  const mobileListScrollRef = useRef(null);

  const eligible = useMemo(
    () => canShowMrtPackageStrip(location),
    [
      location?.slug,
      location?.name,
      location?.name_ko,
      location?.name_en,
      location?.country,
      location?.country_en,
      location?.isScanning,
    ]
  );
  const keyword = useMemo(
    () => resolveMrtPackageSearchKeyword(location),
    [location?.name, location?.name_ko, location?.name_en, location?.slug]
  );
  const placeSearchUrl = useMemo(
    () =>
      buildMrtPkcUrlForLocation(location, {
        utmContent: 'summary-package-place',
      }),
    [location?.slug, location?.name, location?.name_ko, location?.name_en]
  );
  const themeCta = useMemo(
    () =>
      resolveMrtPackageThemeForLocation(location, {
        utmContent: 'summary-package-theme',
      }),
    [location?.slug, location?.country, location?.country_en, location?.name]
  );
  const homeUrl = useMemo(
    () => buildMrtPkcHomeUrl({ utmContent: 'summary-package-home' }),
    []
  );
  const name = location?.name || '';
  const placeKey = `${location?.slug || ''}|${name}|pkc`;
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

  if (!eligible) {
    if (typeof children === 'function') {
      return children({
        packageTab: null,
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

  const packageTabFolded = Boolean(expanded && isLg);

  const packageTab = (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls="globe-package-strip-panel"
      aria-label={packageTabFolded ? '패키지 패널 닫기' : '패키지 찾기'}
      onClick={(e) => {
        e.stopPropagation();
        toggleOpen();
      }}
      className={`absolute z-[2] flex h-[7.25rem] w-[2.15rem] -translate-y-1/2 flex-col items-center justify-center gap-1.5 border shadow-[0_4px_16px_rgba(20,184,166,0.28)] backdrop-blur-md transition-all duration-300 ${
        packageTabFolded
          ? 'top-[calc(50%-7.5rem)] -left-[2.15rem] rounded-l-xl border-r-0 border-teal-100/80 bg-teal-500/55 text-teal-50 hover:bg-teal-500/65'
          : `top-[calc(50%-7.5rem)] -left-[2.15rem] rounded-l-xl border-r-0 ${
              expanded
                ? 'border-teal-200/70 bg-teal-500/42 text-teal-50'
                : 'border-teal-300/55 bg-teal-500/30 text-teal-50 hover:border-teal-200/70 hover:bg-teal-500/40'
            }`
      }`}
    >
      {packageTabFolded ? (
        <ChevronRight size={16} className="shrink-0" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <Luggage size={16} className="shrink-0" strokeWidth={2.25} aria-hidden="true" />
      )}
      <span
        className="text-[12px] font-bold tracking-wide"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {packageTabFolded ? '닫기' : '패키지'}
      </span>
    </button>
  );

  const panelBody = (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-400/25 bg-teal-500/10 px-3 py-2.5">
        <p className="text-center text-sm font-semibold leading-snug text-teal-100/85 break-keep">
          항공·호텔이 묶인 패키지를 마이리얼트립에서 찾아보세요
        </p>
      </div>
      <PackageCtaButton
        href={placeSearchUrl}
        label={keyword ? `${keyword} 패키지 검색` : '패키지 검색'}
        primary
      />
      {themeCta?.url ? (
        <PackageCtaButton href={themeCta.url} label={themeCta.ctaLabel} />
      ) : null}
      <PackageCtaButton href={homeUrl} label="패키지 홈 둘러보기" />
      <p className="text-center text-[11px] text-white/40 break-keep">
        제휴 · 마이리얼트립 패키지 (새 탭)
      </p>
    </div>
  );

  const desktopPortal =
    desktopOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            id="globe-package-strip-panel"
            role="region"
            aria-label="패키지 안내"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[61] left-0 top-0 bottom-0 right-[calc(2rem+400px+0.75rem)] xl:right-[calc(2rem+440px+0.75rem)] flex flex-col overflow-hidden border-2 border-teal-200/35 bg-black/85 shadow-[0_0_28px_rgba(20,184,166,0.16)] backdrop-blur-xl"
          >
            <PackagePanelHeader placeName={name} onClose={close} density="desktop" />
            <div
              ref={desktopListScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-16"
            >
              {panelBody}
            </div>
          </div>,
          document.body
        )
      : null;

  const fullscreenPortal =
    mobileOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            id="globe-package-strip-panel"
            role="dialog"
            aria-modal="true"
            aria-label="패키지 안내"
            className="fixed inset-0 z-[80] flex flex-col bg-black/95"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <PackagePanelHeader placeName={name} onClose={close} density="mobile" />
            <div
              ref={mobileListScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+3.75rem))]"
            >
              {panelBody}
            </div>
          </div>,
          document.body
        )
      : null;

  if (typeof children === 'function') {
    return (
      <>
        {children({ packageTab, eligible: true, expanded, close })}
        {desktopPortal}
        {fullscreenPortal}
      </>
    );
  }

  return (
    <>
      {packageTab}
      {desktopPortal}
      {fullscreenPortal}
    </>
  );
}
