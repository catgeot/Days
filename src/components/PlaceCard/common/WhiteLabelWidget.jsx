import React, { useMemo } from 'react';
import { Search, Plane } from 'lucide-react';
import { buildTripcomPlannerFlightUrl } from '../../../utils/affiliate';

/**
 * 플래너 Trip.com 항공권 제휴 링크 (새 탭, 도착 공항 자동 반영)
 * @param {Record<string, unknown> | null | undefined} [location]
 * @param {Record<string, unknown> | null | undefined} [essentialGuide]
 * @param {React.ReactElement} [customTrigger] - 커스텀 트리거 버튼
 */
const WhiteLabelWidget = ({ location, essentialGuide, customTrigger }) => {
    const flightUrl = useMemo(
        () => buildTripcomPlannerFlightUrl(location, { essentialGuide, mode: 'flights' }),
        [location, essentialGuide],
    );

    const handleOpen = () => {
        const tab = window.open(flightUrl, '_blank');
        if (tab) tab.opener = null;
    };

    if (customTrigger) {
        return React.cloneElement(customTrigger, { onClick: handleOpen });
    }

    return (
        <button
            type="button"
            onClick={handleOpen}
            className="flex items-center justify-center gap-1.5 w-full mt-3 py-3 min-h-[44px] rounded-xl text-xs font-semibold transition-colors border bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
            aria-label="Trip.com 항공권 검색"
        >
            <Plane size={14} />
            <span>Trip.com 항공권 검색</span>
            <Search size={12} className="ml-0.5 opacity-80" />
        </button>
    );
};

export default WhiteLabelWidget;
