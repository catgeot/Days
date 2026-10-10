import { createElement, useEffect, useState } from 'react';

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
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return fallback;

  return createElement('img', {
    src,
    alt,
    className,
    loading,
    decoding,
    draggable,
    fetchPriority,
    style,
    'data-festival-photo': '',
    onError(event) {
      const el = event?.currentTarget;
      if (el?.style) el.style.display = 'none';
      setFailed(true);
    },
  });
}
