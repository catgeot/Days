import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { readVisualViewportBottomInset, syncHomeViewportAfterInput } from '../lib/mobileViewport';

/** iOS Safari 자동 줌 방지 — 모바일 16px, 데스크톱은 기존 크기 유지 */
export const MOBILE_INPUT_TEXT_CLASS = 'text-[16px] md:text-sm';
export const MOBILE_INPUT_TEXT_XS_CLASS = 'text-[16px] md:text-xs';
export const MOBILE_TEXTAREA_CLASS = 'text-[16px] md:text-sm';

export function blurActiveTextInput() {
  if (typeof document === 'undefined') return;
  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement
    || active instanceof HTMLTextAreaElement
    || active instanceof HTMLElement
  ) {
    active.blur();
  }
}

/**
 * 모바일 텍스트 입력 오버레이(모달·시트) 공통 처리.
 * - 열릴 때 body scroll lock
 * - 닫힐 때 blur + syncHomeViewportAfterInput (지구본·fixed UI 복구)
 */
export function useMobileOverlayViewport(isOpen, { lockBody = true } = {}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    if (lockBody) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (lockBody) {
        document.body.style.overflow = '';
      }
      blurActiveTextInput();
      syncHomeViewportAfterInput();
    };
  }, [isOpen, lockBody]);
}

/** 닫기·제출 완료 등 명시적 dismiss 시 호출 */
export function dismissMobileTextInput() {
  blurActiveTextInput();
  syncHomeViewportAfterInput();
}

/** input/textarea onBlur — listbox 등 포커스 이동 직후 sync 방지용 defer */
export function useDeferredViewportSyncOnBlur(deferMs = 0) {
  return useCallback(() => {
    window.setTimeout(() => {
      syncHomeViewportAfterInput();
    }, deferMs);
  }, [deferMs]);
}

/** 모바일 터치 기기 여부 — 출발지 검색 등 키보드 UI 분기 */
export function useCoarsePointer() {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)');
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return matches;
}

/** 키보드 visualViewport 하단에 fixed UI 고정 — `{ bottom }` px */
export function useVisualViewportBottomAnchor(enabled, { pad = 8 } = {}) {
  const [style, setStyle] = useState(undefined);

  useLayoutEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setStyle(undefined);
      return undefined;
    }

    const update = () => {
      setStyle({ bottom: readVisualViewportBottomInset(pad) });
    };

    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [enabled, pad]);

  return style;
}
