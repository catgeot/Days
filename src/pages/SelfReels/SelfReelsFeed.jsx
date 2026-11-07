import { useEffect, useRef, useState } from 'react';
import { pickVisiblePlayIndex } from './selfReelsPlayback.js';

export default function SelfReelsFeed({ reels }) {
  const scrollerRef = useRef(null);
  const itemRefs = useRef([]);
  const videoRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    setMuted(true);
  }, [activeIndex]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return undefined;

    const ratios = new Array(reels.length).fill(0);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number(entry.target.getAttribute('data-reel-index'));
          if (!Number.isInteger(index)) continue;
          ratios[index] = entry.intersectionRatio;
        }
        const next = pickVisiblePlayIndex(ratios, activeIndexRef.current);
        if (next === null) return;
        setActiveIndex((prev) => (prev === next ? prev : next));
      },
      {
        root,
        threshold: [0, 0.25, 0.55, 0.75, 1],
      },
    );

    itemRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [reels]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      video.muted = muted;
      if (index === activeIndex) {
        const playResult = video.play();
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(() => {});
        }
      } else {
        video.pause();
      }
    });
  }, [activeIndex, muted, reels]);

  return (
    <div
      ref={scrollerRef}
      data-self-reels-feed="1"
      className="h-full w-full snap-y snap-mandatory overflow-y-auto"
    >
      {reels.map((reel, index) => (
        <section
          key={reel.id}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
          data-reel-index={index}
          data-reel-id={reel.id}
          className="relative flex h-full w-full snap-start snap-always items-end justify-center"
        >
          <video
            ref={(node) => {
              videoRefs.current[index] = node;
            }}
            data-reel-video={reel.id}
            className="absolute inset-0 h-full w-full object-cover"
            src={reel.videoUrl}
            muted={muted}
            playsInline
            loop
            preload="metadata"
          />
          <div className="relative z-10 flex w-full flex-col gap-3 bg-black/45 px-4 py-5 text-left text-white">
            <p data-reel-credit={reel.id} className="text-xs leading-relaxed">
              {reel.credit}
            </p>
            <button
              type="button"
              data-reel-sound={reel.id}
              className="self-start rounded border border-white/40 px-3 py-1 text-sm"
              onClick={() => setMuted((value) => !value)}
            >
              {muted ? '소리 켜기' : '소리 끄기'}
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
