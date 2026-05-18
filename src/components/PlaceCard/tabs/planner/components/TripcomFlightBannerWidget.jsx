import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    TRIPCOM_FLIGHT_AD,
    buildTripcomPlannerFlightUrl,
    getPlannerFlightArrivalIata,
} from '../../../../../utils/affiliate';
import { computeKlookBannerLayout } from './klookBannerLayout';

const NATIVE_W = TRIPCOM_FLIGHT_AD.width;
const NATIVE_H = TRIPCOM_FLIGHT_AD.height;
const MIN_DISPLAY_HEIGHT = 120;

/**
 * Trip.com 제휴 항공 검색 배너 — iframe `aAirportCode` / `dAirportCode` 자동 주입.
 */
const TripcomFlightBannerWidget = ({ location, essentialGuide, className = 'mt-3' }) => {
    const containerRef = useRef(null);
    const [layout, setLayout] = useState({ scale: 1, clipH: MIN_DISPLAY_HEIGHT });

    const arrivalIata = useMemo(
        () => getPlannerFlightArrivalIata(location, { essentialGuide }),
        [location, essentialGuide],
    );

    const iframeSrc = useMemo(
        () => buildTripcomPlannerFlightUrl(location, { essentialGuide, mode: 'ad' }),
        [location, essentialGuide],
    );

    const fullPageUrl = useMemo(
        () => buildTripcomPlannerFlightUrl(location, { essentialGuide, mode: 'flights' }),
        [location, essentialGuide],
    );

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const { scale, clipH } = computeKlookBannerLayout(
                containerRef.current.clientWidth,
                8,
                NATIVE_W,
                NATIVE_H,
            );
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
    }, []);

    return (
        <div className={className}>
            <div
                ref={containerRef}
                className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                data-tripcom-arrival-iata={arrivalIata || ''}
                data-tripcom-flight-banner="1"
            >
                <div
                    className="flex w-full justify-center overflow-hidden"
                    style={{ height: `${layout.clipH}px` }}
                >
                    <div
                        style={{
                            width: `${NATIVE_W}px`,
                            height: `${NATIVE_H}px`,
                            transform: `scale(${layout.scale})`,
                            transformOrigin: 'top center',
                        }}
                    >
                        <iframe
                            key={iframeSrc}
                            src={iframeSrc}
                            title="Trip.com 항공권 검색"
                            width={NATIVE_W}
                            height={NATIVE_H}
                            className="block border-0"
                            scrolling="no"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>
                <p className="sr-only">
                    {arrivalIata
                        ? `도착 공항 ${arrivalIata} 기준으로 Trip.com 항공권 검색 배너`
                        : 'Trip.com 항공권 검색 배너'}
                </p>
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500 text-center break-keep">
                {arrivalIata ? (
                    <>
                        출발 <span className="font-mono font-semibold">ICN</span> → 도착{' '}
                        <span className="font-mono font-semibold">{arrivalIata}</span> 자동 반영
                        {' · '}
                        <a
                            href={fullPageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline-offset-2 hover:underline"
                        >
                            전체 화면 검색
                        </a>
                    </>
                ) : (
                    <>
                        도착 공항을 찾지 못해 일반 검색으로 열립니다.{' '}
                        <a
                            href={fullPageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
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
