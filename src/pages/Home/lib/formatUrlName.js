import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { mergeCanonicalTravelSpot } from '../../../utils/travelSpotResolve.js';
import { isDomesticKoreaLocation } from '../../../utils/tourApiMatch.js';
import { uiPlacePoiCollidesWithCatalogParam } from './explorePlaceSlugGuard.js';

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
    const v = sanitizeTourContentIdEnglishFallback(loc[key]);
    if (isUrlSafeEnglishLabel(v)) return v;
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

/** TourAPI contentId — 장소별 고유 /place/tour-{id} (공유·새로고침 SSOT) */
export function koreaTourContentPlaceParam(contentId) {
  const id = String(contentId ?? '').trim();
  if (!/^\d{1,32}$/.test(id)) return '';
  return `tour-${id}`;
}

const TOUR_CONTENT_ID_EN_FALLBACK_RE = /^Tour\s+\d{1,32}$/i;

/** slug→영문 추론·name_en — TourAPI contentId 자리표시(Tour 126444)는 영문명 아님 */
export function isTourContentIdEnglishFallback(value) {
  const text = String(value ?? '').trim();
  return Boolean(text && TOUR_CONTENT_ID_EN_FALLBACK_RE.test(text));
}

export function sanitizeTourContentIdEnglishFallback(value) {
  return isTourContentIdEnglishFallback(value) ? '' : String(value ?? '').trim();
}

/**
 * `/place/...` 라우팅용. SSOT slug(canonical) 우선 — 숫자 id(700)·지오코딩 보조지명(ruul) URL 통일.
 */
export function getPlaceUrlParam(loc) {
  if (!loc) return '';

  const merged = typeof loc === 'object' ? mergeCanonicalTravelSpot(loc) : loc;
  const source = String(merged.source ?? '').trim().toLowerCase();

  const tourContentParam = koreaTourContentPlaceParam(merged.contentId);
  if (tourContentParam && source === 'tourapi') {
    return tourContentParam;
  }

  const catalogSlug = resolveCatalogPlaceSlug(merged.slug || merged.canonical_slug);
  if (catalogSlug && source !== 'tourapi' && !uiPlacePoiCollidesWithCatalogParam(merged, catalogSlug)) {
    return catalogSlug;
  }

  const slug = merged.canonical_slug || merged.slug;
  if (slug && typeof slug === 'string' && !isEphemeralSlug(slug) && (source === 'hub' || source === 'ssot')) {
    return slug;
  }

  if (tourContentParam && source === 'tourapi') {
    return tourContentParam;
  }

  const lat = Number(merged.lat);
  const lng = Number(merged.lng);

  if (slug && typeof slug === 'string' && !isEphemeralSlug(slug)) {
    if (/[\uAC00-\uD7A3]/.test(slug)) {
      if (merged.uiPlace && Number.isFinite(lat) && Number.isFinite(lng)) {
        return `search-${lat}-${lng}`;
      }
    } else if (!uiPlacePoiCollidesWithCatalogParam(merged, slug)) {
      return slug;
    }
  }

  const id = merged.id != null ? String(merged.id) : '';
  if (/^\d+$/.test(id)) {
    const spot = TRAVEL_SPOTS.find((s) => String(s.id) === id);
    if (spot?.slug) return spot.slug;
    const fromName = formatUrlName(spot?.name_en || spot?.name);
    if (fromName) return fromName;
  }

  if (id.startsWith('search-') || id.startsWith('loc-') || id.startsWith('tour-')) {
    return id;
  }

  let nameSlug = formatUrlName(pickUrlSafeEnglishName(merged) || merged.name_en || merged.name);
  if (isDomesticKoreaLocation(merged) && (nameSlug === 'south-korea' || nameSlug === 'korea')) {
    nameSlug = '';
  }
  if (nameSlug && !uiPlacePoiCollidesWithCatalogParam(merged, nameSlug)) {
    return nameSlug;
  }

  if (merged.uiPlace && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `search-${lat}-${lng}`;
  }

  return slug || id || merged.name || '';
}
