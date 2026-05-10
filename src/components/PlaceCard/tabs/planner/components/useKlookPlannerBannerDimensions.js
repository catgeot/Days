import { useState, useEffect } from 'react';
import {
    KLOOK_BANNER_WIDTH,
    KLOOK_BANNER_HEIGHT,
    KLOOK_BANNER_MOBILE_WIDTH,
    KLOOK_BANNER_MOBILE_HEIGHT,
    KLOOK_CAR_BANNER_MOBILE_WIDTH,
    KLOOK_CAR_BANNER_MOBILE_HEIGHT,
    KLOOK_PLANNER_MOBILE_MAX_BREAKPOINT,
} from './klookBannerLayout';

/**
 * @param {'tour' | 'car'} slot 투어는 모바일 300×250, 렌터카는 모바일 250×250
 */
function readPlannerBannerSize(slot = 'tour') {
    if (typeof window === 'undefined') {
        return { width: KLOOK_BANNER_WIDTH, height: KLOOK_BANNER_HEIGHT };
    }
    const mobile = window.matchMedia(`(max-width: ${KLOOK_PLANNER_MOBILE_MAX_BREAKPOINT}px)`).matches;
    if (!mobile) {
        return { width: KLOOK_BANNER_WIDTH, height: KLOOK_BANNER_HEIGHT };
    }
    if (slot === 'car') {
        return { width: KLOOK_CAR_BANNER_MOBILE_WIDTH, height: KLOOK_CAR_BANNER_MOBILE_HEIGHT };
    }
    return { width: KLOOK_BANNER_MOBILE_WIDTH, height: KLOOK_BANNER_MOBILE_HEIGHT };
}

/** 플래너 탭 Klook 배너: 좁은 뷰포트에서 슬롯별 모바일 크기, 그 외 468×60 */
export function useKlookPlannerBannerDimensions(slot = 'tour') {
    const [dims, setDims] = useState(() => readPlannerBannerSize(slot));

    useEffect(() => {
        const query = `(max-width: ${KLOOK_PLANNER_MOBILE_MAX_BREAKPOINT}px)`;
        const mq = window.matchMedia(query);
        const sync = () => setDims(readPlannerBannerSize(slot));
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, [slot]);

    return dims;
}
