import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isGateoSocialLikesEnabled } from '../../shared/gateoFeatureFlags.js';
import { createSocialReelSession, safePlay } from './socialReelPlayback.js';
import {
  SOCIAL_REEL_LIKE_FAIL_TOAST,
  SOCIAL_REEL_LIKE_LOGIN_PROMPT,
  resolveSocialReelLikeApi,
  shouldShowSocialReelLikeCount,
} from './socialReelLikes.js';
import { splitSocialReelCredit } from './socialReels.js';

const RAIL_BUTTON =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/55 text-white shadow-[0_2px_8px_rgba(0,0,0,0.55)]';

const SWIPE_PX = 48;
const WHEEL_LOCK_MS = 420;
const SLIDE_MS = 380;
const SOUND_KEY = 'gateo_social_reel_sound';

function readReducedMotion() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  } catch {
    return false;
  }
}

function readSessionMuted() {
  try {
    return window.sessionStorage?.getItem(SOUND_KEY) !== 'on';
  } catch {
    return true;
  }
}

function writeSessionMuted(muted) {
  try {
    if (muted) window.sessionStorage?.removeItem(SOUND_KEY);
    else window.sessionStorage?.setItem(SOUND_KEY, 'on');
  } catch {
    /* private mode */
  }
}

function stepIndex(current, length, delta) {
  const next = current + delta;
  if (next < 0 || next >= length) return current;
  return next;
}

function absoluteUrl(href) {
  try {
    return new URL(href, window.location.origin).href;
  } catch {
    return String(href || '');
  }
}

