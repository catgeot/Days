import { createElement, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Generous load window before pin/placeholder fallback (slow mobile Safari + VisitKorea CDN). */
export const FESTIVAL_PHOTO_LOAD_TIMEOUT_MS = 15_000;

/**
 * @param {HTMLImageElement | null | undefined} img
 */
export function isFestivalPhotoDecoded(img) {
  return Boolean(img && img.complete && img.naturalWidth > 0);
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
    if (loadedRef.current || brokenRef.current) return;
    if (!isFestivalPhotoDecoded(el)) return;
    loadedRef.current = true;
    clearLoadTimeout();
    setTimedOut(false);
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
    if (!img || loadedRef.current || brokenRef.current) return;
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
    if (!src) return;
    syncFromImg(imgRef.current);
  }, [src, timedOut, broken]);

  if (!src) return fallback;

  const showFallback = !loaded && (timedOut || broken);

  return createElement(
    'span',
    {
      className: 'relative block h-full w-full',
      'data-festival-photo-wrap': '',
    },
    createElement('img', {
      ref: (el) => {
        imgRef.current = el;
        syncFromImg(el);
      },
      src,
      alt,
      className: `${className}${showFallback ? ' opacity-0' : ''}`.trim(),
      loading,
      decoding,
      draggable,
      fetchPriority,
      referrerPolicy,
      lang,
      translate,
      style: broken ? { ...style, display: 'none' } : style,
      'data-festival-photo': '',
      'data-festival-photo-loaded': loaded ? 'true' : undefined,
      onLoad(event) {
        const el = event?.currentTarget;
        if (isFestivalPhotoDecoded(el)) {
          markLoaded(el);
          return;
        }
        if (el?.complete && el.naturalWidth === 0) markBroken(el);
      },
      onError(event) {
        if (loadedRef.current) return;
        markBroken(event?.currentTarget);
      },
    }),
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
