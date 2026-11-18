const PEXELS_HOME = 'https://www.pexels.com/';
const WIKIMEDIA_COMMONS = 'https://commons.wikimedia.org/';

/**
 * @param {import('../components/PlaceCard/common/buildGalleryPhotoCredit.js').GalleryStockPhotoCredit | import('../components/PlaceCard/common/buildGalleryPhotoCredit.js').GalleryWikimediaPhotoCredit | import('../components/PlaceCard/common/buildGalleryPhotoCredit.js').GalleryKtoPhotoCredit | null} credit
 * @returns {{ kind: 'plain', text: string } | { kind: 'stock', provider: 'unsplash' | 'pexels', authorName: string, photographerHref: string|null, providerHref: string|null } | { kind: 'wikimedia', authorName: string, photographerHref: string|null, filePageHref: string|null, licenseName: string|null, licenseHref: string|null } | { kind: 'kto', providerLabel: string, providerHref: string } | null}
 */
export function normalizeGalleryPhotoCredit(credit) {
  if (!credit) return null;
  if (credit.kind === 'kto') {
    return {
      kind: 'kto',
      providerLabel: credit.providerLabel,
      providerHref: credit.providerHref,
    };
  }
  if (credit.kind === 'wikimedia') {
    return {
      kind: 'wikimedia',
      authorName: credit.authorName,
      photographerHref: credit.photographerHref || null,
      filePageHref: credit.filePageHref || null,
      licenseName: credit.licenseName || null,
      licenseHref: credit.licenseHref || null,
    };
  }
  if (credit.kind === 'stock') {
    return {
      kind: 'stock',
      provider: credit.provider,
      authorName: credit.authorName,
      photographerHref: credit.photographerHref || null,
      providerHref: credit.providerHref || null,
    };
  }
  return null;
}

/**
 * @param {ReturnType<typeof import('./editorialReviewImageCredit.js').resolveEditorialReviewImageCredit>} credit
 */
export function normalizeEditorialReviewCredit(credit) {
  if (!credit) return null;
  if (credit.type === 'plain') {
    return { kind: 'plain', text: credit.text };
  }
  if (credit.type === 'unsplash') {
    return {
      kind: 'stock',
      provider: 'unsplash',
      authorName: credit.photographerName,
      photographerHref: credit.photographerHref || null,
      providerHref: credit.providerHref || null,
    };
  }
  if (credit.type === 'pexels') {
    return {
      kind: 'stock',
      provider: 'pexels',
      authorName: credit.photographerName,
      photographerHref: credit.photographerHref || null,
      providerHref: credit.providerHref || null,
    };
  }
  if (credit.type === 'wikimedia') {
    return {
      kind: 'wikimedia',
      authorName: credit.photographerName,
      photographerHref: credit.photographerHref || null,
      filePageHref: credit.filePageHref || null,
      licenseName: credit.licenseName || null,
      licenseHref: credit.licenseHref || null,
    };
  }
  return null;
}

/**
 * Locale-aware plain summary for unit tests (no React / i18n runtime).
 * @param {ReturnType<typeof normalizeGalleryPhotoCredit>} credit
 * @param {string} [locale]
 */
export function formatStockPhotoCreditPlainText(credit, locale = 'ko') {
  if (!credit) return '';
  const en = String(locale || '').toLowerCase().startsWith('en');

  if (credit.kind === 'plain') return credit.text;

  if (credit.kind === 'kto') {
    return en ? `Photos: ${credit.providerLabel}` : `사진: ${credit.providerLabel}`;
  }

  if (credit.kind === 'stock') {
    const providerLabel = credit.provider === 'pexels' ? 'Pexels' : 'Unsplash';
    if (en) {
      return `Photo by ${credit.authorName} on ${providerLabel}`;
    }
    return `사진 ${credit.authorName} · ${providerLabel}`;
  }

  if (credit.kind === 'wikimedia') {
    let line = en ? `Photo by ${credit.authorName}` : `사진 ${credit.authorName}`;
    if (credit.licenseName) {
      line += ` · ${credit.licenseName}`;
    }
    return line;
  }

  return '';
}

export { PEXELS_HOME, WIKIMEDIA_COMMONS };