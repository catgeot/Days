import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Map as MapIcon, Car, Ship } from 'lucide-react';
import { DIRECT_FERRIES_HOME_URL } from '../constants';
import { getKlookRentalUrlByLocation } from '../../../../../utils/affiliate';

const timelineCopyHitClass =
    'cursor-pointer rounded border-0 bg-transparent px-0.5 py-0.5 text-left font-inherit transition-colors hover:bg-blue-100/90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-400/45';

/**
 * AI가 적은 제목에서 `(IATA)`를 찾고, 바로 앞의 한 덩어리(공백 전까지)를 도착지명으로 둡니다.
 * 각 위치마다 지명만 / 코드만 따로 복사할 수 있게 합니다. (항공권 검색에는 보통 `ASR`처럼 코드만 잘 맞습니다.)
 *
 * @returns {Array<{ type: 'text', value: string } | { type: 'copyPair', name: string, code: string } | { type: 'copyCode', code: string, label: string }>}
 */
function splitTitleIntoCopyParts(title) {
    if (!title || typeof title !== 'string') return [{ type: 'text', value: title || '' }];

    const codeRe = /\(([A-Z]{3})\)/g;
    const parts = [];
    let last = 0;
    let m;

    while ((m = codeRe.exec(title)) !== null) {
        const parenIdx = m.index;
        const code = m[1];

        let i = parenIdx - 1;
        while (i >= last && /\s/.test(title[i])) i--;
        while (i >= last && !/\s/.test(title[i]) && title[i] !== '(') i--;
        const nameStart = i + 1;
        const name = title.slice(nameStart, parenIdx).replace(/\s+$/g, '');

        if (nameStart > last) {
            parts.push({ type: 'text', value: title.slice(last, nameStart) });
        }

        if (name) {
            parts.push({ type: 'copyPair', name, code });
        } else {
            parts.push({ type: 'copyCode', code, label: m[0] });
        }

        last = parenIdx + m[0].length;
    }

    if (last < title.length) parts.push({ type: 'text', value: title.slice(last) });
    if (parts.length === 0) parts.push({ type: 'text', value: title });
    return parts;
}

function TimelineStepTitleWithCopy({ title, stepIdx, onCopySegment }) {
    const parts = useMemo(() => splitTitleIntoCopyParts(title), [title]);
    const hasCopy = parts.some((p) => p.type === 'copyPair' || p.type === 'copyCode');

    if (!hasCopy) {
        return <span className="text-sm font-bold text-gray-800 leading-tight">{title}</span>;
    }

    return (
        <span className="flex flex-wrap items-baseline gap-x-0.5 gap-y-1 text-sm font-bold text-gray-800 leading-tight">
            {parts.map((p, i) => {
                if (p.type === 'text') {
                    return (
                        <span key={i} className="whitespace-pre-wrap">
                            {p.value}
                        </span>
                    );
                }
                if (p.type === 'copyCode') {
                    return (
                        <button
                            key={i}
                            type="button"
                            className={`${timelineCopyHitClass} font-mono text-xs font-bold text-blue-900/95`}
                            onClick={() => onCopySegment(stepIdx, p.code, 'code')}
                            title="IATA 코드만 복사"
                            aria-label={`${p.code} 복사`}
                        >
                            {p.label}
                        </button>
                    );
                }
                return (
                    <span key={i} className="inline-flex flex-wrap items-baseline gap-0">
                        <button
                            type="button"
                            className={`${timelineCopyHitClass} break-words text-gray-800`}
                            onClick={() => onCopySegment(stepIdx, p.name, 'name')}
                            title="도착지·도시명만 복사"
                            aria-label={`${p.name} 복사`}
                        >
                            {p.name}
                        </button>
                        <button
                            type="button"
                            className={`${timelineCopyHitClass} shrink-0 font-mono text-xs font-bold text-blue-900/95`}
                            onClick={() => onCopySegment(stepIdx, p.code, 'code')}
                            title="IATA 코드만 복사 (괄호 없음)"
                            aria-label={`${p.code} 복사`}
                        >
                            ({p.code})
                        </button>
                    </span>
                );
            })}
        </span>
    );
}

// 🔧 타임라인 내 동적 액션 버튼 생성 로직 (페리, 렌터카만 키워드 매칭)
const getActionForStep = (title, location) => {
    const text = title.toLowerCase();

    // 1. 페리 키워드 매칭
    if (text.includes('페리') || text.includes('항구') || text.includes('크루즈') ||
        text.includes('쾌속선') || text.includes('보트') || text.includes('선박') ||
        text.includes('배') || text.includes('유람선') || text.includes('fast boat')) {
        return {
            type: 'banner',
            label: '페리 실시간 검색',
            description: '전 세계 페리 노선 비교 및 예약',
            url: DIRECT_FERRIES_HOME_URL,
            icon: <Ship size={16} />,
            bgClass: 'bg-white border-2 border-cyan-300',
            iconBgClass: 'bg-cyan-100',
            iconColorClass: 'text-cyan-600',
            textClass: 'text-gray-800',
            descClass: 'text-gray-600'
        };
    }

    // 2. 렌터카 키워드 매칭
    if (text.includes('렌터카') || text.includes('렌트카') || text.includes('자동차') ||
        text.includes('차량') || text.includes('드라이브') || text.includes('렌탈')) {
        return {
            type: 'banner',
            label: '렌터카 검색',
            description: '글로벌 렌터카 비교 및 예약',
            url: getKlookRentalUrlByLocation(location || {}),
            icon: <Car size={16} />,
            bgClass: 'bg-white border-2 border-purple-300',
            iconBgClass: 'bg-purple-100',
            iconColorClass: 'text-purple-600',
            textClass: 'text-gray-800',
            descClass: 'text-gray-600'
        };
    }

    return null;
};

