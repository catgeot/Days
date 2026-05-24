import { useLayoutEffect, useState } from 'react';

const ANCHOR_SELECTOR = '[data-site-notice-anchor]';

export function useSiteNoticeAnchorRect(enabled) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!enabled) {
      setRect(null);
      return undefined;
    }

    const update = () => {
      const el = document.querySelector(ANCHOR_SELECTOR);
      if (!el) {
        setRect(null);
        return;
      }
      const next = el.getBoundingClientRect();
      if (next.width < 16 || next.height < 8) {
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

    const el = document.querySelector(ANCHOR_SELECTOR);
    const observer = el ? new ResizeObserver(update) : null;
    if (el && observer) observer.observe(el);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      observer?.disconnect();
    };
  }, [enabled]);

  return rect;
}
