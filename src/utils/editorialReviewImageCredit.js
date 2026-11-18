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

/** Stable per-file key so duplicate credit rows on different assets are detectable. */
export function extractReviewImageAssetKey(img) {
  if (!img || typeof img !== 'object') return '';
  const candidates = [img.unsplash_url, img.html_link, img.url, img.publicUrl];
  for (const raw of candidates) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const trimmed = raw.trim();
    const photoSlug = trimmed.match(/photos\/[^/?#]+-([A-Za-z0-9_-]+)/);
    if (photoSlug) return `unsplash:${photoSlug[1]}`;
    const cdnId = trimmed.match(/photo-\d+-([a-f0-9]+)/i);
    if (cdnId) return `unsplash-cdn:${cdnId[1]}`;
    try {
      return `path:${new URL(trimmed).pathname}`;
    } catch {
      /* ignore */
    }
  }
  return '';
}

function reviewImageCreditFingerprint(img) {
  if (!img || typeof img !== 'object') return '';
  const credit = String(img.credit || img.attribution || '').trim();
  const photographer = String(img.photographer || img.photographer_name || '').trim();
  const photographerUrl = String(img.photographer_url || '')
    .trim()
    .replace(/\?.*$/, '');
  if (!credit && !photographer && !photographerUrl) return '';
  return `${credit}||${photographer}||${photographerUrl}`;
}

/**
 * Later images sometimes copy the first row's credit while pointing at another file (publish slip).
 * Do not show another photo's attribution on the wrong asset.
 */
export function isBorrowedEditorialReviewImageCredit(img, images, imageIndex) {
  if (!img || imageIndex == null || imageIndex <= 0 || !Array.isArray(images)) return false;
  const selfKey = extractReviewImageAssetKey(img);
  const selfFp = reviewImageCreditFingerprint(img);
  if (!selfKey || !selfFp) return false;

  for (let i = 0; i < imageIndex; i += 1) {
    const other = images[i];
    if (!other || other === img) continue;
    if (extractReviewImageAssetKey(other) === selfKey) continue;
    if (reviewImageCreditFingerprint(other) === selfFp) {
      return true;
    }
  }
  return false;
}

/**
 * @param {string|Record<string, unknown>|null|undefined} img
 * @param {{ images?: unknown[], imageIndex?: number }} [context]
 * @returns {{ type: 'plain', text: string } | { type: 'unsplash', photographerName: string, photographerHref: string|null, unsplashHref: string } | null}
 */
export function resolveEditorialReviewImageCredit(img, context = {}) {
  if (!img || typeof img !== 'object') return null;

  const { images, imageIndex } = context;
  if (
    Array.isArray(images) &&
    typeof imageIndex === 'number' &&
    isBorrowedEditorialReviewImageCredit(img, images, imageIndex)
  ) {
    return null;
  }

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

export function collectUniqueEditorialReviewImageCredits(images, context = {}) {
  if (!Array.isArray(images) || images.length === 0) return [];

  const seen = new Set();
  const credits = [];

  for (let index = 0; index < images.length; index += 1) {
    const img = images[index];
    const credit = resolveEditorialReviewImageCredit(img, {
      images: context.images ?? images,
      imageIndex: context.imageIndex ?? index,
    });
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
