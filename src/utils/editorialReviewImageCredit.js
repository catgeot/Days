const UNSPLASH_HOME = 'https://unsplash.com/';

export function appendGateoReferralUtm(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (!parsed.searchParams.has('utm_source')) {
      parsed.searchParams.set('utm_source', 'gateo');
    }
    if (!parsed.searchParams.has('utm_medium')) {
      parsed.searchParams.set('utm_medium', 'referral');
    }
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

/** Thumbnail caption: Unsplash photographer / photo page metadata only (not plain credit lines). */
export function hasUnsplashReviewImageAttribution(img) {
  if (!img || typeof img !== 'object') return false;
  const photographer = String(img.photographer || img.photographer_name || '').trim();
  const unsplash = String(img.unsplash_url || img.html_link || '').trim();
  const photographerUrl = String(img.photographer_url || '').trim();
  return Boolean(photographer || unsplash || photographerUrl);
}

/**
 * @param {string|Record<string, unknown>|null|undefined} img
 * @returns {{ type: 'plain', text: string } | { type: 'unsplash', photographerName: string, photographerHref: string|null, unsplashHref: string } | null}
 */
export function resolveEditorialReviewImageCredit(img) {
  if (!img || typeof img !== 'object') return null;

  const creditText = String(img.credit || img.attribution || '').trim();
  const photographerName = String(img.photographer || img.photographer_name || '').trim();
  const photographerHrefRaw = img.photographer_url;
  const unsplashHrefRaw = img.unsplash_url || img.html_link;

  const photographerHref =
    typeof photographerHrefRaw === 'string' && photographerHrefRaw.trim()
      ? appendGateoReferralUtm(photographerHrefRaw)
      : null;
  const unsplashHref = appendGateoReferralUtm(
    typeof unsplashHrefRaw === 'string' && unsplashHrefRaw.trim() ? unsplashHrefRaw : UNSPLASH_HOME,
  );

  const hasUnsplashUrls =
    (typeof photographerHrefRaw === 'string' && photographerHrefRaw.trim()) ||
    (typeof unsplashHrefRaw === 'string' && unsplashHrefRaw.trim());

  if (photographerName || hasUnsplashUrls) {
    return {
      type: 'unsplash',
      photographerName: photographerName || 'Photographer',
      photographerHref,
      unsplashHref: unsplashHref || appendGateoReferralUtm(UNSPLASH_HOME),
    };
  }

  if (creditText) {
    return { type: 'plain', text: creditText };
  }

  return null;
}

/** Linked Unsplash caption for collapsed review thumbnails (skips plain-only credits). */
export function resolveReviewThumbnailUnsplashCredit(img) {
  if (!hasUnsplashReviewImageAttribution(img)) return null;
  const credit = resolveEditorialReviewImageCredit(img);
  return credit?.type === 'unsplash' ? credit : null;
}

export function collectUniqueEditorialReviewImageCredits(images) {
  if (!Array.isArray(images) || images.length === 0) return [];

  const seen = new Set();
  const credits = [];

  for (const img of images) {
    const credit = resolveEditorialReviewImageCredit(img);
    if (!credit) continue;

    const key =
      credit.type === 'plain'
        ? `plain:${credit.text}`
        : `unsplash:${credit.photographerName}:${credit.photographerHref ?? ''}:${credit.unsplashHref}`;

    if (seen.has(key)) continue;
    seen.add(key);
    credits.push(credit);
  }

  return credits;
}
