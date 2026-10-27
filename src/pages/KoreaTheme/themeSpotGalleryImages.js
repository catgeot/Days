import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Drops URLs that fail to load in the hero/lightbox carousel (blank slot prevention).
 * @param {string[]} sourceUrls
 */
export function usePrunedImageGallery(sourceUrls) {
  const seed = useMemo(
    () => (Array.isArray(sourceUrls) ? sourceUrls.map((u) => String(u || '').trim()).filter(Boolean) : []),
    [sourceUrls],
  );
  const seedKey = seed.join('\n');
  const [dropped, setDropped] = useState(() => new Set());

  useEffect(() => {
    setDropped(new Set());
  }, [seedKey]);

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
