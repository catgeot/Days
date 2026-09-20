import { useCallback, useEffect, useRef } from 'react';

export const GALLERY_LONG_PRESS_MS = 480;
export const GALLERY_LONG_PRESS_MOVE_PX = 12;

export function shouldCancelGalleryLongPress(start, current, movePx = GALLERY_LONG_PRESS_MOVE_PX) {
  if (!start || !current) return true;
  return Math.hypot(current.x - start.x, current.y - start.y) > movePx;
}

export function vibrateGalleryLongPress() {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* ignore */
  }
}

/**
 * 터치 길게 누르기. 스크롤·스와이프는 이동 임계로 취소.
 * 발화 후 이어지는 click은 consumeClickSuppression으로 막음.
 */
export function useGalleryLongPress(enabled, onLongPress) {
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const suppressClickRef = useRef(false);
  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const onTouchStart = useCallback((e) => {
    if (!enabled || e.touches.length !== 1) {
      clearTimer();
      return;
    }
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      startRef.current = null;
      suppressClickRef.current = true;
      vibrateGalleryLongPress();
      onLongPressRef.current?.();
    }, GALLERY_LONG_PRESS_MS);
  }, [enabled, clearTimer]);

  const onTouchMove = useCallback((e) => {
    if (!enabled || timerRef.current == null) return;
    if (e.touches.length !== 1) {
      clearTimer();
      return;
    }
    const t = e.touches[0];
    if (shouldCancelGalleryLongPress(startRef.current, { x: t.clientX, y: t.clientY })) {
      clearTimer();
    }
  }, [enabled, clearTimer]);

  const onTouchEnd = useCallback(() => {
    if (!enabled) return;
    clearTimer();
  }, [enabled, clearTimer]);

  const onContextMenu = useCallback((e) => {
    if (!enabled) return;
    e.preventDefault();
  }, [enabled]);

  const consumeClickSuppression = useCallback(() => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
    onContextMenu,
    consumeClickSuppression,
  };
}
