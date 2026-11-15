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

function hostnameIsUnsplash(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return host === 'unsplash.com' || host.endsWith('.unsplash.com');
  } catch {
    return false;
  }
}

/**
 * Photographer name alone is not Unsplash. KTO, KOGL, and Wikimedia rows store a
 * photographer plus the credit line that should be shown as written.
 */
export function isUnsplashReviewImage(img) {
  if (!img || typeof img !== 'object') return false;
  const source = String(img.source ?? '').trim().toLowerCase();
  if (source === 'unsplash') return true;
  return [
    img.url,
    img.publicUrl,
    img.unsplash_url,
    img.html_link,
    img.photographer_url,
  ].some(hostnameIsUnsplash);
}

/** Thumbnail caption: real Unsplash photo metadata only (not a stored KTO/KOGL/Wikimedia credit). */
export function hasUnsplashReviewImageAttribution(img) {
  return isUnsplashReviewImage(img);
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

  if (isUnsplashReviewImage(img)) {
    const photographerHref =
      typeof photographerHrefRaw === 'string' && photographerHrefRaw.trim()
        ? appendGateoReferralUtm(photographerHrefRaw)
        : null;
    const unsplashHref = appendGateoReferralUtm(
      typeof unsplashHrefRaw === 'string' && unsplashHrefRaw.trim() ? unsplashHrefRaw : UNSPLASH_HOME,
    );
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
