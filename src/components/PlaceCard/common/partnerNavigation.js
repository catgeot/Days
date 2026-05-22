import { buildTripcomPlannerFlightUrl, TRIPCOM_FLIGHT_AD } from '../../../utils/affiliate';
import { isMobileDevice } from './device';

/**
 * 플래너에서 Trip.com으로 **페이지 이동**할 때 쓰는 URL.
 * 모바일 `/flights/` 직링크는 aAirportCode 자동입력이 무시되는 경우가 있어
 * 배너 iframe과 동일한 partners/ad 위젯 URL을 사용한다.
 *
 * @param {Record<string, unknown> | null | undefined} location
 * @param {{ essentialGuide?: Record<string, unknown> | null, tracking?: string }} [options]
 */
export function buildTripcomPlannerNavigationUrl(location, options = {}) {
    if (isMobileDevice() && TRIPCOM_FLIGHT_AD.mobileAdId) {
        return buildTripcomPlannerFlightUrl(location, {
            ...options,
            mode: 'ad',
            adId: TRIPCOM_FLIGHT_AD.mobileAdId,
            tracking: options.tracking ?? 'planner-flight-mobile',
        });
    }

    return buildTripcomPlannerFlightUrl(location, {
        ...options,
        mode: 'flights',
    });
}

/** 모바일 전체 화면 모달용 ad iframe src (외부 Trip.com 페이지 이동 대신 사용) */
export function buildTripcomPlannerFlightModalSrc(location, options = {}) {
    if (!shouldUseTripcomFlightSearchModal()) return null;

    return buildTripcomPlannerFlightUrl(location, {
        ...options,
        mode: 'ad',
        adId: TRIPCOM_FLIGHT_AD.mobileAdId,
        tracking: options.tracking ?? 'planner-flight-mobile',
    });
}

export function shouldUseTripcomFlightSearchModal() {
    return isMobileDevice() && !!TRIPCOM_FLIGHT_AD.mobileAdId;
}

/**
 * 제휴·파트너 외부 링크 탭 정책.
 * - 모바일: 같은 탭(_self) → 브라우저 뒤로가기로 gateo 복귀
 * - 데스크톱: 새 탭(_blank)
 */
export function getPartnerLinkTarget() {
    return isMobileDevice() ? '_self' : '_blank';
}

/**
 * 일반 제휴 링크 rel (Klook 등). 데스크톱 새 탭은 noopener만.
 */
export function getPartnerLinkRel(target = getPartnerLinkTarget()) {
    return target === '_blank' ? 'noopener' : undefined;
}

/**
 * Trip.com 전용 rel.
 * 모바일: noreferrer — Referer가 있으면 Trip이 aAirportCode 자동입력을 무시하는 경우가 있음.
 * 데스크톱: noopener + Referer 유지 — 새 탭 gateo.kr 복귀 링크용.
 */
export function getTripcomLinkRel(target = getPartnerLinkTarget()) {
    if (target === '_self') return 'noreferrer';
    if (target === '_blank') return 'noopener';
    return undefined;
}

/**
 * Trip.com 배너 iframe Referer.
 * 모바일 ad 위젯은 부모 Referer 없이 src 쿼리(aAirportCode 등)만 사용하는 편이 안정적.
 */
export function getTripcomIframeReferrerPolicy() {
    return isMobileDevice() ? 'no-referrer' : undefined;
}

/** 프로그래밍 방식 — 일반 제휴 URL */
export function openPartnerExternalUrl(url, { target = getPartnerLinkTarget() } = {}) {
    if (!url) return;
    if (target === '_self') {
        window.location.assign(url);
        return;
    }
    window.open(url, '_blank', 'noopener');
}

/** 프로그래밍 방식 — Trip.com (모바일 _self 시 noreferrer로 이동) */
export function openTripcomExternalUrl(url, { target = getPartnerLinkTarget() } = {}) {
    if (!url) return;
    if (target === '_self') {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.rel = 'noreferrer';
        anchor.target = '_self';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        return;
    }
    window.open(url, '_blank', 'noopener');
}
