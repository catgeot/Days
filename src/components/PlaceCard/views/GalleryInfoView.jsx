import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, MapPin, Compass, Sparkles } from 'lucide-react';
import { getGalleryImageAttribution } from '../common/galleryImageAttribution';
import { usePlaceGalleryOverviewHydration } from '../hooks/usePlaceGalleryOverviewHydration';
import { getLocalizedPlaceName } from '../common/locationDisplay';
import { getLocalizedPlaceKeywords, isPlaceDescKoreanOnly } from '../../../pages/Home/lib/placeSeoText.js';
import { useLocale } from '../../../i18n/LocaleProvider';
import { usePlaceDesktopLeftInfoLayout } from '../common/usePlaceDesktopLeftInfoLayout';
import GalleryInfoOverviewScrollContent from './GalleryInfoOverviewScrollContent';

const GalleryInfoView = React.memo(({ selectedPlace, selectedImg, relatedPlaces = [], onRelatedClick }) => {
    const { t, i18n } = useTranslation();
    const { locale } = useLocale();
    const overviewKeywords = useMemo(
        () => getLocalizedPlaceKeywords(selectedPlace, locale),
        [selectedPlace, locale],
    );
    const showKoreanGuideNotice =
        locale === 'en' &&
        isPlaceDescKoreanOnly(selectedPlace);
    const isPhotoMode = !!selectedImg;
    const summaryScrollRef = useRef(null);
    const showRelatedDock = !isPhotoMode && relatedPlaces.length > 0;
    const { mountInLeftOverview } = usePlaceDesktopLeftInfoLayout();
    const [overviewScrollFade, setOverviewScrollFade] = useState(false);

    const description = useMemo(() => {
        if (selectedImg?.alt_description) {
            return selectedImg.alt_description.charAt(0).toUpperCase() + selectedImg.alt_description.slice(1);
        }
        return `Visual data captured at ${selectedPlace?.name || 'Unknown Location'}`;
    }, [selectedImg, selectedPlace]);

    const {
        curation: curationOverview,
        fixed: fixedOverview,
        originalQuery: overviewQuery,
        showDescriptionInKoreanLabel,
    } = usePlaceGalleryOverviewHydration(selectedPlace, locale);

    const photoAttribution = useMemo(
        () => (selectedImg ? getGalleryImageAttribution(selectedImg) : null),
        [selectedImg],
    );

    const scrollContentProps = {
        selectedPlace,
        isPhotoMode,
        description,
        photoAttribution,
        selectedImg,
        showKoreanGuideNotice: showDescriptionInKoreanLabel ? false : showKoreanGuideNotice,
        showDescriptionInKoreanLabel,
        overviewQuery,
        curationOverview,
        fixedOverview,
        overviewKeywords,
        includeLeftLocalInfo: mountInLeftOverview && !isPhotoMode,
    };

    useEffect(() => {
        if (summaryScrollRef.current) summaryScrollRef.current.scrollTop = 0;
    }, [selectedPlace?.id, selectedPlace?.name, selectedPlace?.slug, selectedImg]);

    useEffect(() => {
        if (!mountInLeftOverview || isPhotoMode) {
            setOverviewScrollFade(false);
            return undefined;
        }
        const el = summaryScrollRef.current;
        if (!el) return undefined;
        const syncFade = () => {
            const overflow = el.scrollHeight > el.clientHeight + 2;
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
            setOverviewScrollFade(overflow && !atBottom);
        };
        syncFade();
        el.addEventListener('scroll', syncFade, { passive: true });
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncFade) : null;
        ro?.observe(el);
        return () => {
            el.removeEventListener('scroll', syncFade);
            ro?.disconnect();
        };
    }, [
        mountInLeftOverview,
        isPhotoMode,
        selectedPlace?.id,
        selectedPlace?.name,
        selectedPlace?.slug,
        fixedOverview,
        curationOverview,
        overviewKeywords.length,
    ]);

    const scrollInner = (
        <div className="px-0.5">
            <GalleryInfoOverviewScrollContent {...scrollContentProps} />
        </div>
    );

    return (
        <div className="animate-fade-in flex min-h-0 flex-1 flex-col gap-3">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 2px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(255, 255, 255, 0.03); 
                    border-radius: 10px; 
                }
            `}</style>

             <div className={`shrink-0 items-center justify-between border-b border-white/5 pb-3 bg-[#1a1a1a]/40 backdrop-blur-md z-10 ${!isPhotoMode ? 'hidden xl:flex' : 'flex'}`}>
                 <span className={`text-[11px] font-semibold uppercase tracking-[0.25em] flex items-center gap-2.5 ${
                     isPhotoMode ? 'text-blue-400/90' : 'text-gray-500'
                 }`}>
                    {isPhotoMode ? (
                        <>
                            <Camera size={13} /> 
                            {t('place.info.photoLogLabel')}
                        </>
                    ) : (
                        <>
                            <MapPin size={13} /> 
                            {t('place.info.overviewLabel')}
                        </>
                    )}
                 </span>
             </div>

             {mountInLeftOverview ? (
             <div className="relative min-h-0 flex-1">
             <div
                ref={summaryScrollRef}
                data-place-overview-scroll=""
                className="min-h-0 h-full overflow-y-auto pr-1 custom-scrollbar"
             >
                {scrollInner}
             </div>
             {overviewScrollFade ? (
                <div
                    className="pointer-events-none absolute bottom-0 left-0 right-1 h-10 bg-gradient-to-t from-[#05070a] via-[#05070a]/85 to-transparent"
                    aria-hidden
                />
             ) : null}
             </div>
             ) : (
             <div
                ref={summaryScrollRef}
                className="min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar"
             >
                {scrollInner}
             </div>
             )}

            {showRelatedDock && (
                <div
                    data-gallery-related-dock
                    className="shrink-0 border-t border-white/5 pt-3"
                >
                    <div className="flex flex-wrap gap-2">
                        {relatedPlaces.map((place, idx) => (
                            <button
                                key={`rel-${idx}`}
                                onClick={() => onRelatedClick && onRelatedClick(place.data, place.isBridge)}
                                className={`group px-3 py-1.5 rounded-lg border transition-all duration-300 font-medium text-[12px] flex items-center gap-1.5 ${
                                    place.isBridge
                                    ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300 hover:text-white hover:border-fuchsia-400/60 hover:bg-fuchsia-500/30'
                                    : 'bg-blue-500/5 border-blue-500/20 text-gray-300 hover:text-white hover:border-blue-400/50 hover:bg-blue-500/20'
                                }`}
                            >
                                {place.isBridge ? (
                                    <Sparkles size={13} className="text-fuchsia-400 group-hover:animate-pulse" />
                                ) : (
                                    <Compass size={13} className="text-blue-400 group-hover:animate-pulse" />
                                )}
                                {getLocalizedPlaceName(place.data, i18n.language) || place.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

export default GalleryInfoView;
