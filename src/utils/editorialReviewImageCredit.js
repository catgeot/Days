import { extractCommonsArtistHref, sanitizeWikimediaAuthorHref } from './commonsArtistHref.js';

const UNSPLASH_HOME = 'https://unsplash.com/';
const PEXELS_HOME = 'https://www.pexels.com/';
const WIKIMEDIA_COMMONS = 'https://commons.wikimedia.org/';

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

function hostnameMatches(value, hosts) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return hosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function hostnameIsUnsplash(value) {
  return hostnameMatches(value, ['unsplash.com']);
}

function hostnameIsPexels(value) {
  return hostnameMatches(value, ['pexels.com']);
}

function hostnameIsWikimedia(value) {
  return hostnameMatches(value, ['wikimedia.org', 'wikipedia.org']);
}

/** Wiki User: pages, Wikidata authors, and external author URLs (Flickr). File/Category/Help stay unlinked. */
function resolveWikimediaPhotographerHref(photographerHrefRaw, artistHtml) {
  const fromArtistHtml = extractCommonsArtistHref(artistHtml);
  if (fromArtistHtml) return fromArtistHtml;
  if (typeof photographerHrefRaw === 'string' && photographerHrefRaw.includes('href=')) {
    const fromRawHtml = extractCommonsArtistHref(photographerHrefRaw);
    if (fromRawHtml) return fromRawHtml;
  }
  return sanitizeWikimediaAuthorHref(photographerHrefRaw);
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

export function isPexelsReviewImage(img) {
  if (!img || typeof img !== 'object') return false;
  const source = String(img.source ?? '').trim().toLowerCase();
  if (source === 'pexels') return true;
  return [img.url, img.publicUrl, img.html_link, img.pexels_url, img.photographer_url, img.source_page].some(
    hostnameIsPexels,
  );
}

export function isHeritageStoredCreditLine(img) {
  const creditText = String(img?.credit || img?.attribution || '').trim();
  return /공공누리|KOGL/i.test(creditText);
}

export function isWikimediaStockReviewImage(img) {
  if (!img || typeof img !== 'object') return false;
  if (isUnsplashReviewImage(img) || isPexelsReviewImage(img)) return false;
  if (isHeritageStoredCreditLine(img)) return false;
  const source = String(img.source ?? '').trim().toLowerCase();
  const isWikiSource = source.includes('wikimedia') || source.includes('commons');
  const isWikiUrl = [img.url, img.publicUrl, img.source_page, img.photographer_url, img.html_link].some(
    hostnameIsWikimedia,
  );
  if (!isWikiSource && !isWikiUrl) return false;
  const photographerName = String(img.photographer || img.photographer_name || '').trim();
  return Boolean(photographerName);
}

/** Thumbnail caption: real Unsplash photo metadata only (not a stored KTO/KOGL/Wikimedia credit). */
export function hasUnsplashReviewImageAttribution(img) {
  return isUnsplashReviewImage(img);
}

function readLicenseFields(img) {
  const licenseName = String(img.license || '').trim();
  const licenseHref = String(img.license_url || img.licenseUrl || '').trim();
  return { licenseName: licenseName || null, licenseHref: licenseHref || null };
}

/**
 * @param {string|Record<string, unknown>|null|undefined} img
 * @returns {{ type: 'plain', text: string } | { type: 'unsplash', photographerName: string, photographerHref: string|null, providerHref: string } | { type: 'pexels', photographerName: string, photographerHref: string|null, providerHref: string } | { type: 'wikimedia', photographerName: string, photographerHref: string|null, filePageHref: string|null, licenseName: string|null, licenseHref: string|null, providerHref: string|null } | null}
 */
export function resolveEditorialReviewImageCredit(img) {
  if (!img || typeof img !== 'object') return null;

  const creditText = String(img.credit || img.attribution || '').trim();
  const photographerName = String(img.photographer || img.photographer_name || '').trim();
  const photographerHrefRaw = img.photographer_url;
  const artistHtml = img.artist_html || img.artistHtml || null;
  const unsplashHrefRaw = img.unsplash_url || img.html_link;
  const pexelsHrefRaw =
    img.pexels_url ||
    img.source_page ||
    img.html_link ||
    (typeof img.url === 'string' && hostnameIsPexels(img.url) ? img.url : null);
  const filePageRaw = img.source_page || img.file_page_url;

  if (isUnsplashReviewImage(img)) {
    const photographerHref =
      typeof photographerHrefRaw === 'string' && photographerHrefRaw.trim()
        ? appendGateoReferralUtm(photographerHrefRaw)
        : null;
    const providerHref = appendGateoReferralUtm(
      typeof unsplashHrefRaw === 'string' && unsplashHrefRaw.trim() ? unsplashHrefRaw : UNSPLASH_HOME,
    );
    return {
      type: 'unsplash',
      photographerName: photographerName || 'Photographer',
      photographerHref,
      providerHref: providerHref || appendGateoReferralUtm(UNSPLASH_HOME),
      unsplashHref: providerHref || appendGateoReferralUtm(UNSPLASH_HOME),
    };
  }

  if (isPexelsReviewImage(img)) {
    const photographerHref =
      typeof photographerHrefRaw === 'string' && photographerHrefRaw.trim()
        ? appendGateoReferralUtm(photographerHrefRaw)
        : null;
    const providerHref = appendGateoReferralUtm(
      typeof pexelsHrefRaw === 'string' && pexelsHrefRaw.trim() ? pexelsHrefRaw : PEXELS_HOME,
    );
    if (!photographerName) return creditText ? { type: 'plain', text: creditText } : null;
    return {
      type: 'pexels',
      photographerName,
      photographerHref,
      providerHref: providerHref || appendGateoReferralUtm(PEXELS_HOME),
    };
  }

  if (isWikimediaStockReviewImage(img)) {
    const { licenseName, licenseHref } = readLicenseFields(img);
    const filePageHref =
      typeof filePageRaw === 'string' && filePageRaw.trim()
        ? filePageRaw.trim()
        : typeof photographerHrefRaw === 'string' &&
            photographerHrefRaw.trim() &&
            photographerHrefRaw.includes('commons.wikimedia.org/wiki/File:')
          ? photographerHrefRaw.trim()
          : null;
    const photographerHref = resolveWikimediaPhotographerHref(photographerHrefRaw, artistHtml);
    return {
      type: 'wikimedia',
      photographerName,
      photographerHref,
      filePageHref,
      licenseName,
      licenseHref: licenseHref || null,
      providerHref: filePageHref || WIKIMEDIA_COMMONS,
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
        : credit.type === 'wikimedia'
          ? `wikimedia:${credit.photographerName}:${credit.photographerHref ?? ''}:${credit.filePageHref ?? ''}:${credit.licenseName ?? ''}`
          : credit.type === 'pexels'
            ? `pexels:${credit.photographerName}:${credit.photographerHref ?? ''}:${credit.providerHref}`
            : `unsplash:${credit.photographerName}:${credit.photographerHref ?? ''}:${credit.providerHref ?? credit.unsplashHref}`;

    if (seen.has(key)) continue;
    seen.add(key);
    credits.push(credit);
  }

  return credits;
}