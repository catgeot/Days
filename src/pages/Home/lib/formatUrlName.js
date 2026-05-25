import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { mergeCanonicalTravelSpot } from '../../../utils/travelSpotResolve.js';

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

function isEphemeralSlug(slug) {
  if (!slug || typeof slug !== 'string') return true;
  const s = slug.trim();
  return (
    !s ||
    /^\d+$/.test(s) ||
    s.startsWith('search-') ||
    s.startsWith('loc-') ||
    s.startsWith('city-')
  );
}

/**
 * `/place/...` 라우팅용. SSOT slug(canonical) 우선 — 숫자 id(700)·지오코딩 보조지명(ruul) URL 통일.
 */
export function getPlaceUrlParam(loc) {
  if (!loc) return '';

  const merged = typeof loc === 'object' ? mergeCanonicalTravelSpot(loc) : loc;
  const slug = merged.canonical_slug || merged.slug;

  if (slug && typeof slug === 'string' && !isEphemeralSlug(slug)) {
    return slug;
  }

  const id = merged.id != null ? String(merged.id) : '';
  if (/^\d+$/.test(id)) {
    const spot = TRAVEL_SPOTS.find((s) => String(s.id) === id);
    if (spot?.slug) return spot.slug;
    const fromName = formatUrlName(spot?.name_en || spot?.name);
    if (fromName) return fromName;
  }

  if (id.startsWith('search-') || id.startsWith('loc-')) {
    return id;
  }

  const nameSlug = formatUrlName(merged.name_en || merged.name);
  return nameSlug || slug || id || merged.name || '';
}
