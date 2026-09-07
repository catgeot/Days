/** 갤러리·위키·리뷰 — 세로 스크롤만 (줌 없음) */
export const placeScrollPanYClass = 'place-scroll-pan-y overscroll-y-contain overscroll-x-none';

/** 플래너 — 네이티브 핀치 줌 + 상하좌우 스크롤 */
export const plannerScrollSurfaceClass = 'place-scroll-zoom overscroll-y-contain overscroll-x-none';

/** @deprecated placeScrollPanYClass 사용 */
export const placeScrollSurfaceClass = placeScrollPanYClass;

export const PLACE_MEDIA_SCROLL_TO_TOP_EVENT = 'place-media-scroll-to-top';

/** @deprecated PLACE_MEDIA_SCROLL_TO_TOP_EVENT 사용 */
export const PLANNER_SCROLL_TO_TOP_EVENT = 'planner-scroll-to-top';

/** Nested overflow — instant top. Place switch must not keep the previous gallery offset. */
export function resetPlaceMediaScrollInstant(scrollEl) {
    if (!scrollEl) return false;
    scrollEl.scrollTop = 0;
    if (typeof scrollEl.scrollTo === 'function') {
        try {
            scrollEl.scrollTo({ top: 0, left: scrollEl.scrollLeft || 0, behavior: 'auto' });
        } catch {
            scrollEl.scrollTop = 0;
        }
    }
    return scrollEl.scrollTop === 0;
}

export function dispatchPlaceScrollToTop(mediaMode, { behavior = 'smooth' } = {}) {
    window.dispatchEvent(
        new CustomEvent(PLACE_MEDIA_SCROLL_TO_TOP_EVENT, { detail: { mediaMode, behavior } })
    );
}
