/** 갤러리 stale-while-revalidate — DB 즉시 표시 · 스톡만 백그라운드 · hero/image_url 유지 */

export const GALLERY_SWR_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export function gallerySwrStampKey(cacheVersion, placeKey) {
  return `days_gallery_swr_${cacheVersion}_${encodeURIComponent(placeKey || '')}`;
}

export function galleryHiddenIdsKey(cacheVersion, placeKey) {
  return `days_gallery_hidden_${cacheVersion}_${encodeURIComponent(placeKey || '')}`;
}

export function isGallerySwrDue(lastAt, now = Date.now(), ttlMs = GALLERY_SWR_TTL_MS) {
  if (!lastAt) return true;
  const n = Number(lastAt);
  if (!Number.isFinite(n) || n <= 0) return true;
  return now - n > ttlMs;
}

export function shouldRunGalleryStockSwr({
  thumbnailOnly,
  lastSwrAt,
  isTourDominant,
  imageCount,
  now,
  ttlMs,
}) {
  if (thumbnailOnly) return false;
  if (!imageCount) return false;
  if (isTourDominant) return false;
  return isGallerySwrDue(lastSwrAt, now, ttlMs);
}

export function filterHiddenGalleryIncoming(incoming, hiddenIds) {
  const hidden = hiddenIds instanceof Set ? hiddenIds : new Set(hiddenIds || []);
  const list = Array.isArray(incoming) ? incoming : [];
  if (!hidden.size) return list;
  return list.filter((img) => img?.id && !hidden.has(img.id));
}

/**
 * 최신 스톡을 hero(요약·OG) 뒤에 넣고 꼬리만 cap.
 * 기존 id는 유지 · 0번 사진은 바꾸지 않음.
 */
export function mergeGalleryFreshKeepHero(existing, incoming, max) {
  const list = Array.isArray(existing) ? existing.filter(Boolean) : [];
  const cappedExisting = list.length <= max ? list : list.slice(0, max);
  const existingIds = new Set(cappedExisting.map((img) => img.id));
  const fresh = (incoming || []).filter((img) => img?.id && !existingIds.has(img.id));
  if (!fresh.length) return { merged: cappedExisting, added: 0 };
  if (!cappedExisting.length) {
    const merged = fresh.length <= max ? fresh : fresh.slice(0, max);
    return { merged, added: merged.length };
  }
  const [hero, ...rest] = cappedExisting;
  const combined = [hero, ...fresh, ...rest];
  const merged = combined.length <= max ? combined : combined.slice(0, max);
  return { merged, added: fresh.length };
}
