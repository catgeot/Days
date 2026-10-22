import { withoutDroppedGalleryImages } from '../shared/api/placeGalleryPersist.js';

/** Active moderator removals. Empty means show the photo (RPC miss or error). */
export function emptyGalleryExclusion() {
  return { ids: new Set(), urlKeys: new Set() };
}

/**
 * Host + path, query and fragment stripped. Port of public.gallery_url_key.
 * Non-https and other non-matching URLs have no key.
 */
export function galleryUrlKey(url) {
  const raw = String(url || '');
  if (!/^https:\/\/[a-z0-9.-]+/i.test(raw)) return '';
  const hostMatch = raw.match(/^https:\/\/([A-Za-z0-9.-]+)/i);
  if (!hostMatch) return '';
  const host = hostMatch[1].toLowerCase();
  const rest = raw.slice(hostMatch[0].length);
  let path = '/';
  const body = rest.startsWith(':443') ? rest.slice(4) : rest;
  if (!rest.startsWith(':') || rest.startsWith(':443')) {
    const pathMatch = body.match(/^(\/[^?#]*)/);
    if (pathMatch) path = pathMatch[1] || '/';
  }
  return `${host}${path}`;
}

export function galleryImageUrlKeys(image) {
  const urls = image?.urls && typeof image.urls === 'object' ? image.urls : {};
  return [galleryUrlKey(urls.regular), galleryUrlKey(urls.small)].filter(Boolean);
}

export function galleryExclusionFromRows(rows) {
  const exclusion = emptyGalleryExclusion();
  if (!Array.isArray(rows)) return exclusion;
  for (const row of rows) {
    const id = String(row?.image_id || '').trim();
    const key = String(row?.image_url_key || '').trim();
    if (id) exclusion.ids.add(id);
    if (key) exclusion.urlKeys.add(key);
  }
  return exclusion;
}

export function isGalleryPhotoExcluded(image, exclusion) {
  if (!image || !exclusion) return false;
  const ids = exclusion.ids instanceof Set ? exclusion.ids : new Set();
  const urlKeys = exclusion.urlKeys instanceof Set ? exclusion.urlKeys : new Set();
  if (!ids.size && !urlKeys.size) return false;
  if (image.id != null && ids.has(String(image.id))) return true;
  return galleryImageUrlKeys(image).some((key) => urlKeys.has(key));
}

export function filterExcludedGalleryImages(images, exclusion) {
  const list = Array.isArray(images) ? images : [];
  if (!exclusion || (!(exclusion.ids instanceof Set) && !(exclusion.urlKeys instanceof Set))) {
    return list;
  }
  if (!exclusion.ids?.size && !exclusion.urlKeys?.size) return list;
  return list.filter((image) => !isGalleryPhotoExcluded(image, exclusion));
}

const EXCLUSION_RPC_MISSING_KEY = 'days_gallery_excluded_rpc_missing';
let exclusionRpcMissing = false;

export function resetGalleryExclusionRpcMemo() {
  exclusionRpcMissing = false;
  try {
    sessionStorage.removeItem(EXCLUSION_RPC_MISSING_KEY);
  } catch {
    /* node or private mode */
  }
}

function exclusionRpcMemoIsMissing() {
  if (exclusionRpcMissing) return true;
  try {
    if (sessionStorage.getItem(EXCLUSION_RPC_MISSING_KEY) === '1') {
      exclusionRpcMissing = true;
      return true;
    }
  } catch {
    /* private mode */
  }
  return false;
}

function rememberExclusionRpcMissing() {
  exclusionRpcMissing = true;
  try {
    sessionStorage.setItem(EXCLUSION_RPC_MISSING_KEY, '1');
  } catch {
    /* private mode */
  }
}

/** PostgREST has no gallery_excluded_keys yet (migration not applied). */
export function galleryExclusionRpcIsMissing(error) {
  if (!error || typeof error !== 'object') return false;
  const code = String(error.code || '');
  const status = Number(error.status || error.statusCode || 0);
  const text = `${error.message || ''} ${error.details || ''}`;
  return code === 'PGRST202'
    || status === 404
    || /PGRST202|Could not find the function|schema cache/i.test(text);
}

export function galleryExclusionIsActive(exclusion) {
  return Boolean(exclusion?.ids?.size || exclusion?.urlKeys?.size);
}

/** RPC error, timeout, or a missing place id shows the gallery. A missing function is remembered for the session. */
export async function loadGalleryExcludedKeys(rpc, placeId) {
  const id = String(placeId || '').trim();
  if (!id || typeof rpc !== 'function') return emptyGalleryExclusion();
  if (exclusionRpcMemoIsMissing()) return emptyGalleryExclusion();
  try {
    const { data, error } = await rpc('gallery_excluded_keys', { p_place_id: id });
    if (error) {
      if (galleryExclusionRpcIsMissing(error)) rememberExclusionRpcMissing();
      return emptyGalleryExclusion();
    }
    return galleryExclusionFromRows(data);
  } catch (error) {
    if (galleryExclusionRpcIsMissing(error)) rememberExclusionRpcMissing();
    return emptyGalleryExclusion();
  }
}

export function sessionCacheAfterDroppedIds(cachedImages, droppedIds) {
  const images = withoutDroppedGalleryImages(cachedImages, droppedIds);
  const before = Array.isArray(cachedImages) ? cachedImages.length : 0;
  return { images, changed: images.length !== before };
}
