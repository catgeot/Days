import { resolveListImageUrl } from '../../utils/listImageUrl.js';
import { normalizeFestivalItemImages } from './socialPromoFestivalsLogic.js';

/**
 * List/promo thumbnail src — normalizes TourAPI fields and http(s) for <img>.
 * @param {Record<string, unknown> | null | undefined} item
 */
export function festivalItemThumbSrc(item) {
  const urls = festivalItemThumbCandidateUrls(item);
  return urls[0] || '';
}

/**
 * Resolved list-thumb URLs (https, deduped) — same order as legacy list tries.
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {string[]}
 */
export function festivalItemThumbCandidateUrls(item) {
  if (!item) return [];
  const normalized = normalizeFestivalItemImages(item);
  const rawFields = [
    normalized.firstimage,
    normalized.imageUrl,
    normalized.firstimage2,
  ];
  const seen = new Set();
  const out = [];
  for (const raw of rawFields) {
    const resolved = resolveListImageUrl(String(raw || '').trim(), { role: 'list' });
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    out.push(resolved);
  }
  return out;
}
