import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    TRIPCOM_FLIGHT_AD,
    buildTripcomPlannerFlightUrl,
    getPlannerFlightArrivalIata,
} from '../../../../../utils/affiliate';
import {
    buildTripcomPlannerNavigationUrl,
    getPartnerLinkTarget,
    getTripcomIframeReferrerPolicy,
    getTripcomLinkRel,
    shouldUseTripcomFlightSearchModal,
} from '../../../common/partnerNavigation';
import { useTryOpenTripcomFlightSearch } from '../TripcomFlightSearchContext';
import { computeKlookBannerLayout } from './klookBannerLayout';
import { useTripcomPlannerBannerDimensions } from './useTripcomPlannerBannerDimensions';
import { plannerCaption } from '../readableText';
import PlannerAffiliateLinkBadge from './PlannerAffiliateLinkBadge';

const MIN_DISPLAY_HEIGHT = 120;

/**
 * Trip.com 제휴 항공 검색 배너 — iframe `aAirportCode` / `dAirportCode` 자동 주입.
 * 모바일(≤767px) 320×480, 데스크톱 900×200.
 * 배너 iframe에서 출발·도착·일자 등을 직접 수정할 수 있도록 클릭을 iframe에 전달합니다.
 */
const TripcomFlightBannerWidget = ({ location, essentialGuide, className = 'mt-3' }) => {
    const tryOpenFlightSearch = useTryOpenTripcomFlightSearch();
    const containerRef = useRef(null);
    const { width: nativeW, height: nativeH } = useTripcomPlannerBannerDimensions();
    const [layout, setLayout] = useState({ scale: 1, clipH: MIN_DISPLAY_HEIGHT });
    const linkTarget = getPartnerLinkTarget();
    const linkRel = getTripcomLinkRel(linkTarget);
    const iframeReferrerPolicy = getTripcomIframeReferrerPolicy();

    const arrivalIata = useMemo(
        () => getPlannerFlightArrivalIata(location, { essentialGuide }),
        [location, essentialGuide],
    );

    const isMobileBanner =
        nativeW === TRIPCOM_FLIGHT_AD.mobileWidth && nativeH === TRIPCOM_FLIGHT_AD.mobileHeight;
    const flightAdId =
        isMobileBanner && TRIPCOM_FLIGHT_AD.mobileAdId
            ? TRIPCOM_FLIGHT_AD.mobileAdId
            : TRIPCOM_FLIGHT_AD.adId;

    const iframeSrc = useMemo(
        () =>
            buildTripcomPlannerFlightUrl(location, {
                essentialGuide,
                mode: 'ad',
                adId: flightAdId,
                ...(isMobileBanner ? { tracking: 'planner-flight-mobile' } : {}),
            }),
        [location, essentialGuide, flightAdId, isMobileBanner],
    );

    const clickUrl = useMemo(
        () => buildTripcomPlannerNavigationUrl(location, { essentialGuide }),
        [location, essentialGuide],
    );

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            let { scale, clipH } = computeKlookBannerLayout(
                containerRef.current.clientWidth,
                8,
                nativeW,
                nativeH,
            );
            if (isMobileBanner && scale > 1) {
                scale = 1;
                clipH = nativeH;
            }
            setLayout({ scale, clipH: Math.max(clipH, MIN_DISPLAY_HEIGHT) });
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        const el = containerRef.current;
        const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(updateScale) : null;
        if (ro && el) ro.observe(el);

        return () => {
            window.removeEventListener('resize', updateScale);
            ro?.disconnect();
        };
    }, [nativeW, nativeH, isMobileBanner]);

    const handleFullScreenClick = (event) => {
        if (tryOpenFlightSearch(location, { essentialGuide })) {
            event.preventDefault();
        }
    };

    const fullScreenLinkProps = shouldUseTripcomFlightSearchModal()
        ? { href: '#', onClick: handleFullScreenClick, role: 'button' }
        : { href: clickUrl, target: linkTarget, rel: linkRel };

    return (
        <div className={className}>
            <div
                ref={containerRef}
                className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                data-tripcom-arrival-iata={arrivalIata || ''}
                data-tripcom-flight-banner="1"
                data-tripcom-ad-id={flightAdId}
                data-tripcom-banner-size={`${nativeW}x${nativeH}`}
            >
                <PlannerAffiliateLinkBadge />
                <div
                    className="flex w-full justify-center overflow-hidden"
                    style={{ height: `${layout.clipH}px` }}
                >
                    <div
                        style={{
                            width: `${nativeW}px`,
                            height: `${nativeH}px`,
                            transform: `scale(${layout.scale})`,
                            transformOrigin: 'top center',
                        }}
                    >
                        <iframe
                            key={`${iframeSrc}-${nativeW}x${nativeH}`}
                            src={iframeSrc}
                            title="Trip.com 항공권 검색"
                            width={nativeW}
                            height={nativeH}
                            className="block border-0"
                            scrolling="no"
                            loading="lazy"
                            {...(iframeReferrerPolicy
                                ? { referrerPolicy: iframeReferrerPolicy }
                                : {})}
                        />
                    </div>
                </div>
                <p className="sr-only">
                    {arrivalIata
                        ? `도착 공항 ${arrivalIata} 기준 Trip.com 항공권 검색 배너. 배너에서 출발·도착·일자를 수정할 수 있습니다.`
                        : 'Trip.com 항공권 검색 배너. 배너에서 출발·도착·일자를 수정할 수 있습니다.'}
                </p>
            </div>
            <p className={`mt-1.5 text-center ${plannerCaption}`}>
                {arrivalIata ? (
                    <>
                        출발 <span className="font-mono font-semibold">ICN</span> → 도착{' '}
                        <span className="font-mono font-semibold">{arrivalIata}</span> 자동 반영 · 배너에서 수정 가능
                        {' · '}
                        <a
                            {...fullScreenLinkProps}
                            className="text-blue-600 underline-offset-2 hover:underline"
                        >
                            전체 화면 검색
                        </a>
                    </>
                ) : (
                    <>
                        도착 공항을 찾지 못해 일반 검색으로 열립니다.{' '}
                        <a
                            {...fullScreenLinkProps}
                            className="text-blue-600 underline-offset-2 hover:underline"
                        >
                            Trip.com 항공권
                        </a>
                    </>
                )}
            </p>
        </div>
    );
};

export default TripcomFlightBannerWidget;
