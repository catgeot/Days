/** 갤러리·위키·리뷰 — 세로 스크롤만 (줌 없음) */
export const placeScrollPanYClass = 'place-scroll-pan-y overscroll-y-contain overscroll-x-none';

/** 플래너 — 네이티브 핀치 줌 + 상하좌우 스크롤 */
export const plannerScrollSurfaceClass = 'place-scroll-zoom overscroll-y-contain overscroll-x-none';

/** @deprecated placeScrollPanYClass 사용 */
export const placeScrollSurfaceClass = placeScrollPanYClass;

export const PLACE_MEDIA_SCROLL_TO_TOP_EVENT = 'place-media-scroll-to-top';

/** @deprecated PLACE_MEDIA_SCROLL_TO_TOP_EVENT 사용 */
export const PLANNER_SCROLL_TO_TOP_EVENT = 'planner-scroll-to-top';

export function dispatchPlaceScrollToTop(mediaMode) {
    window.dispatchEvent(
        new CustomEvent(PLACE_MEDIA_SCROLL_TO_TOP_EVENT, { detail: { mediaMode } })
    );
}
