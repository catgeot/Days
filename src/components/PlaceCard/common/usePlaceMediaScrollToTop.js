import { useCallback, useEffect } from 'react';
import { PLACE_MEDIA_SCROLL_TO_TOP_EVENT, resetPlaceMediaScrollInstant } from './placeScrollSurface';

export function usePlaceMediaScrollToTop(mediaMode, scrollRef, enabled = true) {
    const scrollToTop = useCallback((behavior = 'smooth') => {
        const el = scrollRef.current;
        if (!el) return;
        if (behavior === 'auto') {
            resetPlaceMediaScrollInstant(el);
            return;
        }
        el.scrollTo({ top: 0, behavior: 'smooth' });
    }, [scrollRef]);

    useEffect(() => {
        if (!enabled) return;
        const handler = (event) => {
            if (event.detail?.mediaMode !== mediaMode) return;
            scrollToTop(event.detail?.behavior || 'smooth');
        };
        window.addEventListener(PLACE_MEDIA_SCROLL_TO_TOP_EVENT, handler);
        return () => window.removeEventListener(PLACE_MEDIA_SCROLL_TO_TOP_EVENT, handler);
    }, [mediaMode, scrollToTop, enabled]);

    return scrollToTop;
}
