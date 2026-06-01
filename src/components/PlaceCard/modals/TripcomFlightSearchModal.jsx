import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plane } from 'lucide-react';
import { TRIPCOM_FLIGHT_AD } from '../../../utils/affiliate';

/**
 * Trip.com 항공 검색 모달 — partners/ad iframe을 뷰포트 중앙에 배치.
 * 모바일 320×480 · 데스크톱 900×200. Trip.com 외부 ad 페이지는 위젯이 좌측으로
 * 쏠리는 경우가 있어 앱 내 모달로 대체한다.
 */
const TripcomFlightSearchModal = ({
    iframeSrc,
    arrivalIata,
    bannerWidth = TRIPCOM_FLIGHT_AD.mobileWidth,
    bannerHeight = TRIPCOM_FLIGHT_AD.mobileHeight,
    onClose,
}) => {
    const [loadedSrc, setLoadedSrc] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const timer = setTimeout(() => {
            setLoadedSrc(iframeSrc);
        }, 200);

        return () => {
            document.body.style.overflow = '';
            clearTimeout(timer);
        };
    }, [iframeSrc]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    if (!iframeSrc) return null;

    const bannerW = bannerWidth;
    const bannerH = bannerHeight;
    const isDesktopBanner = bannerW === TRIPCOM_FLIGHT_AD.width;

    const modal = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] animate-fade-in">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-label={
                    arrivalIata
                        ? `Trip.com 항공권 검색 — ICN에서 ${arrivalIata}까지`
                        : 'Trip.com 항공권 검색'
                }
                className={`relative z-10 flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_50px_rgba(0,0,0,0.45)] animate-scale-up ${
                    isDesktopBanner
                        ? 'max-h-[min(280px,calc(100dvh-2rem))] w-[min(900px,calc(100vw-2rem))]'
                        : 'max-h-[min(560px,calc(100dvh-2rem))] w-[min(320px,calc(100vw-2rem))]'
                }`}
            >
                <div className="relative shrink-0 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-blue-50 px-3 py-2.5">
                    <span className="pointer-events-none absolute right-12 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        제휴링크
                    </span>
                    <div className="flex items-center gap-2.5 pr-10">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                            <Plane size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-gray-900">항공권 검색</p>
                            {arrivalIata ? (
                                <p className="text-[11px] font-mono text-gray-600">
                                    ICN → {arrivalIata}
                                </p>
                            ) : (
                                <p className="text-[11px] text-gray-600">Trip.com 제휴 검색</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/80 hover:text-gray-800"
                        aria-label="닫기"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="relative flex min-h-0 flex-1 items-center justify-center bg-gray-50">
                    {!isLoaded && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                        </div>
                    )}
                    {loadedSrc ? (
                        <iframe
                            src={loadedSrc}
                            title="Trip.com 항공권 검색"
                            width={bannerW}
                            height={bannerH}
                            className="block max-h-full w-full border-0"
                            style={{
                                width: bannerW,
                                height: bannerH,
                                maxHeight: isDesktopBanner
                                    ? 'calc(100dvh - 5rem)'
                                    : 'calc(100dvh - 6.5rem)',
                            }}
                            scrolling="no"
                            referrerPolicy="no-referrer"
                            onLoad={() => setIsLoaded(true)}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modal, document.body);
};

export default TripcomFlightSearchModal;
