import { useLayoutEffect, useState } from 'react';

const DESKTOP_ANCHOR_SELECTOR = '[data-site-notice-anchor]';
const MOBILE_ANCHOR_SELECTOR = '[data-site-notice-anchor-mobile]';
const MOBILE_MQL = '(max-width: 767px)';

function pickAnchorSelector() {
  if (typeof window === 'undefined') return DESKTOP_ANCHOR_SELECTOR;
  return window.matchMedia(MOBILE_MQL).matches
    ? MOBILE_ANCHOR_SELECTOR
    : DESKTOP_ANCHOR_SELECTOR;
}

export function useSiteNoticeAnchorRect(enabled) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!enabled) {
      setRect(null);
      return undefined;
    }

    let observedEl = null;
    const observer = new ResizeObserver(() => update());

    const update = () => {
      const el = document.querySelector(pickAnchorSelector());
      if (el !== observedEl) {
        if (observedEl) observer.unobserve(observedEl);
        observedEl = el;
        if (el) observer.observe(el);
      }

      if (!el) {
        setRect(null);
        return;
      }

      const next = el.getBoundingClientRect();
      const isMobileAnchor = el.matches(MOBILE_ANCHOR_SELECTOR);
      if (next.width < 16 || (!isMobileAnchor && next.height < 8)) {
        setRect(null);
        return;
      }

      setRect({
        top: next.top,
        left: next.left,
        width: next.width,
        height: next.height,
      });
    };

    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    const mql = window.matchMedia(MOBILE_MQL);
    mql.addEventListener('change', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      mql.removeEventListener('change', update);
      if (observedEl) observer.unobserve(observedEl);
      observer.disconnect();
    };
  }, [enabled]);

  return rect;
}
