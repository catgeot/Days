import React from 'react';
import { DIRECT_FERRIES_BASE_URL, DIRECT_FERRIES_RECOMMENDATIONS } from '../constants';

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
                    Direct Ferries 실시간 검색
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            {/* Direct Ferries iframe 위젯 */}
            <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <iframe
                    src={DIRECT_FERRIES_BASE_URL}
                    width="100%"
                    height="285"
                    frameBorder="0"
                    scrolling="no"
                    title="Direct Ferries 페리 검색"
                    className="w-full"
                    style={{ minHeight: '285px' }}
                />
            </div>

            {/* 제휴 안내 문구 */}
            <p className="text-[10px] text-gray-500 text-center leading-relaxed break-keep">
                Direct Ferries 제휴 링크로, 예약 시 사이트 운영에 도움이 됩니다.
            </p>
        </div>
    );
};

export default DirectFerriesWidget;
