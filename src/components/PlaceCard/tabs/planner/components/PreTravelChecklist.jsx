import React from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Plane, Car, Bed } from 'lucide-react';
import WhiteLabelWidget from '../../../common/WhiteLabelWidget';
import MrtTimelineAction from './MrtTimelineAction';
import { getKlookAffiliateUrl, getTripcomHotelOverrideUrlForLocation } from '../../../../../utils/affiliate';
import { getFlightDestinationSearchHint } from '../../../../../utils/rentalAirportMatch.js';

const PreTravelChecklist = ({ items, locationName, location, essentialGuide }) => {
    const tripcomHotelOverride = getTripcomHotelOverrideUrlForLocation(location);
    const mrtQuery = `${locationName || ''} 숙소`;

    return (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 mb-5 shadow-sm flex flex-col">
            <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-sm md:text-base">
                <AlertCircle className="text-amber-600 shrink-0" size={18} />
                출발 전 필수 준비사항
            </h3>

            {/* AI가 생성한 준비사항 */}
            <div className="flex-1">
                {items && items.length > 0 && (
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-amber-100">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={18} className="text-amber-500 shrink-0" />
                                    <div>
                                        <p className="text-xs md:text-sm font-bold text-gray-800">{item.title}</p>
                                        {item.cost && <p className="text-[10px] md:text-xs text-gray-500 font-medium">{item.cost}</p>}
                                    </div>
                                </div>
                                {item.url && (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                        <span>바로가기</span>
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🆕 상시 노출 예약 버튼 (항공권, 숙소, 픽업) - 하단 고정 */}
            <div className="mt-auto pt-5">
                {/* 구분선 및 라벨 */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-amber-300/50"></div>
                    <p className="text-[10px] text-amber-700/90 font-bold tracking-wide">
                        ✈️ 필수 예약 툴킷
                    </p>
                    <div className="h-px flex-1 bg-amber-300/50"></div>
                </div>

                {/* 1. 항공권 검색 */}
                <div className="mb-3">
                    <WhiteLabelWidget
                        locationName={locationName}
                        type="flight"
                        customTrigger={
                            <button className="bg-white border-2 border-indigo-300 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group w-full">
                                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg shrink-0">
                                    <Plane size={16} />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="font-bold text-sm text-gray-800">항공권 실시간 검색</div>
                                    <div className="text-[11px] text-gray-600 leading-snug mt-0.5">
                                        {getFlightDestinationSearchHint(location, { essentialGuide })}
                                    </div>
                                </div>
                                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">→</div>
                            </button>
                        }
                    />
                </div>

                {/* 2. 숙소 검색 — 기본 마이리얼트립 / PLANNER_TRIPCOM_HOTEL_OVERRIDES 등록 시 트립닷컴 */}
                <div className="mb-3">
                    {tripcomHotelOverride ? (
                        <a
                            href={tripcomHotelOverride}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <span className="bg-white border-2 border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group w-full cursor-pointer">
                                <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg shrink-0 inline-flex">
                                    <Bed size={16} />
                                </span>
                                <span className="flex-1 text-left">
                                    <span className="font-bold text-sm text-gray-800 block">호텔 예약 (Trip.com)</span>
                                    <span className="text-xs text-gray-600">이 여행지는 트립닷컴 제휴 링크로 연결됩니다</span>
                                </span>
                                <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
                            </span>
                        </a>
                    ) : (
                        <MrtTimelineAction
                            mrtQuery={mrtQuery}
                            label="숙소 실시간 검색"
                            customTrigger={
                                <button type="button" className="bg-white border-2 border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group w-full">
                                    <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg shrink-0 inline-flex">
                                        <Bed size={16} />
                                    </span>
                                    <span className="flex-1 text-left">
                                        <span className="font-bold text-sm text-gray-800 block">숙소 실시간 검색</span>
                                        <span className="text-xs text-gray-600">전 세계 숙소 검색 및 예약</span>
                                    </span>
                                    <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
                                </button>
                            }
                        />
                    )}
                </div>

                {/* 3. 공항 픽업 예약 */}
                <a
                    href={getKlookAffiliateUrl('https://www.klook.com/ko/airport-transfers/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border-2 border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all group w-full block"
                >
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-lg shrink-0">
                        <Car size={16} />
                    </div>
                    <div className="flex-1 text-left">
                        <div className="font-bold text-sm text-gray-800">공항 픽업 예약</div>
                        <div className="text-xs text-gray-600 leading-snug">
                            항공권 구매 후 항공편명으로 검색해 주세요.
                        </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">→</div>
                </a>
            </div>
        </div>
    );
};

export default PreTravelChecklist;
