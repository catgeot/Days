import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Car } from 'lucide-react';
import { resolveRentalPickupBannerInfo } from '../../../../../utils/rentalAirportMatch.js';
import { plannerCaption, plannerCaptionMedium, plannerCaptionStrong, plannerMicroLabel } from '../readableText';

const airportCopyHitClass =
    'cursor-pointer rounded border-0 bg-transparent px-0.5 py-1 text-left font-inherit transition-colors hover:bg-emerald-100/70 focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-500/40';

function RentalPickupAirportCopyRow({ officialKo, iata, onCopy, highlight = false }) {
    return (
        <div
            className={`flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm font-semibold leading-snug ${highlight ? 'text-emerald-950' : 'text-gray-900'}`}
        >
            <button
                type="button"
                className={`${airportCopyHitClass} break-words ${highlight ? 'text-emerald-950' : 'text-gray-900'}`}
                onClick={() => onCopy(officialKo, '정식 공항명이 복사되었습니다.')}
                title="클릭하여 정식 공항명 복사"
            >
                {officialKo}
            </button>
            {iata ? (
                <button
                    type="button"
                    className={`${airportCopyHitClass} shrink-0 font-mono text-xs font-medium ${highlight ? 'text-emerald-800' : 'text-emerald-800/90'}`}
                    onClick={() => onCopy(iata, `IATA 코드 ${iata}가 복사되었습니다.`)}
                    title="클릭하여 IATA 코드 복사"
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
export default function RentalPickupBanner({ location, essentialGuide, className = '' }) {
    const [copyMessage, setCopyMessage] = useState(null);
    const copyTimeoutRef = useRef(0);

    const info = useMemo(
        () => resolveRentalPickupBannerInfo(location, { essentialGuide }),
        [location, essentialGuide]
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
                setCopyMessage('복사에 실패했습니다. 브라우저에서 클립보드 권한을 확인해 주세요.');
                window.clearTimeout(copyTimeoutRef.current);
                copyTimeoutRef.current = window.setTimeout(() => setCopyMessage(null), 3500);
            }
        };
        void run();
    }, []);

    useEffect(() => () => window.clearTimeout(copyTimeoutRef.current), []);

    if (!info) return null;

    const subtitle = info.fromPlanner
        ? '툴킷 여정·항공 안내와 맞춘 도착 공항입니다. 티켓과 다르면 실제 도착 코드로 검색어를 바꿔 주세요.'
        : '항공권·렌터카 검색에 쓰는 도착 공항입니다. 티켓의 도착 공항 코드를 확인해 주세요.';

    const linkHub = info.kind === 'multi' ? info.linkHub : null;
    const alternateAirports =
        info.kind === 'multi' ? info.airports.filter((a) => a.iata !== linkHub?.iata) : [];

    return (
        <div
            className={`flex w-full items-start gap-3 rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-3.5 py-3 shadow-sm ${className}`.trim()}
        >
            <Car size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
            <div className="min-w-0 flex-1 text-left">
                <p className={`${plannerMicroLabel} text-emerald-800/85`}>
                    렌터카 · 픽업 · 항공권 기준
                </p>
                <p className={`mt-0.5 ${plannerCaption}`}>{subtitle}</p>

                {info.kind === 'multi' ? (
                    <>
                        <p className={`mt-2 ${plannerMicroLabel} text-emerald-900/90`}>연동 도착 공항</p>
                        <div className="mt-1">
                            <RentalPickupAirportCopyRow
                                officialKo={linkHub.officialKo}
                                iata={linkHub.iata}
                                onCopy={handleCopy}
                                highlight
                            />
                        </div>
                        {alternateAirports.length > 0 ? (
                            <>
                                <p className={`mt-2 ${plannerCaptionStrong} text-gray-600`}>다른 도착 후보</p>
                                <div className="mt-1 flex flex-col gap-2">
                                    {alternateAirports.map((a) => (
                                        <RentalPickupAirportCopyRow
                                            key={a.iata || a.officialKo}
                                            officialKo={a.officialKo}
                                            iata={a.iata}
                                            onCopy={handleCopy}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : null}
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
                                officialKo={info.officialKo}
                                iata={info.iata}
                                onCopy={handleCopy}
                                highlight
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

                {info.kind === 'multi' ? (
                    <p className={`mt-1.5 ${plannerCaptionMedium}`}>
                        렌터카·픽업 제휴 링크는 위 「연동 도착 공항」 기준으로 연결됩니다.
                    </p>
                ) : (
                    <p className={`mt-1 ${plannerCaptionMedium}`}>렌터카·픽업 제휴 링크는 이 공항 기준입니다.</p>
                )}
            </div>
        </div>
    );
}
