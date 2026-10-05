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
