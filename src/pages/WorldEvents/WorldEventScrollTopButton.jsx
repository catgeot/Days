import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SCROLL_TOP_THRESHOLD = 180;

/**
 * Hub·상세 main은 100dvh 안쪽 스크롤이라 window로는 맨 위에 못 간다.
 * @param {React.RefObject<HTMLElement | null>} scrollRef
 * @param {boolean} [enabled]
 */
export function useWorldEventScrollTop(scrollRef, enabled = true) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return undefined;
    }
    const el = scrollRef.current;
    if (!el) {
      setVisible(false);
      return undefined;
    }
    const onScroll = () => setVisible(el.scrollTop > SCROLL_TOP_THRESHOLD);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, enabled]);

  return visible;
}

/** @param {React.RefObject<HTMLElement | null>} scrollRef */
export function scrollWorldEventMainToTop(scrollRef) {
  scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
}

/** @param {{ visible: boolean, onClick: () => void }} props */
export default function WorldEventScrollTopButton({ visible, onClick }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      data-world-event-scroll-top=""
      aria-label={t('korea.common.scrollToTop')}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`fixed bottom-[max(3.6rem,calc(env(safe-area-inset-bottom)+2.85rem))] right-3 z-40 flex h-11 items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500 px-3.5 text-white shadow-[0_4px_18px_rgba(245,158,11,0.45)] transition-all duration-300 ${
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ArrowUp size={18} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
      <span className="text-xs font-bold">{t('korea.common.scrollUp')}</span>
    </button>
  );
}
