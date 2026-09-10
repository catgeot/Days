import travelSpotTourApi from '../pages/Home/data/travelSpotTourApi.json' with { type: 'json' };

/**
 * @typedef {{
 *   slug: string | null,
 *   photoKeyword: string,
 *   photoKeywords: string[],
 *   contentId: string | null,
 *   title: string,
 *   curated: boolean,
 * }} TourApiPlaceMapping
 */

const KR_COUNTRY_RE = /^(한국|대한민국|korea|south\s*korea|republic of korea)$/i;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isDomesticKoreaCountry(value) {
  const s = String(value || '').trim();
  if (!s) return false;
  return KR_COUNTRY_RE.test(s);
}

/**
 * @param {{ country?: string, country_en?: string } | null | undefined} location
 * @returns {boolean}
 */
export function isDomesticKoreaLocation(location) {
  if (!location || typeof location !== 'object') return false;
  return (
    isDomesticKoreaCountry(location.country) ||
    isDomesticKoreaCountry(location.country_en)
  );
}

/**
 * @param {{ slug?: string, hubId?: string, id?: string } | string | null | undefined} locationOrSlug
 * @returns {string}
 */
export function getTourApiSlugKey(locationOrSlug) {
  if (typeof locationOrSlug === 'string') {
    return locationOrSlug.trim().toLowerCase();
  }
  if (!locationOrSlug || typeof locationOrSlug !== 'object') return '';
  return String(
    locationOrSlug.slug || locationOrSlug.hubId || locationOrSlug.id || '',
  )
    .trim()
    .toLowerCase();
}

/**
 * @param {string} slug
 * @returns {TourApiPlaceMapping | null}
 */
function mappingFromSlug(slug) {
  if (!slug) return null;
  const entry = travelSpotTourApi?.spots?.[slug];
  if (!entry) return null;
  const photoKeyword = String(entry.photoKeyword || '').trim();
  if (!photoKeyword) return null;
  const contentIdRaw = entry.contentId;
  const contentId =
    contentIdRaw != null && String(contentIdRaw).trim() !== ''
      ? String(contentIdRaw).trim()
      : null;
  const photoKeywords = Array.isArray(entry.photoKeywords)
    ? entry.photoKeywords.map((k) => String(k || '').trim()).filter(Boolean)
    : [];
  return {
    slug,
    photoKeyword,
    photoKeywords,
    contentId,
    title: String(entry.title || photoKeyword).trim(),
    curated: true,
  };
}

/**
 * slug → contentId/photoKeyword. 미등록 국내는 soft(이름=keyword).
 *
 * @param {{ slug?: string, hubId?: string, id?: string, name?: string, country?: string, country_en?: string } | string | null | undefined} locationOrSlug
 * @returns {TourApiPlaceMapping | null}
 */
export function resolveTourApiPlace(locationOrSlug) {
  if (locationOrSlug == null) return null;

  if (typeof locationOrSlug === 'string') {
    const bySlug = mappingFromSlug(getTourApiSlugKey(locationOrSlug));
    if (bySlug) return bySlug;
    const byNameSlug = travelSpotTourApi?.byName?.[locationOrSlug.trim()];
    if (byNameSlug) return mappingFromSlug(byNameSlug);
    return null;
  }

  const slugKey = getTourApiSlugKey(locationOrSlug);
  const explicitId = String(locationOrSlug.contentId || '').trim();
  const hasExplicitId = /^\d{1,32}$/.test(explicitId);
  const bySlug = mappingFromSlug(slugKey);
  if (bySlug) {
    if (hasExplicitId && !bySlug.contentId) {
      return { ...bySlug, contentId: explicitId };
    }
    return bySlug;
  }

  const name = String(locationOrSlug.name || '').trim();
  if (name) {
    const byNameSlug = travelSpotTourApi?.byName?.[name];
    if (byNameSlug) {
      const mapped = mappingFromSlug(byNameSlug);
      if (mapped) {
        if (hasExplicitId && !mapped.contentId) {
          return { ...mapped, contentId: explicitId };
        }
        return mapped;
      }
    }
  }

  // 국내 미등록: 장소 contentId가 있으면 Tour 갤러리·분류에 쓰고, 없으면 searchPhoto soft
  if (isDomesticKoreaLocation(locationOrSlug) && (name || hasExplicitId)) {
    const label = name || explicitId;
    return {
      slug: slugKey || null,
      photoKeyword: label.slice(0, 80),
      photoKeywords: name
        ? [`${name} 전경`.slice(0, 80), `${name} 야경`.slice(0, 80)]
        : [],
      contentId: hasExplicitId ? explicitId : null,
      title: label,
      curated: false,
    };
  }

  return null;
}

/**
 * @param {unknown} locationOrSlug
 * @returns {boolean}
 */
export function hasTourApiPlace(locationOrSlug) {
  return Boolean(resolveTourApiPlace(locationOrSlug));
}
