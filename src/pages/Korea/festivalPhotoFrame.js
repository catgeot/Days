import { createElement, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Generous load window before pin/placeholder fallback (slow mobile Safari + VisitKorea CDN). */
export const FESTIVAL_PHOTO_LOAD_TIMEOUT_MS = 8_000;

/**
 * @param {HTMLImageElement | null | undefined} img
 */
export function isFestivalPhotoDecoded(img) {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

/**
 * Lazy thumbs can report complete+0px before the network starts (WebKit grid scroll).
 * Treat as broken only on eager loads or after error/timeout — not while pending.
 * @param {HTMLImageElement | null | undefined} img
 * @param {{ loading?: 'eager' | 'lazy' }} [opts]
 */
export function shouldSyncMarkFestivalPhotoBroken(img, opts = {}) {
  const loading = opts.loading === 'eager' ? 'eager' : 'lazy';
  if (!img || !img.complete || img.naturalWidth > 0) return false;
  return loading !== 'lazy';
}

/** Wrap must not use w-full in flex rows when the img has fixed Tailwind size (Safari squeezes labels). */
export function festivalPhotoWrapClassName(imgClassName = '') {
  const c = String(imgClassName);
  if (/\b(?:w|h)-\d/.test(c) && !/\b(?:min-|max-)?(?:w|h)-full\b/.test(c)) {
    return 'relative block shrink-0 overflow-hidden';
  }
  if (/\babsolute\b/.test(c) || /\binset-0\b/.test(c)) {
    return 'relative block h-full w-full overflow-hidden';
  }
  if (/\bw-full\b/.test(c) && /\bh-full\b/.test(c)) {
    return 'relative block h-full w-full overflow-hidden';
  }
  return 'relative block shrink-0 overflow-hidden';
}

/** Keep loading in DOM but do not paint a broken-image glyph in the card box. */
export function festivalPhotoImgHiddenStyle(style) {
  return {
    ...style,
    position: 'absolute',
    width: 0,
    height: 0,
    maxWidth: 0,
    maxHeight: 0,
    opacity: 0,
    visibility: 'hidden',
    overflow: 'hidden',
    border: 0,
    pointerEvents: 'none',
  };
}

/**
 * Festival photo that never leaves the browser broken-image glyph on screen.
 * A failed or empty src renders `fallback` (empty slot or neutral placeholder).
 * Once decoded (naturalWidth>0), the image is never swapped for fallback.
 * Timeout shows fallback while the <img> keeps loading; a late decode restores the photo.
 * @param {{
 *   src?: string,
 *   alt?: string,
 *   className?: string,
 *   fallback?: import('react').ReactNode,
 *   loading?: 'eager' | 'lazy',
 *   decoding?: 'async' | 'auto' | 'sync',
 *   draggable?: boolean,
 *   fetchPriority?: 'high' | 'low' | 'auto',
 *   referrerPolicy?: string,
 *   lang?: string,
 *   translate?: 'yes' | 'no',
 *   style?: import('react').CSSProperties,
 *   onLoaded?: () => void,
 *   onFailed?: () => void,
 *   pendingShimmer?: boolean,
 * }} props
 */
export function FestivalPhotoFrame({
  src,
  alt = '',
  className = '',
  fallback = null,
  loading = 'lazy',
  decoding = 'async',
  draggable,
  fetchPriority,
  referrerPolicy = 'no-referrer',
  lang,
  translate,
  style,
  onLoaded,
  onFailed,
  pendingShimmer = false,
}) {
  const [timedOut, setTimedOut] = useState(false);
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);
  const brokenRef = useRef(false);
  const imgRef = useRef(null);
  const timeoutRef = useRef(null);
  const onLoadedRef = useRef(onLoaded);
  const onFailedRef = useRef(onFailed);
  onLoadedRef.current = onLoaded;
  onFailedRef.current = onFailed;

  const clearLoadTimeout = () => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const markLoaded = (el) => {
    if (loadedRef.current) return;
    if (!isFestivalPhotoDecoded(el)) return;
    loadedRef.current = true;
    brokenRef.current = false;
    clearLoadTimeout();
    setTimedOut(false);
    setBroken(false);
    setLoaded(true);
    if (onLoadedRef.current) onLoadedRef.current();
  };

  const markBroken = (el) => {
    if (loadedRef.current || brokenRef.current) return;
    brokenRef.current = true;
    clearLoadTimeout();
    setBroken(true);
    setTimedOut(false);
    if (onFailedRef.current) onFailedRef.current();
  };

  const syncFromImg = (img) => {
    if (!img || loadedRef.current) return;
    if (isFestivalPhotoDecoded(img)) markLoaded(img);
  };

  useEffect(() => {
    loadedRef.current = false;
    brokenRef.current = false;
    setTimedOut(false);
    setBroken(false);
    setLoaded(false);
    clearLoadTimeout();
    if (!src) return undefined;
    timeoutRef.current = setTimeout(() => {
      if (!loadedRef.current && !brokenRef.current) setTimedOut(true);
    }, FESTIVAL_PHOTO_LOAD_TIMEOUT_MS);
    return () => clearLoadTimeout();
  }, [src]);

  useLayoutEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      const img = imgRef.current;
      if (!img) {
        requestAnimationFrame(loop);
        return;
      }
      if (loadedRef.current && !isFestivalPhotoDecoded(img)) {
        loadedRef.current = false;
        setLoaded(false);
      }
      if (isFestivalPhotoDecoded(img)) {
        markLoaded(img);
        return;
      }
      if (shouldSyncMarkFestivalPhotoBroken(img, { loading })) {
        markBroken(img);
        return;
      }
      requestAnimationFrame(loop);
    };
    syncFromImg(imgRef.current);
    loop();
    return () => {
      cancelled = true;
    };
  }, [src, timedOut, broken, loaded]);

  if (!src) return fallback;

  const imgEl = imgRef.current;
  const paintLoaded = loaded && isFestivalPhotoDecoded(imgEl);
  const showFallback = !paintLoaded && (timedOut || broken);
  const showPending = Boolean(pendingShimmer) && !paintLoaded && !showFallback;
  const hideImgPaint = !paintLoaded;

  const imgA11yClass = ' text-transparent select-none';
  const imgClassName = hideImgPaint
    ? `block${imgA11yClass}`.trim()
    : `${className}${imgA11yClass}`.trim();

  return createElement(
    'span',
    {
      className: festivalPhotoWrapClassName(className),
      'data-festival-photo-wrap': '',
    },
    createElement('img', {
      ref: (el) => {
        imgRef.current = el;
        syncFromImg(el);
      },
      src,
      alt,
      className: imgClassName,
      loading,
      decoding,
      draggable,
      fetchPriority,
      referrerPolicy,
      lang,
      translate,
      style: hideImgPaint ? festivalPhotoImgHiddenStyle(style) : style,
      'data-festival-photo': '',
      'data-festival-photo-hidden': hideImgPaint ? 'true' : undefined,
      'data-festival-photo-loaded': paintLoaded ? 'true' : undefined,
      onLoad(event) {
        const el = event?.currentTarget;
        if (isFestivalPhotoDecoded(el)) {
          markLoaded(el);
          return;
        }
        if (shouldSyncMarkFestivalPhotoBroken(el, { loading })) markBroken(el);
      },
      onError(event) {
        if (loadedRef.current) return;
        markBroken(event?.currentTarget);
      },
    }),
    showPending
      ? createElement(
          'span',
          {
            className: 'pointer-events-none absolute inset-0 overflow-hidden',
            'data-festival-photo-pending': '',
            'aria-hidden': 'true',
          },
          createElement('span', {
            className:
              'absolute inset-[-12%] bg-gradient-to-br from-amber-50 via-stone-200/80 to-orange-100 blur-md',
          }),
          createElement('span', {
            className:
              'absolute inset-0 animate-pulse bg-gradient-to-r from-white/0 via-white/80 to-white/0',
          }),
        )
      : null,
    showFallback
      ? createElement(
          'span',
          {
            className: 'absolute inset-0',
            'data-festival-photo-fallback-slot': '',
          },
          fallback,
        )
      : null,
  );
}
