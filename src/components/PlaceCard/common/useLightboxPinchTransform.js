import { useRef, useCallback, useEffect, useState } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_EPSILON = 1.02;

function pinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
}

/**
 * 갤러리 라이트박스 — img CSS transform 핀치 in/out (document viewport 줌 없음).
 */
export function useLightboxPinchTransform(resetKey) {
    const gestureRef = useRef(null);
    const scaleRef = useRef(1);
    const panRef = useRef({ x: 0, y: 0 });
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });

    const applyTransform = useCallback((scale, pan) => {
        scaleRef.current = scale;
        panRef.current = pan;
        setTransform({ scale, x: pan.x, y: pan.y });
    }, []);

    const reset = useCallback(() => {
        gestureRef.current = null;
        applyTransform(1, { x: 0, y: 0 });
    }, [applyTransform]);

    useEffect(() => {
        reset();
    }, [resetKey, reset]);

    const isZoomed = useCallback(() => scaleRef.current > ZOOM_EPSILON, []);

    const onPinchTouchStart = useCallback((e) => {
        if (e.touches.length === 2) {
            gestureRef.current = {
                mode: 'pinch',
                startDist: pinchDistance(e.touches),
                startScale: scaleRef.current,
            };
            return;
        }
        if (e.touches.length === 1 && isZoomed()) {
            gestureRef.current = {
                mode: 'pan',
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                startPan: { ...panRef.current },
            };
        }
    }, [isZoomed]);

    const onPinchTouchMove = useCallback((e) => {
        const gesture = gestureRef.current;
        if (!gesture) return;

        if (gesture.mode === 'pinch' && e.touches.length >= 2) {
            e.preventDefault();
            const dist = pinchDistance(e.touches);
            const nextScale = Math.min(
                MAX_SCALE,
                Math.max(MIN_SCALE, gesture.startScale * (dist / gesture.startDist))
            );
            const pan = nextScale <= MIN_SCALE + 0.001 ? { x: 0, y: 0 } : panRef.current;
            applyTransform(nextScale, pan);
            return;
        }

        if (gesture.mode === 'pan' && e.touches.length === 1 && isZoomed()) {
            e.preventDefault();
            const dx = e.touches[0].clientX - gesture.startX;
            const dy = e.touches[0].clientY - gesture.startY;
            applyTransform(scaleRef.current, {
                x: gesture.startPan.x + dx,
                y: gesture.startPan.y + dy,
            });
        }
    }, [applyTransform, isZoomed]);

    const onPinchTouchEnd = useCallback((e) => {
        if (e.touches.length > 0) return;
        gestureRef.current = null;
    }, []);

    const transformStyle = {
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transformOrigin: 'center center',
        willChange: transform.scale > 1 ? 'transform' : undefined,
    };

    return {
        transformStyle,
        isZoomed,
        reset,
        onPinchTouchStart,
        onPinchTouchMove,
        onPinchTouchEnd,
        onPinchTouchCancel: onPinchTouchEnd,
    };
}