const JourneyTimeline = ({ timeline, location }) => {
    const [copyFeedback, setCopyFeedback] = useState(null);
    const copyTimeoutRef = useRef(0);

    useEffect(() => () => window.clearTimeout(copyTimeoutRef.current), []);

    const handleCopySegment = useCallback((stepIdx, text, feedbackKey) => {
        const run = async () => {
            try {
                await navigator.clipboard.writeText(text);
                const message =
                    feedbackKey === 'code'
                        ? '공항 코드를 복사했습니다.'
                        : feedbackKey === 'name'
                          ? '도착지명을 복사했습니다.'
                          : '클립보드에 복사했습니다.';
                setCopyFeedback({ stepIdx, message });
                window.clearTimeout(copyTimeoutRef.current);
                copyTimeoutRef.current = window.setTimeout(() => setCopyFeedback(null), 2500);
            } catch (err) {
                console.warn('[JourneyTimeline] 클립보드 복사 실패', err);
                setCopyFeedback({ stepIdx, message: '복사에 실패했습니다. 브라우저에서 클립보드 권한을 확인해 주세요.' });
                window.clearTimeout(copyTimeoutRef.current);
                copyTimeoutRef.current = window.setTimeout(() => setCopyFeedback(null), 3500);
            }
        };
        void run();
    }, []);

    if (!timeline || timeline.length === 0) return null;

    // 각 액션 타입별로 첫 번째만 표시하기 위한 중복 제거
    const shownActionTypes = new Set();

    return (
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 mb-5 shadow-sm">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-sm md:text-base">
                <MapIcon className="text-blue-600 shrink-0" size={18} />
                상세 여정 플래너
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-blue-200">
                {timeline.map((step, idx) => {
                    const action = getActionForStep(step.title, location);

                    // 액션 타입 식별 (중복 방지용)
                    let actionTypeKey = null;
                    if (action) {
                        if (action.label.includes('페리')) actionTypeKey = 'ferry';
                        else if (action.label.includes('렌터카')) actionTypeKey = 'rental_car';
                    }

                    // 중복 체크: 이미 표시된 타입이면 숨김
                    let shouldShowAction = true;
                    if (actionTypeKey) {
                        if (shownActionTypes.has(actionTypeKey)) {
                            shouldShowAction = false;
                        } else {
                            shownActionTypes.add(actionTypeKey);
                        }
                    }

                    return (
                        <div key={idx} className="relative">
                            {/* 둥근 점 */}
                            <div className="absolute -left-[30px] top-1 w-3 h-3 bg-blue-500 rounded-full border-[3px] border-blue-50 shadow-sm z-10" />
                            <div className="flex flex-col items-start">
                                <span className="text-[11px] font-bold text-blue-500 tracking-wider uppercase mb-0.5">STEP {step.step || (idx + 1)}</span>
                                <div className="flex flex-col gap-2 w-full">
                                    <TimelineStepTitleWithCopy title={step.title} stepIdx={idx} onCopySegment={handleCopySegment} />
                                    {copyFeedback?.stepIdx === idx ? (
                                        <p
                                            className="text-[11px] font-semibold leading-snug text-blue-900"
                                            role="status"
                                            aria-live="polite"
                                        >
                                            {copyFeedback.message}
                                        </p>
                                    ) : null}
                                    {action && shouldShowAction && (
                                        <a href={action.url} target="_blank" rel="noopener noreferrer"
                                           className={`${action.bgClass} rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group w-full`}>
                                            <div className={`${action.iconBgClass} ${action.iconColorClass} p-2 rounded-lg shrink-0`}>
                                                {action.icon}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className={`font-bold text-sm ${action.textClass}`}>{action.label}</div>
                                                <div className={`text-xs ${action.descClass}`}>{action.description}</div>
                                            </div>
                                            <div className="text-gray-400 group-hover:text-gray-600 transition-colors">→</div>
                                        </a>
                                    )}
                                </div>
                                {step.duration && (
                                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1.5 font-medium bg-blue-100/50 w-fit px-1.5 py-0.5 rounded-md">
                                        <Clock size={10} />
                                        <span>{step.duration}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default JourneyTimeline;
