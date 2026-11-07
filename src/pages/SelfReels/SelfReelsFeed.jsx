import { useEffect, useRef, useState } from 'react';
import { pickVisiblePlayIndex, planPlaybackActions } from './selfReelsPlayback.js';

function pauseAllVideos(videoRefs) {
  videoRefs.forEach((video) => {
    if (!video) return;
    video.pause();
  });
}

function applyPlayback(videoRefs, activeIndex, muted, documentHidden) {
  const videos = videoRefs;
  if (documentHidden || activeIndex == null) {
    pauseAllVideos(videos);
    return;
  }

  const actions = planPlaybackActions(activeIndex, videos.length);
  for (const action of actions) {
    const video = videos[action.index];
    if (!video) continue;
    if (action.type === 'pause') {
      video.pause();
      video.muted = true;
      continue;
    }
    video.muted = muted;
    const playResult = video.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => {});
    }
  }
}

export default function SelfReelsFeed({ reels }) {
  const scrollerRef = useRef(null);
  const itemRefs = useRef([]);
  const videoRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [muted, setMuted] = useState(true);
  const [documentHidden, setDocumentHidden] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false,
  );
  const activeIndexRef = useRef(null);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
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
        if (next === activeIndexRef.current) return;
        setMuted(true);
        setActiveIndex(next);
      },
      {
        root,
        threshold: [0, 0.25, 0.55, 0.75, 1],
      },
    );

    itemRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
      pauseAllVideos(videoRefs.current);
    };
  }, [reels]);

  useEffect(() => {
    const onVisibility = () => {
      const hidden = document.visibilityState === 'hidden';
      setDocumentHidden(hidden);
      if (hidden) pauseAllVideos(videoRefs.current);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      pauseAllVideos(videoRefs.current);
    };
  }, []);

  useEffect(() => {
    applyPlayback(videoRefs.current, activeIndex, muted, documentHidden);
  }, [activeIndex, muted, documentHidden, reels]);

  return (
    <div
      ref={scrollerRef}
      data-self-reels-feed="1"
      data-active-index={activeIndex == null ? '' : String(activeIndex)}
      data-feed-muted={muted ? '1' : '0'}
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
            <p data-reel-fixture-label={reel.id} className="text-[11px] text-white/70">
              fixture
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
