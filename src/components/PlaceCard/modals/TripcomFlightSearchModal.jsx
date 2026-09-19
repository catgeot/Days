import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plane } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TRIPCOM_FLIGHT_AD } from '../../../utils/affiliate';
import TripcomFlightNativeSearch from '../tabs/planner/components/TripcomFlightNativeSearch';

/**
 * Trip.com 항공 검색 모달. 모바일은 네이티브 폼(partners/ad iframe은 빈 화면).
 */
const TripcomFlightSearchModal = ({
    iframeSrc,
    arrivalIata,
    departureIata = null,
    bannerWidth = TRIPCOM_FLIGHT_AD.mobileWidth,
    bannerHeight = TRIPCOM_FLIGHT_AD.mobileHeight,
    useNativeForm = false,
    location = null,
    searchOptions = {},
    onClose,
}) => {
    const { t } = useTranslation();
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

    if (!useNativeForm && !iframeSrc) return null;

    const bannerW = bannerWidth;
    const bannerH = bannerHeight;
    const isDesktopBanner = bannerW === TRIPCOM_FLIGHT_AD.width;
    const departCode = departureIata
        ? String(departureIata).trim().toUpperCase()
        : 'ICN';

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
                        ? t('mooni.booking.modal.ariaRoute', {
                              depart: departCode,
                              arrive: arrivalIata,
                          })
                        : t('mooni.booking.modal.ariaSearch')
                }
                className={`relative z-10 flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_50px_rgba(0,0,0,0.45)] animate-scale-up ${
                    useNativeForm
                        ? 'max-h-[min(640px,calc(100dvh-2rem))] w-[min(420px,calc(100vw-2rem))]'
                        : isDesktopBanner
                        ? 'max-h-[min(280px,calc(100dvh-2rem))] w-[min(900px,calc(100vw-2rem))]'
                        : 'max-h-[min(560px,calc(100dvh-2rem))] w-[min(320px,calc(100vw-2rem))]'
                }`}
            >
                <div className="relative shrink-0 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-blue-50 px-3 py-2.5">
                    <span className="pointer-events-none absolute right-12 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {t('mooni.booking.modal.affiliateBadge')}
                    </span>
                    <div className="flex items-center gap-2.5 pr-10">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                            <Plane size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-gray-900">
                                {t('mooni.booking.modal.title')}
                            </p>
                            {arrivalIata ? (
                                <p className="text-[11px] font-mono text-gray-600">
                                    {departCode} → {arrivalIata}
                                </p>
                            ) : (
                                <p className="text-[11px] text-gray-600">
                                    {t('mooni.booking.modal.partnerSearch')}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/80 hover:text-gray-800"
                        aria-label={t('mooni.booking.modal.close')}
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="relative flex min-h-0 flex-1 items-center justify-center bg-gray-50">
                    {useNativeForm ? (
                        <TripcomFlightNativeSearch
                            location={location}
                            essentialGuide={searchOptions.essentialGuide}
                            departureIata={departureIata}
                            tracking={searchOptions.tracking}
                            departDate={searchOptions.departDate}
                            returnDate={searchOptions.returnDate}
                            onAfterSearch={onClose}
                        />
                    ) : (
                        <>
                    {!isLoaded && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                        </div>
                    )}
                    {loadedSrc ? (
                        <iframe
                            src={loadedSrc}
                            title={t('mooni.booking.modal.ariaSearch')}
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modal, document.body);
};

export default TripcomFlightSearchModal;
