import { getPlaceStableKey } from '../../../utils/travelSpotResolve';

export const GALLERY_ATTRIBUTION_RETURN_KEY = 'gateo:gallery-attribution-return';
const RETURN_TTL_MS = 30 * 60 * 1000;

const MOBILE_ATTRIBUTION_SAME_TAB_QUERY =
  '(max-width: 767px), ((max-width: 834px) and (hover: none) and (pointer: coarse))';

export function resolveGalleryPlaceKey(location) {
  if (!location) return '';
  if (typeof location === 'object') {
    return (
      getPlaceStableKey(location) ||
      String(location.slug || location.id || location.name || '').trim()
    );
  }
  return String(location).trim();
}

export function isMobileGalleryAttributionSameTab() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_ATTRIBUTION_SAME_TAB_QUERY).matches;
}

export function saveGalleryAttributionReturnState({
  placeKey,
  image,
  context = 'gallery',
  lightboxIndex = null,
}) {
  if (!placeKey || !image?.id) return;
  try {
    sessionStorage.setItem(
      GALLERY_ATTRIBUTION_RETURN_KEY,
      JSON.stringify({
        placeKey,
        imageId: String(image.id),
        imageUrl: image.urls?.regular || image.urls?.small || null,
        context,
        lightboxIndex: typeof lightboxIndex === 'number' ? lightboxIndex : null,
        savedAt: Date.now(),
      }),
    );
  } catch {
    // sessionStorage quota — navigation still proceeds
  }
}

export function readGalleryAttributionReturnState() {
  try {
    const raw = sessionStorage.getItem(GALLERY_ATTRIBUTION_RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.placeKey || !parsed?.imageId) {
      sessionStorage.removeItem(GALLERY_ATTRIBUTION_RETURN_KEY);
      return null;
    }
    if (Date.now() - (parsed.savedAt || 0) > RETURN_TTL_MS) {
      sessionStorage.removeItem(GALLERY_ATTRIBUTION_RETURN_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(GALLERY_ATTRIBUTION_RETURN_KEY);
    return null;
  }
}

export function clearGalleryAttributionReturnState() {
  sessionStorage.removeItem(GALLERY_ATTRIBUTION_RETURN_KEY);
}

export function consumeGalleryAttributionReturnState(expectedPlaceKey, expectedContext = 'gallery') {
  const pending = readGalleryAttributionReturnState();
  if (!pending) return null;
  if (pending.placeKey !== expectedPlaceKey) return null;
  if ((pending.context || 'gallery') !== expectedContext) return null;
  clearGalleryAttributionReturnState();
  return pending;
}

export function findImageForReturnState(images, returnState) {
  if (!returnState || !images?.length) return null;
  const byId = images.find((img) => String(img.id) === String(returnState.imageId));
  if (byId) return byId;
  if (returnState.imageUrl) {
    return (
      images.find(
        (img) => (img.urls?.regular || img.urls?.small) === returnState.imageUrl,
      ) || null
    );
  }
  return null;
}

/** 모바일 — 같은 탭 + sessionStorage 복원용. 데스크톱 — 새 탭 유지 */
export function navigateGalleryAttributionLink(event, { placeKey, image, href, context = 'gallery', lightboxIndex }) {
  if (!isMobileGalleryAttributionSameTab()) return;

  event.preventDefault();
  event.stopPropagation();

  saveGalleryAttributionReturnState({ placeKey, image, context, lightboxIndex });
  window.location.assign(href);
}

export function getGalleryAttributionLinkTarget() {
  return isMobileGalleryAttributionSameTab() ? '_self' : '_blank';
}
