import { createElement, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Festival photo that never leaves the browser broken-image glyph on screen.
 * A failed or empty src renders `fallback` (empty slot or neutral placeholder).
 * @param {{
 *   src?: string,
 *   alt?: string,
 *   className?: string,
 *   fallback?: import('react').ReactNode,
 *   loading?: 'eager' | 'lazy',
 *   decoding?: 'async' | 'auto' | 'sync',
 *   draggable?: boolean,
 *   fetchPriority?: 'high' | 'low' | 'auto',
 *   style?: import('react').CSSProperties,
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
  style,
  onFailed,
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const markBroken = (el) => {
    if (el?.style) el.style.display = 'none';
    if (onFailed) onFailed();
    setFailed(true);
  };

  useLayoutEffect(() => {
    if (!src || failed) return;
    const img = imgRef.current;
    if (!img?.complete) return;
    if (img.naturalWidth > 0) return;
    markBroken(img);
  }, [src, failed]);

  if (!src || failed) return fallback;

  return createElement('img', {
    ref: imgRef,
    src,
    alt,
    className,
    loading,
    decoding,
    draggable,
    fetchPriority,
    style,
    'data-festival-photo': '',
    onLoad(event) {
      const el = event?.currentTarget;
      if (el?.complete && el.naturalWidth === 0) markBroken(el);
    },
    onError(event) {
      markBroken(event?.currentTarget);
    },
  });
}
