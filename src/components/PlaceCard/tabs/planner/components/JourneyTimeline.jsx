import React from 'react';
import { Clock, Map as MapIcon, Car, Ship, Bed, Plane } from 'lucide-react';
import MrtTimelineAction from './MrtTimelineAction';
import WhiteLabelWidget from '../../../common/WhiteLabelWidget';
import { DIRECT_FERRIES_HOME_URL } from '../constants';

// 타임라인 내 동적 액션 버튼 생성 로직
const getActionForStep = (title, locationName) => {
    const text = title.toLowerCase();
    const query = encodeURIComponent(locationName || '');

    // 경유/환승일 경우 공항 픽업 버튼 생성 방지
    const isTransfer = text.includes('환승') || text.includes('경유');

    if (!isTransfer && text.includes('공항') && (text.includes('도착') || text.includes('이동') || text.includes('픽업'))) {
        const klookTransferTargetUrl = `https://www.klook.com/ko/airport-transfers/`;
        return {
            type: 'banner',
            label: '공항 픽업 예약',
            description: '편리한 공항 ↔ 목적지 직행 서비스',
            url: `https://affiliate.klook.com/redirect?aid=118544&aff_adid=1256120&k_site=${encodeURIComponent(klookTransferTargetUrl)}`,
            icon: <Car size={16} />,
            bgClass: 'bg-white border-2 border-amber-300',
            iconBgClass: 'bg-amber-100',
            iconColorClass: 'text-amber-600',
            textClass: 'text-gray-800',
            descClass: 'text-gray-600'
        };
    }
    if (text.includes('페리') || text.includes('항구') || text.includes('크루즈') ||
        text.includes('쾌속선') || text.includes('보트') || text.includes('선박') ||
        text.includes('배') || text.includes('유람선') || text.includes('fast boat')) {
        // Direct Ferries 홈으로 연결 (dfpid=7263: 파트너 ID, affid=1001: Affiliate ID)
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
    if (text.includes('숙소') || text.includes('호텔') || text.includes('리조트')) {
        const isAsia = ['일본', '대만', '베트남', '태국', '필리핀', '인도네시아', '말레이시아', '싱가포르'].some(c => locationName?.includes(c));
        const queryForMrt = isAsia ? `${locationName || ''} 한인민박` : `${locationName || ''} 숙소`;

        return {
            type: 'accommodation_banner',
            mrtQuery: queryForMrt,
            label: '숙소 실시간 검색',
            description: isAsia ? '한인민박 및 현지 숙소 비교' : '전 세계 숙소 최저가 비교',
            icon: <Bed size={16} />,
            bgClass: 'bg-white border-2 border-emerald-300',
            iconBgClass: 'bg-emerald-100',
            iconColorClass: 'text-emerald-600',
            textClass: 'text-gray-800',
            descClass: 'text-gray-600'
        };
    }
    if (text.includes('출발') || text.includes('항공') || text.includes('비행')) {
        return {
            type: 'flight_banner',
            locationName: locationName,
            label: '항공권 실시간 검색',
            description: '전 세계 항공편 비교 및 최저가 예약',
            icon: <Plane size={16} />,
            bgClass: 'bg-white border-2 border-indigo-300',
            iconBgClass: 'bg-indigo-100',
            iconColorClass: 'text-indigo-600',
            textClass: 'text-gray-800',
            descClass: 'text-gray-600'
        };
    }
    return null;
};

const JourneyTimeline = ({ timeline, locationName }) => {
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
                    const action = getActionForStep(step.title, locationName);

                    // 액션 타입 식별 (중복 방지용)
                    let actionTypeKey = null;
                    if (action) {
                        if (action.type === 'banner' && action.label.includes('공항')) actionTypeKey = 'airport_pickup';
                        else if (action.type === 'banner' && action.label.includes('페리')) actionTypeKey = 'ferry';
                        else if (action.type === 'flight_banner') actionTypeKey = 'flight';
                        else if (action.isMrt) actionTypeKey = 'accommodation';
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
                                    <span className="text-sm font-bold text-gray-800 leading-tight">{step.title}</span>
                                    {action && shouldShowAction && (
                                        action.type === 'banner' ? (
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
                                        ) : action.type === 'flight_banner' ? (
                                            <WhiteLabelWidget
                                                locationName={action.locationName}
                                                type="flight"
                                                customTrigger={
                                                    <button className={`${action.bgClass} rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group w-full`}>
                                                        <div className={`${action.iconBgClass} ${action.iconColorClass} p-2 rounded-lg shrink-0`}>
                                                            {action.icon}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <div className={`font-bold text-sm ${action.textClass}`}>{action.label}</div>
                                                            <div className={`text-xs ${action.descClass}`}>{action.description}</div>
                                                        </div>
                                                        <div className="text-gray-400 group-hover:text-gray-600 transition-colors">→</div>
                                                    </button>
                                                }
                                            />
                                        ) : action.type === 'accommodation_banner' ? (
                                            <MrtTimelineAction
                                                mrtQuery={action.mrtQuery}
                                                label={action.label}
                                                customTrigger={
                                                    <button className={`${action.bgClass} rounded-lg px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group w-full`}>
                                                        <div className={`${action.iconBgClass} ${action.iconColorClass} p-2 rounded-lg shrink-0`}>
                                                            {action.icon}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <div className={`font-bold text-sm ${action.textClass}`}>{action.label}</div>
                                                            <div className={`text-xs ${action.descClass}`}>{action.description}</div>
                                                        </div>
                                                        <div className="text-gray-400 group-hover:text-gray-600 transition-colors">→</div>
                                                    </button>
                                                }
                                            />
                                        ) : null
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
