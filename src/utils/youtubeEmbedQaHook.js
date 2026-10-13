import { isCloudPreviewSurface } from '../shared/cloudPreview/isCloudPreviewSurface.js';

const LS_FORCE_EMBED_ERROR = 'gateo.yt.forceEmbedError';

/** Preview / dev only — no-op on www.gateo.kr PROD. */
export function isYoutubeEmbedQaSurface() {
  if (import.meta.env.PROD && !isCloudPreviewSurface()) return false;
  return isCloudPreviewSurface() || import.meta.env.DEV;
}

export function isYoutubeForceEmbedErrorEnabled() {
  if (!isYoutubeEmbedQaSurface() || typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ytForceError') === '1') return true;
    return window.localStorage.getItem(LS_FORCE_EMBED_ERROR) === '1';
  } catch {
    return false;
  }
}
