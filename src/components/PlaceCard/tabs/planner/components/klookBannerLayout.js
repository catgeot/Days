/** Klook 배너 공통 레이아웃·스케일 계산 */

/** 데스크톱·넓은 화면: 468×60 */
export const KLOOK_BANNER_WIDTH = 468;
export const KLOOK_BANNER_HEIGHT = 60;
/** 모바일 뷰포트 — 투어(Play): IAB 300×250 */
export const KLOOK_BANNER_MOBILE_WIDTH = 300;
export const KLOOK_BANNER_MOBILE_HEIGHT = 250;
/** 모바일 뷰포트 — 렌터카(Car): 클룩이 제공하는 250×250 정사각형 단위 */
export const KLOOK_CAR_BANNER_MOBILE_WIDTH = 250;
export const KLOOK_CAR_BANNER_MOBILE_HEIGHT = 250;
/** Tailwind `md`(768px) 미만을 플래너 카드 기준 모바일으로 본다 */
export const KLOOK_PLANNER_MOBILE_MAX_BREAKPOINT = 767;

/** Play(투어) 배너 — 클룩 대시보드에서 발급한 크기별 광고 단위(data-adid) */
export const KLOOK_TOUR_AD_ID_DESKTOP = '1272015';
export const KLOOK_TOUR_AD_ID_MOBILE = '1273972';

/** Car(렌터카) 배너 — 데스크톱 468×60 / 모바일 250×250 각각 embed의 data-adid (data-bgtype은 항상 Car) */
export const KLOOK_CAR_AD_ID_DESKTOP = '1265731';
export const KLOOK_CAR_AD_ID_MOBILE = '1273974';
export const KLOOK_BANNER_MAX_SCALE = 2.35;
export const KLOOK_BANNER_MIN_SCALE = 0.2;
/** 좁은 폭에서 세로가 너무 얇아 보이지 않도록 높이 기준 최소 스케일 */
export const KLOOK_BANNER_MIN_DISPLAY_HEIGHT = 50;

/**
 * @param {number} containerClientWidth ref 측정 폭
 * @param {number} [horizontalPad]
 * @param {number} [bannerW]
 * @param {number} [bannerH]
 * @returns {{ scale: number, clipW: number, clipH: number }}
 */
export function computeKlookBannerLayout(
    containerClientWidth,
    horizontalPad = 8,
    bannerW = KLOOK_BANNER_WIDTH,
    bannerH = KLOOK_BANNER_HEIGHT,
) {
    const available = Math.max(0, Math.round(containerClientWidth - horizontalPad));
    const scaleToFitWidth = bannerW > 0 ? available / bannerW : 1;
    const minScaleForHeight = bannerH > 0 ? KLOOK_BANNER_MIN_DISPLAY_HEIGHT / bannerH : KLOOK_BANNER_MIN_SCALE;
    // 1) 최대·폭 기준 상한. 2) 폭이 허용할 때만 최소 높이만큼 키움(구버전은 minHeight가 폭보다 커져 좌우 잘림).
    let scale = Math.min(KLOOK_BANNER_MAX_SCALE, scaleToFitWidth);
    scale = Math.max(scale, Math.min(minScaleForHeight, scaleToFitWidth));
    scale = Math.min(scaleToFitWidth, Math.max(KLOOK_BANNER_MIN_SCALE, scale));
    const clipH = Math.round(bannerH * scale);
    const clipW = available;
    return { scale, clipW, clipH };
}
