import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Drops URLs that fail to load in the hero/lightbox carousel (blank slot prevention).
 * Failed URLs stay dropped when Tour detail expands the URL list (same galleryKey).
 * @param {string[]} sourceUrls
 * @param {string} [galleryKey] — resets dropped set when this changes (e.g. spot id)
 */
export function usePrunedImageGallery(sourceUrls, galleryKey = '') {
  const seed = useMemo(
    () =>
      Array.isArray(sourceUrls)
        ? sourceUrls.map((u) => String(u || '').trim()).filter(Boolean)
        : [],
    [sourceUrls],
  );
  const scopeKey = String(galleryKey || '');
  const scopeRef = useRef(scopeKey);
  const [dropped, setDropped] = useState(() => new Set());

  useEffect(() => {
    if (scopeRef.current !== scopeKey) {
      scopeRef.current = scopeKey;
      setDropped(new Set());
    }
  }, [scopeKey]);

  const markBroken = useCallback((url) => {
    const u = String(url || '').trim();
    if (!u) return;
    setDropped((prev) => {
      if (prev.has(u)) return prev;
      const next = new Set(prev);
      next.add(u);
      return next;
    });
  }, []);

  const visibleUrls = useMemo(
    () => seed.filter((u) => !dropped.has(u)),
    [seed, dropped],
  );

  return { visibleUrls, markBroken };
}
