import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ArrowUp } from 'lucide-react';
import CurationHub from './components/CurationHub';

function findScrollParent(el) {
  let node = el?.parentElement;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

const Curation = () => {
  const rootRef = useRef(null);
  const scrollParentRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const scrollEl = findScrollParent(root) || document.documentElement;
    scrollParentRef.current = scrollEl;

    const readTop = () =>
      scrollEl === document.documentElement
        ? window.scrollY || document.documentElement.scrollTop || 0
        : scrollEl.scrollTop;

    const onScroll = () => setShowScrollTop(readTop() > 280);
    onScroll();

    const target = scrollEl === document.documentElement ? window : scrollEl;
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    const el = scrollParentRef.current;
    if (!el || el === document.documentElement) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={rootRef} className="min-h-screen bg-white text-gray-900 font-sans relative">
      <div className="page-scroll-end-pad max-w-7xl mx-auto pt-8 px-4 sm:px-6">
        <div className="mb-6 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/blog"
              aria-label="LogBook으로 돌아가기"
              title="LogBook으로 돌아가기"
              className="inline-flex items-center justify-center w-9 h-9 -ml-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ChevronLeft size={22} strokeWidth={2.25} aria-hidden="true" />
            </Link>
            <Sparkles className="text-blue-500 flex-shrink-0" size={24} />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight drop-shadow-sm">
              큐레이션
            </h2>
          </div>
          <p className="text-gray-500 mt-1.5 text-sm font-medium break-keep max-w-xl pl-11">
            숨은 낙원을 추천받고, 이 페이지에서 팁·계절·이야기를 바로 읽으세요. 지나간 추천은 목록에서 다시 엽니다.
          </p>
        </div>

        <CurationHub />
      </div>

      <button
        type="button"
        aria-label="맨 위로"
        onClick={scrollToTop}
        className={`fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] right-3 z-40 flex h-11 items-center gap-1 rounded-full border border-blue-500/50 bg-blue-600 px-3.5 text-white shadow-[0_4px_18px_rgba(37,99,235,0.4)] transition-all duration-300 ${
          showScrollTop
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp size={18} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
        <span className="text-xs font-bold">위로</span>
      </button>
    </div>
  );
};

export default Curation;
