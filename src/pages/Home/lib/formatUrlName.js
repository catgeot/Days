export const formatUrlName = (nameEn) => {
  if (!nameEn) return '';
  return nameEn
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * `/place/...` 라우팅용. 지오코딩 slug가 유명 도시(slug)와 겹치면 잘못된 프리셋(예: 부산)으로 해석될 수 있어
 * 좌표 기반 id(search-, loc-)는 slug보다 우선합니다.
 */
export function getPlaceUrlParam(loc) {
  if (!loc) return '';
  const id = loc.id != null ? String(loc.id) : '';
  if (id.startsWith('search-') || id.startsWith('loc-')) {
    return id;
  }
  return loc.slug || id || loc.name || '';
}
