/** place_stats 갤러리 단일 writer. 직접 upsert/update/insert 금지. */

export const GALLERY_PERSIST_MODES = Object.freeze([
  'replace',
  'merge_keep_hero',
  'append',
  'thumb',
]);

export const GALLERY_REPORT_REASONS = Object.freeze([
  'irrelevant',
  'inappropriate',
  'low_quality',
  'copyright',
  'other',
]);

/**
 * 로드된 place_stats 행이 있으면 그 place_id.
 * 행이 없을 때만 canonical id(첫 방문 생성). 한글 alias로 바꾸지 않는다.
 */
export function resolveGalleryPersistPlaceId(loadedPlaceId, canonicalPlaceId) {
  const loaded = String(loadedPlaceId || '').trim();
  if (loaded) return loaded;
  return String(canonicalPlaceId || '').trim();
}

/**
 * replace: 숨김 필터를 적용하지 않은 storage 전체.
 * merge_keep_hero / append: fresh만. thumb: null.
 * view(숨긴 id를 뺀 목록)를 넘기면 그 사용자의 숨김이 공유 갤러리에 퍼진다.
 */
export function imagesForGalleryPersist(mode, { storage, fresh } = {}) {
  if (mode === 'thumb') return null;
  if (mode === 'merge_keep_hero' || mode === 'append') {
    return Array.isArray(fresh) ? fresh : [];
  }
  return Array.isArray(storage) ? storage : [];
}

export function galleryPersistDropsStoredImages(payloadImages, storage) {
  const payloadIds = new Set((payloadImages || []).map((img) => img?.id).filter(Boolean));
  return (storage || []).some((img) => img?.id && !payloadIds.has(img.id));
}

function galleryPersistNormalizedIds(images) {
  return (Array.isArray(images) ? images : [])
    .map((img) => String(img?.id ?? '').trim())
    .filter(Boolean);
}

export function isTourApiGalleryImage(img) {
  if (!img || typeof img !== 'object') return false;
  if (img.source === 'tourapi') return true;
  return String(img.id ?? '').startsWith('tourapi');
}

export function isOfficialGalleryImage(img) {
  if (!img || typeof img !== 'object') return false;
  const source = String(img.source ?? '').trim();
  if (source === 'local-scenic-official' || source === 'korea-scenic-ssot') return true;
  return String(img.id ?? '').startsWith('local-scenic-official-');
}

function isPexelsGalleryImage(img) {
  if (!img || typeof img !== 'object') return false;
  if (img.source === 'pexels') return true;
  return String(img.id ?? '').startsWith('pexels');
}

function isUnsplashGalleryImage(img) {
  if (!img || typeof img !== 'object') return false;
  if (img.source === 'unsplash') return true;
  const url = String(img.urls?.small || img.urls?.regular || '').trim();
  return url.includes('images.unsplash.com');
}

export function isStockGalleryImage(img) {
  return isPexelsGalleryImage(img) || isUnsplashGalleryImage(img);
}

/** place_stats가 TourAPI 위주면 soft는 스톡 API로 갱신(절약은 세션·스톡 DB 히트) — usePlaceGallery 와 동일 기준 */
export function isTourApiDominantGallery(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (list.length === 0) return false;
  const tourCount = list.filter(isTourApiGalleryImage).length;
  return tourCount / list.length >= 0.5;
}

export function galleryPersistReplaceSameAsStored(storedBaseline, payloadImages) {
  const stored = galleryPersistNormalizedIds(storedBaseline);
  if (!stored.length) return false;
  const payload = galleryPersistNormalizedIds(payloadImages);
  if (stored.length !== payload.length) return false;
  for (let i = 0; i < stored.length; i += 1) {
    if (stored[i] !== payload[i]) return false;
  }
  return true;
}

/**
 * replace RPC 생략 — 화면·캐시는 그대로, DB 쓰기만 막음.
 * @returns {'unchanged' | 'tour_to_stock_only' | null}
 */
export function skipPersistPlaceGalleryReplaceReason(storedBaseline, payloadImages) {
  if (!Array.isArray(payloadImages) || payloadImages.length === 0) return null;
  if (galleryPersistReplaceSameAsStored(storedBaseline, payloadImages)) {
    return 'unchanged';
  }
  const baseline = Array.isArray(storedBaseline) ? storedBaseline.filter(Boolean) : [];
  if (!baseline.length || !isTourApiDominantGallery(baseline)) return null;
  const hasTourOrOfficial = payloadImages.some(
    (img) => isTourApiGalleryImage(img) || isOfficialGalleryImage(img),
  );
  if (hasTourOrOfficial) return null;
  if (payloadImages.every((img) => isStockGalleryImage(img))) {
    return 'tour_to_stock_only';
  }
  return null;
}

export function buildPersistPlaceGalleryArgs({ placeId, mode, images, imageUrl }) {
  return {
    p_place_id: placeId,
    p_mode: mode,
    p_images: mode === 'thumb' ? null : images ?? null,
    p_image_url: imageUrl ?? null,
  };
}

export function droppedGalleryIds(data) {
  const raw = data?.dropped_ids;
  if (!Array.isArray(raw)) return [];
  return raw.map((id) => String(id)).filter(Boolean);
}

export function withoutDroppedGalleryImages(storage, droppedIds) {
  const drop = new Set((droppedIds || []).map((id) => String(id)));
  if (!drop.size) return Array.isArray(storage) ? storage : [];
  return (storage || []).filter((img) => !drop.has(String(img?.id)));
}

export function galleryReportErrorReason(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  if (code === '23505') return 'duplicate';
  if (code === '42501') return 'login';
  if (code === '23503') return 'missing_photo';
  if (
    code === 'PGRST205'
    || code === '42P01'
    || code === 'PGRST204'
    || /could not find the table/i.test(message)
    || (/gallery_photo_reports/.test(message) && /schema cache|does not exist/i.test(message))
  ) {
    return 'unavailable';
  }
  return 'error';
}

/** 늦은 응답은 null. 에러·비관리자는 false (버튼 숨김). */
export function galleryAdminFromProbe({ seq, latestSeq, hasUser, error, data }) {
  if (seq !== latestSeq) return null;
  if (!hasUser || error || data !== true) return false;
  return true;
}

export function galleryModerateFailureReason(error, data) {
  if (!error && data?.ok !== false) return null;
  const status = Number(error?.context?.status || error?.status || 0);
  const code = String(error?.code || data?.code || '');
  if (status === 403 || code === '42501' || code === '403') return 'forbidden';
  return 'error';
}
