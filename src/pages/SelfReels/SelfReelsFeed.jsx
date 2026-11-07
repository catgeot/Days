import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { pickVisiblePlayIndex, planPlaybackActions } from './selfReelsPlayback.js';
import { failureUiState, nextReelIndex } from './selfReelsFailure.js';

function pauseAllVideos(videoRefs) {
  videoRefs.forEach((video) => {
    if (!video) return;
    video.pause();
  });
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
  /** @type {Record<string, { count: number, open: boolean }>} */
  const [errors, setErrors] = useState({});
  const activeIndexRef = useRef(null);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const markFailed = (index) => {
    if (!Number.isInteger(index) || index < 0 || index >= reels.length) return;
    if (activeIndexRef.current !== index) return;
    const id = reels[index].id;
    setErrors((prev) => {
      const cur = prev[id];
      if (cur?.open) return prev;
      const count = (cur?.count || 0) + 1;
      return { ...prev, [id]: { count, open: true } };
    });
    const video = videoRefs.current[index];
    if (video) video.pause();
  };

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
    const videos = videoRefs.current;
    if (documentHidden || activeIndex == null) {
      pauseAllVideos(videos);
      return;
    }

    const activeId = reels[activeIndex]?.id;
    const errorOpen = activeId ? Boolean(errors[activeId]?.open) : false;
    if (errorOpen) {
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
        playResult.catch(() => {
          markFailed(action.index);
        });
      }
    }
  }, [activeIndex, muted, documentHidden, reels, errors]);

  const retryActive = () => {
    if (activeIndex == null) return;
    const id = reels[activeIndex]?.id;
    if (!id) return;
    setErrors((prev) => {
      const cur = prev[id] || { count: 0, open: true };
      return { ...prev, [id]: { count: cur.count, open: false } };
    });
    const video = videoRefs.current[activeIndex];
    if (!video) return;
    try {
      video.load();
    } catch {
      // ignore
    }
  };

  const goNextFromFailure = () => {
    const next = nextReelIndex(activeIndex, reels.length);
    if (next == null) return;
    setMuted(true);
    setActiveIndex(next);
    const node = itemRefs.current[next];
    if (node) node.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

  return (
    <div
      ref={scrollerRef}
      data-self-reels-feed="1"
      data-active-index={activeIndex == null ? '' : String(activeIndex)}
      data-feed-muted={muted ? '1' : '0'}
      className="h-full w-full snap-y snap-mandatory overflow-y-auto"
    >
      {reels.map((reel, index) => {
        const err = errors[reel.id] || { count: 0, open: false };
        const hasNext = nextReelIndex(index, reels.length) != null;
        const ui = failureUiState(err.count, hasNext);
        const showFailure = err.open && ui.showRetry && activeIndex === index;

        return (
          <section
            key={reel.id}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            data-reel-index={index}
            data-reel-id={reel.id}
            data-reel-fail-count={String(err.count)}
            className="relative flex h-full w-full snap-start snap-always flex-col bg-black"
          >
            <div
              data-reel-stage={reel.id}
              className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            >
              <video
                ref={(node) => {
                  videoRefs.current[index] = node;
                }}
                data-reel-video={reel.id}
                className="h-full w-full object-contain"
                src={reel.videoUrl}
                muted={muted}
                playsInline
                loop
                preload="metadata"
                onError={() => {
                  if (activeIndexRef.current === index) markFailed(index);
                }}
                onPlaying={() => {
                  const id = reel.id;
                  setErrors((prev) => {
                    if (!prev[id]) return prev;
                    const next = { ...prev };
                    delete next[id];
                    return next;
                  });
                }}
              />
              {showFailure ? (
                <div
                  data-reel-failure={reel.id}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/70 px-4 text-center"
                >
                  <p className="text-sm text-white/90">영상을 재생하지 못했어요.</p>
                  <button
                    type="button"
                    data-reel-retry={reel.id}
                    className="rounded border border-white/50 px-3 py-1.5 text-sm"
                    onClick={retryActive}
                  >
                    다시 시도
                  </button>
                  {ui.showNext ? (
                    <button
                      type="button"
                      data-reel-next={reel.id}
                      className="rounded border border-white/50 px-3 py-1.5 text-sm"
                      onClick={goNextFromFailure}
                    >
                      다음 영상
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div
              data-reel-controls={reel.id}
              className="relative z-20 flex w-full shrink-0 flex-col gap-3 bg-black/45 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-left text-white"
            >
              <p data-reel-credit={reel.id} className="text-xs leading-relaxed">
                {reel.credit}
              </p>
              {reel.isFixture ? (
                <p data-reel-fixture-label={reel.id} className="text-[11px] text-white/70">
                  fixture
                </p>
              ) : null}
              <ul
                data-reel-places={reel.id}
                className="max-h-28 overflow-y-auto text-xs leading-relaxed"
              >
                {(reel.places || []).map((place) => (
                  <li key={place.path}>
                    <Link
                      to={place.path}
                      data-reel-place-href={place.path}
                      data-reel-place-name={place.name}
                      className="underline underline-offset-2 hover:text-white/90"
                    >
                      {place.name}
                    </Link>
                  </li>
                ))}
              </ul>
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
        );
      })}
    </div>
  );
}
