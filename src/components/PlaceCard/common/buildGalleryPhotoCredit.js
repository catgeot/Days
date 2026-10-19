import { appendGateoReferralUtm } from '../../../utils/editorialReviewImageCredit';
import { getGalleryImageSource } from './galleryImageAttribution';

const UNSPLASH_HOME = 'https://unsplash.com/';
const PEXELS_HOME = 'https://www.pexels.com/';
const KTO_HOME = 'https://www.visitkorea.or.kr/';

/**
 * @typedef {{ kind: 'stock', authorName: string, photographerHref: string, providerHref: string, provider: 'unsplash' | 'pexels' }} GalleryStockPhotoCredit
 * @typedef {{ kind: 'kto', authorName: string, photographerHref: string, providerHref: string, providerLabel: string }} GalleryKtoPhotoCredit
 */

/**
 * Per-grid-tile photographer credit. Returns null when attribution cannot be shown (no empty “Photo by”).
 * @param {Record<string, unknown> | null | undefined} image
 * @param {string} [locale]
 * @returns {GalleryStockPhotoCredit | GalleryKtoPhotoCredit | null}
 */
export function buildGalleryPhotoCredit(image, locale = 'ko') {
  if (!image || typeof image !== 'object') return null;

  const source = getGalleryImageSource(image);
  const authorName = String(image?.user?.name || '').trim();
  const isKo = !String(locale || '').toLowerCase().startsWith('en');

  if (source === 'tourapi') {
    const photographerHref = appendGateoReferralUtm(
      typeof image?.links?.html === 'string' && image.links.html.trim()
        ? image.links.html
        : KTO_HOME,
    );
    const providerHref = KTO_HOME;
    const providerLabel = isKo ? '한국관광공사' : 'Korea Tourism Organization';
    return {
      kind: 'kto',
      authorName: authorName || providerLabel,
      photographerHref: photographerHref || providerHref,
      providerHref,
      providerLabel,
    };
  }

  if (source === 'pexels') {
    if (!authorName) return null;
    const photoPage =
      typeof image?.links?.html === 'string' && image.links.html.trim()
        ? image.links.html
        : PEXELS_HOME;
    return {
      kind: 'stock',
      authorName,
      photographerHref: appendGateoReferralUtm(photoPage) || PEXELS_HOME,
      providerHref: appendGateoReferralUtm(PEXELS_HOME) || PEXELS_HOME,
      provider: 'pexels',
    };
  }

  if (source === 'unsplash') {
    if (!authorName) return null;
    const profile =
      typeof image?.user?.links?.html === 'string' && image.user.links.html.trim()
        ? image.user.links.html
        : typeof image?.links?.html === 'string' && image.links.html.trim()
          ? image.links.html
          : UNSPLASH_HOME;
    return {
      kind: 'stock',
      authorName,
      photographerHref: appendGateoReferralUtm(profile) || UNSPLASH_HOME,
      providerHref: appendGateoReferralUtm(UNSPLASH_HOME) || UNSPLASH_HOME,
      provider: 'unsplash',
    };
  }

  return null;
}
