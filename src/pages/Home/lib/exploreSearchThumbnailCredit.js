const GATEO_UNSPLASH_FALLBACK = 'https://unsplash.com/?utm_source=gateo&utm_medium=referral';

export function ensureGateoReferralHref(href) {
  const raw = String(href || '').trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'gateo');
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'referral');
    return u.toString();
  } catch {
    return raw;
  }
}

/**
 * @param {unknown} raw SSOT thumbnailCredit on explore search rows
 * @returns {{ kind: 'unsplash', authorName: string, photographerHref: string|null, unsplashHref: string } | null}
 */
export function normalizeExploreSearchThumbnailCredit(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const source = String(raw.source || '').trim().toLowerCase();
  if (source !== 'unsplash') return null;
  const authorName = String(raw.photographer || '').trim();
  if (!authorName) return null;
  return {
    kind: 'unsplash',
    authorName,
    photographerHref: ensureGateoReferralHref(raw.photographer_url),
    unsplashHref:
      ensureGateoReferralHref(raw.unsplash_url) || GATEO_UNSPLASH_FALLBACK,
  };
}

/**
 * @param {ReturnType<typeof normalizeExploreSearchThumbnailCredit>} credit
 * @param {string} [locale]
 */
export function formatExploreSearchThumbnailCreditPlain(credit, locale = 'ko') {
  if (!credit) return '';
  const en = String(locale || '').toLowerCase().startsWith('en');
  if (en) {
    return `Photo: ${credit.authorName} / Unsplash`;
  }
  return `사진 ${credit.authorName} / Unsplash`;
}