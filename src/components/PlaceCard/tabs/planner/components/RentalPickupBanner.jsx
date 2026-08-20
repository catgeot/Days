import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveRentalPickupBannerInfo, resolveBannerPeerAlternateAirports } from '../../../../../utils/rentalAirportMatch.js';
import { shouldShowOfficialFlightBooking } from '../../../../../utils/flightBookingMatch.js';
import { PLANNER_FOCUS_ID, scrollPlannerFocusIntoView } from '../../../../../utils/placePlannerFocus.js';
import { plannerCaption, plannerCaptionMedium, plannerCaptionStrong, plannerMicroLabel } from '../readableText';

const airportCopyHitClass =
    'cursor-pointer rounded border-0 bg-transparent px-0.5 py-1 text-left font-inherit transition-colors hover:bg-emerald-100/70 focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-500/40';

function RentalPickupAirportCopyRow({ officialKo, iata, onCopy, highlight = false, copyMessages }) {
    return (
        <div
            className={`flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm font-semibold leading-snug ${highlight ? 'text-emerald-950' : 'text-gray-900'}`}
        >
            <button
                type="button"
                className={`${airportCopyHitClass} break-words ${highlight ? 'text-emerald-950' : 'text-gray-900'}`}
                onClick={() => onCopy(officialKo, copyMessages.officialDone)}
                title={copyMessages.officialTitle}
            >
                {officialKo}
            </button>
            {iata ? (
                <button
                    type="button"
                    className={`${airportCopyHitClass} shrink-0 font-mono text-xs font-medium ${highlight ? 'text-emerald-800' : 'text-emerald-800/90'}`}
                    onClick={() => onCopy(iata, copyMessages.iataDone(iata))}
                    title={copyMessages.iataTitle}
                >
                    ({iata})
                </button>
            ) : null}
        </div>
    );
}

/**
 * 플래너 상단 「렌터카 · 픽업 · 항공권 기준」 도착 공항 배너
 */
