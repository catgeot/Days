import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { mergeCanonicalTravelSpot } from '../../../utils/travelSpotResolve.js';

/** slug·name_en용 — 한글/CJK만 있으면 false (레소토·에스와티니 라벨 등) */
export function isUrlSafeEnglishLabel(value) {
  const s = String(value || '').trim();
  if (!s) return false;
  if (/[\uAC00-\uD7A3\u3040-\u30ff\u3400-\u9fff]/.test(s)) return false;
  return /[A-Za-z\u00C0-\u024F]/.test(s);
}

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

/** uiPlace URL용 영문 라벨 — name_en → country_en → (영문일 때만) name */
export function pickUrlSafeEnglishName(loc) {
  if (!loc || typeof loc !== 'object') return '';
  for (const key of ['name_en', 'country_en', 'name']) {
    const v = loc[key];
    if (isUrlSafeEnglishLabel(v)) return String(v).trim();
  }
  return '';
}

export function isEphemeralSlug(slug) {
  if (!slug || typeof slug !== 'string') return true;
  const s = slug.trim();
  return (
    !s ||
    /^\d+$/.test(s) ||
    s.startsWith('search-') ||
    s.startsWith('loc-') ||
    s.startsWith('city-') ||
    s.startsWith('label-')
  );
}

/** 무니 플래너·퀵리플라이용 — TRAVEL_SPOTS에 있는 slug만 */
export function resolveCatalogPlaceSlug(slug) {
  const s = String(slug ?? '').trim().toLowerCase();
  if (!s || isEphemeralSlug(s)) return null;
  return TRAVEL_SPOTS.find((x) => String(x.slug).toLowerCase() === s)?.slug ?? null;
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

  const nameSlug = formatUrlName(pickUrlSafeEnglishName(merged) || merged.name_en || merged.name);
  return nameSlug || slug || id || merged.name || '';
}
