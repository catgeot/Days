import canonicalPlaceIdMap from './canonicalPlaceIdMap.json' with { type: 'json' };

const SLUG_TO_CANONICAL = canonicalPlaceIdMap as Record<string, string>;

/**
 * slug-first place_id — 큐레이션 slug가 있으면 DB 키로 slug 저장.
 * 레거시: slug 미매핑 시 placeId/locationName(한글·영문) 그대로.
 */
export function resolveCanonicalPlaceId(params: {
  slug?: string | null;
  placeId?: string | null;
  locationName?: string | null;
  canonicalPlaceId?: string | null;
}): string {
  const slug = String(params.slug ?? '').trim().toLowerCase();
  const fromClient = String(params.canonicalPlaceId ?? '').trim();
  const fallback = String(params.placeId ?? params.locationName ?? '').trim();

  if (slug && isKnownTravelSpotSlug(slug)) {
    return slug;
  }

  if (slug && SLUG_TO_CANONICAL[slug]) {
    return slug;
  }

  if (fromClient && isKnownTravelSpotSlug(fromClient.toLowerCase())) {
    return fromClient.toLowerCase();
  }

  return fallback || fromClient;
}

export function isKnownTravelSpotSlug(slug?: string | null): boolean {
  const s = String(slug ?? '').trim().toLowerCase();
  return Boolean(s && SLUG_TO_CANONICAL[s]);
}
