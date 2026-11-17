import { resolveCityAttractionHub } from '../../Home/lib/cityAttractionHubs.js';
import { resolveFestivalThemeCrossLinks } from '../../Home/lib/koreaThemeCrossLinks.js';

/**
 * City place for a festival detail line.
 * Uses the same primary nearby hub as place↔festival cross links.
 * @param {Record<string, unknown> | null | undefined} festivalCross
 * @returns {{ slug: string } | null}
 */
export function festivalCityPlaceFromCross(festivalCross) {
  const hubId = String(festivalCross?.nearbyHubs?.[0]?.hubId || '').trim().toLowerCase();
  if (!hubId) return null;
  const hub = resolveCityAttractionHub(hubId);
  const slug = String(hub?.hubId || '').trim().toLowerCase();
  if (!slug) return null;
  return { slug };
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {{ slug: string } | null}
 */
export function resolveFestivalCityPlaceLink(item) {
  if (!item || typeof item !== 'object') return null;
  const cross = resolveFestivalThemeCrossLinks(item, {
    areaCode: item.areaCode ?? item.areacode,
  });
  return festivalCityPlaceFromCross(cross);
}

/** @param {string} slug @param {boolean} isEnglish */
export function festivalCityPlaceHref(slug, isEnglish) {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return '';
  return isEnglish ? `/place/${key}?lang=en` : `/place/${key}`;
}
