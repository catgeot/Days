import React from 'react';
import { Ship } from 'lucide-react';
import { DIRECT_FERRIES_HOME_URL, DIRECT_FERRIES_RECOMMENDATIONS } from '../constants';

const DirectFerriesWidget = ({ location }) => {
    const recommendations = location?.slug ? DIRECT_FERRIES_RECOMMENDATIONS[location.slug] : null;

    return (
        <div className="mt-4 space-y-3">
            {/* 추천 노선 박스 (여행지별 조건부 표시) */}
            {recommendations && recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💡</span>
                        <h4 className="font-semibold text-blue-900 text-sm">추천 노선</h4>
                    </div>
                    <ul className="space-y-1.5">
                        {recommendations.map((route, idx) => (
                            <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span className="break-keep">{route}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 구분선 */}
            <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direct Ferries 페리 검색
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            {/* Direct Ferries 홈 배너 버튼 */}
            <a
                href={DIRECT_FERRIES_HOME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
            >
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Ship className="text-white" size={24} />
                                </div>
                                <h3 className="text-white font-bold text-lg">Direct Ferries</h3>
                            </div>
                            <p className="text-white/90 text-sm font-medium break-keep">
                                전 세계 페리 노선 실시간 검색 및 예약
                            </p>
                            <p className="text-white/70 text-xs mt-1 break-keep">
                                자동완성 지원 · 최저가 보장 · 즉시 예약 확정
                            </p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            <div className="bg-white text-cyan-600 px-4 py-2 rounded-lg font-bold text-sm group-hover:bg-cyan-50 transition-colors">
                                검색하기 →
                            </div>
                        </div>
                    </div>
                </div>
            </a>

            {/* 제휴 안내 문구 */}
            <p className="text-[10px] text-gray-500 text-center leading-relaxed break-keep">
                Direct Ferries 제휴 링크로, 예약 시 사이트 운영에 도움이 됩니다.
            </p>
        </div>
    );
};

export default DirectFerriesWidget;
