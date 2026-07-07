/** 읽기 영역 — 세로 스크롤 + 핀치 줌 공존 (touch-pan-y 단독은 줌 차단). 줌 후 pan-x는 usePinchZoomPan */
export const placeScrollSurfaceClass = 'pinch-zoom-scroll overscroll-y-contain overscroll-x-none';

export const PLACE_MEDIA_SCROLL_TO_TOP_EVENT = 'place-media-scroll-to-top';

/** @deprecated PLACE_MEDIA_SCROLL_TO_TOP_EVENT 사용 */
export const PLANNER_SCROLL_TO_TOP_EVENT = 'planner-scroll-to-top';

export function dispatchPlaceScrollToTop(mediaMode) {
    window.dispatchEvent(
        new CustomEvent(PLACE_MEDIA_SCROLL_TO_TOP_EVENT, { detail: { mediaMode } })
    );
}