async function copyText(text) {
  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* try the textarea fallback */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="h-5 w-5">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSpeaker({ muted }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="h-5 w-5">
      <path fill="currentColor" d="M4 9v6h3.5L12 19V5L7.5 9H4z" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M16 8.5a4.5 4.5 0 010 7M18.2 6a8 8 0 010 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="h-5 w-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
      <path d="M12 16V5M8 8.5L12 4.5l4 4M6 20h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconHeart({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="h-5 w-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
      <path
        d="M12 19s-7-4.4-7-9a4 4 0 017-2 4 4 0 017 2c0 4.6-7 9-7 9z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function applyMuteFlag(video, muted) {
  video.muted = muted;
  video.defaultMuted = muted;
  if (muted) video.setAttribute('muted', '');
  else video.removeAttribute('muted');
}

function ReelVideo({ reel, active, muted, reduced, onEnded, videoRef }) {
  const localRef = useRef(null);
  const onEndedRef = useRef(onEnded);
  const activeRef = useRef(active);
  const mutedRef = useRef(muted);
  const reducedRef = useRef(reduced);
  useEffect(() => {
    onEndedRef.current = onEnded;
    activeRef.current = active;
    mutedRef.current = muted;
    reducedRef.current = reduced;
  });

  useEffect(() => {
    if (!active) return undefined;
    const node = localRef.current;
    videoRef.current = node;
    return () => {
      if (videoRef.current === node) videoRef.current = null;
    };
  }, [active, videoRef]);

  useEffect(() => {
    const video = localRef.current;
    if (!video || !reel) return undefined;
    const session = createSocialReelSession(video);
    let cancelled = false;
    const startMuted = activeRef.current ? mutedRef.current : true;
    session.attach(reel, { muted: startMuted }).then(() => {
      if (cancelled) return;
      const node = localRef.current;
      if (!node) return;
      applyMuteFlag(node, activeRef.current ? mutedRef.current : true);
      if (activeRef.current && !reducedRef.current) safePlay(node);
    }).catch(() => {});
    const handleEnded = () => {
      if (!activeRef.current || reducedRef.current) return;
      onEndedRef.current?.();
    };
    video.addEventListener('ended', handleEnded);
    return () => {
      cancelled = true;
      video.removeEventListener('ended', handleEnded);
      session.detach();
    };
  }, [reel]);

  useEffect(() => {
    const video = localRef.current;
    if (!video) return undefined;
    video.preload = active ? 'metadata' : 'auto';
    applyMuteFlag(video, !active || muted);
    if (!active) {
      try {
        video.pause?.();
      } catch {
        /* jsdom */
      }
      return undefined;
    }
    if (!reduced) safePlay(video);
    return undefined;
  }, [active, muted, reduced]);

  return (
    <video
      ref={localRef}
      data-testid={active ? 'social-reel-video' : 'social-reel-video-preload'}
      data-active={active ? 'true' : 'false'}
      className="h-full w-full bg-black object-contain"
      playsInline
      muted={!active || muted}
      autoPlay={active && !reduced}
      poster={reel.poster || undefined}
      preload="metadata"
      aria-hidden={active ? undefined : true}
    />
  );
}

export default function SocialReelsPlayer({ playlist, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const likesEnabled = isGateoSocialLikesEnabled(location.search);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(readSessionMuted);
  const [reduced, setReduced] = useState(readReducedMotion);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState('');
  const [likeState, setLikeState] = useState({});
  const closeRef = useRef(null);
  const viewportRef = useRef(null);
  const activeVideoRef = useRef(null);
  const swipeRef = useRef(null);
  const wheelLockRef = useRef(false);
  const mutedRef = useRef(muted);
  const reducedRef = useRef(reduced);
  const lengthRef = useRef(playlist.length);
  const indexRef = useRef(0);
  const likeStateRef = useRef(likeState);
  const likePendingRef = useRef(new Set());
  const safeIndex = Math.min(index, Math.max(playlist.length - 1, 0));
  const item = playlist[safeIndex] || null;
  const nextItem = playlist[safeIndex + 1] || null;
  const idsKey = playlist.map((entry) => entry.campaignId).join('\n');

  useEffect(() => {
    mutedRef.current = muted;
    reducedRef.current = reduced;
    lengthRef.current = playlist.length;
    indexRef.current = safeIndex;
    likeStateRef.current = likeState;
  });

  useEffect(() => {
    if (!likesEnabled) return undefined;
    let cancelled = false;
    const ids = idsKey.split('\n').filter(Boolean);
    (async () => {
      try {
        const api = await resolveSocialReelLikeApi();
        const result = await api.fetchState(ids);
        if (cancelled) return;
        if (!result || result.error || result.missing) {
          if (!likePendingRef.current.size) setLikeState({});
          return;
        }
        setLikeState((current) => {
          const next = {};
          for (const id of ids) {
            if (likePendingRef.current.has(id) && current[id]) {
              next[id] = current[id];
              continue;
            }
            const count = Number(result.counts?.[id]);
            next[id] = {
              count: Number.isFinite(count) ? count : null,
              liked: Array.isArray(result.mine) && result.mine.includes(id),
            };
          }
          return next;
        });
      } catch {
        if (!cancelled) setLikeState({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [likesEnabled, idsKey]);

  const go = useCallback((delta) => {
    setDragPx(0);
    setDragging(false);
    setIndex((current) => stepIndex(current, lengthRef.current, delta));
  }, []);

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
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(''), 1600);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };
    const onWheel = (event) => {
      if (window.innerWidth < 1280) return;
      if (Math.abs(event.deltaY) < 4 || Math.abs(event.deltaY) < Math.abs(event.deltaX || 0)) return;
      event.preventDefault();
      if (wheelLockRef.current) return;
      wheelLockRef.current = true;
      go(event.deltaY > 0 ? 1 : -1);
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, reducedRef.current ? 0 : WHEEL_LOCK_MS);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [go, onClose]);

  function onPointerDown(event) {
    if (event.target?.closest?.('a, button')) return;
    swipeRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* jsdom */
    }
  }

  function onPointerMove(event) {
    const start = swipeRef.current;
    if (!start || (start.id != null && event.pointerId != null && start.id !== event.pointerId)) return;
    const dy = event.clientY - start.y;
    const height = viewportRef.current?.clientHeight || window.innerHeight || 1;
    const limited = Math.max(-height, Math.min(height, dy));
    const atStart = indexRef.current <= 0 && limited > 0;
    const atEnd = indexRef.current >= lengthRef.current - 1 && limited < 0;
    setDragging(true);
    setDragPx(atStart || atEnd ? limited * 0.28 : limited);
  }

  function onPointerUp(event) {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    if (start.id != null && event.pointerId != null && start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const vertical = Math.abs(dy) >= SWIPE_PX && Math.abs(dy) > Math.abs(dx);
    setDragging(false);
    setDragPx(0);
    if (!vertical) return;
    go(dy < 0 ? 1 : -1);
  }

  async function onShare() {
    if (!item) return;
    const url = absoluteUrl(item.href);
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: item.placeName || 'GATEO', url });
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
    const copied = await copyText(url);
    if (copied) setToast('링크를 복사했어요');
  }

  async function onLike() {
    if (!likesEnabled || !item) return;
    const id = item.campaignId;
    if (likePendingRef.current.has(id)) return;
    let api;
    try {
      api = await resolveSocialReelLikeApi();
    } catch {
      setToast(SOCIAL_REEL_LIKE_FAIL_TOAST);
      return;
    }
    let user = null;
    try {
      user = await api.readUser();
    } catch {
      user = null;
    }
    if (!user) {
      const ask = typeof window.confirm === 'function' ? window.confirm : null;
      if (!ask) {
        setToast('좋아요는 로그인 후 누를 수 있어요');
        return;
      }
      if (ask(SOCIAL_REEL_LIKE_LOGIN_PROMPT)) {
        const from = `${location.pathname}${location.search}${location.hash}`;
        navigate('/auth/login', { state: { from } });
      }
      return;
    }
    const prev = likeStateRef.current[id] || { count: null, liked: false };
    const nextLiked = !prev.liked;
    const nextCount = Number.isFinite(prev.count)
      ? Math.max(0, prev.count + (nextLiked ? 1 : -1))
      : null;
    const optimistic = { count: nextCount, liked: nextLiked };
    likePendingRef.current.add(id);
    likeStateRef.current = { ...likeStateRef.current, [id]: optimistic };
    setLikeState((current) => ({ ...current, [id]: optimistic }));
    let result;
    try {
      result = await api.toggle(id, nextLiked);
    } catch (error) {
      result = { error };
    }
    likePendingRef.current.delete(id);
    if (!result || result.error || result.missing) {
      likeStateRef.current = { ...likeStateRef.current, [id]: prev };
      setLikeState((current) => ({ ...current, [id]: prev }));
      setToast(SOCIAL_REEL_LIKE_FAIL_TOAST);
      return;
    }
    const applied = {
      count: Number.isFinite(result.count) ? result.count : nextCount,
      liked: typeof result.liked === 'boolean' ? result.liked : nextLiked,
    };
    likeStateRef.current = { ...likeStateRef.current, [id]: applied };
    setLikeState((current) => ({ ...current, [id]: applied }));
  }

  function onToggleSound() {
    const next = !mutedRef.current;
    mutedRef.current = next;
    writeSessionMuted(next);
    setMuted(next);
    const video = activeVideoRef.current;
    if (!video) return;
    applyMuteFlag(video, next);
    if (!next) safePlay(video);
  }

  if (!item) return null;

  const transition = reduced || dragging ? 'none' : `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  const soundLabel = muted ? '소리 켜기' : '소리 끄기';
  const likeEntry = (item && likeState[item.campaignId]) || { count: null, liked: false };
  const showLikeCount = shouldShowSocialReelLikeCount(likeEntry.count);
  const creditParts = splitSocialReelCredit(item.reel?.credit || item.creditText);
  const likeLabel = likeEntry.liked ? '좋아요 취소' : '좋아요';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="지난 릴스"
      data-testid="social-reel-player"
      data-campaign={item.campaignId}
      data-index={safeIndex}
      data-reduced-motion={reduced ? '1' : '0'}
      className="fixed inset-0 z-[10050] bg-black text-white"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        ref={viewportRef}
        data-testid="social-reel-viewport"
        className="absolute inset-0 overflow-hidden touch-none xl:inset-y-0 xl:right-auto xl:left-1/2 xl:w-[min(100vw,56.25dvh)] xl:-translate-x-1/2"
      >
        <div
          data-testid="social-reel-track"
          className="relative h-full w-full"
          style={{
            transform: `translate3d(0, calc(${-safeIndex * 100}% + ${dragPx}px), 0)`,
            transition,
          }}
        >
          {playlist.map((entry, entryIndex) => {
            const mounted = Math.abs(entryIndex - safeIndex) <= 1;
            return (
              <div
                key={entry.campaignId}
                data-testid="social-reel-slide"
                data-index={entryIndex}
                className="absolute inset-x-0 h-full"
                style={{ top: `${entryIndex * 100}%` }}
              >
                {mounted && entry.reel ? (
                  <ReelVideo
                    reel={entry.reel}
                    active={entryIndex === safeIndex}
                    muted={muted}
                    reduced={reduced}
                    onEnded={() => go(1)}
                    videoRef={activeVideoRef}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <button
        ref={closeRef}
        type="button"
        data-testid="social-reel-close"
        aria-label="닫기"
        className="absolute left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white"
        onClick={() => onClose?.()}
      >
        <IconX />
      </button>

      <button
        type="button"
        data-testid="social-reel-mute"
        data-muted={muted ? 'true' : 'false'}
        aria-pressed={muted ? 'false' : 'true'}
        aria-label={soundLabel}
        className="absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white xl:left-[calc(50%+min(50vw,28.125dvh)+0.75rem)] xl:right-auto xl:top-6"
        onClick={onToggleSound}
      >
        <IconSpeaker muted={muted} /><span className="sr-only">{soundLabel}</span>
      </button>

      <div
        data-testid="social-reel-rail"
        className="absolute right-2 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 xl:left-[calc(50%+min(50vw,28.125dvh)+0.75rem)] xl:right-auto"
      >
        <button
          type="button"
          data-testid="social-reel-share"
          aria-label="공유하기"
          className={RAIL_BUTTON}
          onClick={onShare}
        >
          <IconShare />
        </button>
        {likesEnabled ? (
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              data-testid="social-reel-like"
              data-liked={likeEntry.liked ? 'true' : 'false'}
              aria-pressed={likeEntry.liked ? 'true' : 'false'}
              aria-label={likeLabel}
              className={RAIL_BUTTON}
              style={likeEntry.liked ? { color: '#fda4af' } : undefined}
              onClick={onLike}
            >
              <IconHeart filled={likeEntry.liked} />
            </button>
            {showLikeCount ? (
              <span
                data-testid="social-reel-like-count"
                className="text-[11px] font-semibold leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
              >
                {likeEntry.count}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* 1280: half of a full-height 9:16 frame is 28.125dvh, so this block stays in the left gutter. */}
      <div
        data-testid="social-reel-chrome"
        className="absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 xl:inset-x-auto xl:bottom-4 xl:left-[max(1rem,calc(50%-min(50vw,28.125dvh)-22rem-0.75rem))] xl:w-[min(22rem,calc(50%-min(50vw,28.125dvh)-1.5rem))] xl:px-0 xl:pb-0 xl:pt-0"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/35 to-transparent xl:hidden"
        />
        <div className="relative max-w-[calc(100%-3.5rem)] xl:max-w-none">
          {item.placeName ? (
            <p
              data-testid="social-reel-place-name"
              className="inline-flex max-w-full truncate rounded-full bg-white/15 px-2.5 py-1 text-sm font-semibold text-white"
            >
              {item.placeName}
            </p>
          ) : null}
          <Link
            to={item.href}
            data-testid="social-reel-place"
            className="mt-1.5 block w-fit text-[13px] font-medium text-white underline decoration-white/50 underline-offset-2"
          >{item.placeLabel}</Link>
          {item.creditText ? (
            <p
              data-testid="social-reel-credit"
              title={item.creditText}
              className="mt-1 text-[11px] leading-snug text-white/75"
            >
              {creditParts.license ? (
                <>
                  <span className="block truncate">{creditParts.source}</span>
                  <span data-testid="social-reel-credit-license" className="block">
                    {creditParts.license}
                  </span>
                </>
              ) : (
                item.creditText
              )}
            </p>
          ) : null}
          <p className="mt-2 hidden text-xs text-white/70 xl:block">위아래 키로 옮겨요 · Esc로 닫아요</p>
        </div>
      </div>

      {toast ? (
        <p
          data-testid="social-reel-toast"
          role="status"
          className="absolute left-1/2 top-16 z-40 -translate-x-1/2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-black"
        >
          {toast}
        </p>
      ) : null}

      {nextItem?.reel.poster ? (
        <img
          alt=""
          src={nextItem.reel.poster}
          data-testid="social-reel-next-poster"
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      ) : null}
    </div>
  );
}
