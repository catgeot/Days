/** Query names that mark a temporary signed URL. */
const SIGNED_QUERY_NAMES = new Set(['signature', 'expires', 'awsaccesskeyid']);
const SIGNED_QUERY_PREFIXES = ['x-amz-', 'x-goog-'];

export const SELF_REELS_PUBLISHED = Object.freeze([]);

export function isStableSelfReelVideoUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) return false;
  if (!/^https:\/\/[^/?#\s]+/.test(value)) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || !url.hostname) return false;
  if (url.username || url.password) return false;
  for (const key of url.searchParams.keys()) {
    const name = key.toLowerCase();
    if (SIGNED_QUERY_NAMES.has(name)) return false;
    if (SIGNED_QUERY_PREFIXES.some((prefix) => name.startsWith(prefix))) return false;
  }
  return true;
}

export function isInternalPlacePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/place/')) return false;
  if (/[?#\\\s]/.test(value)) return false;
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }
  if (!decoded.startsWith('/place/') || decoded.includes('://') || decoded.includes('//')) return false;
  const parts = decoded.slice('/place/'.length).split('/');
  if (parts.length === 0 || parts.some((part) => part === '' || part === '.' || part === '..')) return false;
  return true;
}

export function isConfirmedPlaceDisplayName(value) {
  return typeof value === 'string' && value.length > 0 && value.trim() === value;
}

/**
 * Public rows need confirmed place display names 1:1 with internal paths.
 * placePaths alone (no names) or any blank name → 공개 보류 (null).
 * Session 6 confirmation package must supply the real name per href — do not invent names here.
 */
export function toPublicPlaces(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (!Array.isArray(entry.places) || entry.places.length === 0) return null;
  const places = [];
  for (const item of entry.places) {
    if (!item || typeof item !== 'object') return null;
    if (!isInternalPlacePath(item.path)) return null;
    if (!isConfirmedPlaceDisplayName(item.name)) return null;
    places.push({ path: item.path, name: item.name });
  }
  return places;
}

export function toPublicSelfReel(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (typeof entry.id !== 'string' || entry.id.length === 0) return null;
  if (entry.rightsConfirmed !== true) return null;
  if (typeof entry.credit !== 'string' || !entry.credit.includes('공공누리')) return null;
  if (!isStableSelfReelVideoUrl(entry.videoUrl)) return null;
  const places = toPublicPlaces(entry);
  if (!places) return null;
  return {
    id: entry.id,
    rightsConfirmed: true,
    credit: entry.credit,
    videoUrl: entry.videoUrl,
    places,
    placePaths: places.map((place) => place.path),
  };
}

export function selectPublicSelfReels(entries) {
  if (!Array.isArray(entries)) return [];
  const selected = [];
  for (const entry of entries) {
    const reel = toPublicSelfReel(entry);
    if (reel) selected.push(reel);
  }
  return selected;
}

export function getPublishedSelfReels() {
  return selectPublicSelfReels(SELF_REELS_PUBLISHED);
}
