import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobeHomeBanner } from '../hooks/useGlobeHomeBanner';

/** 복제 트랙 50% 이동 = 우→좌 1회전. 뉴스 크롤·전광판 통상 속도(약 30~40초). */
const MARQUEE_LOOP_SECONDS = 32;

const TOPIC_META = {
  festival: {
    badge: '축제',
    badgeClass: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  },
  scenic: {
    badge: '명소',
    badgeClass: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
  },
};

function BannerItem({ item, onSelect }) {
  const meta = TOPIC_META[item.topic] || TOPIC_META.scenic;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.href)}
      className="inline-flex shrink-0 items-center gap-1.5 px-3 touch-manipulation"
      aria-label={`${meta.badge} ${item.label}`}
    >
      <span
        className={`rounded px-1 py-0.5 text-[9px] font-bold tracking-wide border ${meta.badgeClass}`}
      >
        {meta.badge}
      </span>
      <span className="text-[11px] font-medium text-white/85 whitespace-nowrap">
        {item.label}
      </span>
    </button>
  );
}

export default function GlobeHomeMarqueeBanner({ hidden = false }) {
  const navigate = useNavigate();
  const { items } = useGlobeHomeBanner();
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const loopItems = useMemo(() => {
    if (!items.length) return [];
    return [...items, ...items];
  }, [items]);

  if (hidden || items.length === 0) return null;

  const handleSelect = (href) => {
    navigate(href);
  };

  if (reduceMotion) {
    const first = items[0];
    const meta = TOPIC_META[first.topic] || TOPIC_META.scenic;
    return (
      <div
        className="w-full max-w-[17.5rem] md:max-w-[14rem] rounded-xl border border-white/10 bg-black/25 backdrop-blur-md overflow-hidden pointer-events-auto"
        data-home-globe-banner
      >
        <button
          type="button"
          onClick={() => handleSelect(first.href)}
          className="flex w-full items-center gap-1.5 px-2.5 py-1.5 touch-manipulation text-left"
        >
          <span
            className={`rounded px-1 py-0.5 text-[9px] font-bold border ${meta.badgeClass}`}
          >
            {meta.badge}
          </span>
          <span className="truncate text-[11px] font-medium text-white/85">
            {first.label}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-[17.5rem] md:max-w-[14rem] rounded-xl border border-white/10 bg-black/25 backdrop-blur-md overflow-hidden pointer-events-auto"
      data-home-globe-banner
      aria-live="off"
    >
      <div className="globe-home-marquee-track py-1.5">
        <div className="globe-home-marquee-inner flex w-max items-center">
          {loopItems.map((item, idx) => (
            <BannerItem
              key={`${item.id}:${idx}`}
              item={item}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
      <style>{`
        .globe-home-marquee-track {
          overflow: hidden;
          mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }
        .globe-home-marquee-inner {
          animation: globe-home-marquee ${MARQUEE_LOOP_SECONDS}s linear infinite;
        }
        @keyframes globe-home-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .globe-home-marquee-inner { animation: none; }
        }
      `}</style>
    </div>
  );
}