export default function RentalPickupBanner({ location, essentialGuide, scrollContainerRef, className = '' }) {
    const { t } = useTranslation();
    const [copyMessage, setCopyMessage] = useState(null);
    const copyTimeoutRef = useRef(0);

    const copyMessages = useMemo(
        () => ({
            officialDone: t('place.planner.banners.rentalPickup.copyOfficialDone'),
            officialTitle: t('place.planner.banners.rentalPickup.copyOfficialTitle'),
            iataDone: (code) => t('place.planner.banners.rentalPickup.copyIataDone', { code }),
            iataTitle: t('place.planner.banners.rentalPickup.copyIataTitle'),
            failed: t('place.planner.banners.rentalPickup.copyFailed'),
        }),
        [t],
    );

    const info = useMemo(
        () => resolveRentalPickupBannerInfo(location, { essentialGuide }),
        [location, essentialGuide]
    );

    const peerAlternates = useMemo(
        () => resolveBannerPeerAlternateAirports(location, info, { essentialGuide }),
        [location, info, essentialGuide]
    );

    const handleCopy = useCallback((text, message) => {
        const run = async () => {
            try {
                await navigator.clipboard.writeText(text);
                setCopyMessage(message);
                window.clearTimeout(copyTimeoutRef.current);
                copyTimeoutRef.current = window.setTimeout(() => setCopyMessage(null), 2500);
            } catch (err) {
                console.warn('[RentalPickupBanner] 클립보드 복사 실패', err);
                setCopyMessage(copyMessages.failed);
                window.clearTimeout(copyTimeoutRef.current);
                copyTimeoutRef.current = window.setTimeout(() => setCopyMessage(null), 3500);
            }
        };
        void run();
    }, [copyMessages.failed]);

    useEffect(() => () => window.clearTimeout(copyTimeoutRef.current), []);

    const showFlightNav = useMemo(
        () => Boolean(info?.bannerNote?.trim()) || shouldShowOfficialFlightBooking(location),
        [info?.bannerNote, location],
    );

    const scrollToFlightSection = useCallback(
        (focusId) => {
            scrollPlannerFocusIntoView(scrollContainerRef?.current ?? null, focusId, {
                headerOffset: 96,
            });
        },
        [scrollContainerRef],
    );

    if (!info) return null;

    const subtitle = info.fromPlanner
        ? t('place.planner.banners.rentalPickup.subtitleFromPlanner')
        : t('place.planner.banners.rentalPickup.subtitleDefault');

    const primaryAirport =
        info.kind === 'multi' && info.linkHub
            ? info.linkHub
            : info.kind === 'single'
              ? { officialKo: info.officialKo, iata: info.iata }
              : null;
    const showPeerAlternates = peerAlternates.length > 0;

    return (
        <div
            className={`flex w-full items-start gap-3 rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-3.5 py-3 shadow-sm ${className}`.trim()}
        >
            <Car size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
            <div className="min-w-0 flex-1 text-left">
                <p className={`${plannerMicroLabel} text-emerald-800/85`}>
                    {t('place.planner.banners.rentalPickup.heading')}
                </p>
                <p className={`mt-0.5 ${plannerCaption}`}>{subtitle}</p>

                {showPeerAlternates ? (
                    <>
                        <p className={`mt-2 ${plannerMicroLabel} text-emerald-900/90`}>
                            {t('place.planner.banners.rentalPickup.linkedArrival')}
                        </p>
                        <div className="mt-1">
                            <RentalPickupAirportCopyRow
                                officialKo={primaryAirport.officialKo}
                                iata={primaryAirport.iata}
                                onCopy={handleCopy}
                                highlight
                                copyMessages={copyMessages}
                            />
                        </div>
                        <p className={`mt-2 ${plannerCaptionStrong} text-gray-600`}>
                            {t('place.planner.banners.rentalPickup.otherCandidates')}
                        </p>
                        <div className="mt-1 flex flex-col gap-2">
                            {peerAlternates.map((a) => (
                                <RentalPickupAirportCopyRow
                                    key={a.iata || a.officialKo}
                                    officialKo={a.officialKo}
                                    iata={a.iata}
                                    onCopy={handleCopy}
                                    copyMessages={copyMessages}
                                />
                            ))}
                        </div>
                        {info.bannerNote ? (
                            <p className={`mt-2 whitespace-pre-line border-l-2 border-emerald-300/80 pl-2.5 ${plannerCaptionMedium} text-gray-800`}>
                                {info.bannerNote}
                            </p>
                        ) : null}
                    </>
                ) : (
                    <>
                        <div className="mt-1.5">
                            <RentalPickupAirportCopyRow
                                officialKo={primaryAirport?.officialKo ?? info.officialKo}
                                iata={primaryAirport?.iata ?? info.iata}
                                onCopy={handleCopy}
                                highlight
                                copyMessages={copyMessages}
                            />
                        </div>
                        {info.bannerNote ? (
                            <p className={`mt-2 whitespace-pre-line border-l-2 border-emerald-300/80 pl-2.5 ${plannerCaptionMedium} text-gray-800`}>
                                {info.bannerNote}
                            </p>
                        ) : null}
                    </>
                )}

                {copyMessage ? (
                    <p className={`mt-1.5 ${plannerCaptionStrong} text-emerald-800`} role="status" aria-live="polite">
                        {copyMessage}
                    </p>
                ) : null}

                {showPeerAlternates ? (
                    <p className={`mt-1.5 ${plannerCaptionMedium}`}>
                        {t('place.planner.banners.rentalPickup.affiliateNoteLinked')}
                    </p>
                ) : (
                    <p className={`mt-1 ${plannerCaptionMedium}`}>
                        {t('place.planner.banners.rentalPickup.affiliateNoteSingle')}
                    </p>
                )}

                {showFlightNav ? (
                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={() => scrollToFlightSection(PLANNER_FOCUS_ID.PREP_FLIGHT)}
                            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-emerald-300/90 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-emerald-100/80 focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                        >
                            {t('place.planner.banners.rentalPickup.flightTipsCta')}
                            <ArrowDown size={13} className="opacity-70" aria-hidden />
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
