import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createSocialReelSession, safePlay } from './socialReelPlayback.js';

const SWIPE_PX = 48;

function readReducedMotion() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  } catch {
    return false;
  }
}

function stepIndex(current, length, delta) {
  const next = current + delta;
  if (next < 0 || next >= length) return current;
  return next;
}

export default function SocialReelsPlayer({ playlist, onClose, loadHls }) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [reduced, setReduced] = useState(readReducedMotion);
  const videoRef = useRef(null);
  const closeRef = useRef(null);
  const swipeRef = useRef(null);
  const mutedRef = useRef(true);
  const reducedRef = useRef(reduced);
  const lengthRef = useRef(playlist.length);
  const safeIndex = Math.min(index, Math.max(playlist.length - 1, 0));
  const item = playlist[safeIndex] || null;
  const nextItem = playlist[safeIndex + 1] || null;

  useEffect(() => {
    mutedRef.current = muted;
    reducedRef.current = reduced;
    lengthRef.current = playlist.length;
  });

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus?.();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media?.addEventListener) return undefined;
    const onChange = () => setReduced(media.matches === true);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !item?.reel) return undefined;
    const session = createSocialReelSession(video, loadHls ? { loadHls } : undefined);
    let cancelled = false;
    session.attach(item.reel, { muted: mutedRef.current }).then(() => {
      if (cancelled || reducedRef.current) return;
      safePlay(video);
    }).catch(() => {});
    const onEnded = () => {
      if (reducedRef.current) return;
      setIndex((current) => stepIndex(current, lengthRef.current, 1));
    };
    video.addEventListener('ended', onEnded);
    return () => {
      cancelled = true;
      video.removeEventListener('ended', onEnded);
      session.detach();
    };
  }, [item, loadHls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    video.muted = muted;
    video.defaultMuted = muted;
    if (muted) video.setAttribute('muted', '');
    else video.removeAttribute('muted');
    return undefined;
  }, [muted]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setIndex((current) => stepIndex(current, lengthRef.current, 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setIndex((current) => stepIndex(current, lengthRef.current, -1));
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function onPointerDown(event) {
    if (event.target?.closest?.('a, button')) return;
    swipeRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }

  function onPointerUp(event) {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    if (start.id != null && event.pointerId != null && start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dy) < SWIPE_PX || Math.abs(dy) <= Math.abs(dx)) return;
    setIndex((current) => stepIndex(current, lengthRef.current, dy < 0 ? 1 : -1));
  }

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="지난 릴스"
      data-testid="social-reel-player"
      data-campaign={item.campaignId}
      data-index={safeIndex}
      data-reduced-motion={reduced ? '1' : '0'}
      className="fixed inset-0 z-[10050] flex flex-col bg-black text-white"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <video
        ref={videoRef}
        data-testid="social-reel-video"
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted={muted}
        autoPlay={!reduced}
        poster={item.reel.poster || undefined}
        preload="auto"
      />
      {nextItem?.reel.poster ? (
        <img
          alt=""
          src={nextItem.reel.poster}
          data-testid="social-reel-next-poster"
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      ) : null}
      <div className="relative z-10 flex items-start justify-between gap-3 p-4">
        <button
          ref={closeRef}
          type="button"
          data-testid="social-reel-close"
          className="inline-flex h-11 items-center rounded-2xl bg-white px-4 text-sm font-semibold text-black"
          onClick={() => onClose?.()}
        >
          닫기
        </button>
        <button
          type="button"
          data-testid="social-reel-mute"
          data-muted={muted ? 'true' : 'false'}
          aria-pressed={muted ? 'false' : 'true'}
          className="inline-flex h-11 items-center rounded-2xl bg-white px-4 text-sm font-semibold text-black"
          onClick={() => {
            const video = videoRef.current;
            setMuted((value) => {
              if (value && video) safePlay(video);
              return !value;
            });
          }}
        >
          {muted ? '소리 켜기' : '소리 끄기'}
        </button>
      </div>
      <div className="relative z-10 mt-auto bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-6 pt-16">
        {item.creditText ? (
          <p data-testid="social-reel-credit" className="mb-3 break-keep text-[13px] leading-snug text-white/90">
            {item.creditText}
          </p>
        ) : null}
        <Link
          to={item.href}
          data-testid="social-reel-place"
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-white text-[15px] font-semibold text-black no-underline"
        >
          {item.placeLabel}
        </Link>
        <p className="mt-3 hidden text-center text-xs text-white/70 lg:block">위아래 키로 옮겨요 · Esc로 닫아요</p>
      </div>
    </div>
  );
}
