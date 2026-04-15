import React from 'react';
import { Clock, Map as MapIcon, Car, Ship, Bed, Plane } from 'lucide-react';
import MrtTimelineAction from './MrtTimelineAction';

// 타임라인 내 동적 액션 버튼 생성 로직
const getActionForStep = (title, locationName) => {
    const text = title.toLowerCase();
    const query = encodeURIComponent(locationName || '');

    if (text.includes('공항') && (text.includes('도착') || text.includes('이동') || text.includes('픽업'))) {
        const klookTransferTargetUrl = `https://www.klook.com/ko/airport-transfers/`;
        return {
            label: '공항 픽업',
            url: `https://affiliate.klook.com/redirect?aid=118544&aff_adid=1256120&k_site=${encodeURIComponent(klookTransferTargetUrl)}`,
            icon: <Car size={10} />,
            colorClass: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
        };
    }
    if (text.includes('페리') || text.includes('항구')) {
        const klookFerryTargetUrl = `https://www.klook.com/ko/search/result/?query=${query}%20페리`;
        return {
            label: '페리 예약',
            url: `https://affiliate.klook.com/redirect?aid=118544&aff_adid=1256120&k_site=${encodeURIComponent(klookFerryTargetUrl)}`,
            icon: <Ship size={10} />,
            colorClass: 'bg-orange-50 text-orange-700 hover:bg-orange-100'
        };
    }
    if (text.includes('숙소') || text.includes('호텔') || text.includes('리조트')) {
        const isAsia = ['일본', '대만', '베트남', '태국', '필리핀', '인도네시아', '말레이시아', '싱가포르'].some(c => locationName?.includes(c));
        const queryForMrt = isAsia ? `${locationName || ''} 한인민박` : `${locationName || ''} 숙소`;

        return {
            isMrt: true,
            mrtQuery: queryForMrt,
            label: '숙소 검색',
            icon: <Bed size={10} />,
            colorClass: 'bg-rose-50 text-rose-700 hover:bg-rose-100'
        };
    }
    if (text.includes('출발') || text.includes('항공') || text.includes('비행')) {
        return {
            label: '항공권 검색',
            url: `https://search.kyte.travel/`,
            icon: <Plane size={10} />,
            colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100'
        };
    }
    return null;
};

const JourneyTimeline = ({ timeline, locationName }) => {
    if (!timeline || timeline.length === 0) return null;

    return (
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 mb-5 shadow-sm">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-sm md:text-base">
                <MapIcon className="text-blue-600 shrink-0" size={18} />
                상세 여정 플래너
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-blue-200">
                {timeline.map((step, idx) => {
                    const action = getActionForStep(step.title, locationName);
                    return (
                        <div key={idx} className="relative">
                            {/* 둥근 점 */}
                            <div className="absolute -left-[30px] top-1 w-3 h-3 bg-blue-500 rounded-full border-[3px] border-blue-50 shadow-sm z-10" />
                            <div className="flex flex-col items-start">
                                <span className="text-[11px] font-bold text-blue-500 tracking-wider uppercase mb-0.5">STEP {step.step || (idx + 1)}</span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-bold text-gray-800 leading-tight">{step.title}</span>
                                    {action && (
                                        action.isMrt ? (
                                            <MrtTimelineAction
                                                mrtQuery={action.mrtQuery}
                                                label={action.label}
                                                icon={action.icon}
                                                colorClass={action.colorClass}
                                            />
                                        ) : (
                                            <a href={action.url} target="_blank" rel="noopener noreferrer"
                                               className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors border border-transparent hover:border-current ${action.colorClass}`}>
                                                {action.icon}
                                                {action.label}
                                            </a>
                                        )
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
