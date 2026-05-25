import { useCallback, useEffect } from 'react';
import { PLACE_MEDIA_SCROLL_TO_TOP_EVENT } from './placeScrollSurface';

export function usePlaceMediaScrollToTop(mediaMode, scrollRef, enabled = true) {
    const scrollToTop = useCallback(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [scrollRef]);

    useEffect(() => {
        if (!enabled) return;
        const handler = (event) => {
            if (event.detail?.mediaMode === mediaMode) scrollToTop();
        };
        window.addEventListener(PLACE_MEDIA_SCROLL_TO_TOP_EVENT, handler);
        return () => window.removeEventListener(PLACE_MEDIA_SCROLL_TO_TOP_EVENT, handler);
    }, [mediaMode, scrollToTop, enabled]);

    return scrollToTop;
}
