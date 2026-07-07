import { useEffect } from 'react';
import { snapVisualViewportPinchZoom } from '../../../shared/lib/mobileViewport';

const ZOOMED_CLASS = 'pinch-zoom-scroll--zoomed';
/** iOS·Android 핀치 줌 감지 — 1.0 부동소수 오차 여유 */
const ZOOM_SCALE_THRESHOLD = 1.02;
/** 핀치 아웃 후 이 scale 이하면 1.0으로 스냅 */
const PINCH_SNAP_MAX_SCALE = 1.08;
/** 탭 vs 패닝 구분 */
const PAN_START_THRESHOLD_PX = 4;

const INTERACTIVE_SELECTOR =
    'button, a, input, textarea, select, label, iframe, [role="button"], [contenteditable="true"]';

/**
 * 핀치 줌 후 한 손가락 패닝 — visualViewport.scale>1일 때 스크롤 컨테이너 잠금 +
 * translate로 상·하·좌·우 이동 (PlaceCard fixed 레이아웃·2손가락 패닝과 유사한 통합 조작).
 */
export function usePinchZoomPan(scrollRef, enabled = true) {
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return undefined;

        const vv = window.visualViewport;
        let surfaceEl = null;
        let touchBound = false;
        let zoomed = false;
        let savedScrollTop = 0;
        let panX = 0;
        let panY = 0;
        let isPanning = false;
        let panStarted = false;
        let lastPanX = 0;
        let lastPanY = 0;
        let activeTouchCount = 0;

        const isZoomed = () => (vv?.scale ?? 1) > ZOOM_SCALE_THRESHOLD;

        const shouldIgnorePanTarget = (target) =>
            target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));

        const resetPanOffset = () => {
            panX = 0;
            panY = 0;
            if (surfaceEl) surfaceEl.style.transform = '';
        };

        const applyPanTransform = () => {
            if (!surfaceEl || !zoomed) return;
            if (panX === 0 && panY === 0) {
                surfaceEl.style.transform = '';
                return;
            }
            surfaceEl.style.transform = `translate(${panX}px, ${panY}px)`;
        };

        const applyZoomedState = (nextZoomed) => {
            const nowZoomed = nextZoomed || isZoomed();
            if (!surfaceEl) {
                zoomed = nowZoomed;
                return;
            }

            if (nowZoomed && !zoomed) {
                savedScrollTop = surfaceEl.scrollTop;
                resetPanOffset();
            }
            if (!nowZoomed && zoomed) {
                surfaceEl.scrollTop = savedScrollTop;
                resetPanOffset();
            }

            zoomed = nowZoomed;
            surfaceEl.classList.toggle(ZOOMED_CLASS, zoomed);
        };

        const sync = () => {
            const el = scrollRef.current;
            if (!el) return;

            if (el !== surfaceEl) {
                if (surfaceEl && touchBound) {
                    detachTouch(surfaceEl);
                }
                surfaceEl = el;
                touchBound = false;
            }

            if (!touchBound) {
                attachTouch(surfaceEl);
                touchBound = true;
            }

            const nowZoomed = isZoomed();
            if (nowZoomed !== zoomed) {
                applyZoomedState(nowZoomed);
                return;
            }
            if (!nowZoomed) {
                surfaceEl.classList.remove(ZOOMED_CLASS);
            }
        };

        function attachTouch(el) {
            el.addEventListener('touchstart', onTouchStart, { passive: true });
            el.addEventListener('touchmove', onTouchMove, { passive: false });
            el.addEventListener('touchend', onTouchEnd, { passive: true });
            el.addEventListener('touchcancel', onTouchEnd, { passive: true });
        }

        function detachTouch(el) {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
            el.removeEventListener('touchcancel', onTouchEnd);
            el.classList.remove(ZOOMED_CLASS);
            el.style.transform = '';
        }

        function resetPanState() {
            isPanning = false;
            panStarted = false;
        }

        function onTouchStart(event) {
            activeTouchCount = event.touches.length;
            if (event.touches.length >= 2) {
                resetPanState();
                applyZoomedState(true);
                return;
            }

            if (!isZoomed() && !zoomed) return;
            if (event.touches.length !== 1) return;
            if (shouldIgnorePanTarget(event.target)) return;

            isPanning = true;
            panStarted = false;
            lastPanX = event.touches[0].clientX;
            lastPanY = event.touches[0].clientY;
        }

        function onTouchMove(event) {
            activeTouchCount = event.touches.length;
            if (event.touches.length >= 2) {
                resetPanState();
                applyZoomedState(true);
                return;
            }

            if (!isPanning || (!isZoomed() && !zoomed)) return;
            if (event.touches.length !== 1) return;

            const x = event.touches[0].clientX;
            const y = event.touches[0].clientY;
            const dx = x - lastPanX;
            const dy = y - lastPanY;

            if (!panStarted) {
                if (Math.hypot(dx, dy) < PAN_START_THRESHOLD_PX) return;
                panStarted = true;
            }

            panX += dx;
            panY += dy;
            applyPanTransform();
            lastPanX = x;
            lastPanY = y;
            event.preventDefault();
        }

        function onTouchEnd(event) {
            const wasPinching = activeTouchCount >= 2;
            activeTouchCount = event.touches.length;
            resetPanState();
            applyZoomedState(isZoomed());

            if (wasPinching && event.touches.length === 0) {
                requestAnimationFrame(() => {
                    if (snapVisualViewportPinchZoom(PINCH_SNAP_MAX_SCALE)) {
                        applyZoomedState(false);
                    }
                    sync();
                });
            }
        }

        vv?.addEventListener('resize', sync);
        vv?.addEventListener('scroll', sync);
        sync();
        const retryId = window.requestAnimationFrame(sync);

        return () => {
            window.cancelAnimationFrame(retryId);
            vv?.removeEventListener('resize', sync);
            vv?.removeEventListener('scroll', sync);
            if (surfaceEl && touchBound) {
                detachTouch(surfaceEl);
            }
        };
    }, [scrollRef, enabled]);
}
