import { resolveListImageUrl } from '../../utils/listImageUrl.js';
import { normalizeFestivalItemImages } from './socialPromoFestivalsLogic.js';

/**
 * List/promo thumbnail src — normalizes TourAPI fields and http(s) for <img>.
 * @param {Record<string, unknown> | null | undefined} item
 */
export function festivalItemThumbSrc(item) {
  if (!item) return '';
  const normalized = normalizeFestivalItemImages(item);
  const raw =
    normalized.firstimage ||
    normalized.imageUrl ||
    normalized.firstimage2 ||
    '';
  return resolveListImageUrl(raw, { role: 'list' }) || '';
}
