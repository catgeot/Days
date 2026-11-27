import { MRT_HOME_MYLINK_ID } from '../pages/Home/data/mrtPackageThemeLinks.js';

/**
 * MRT 비항공 URL에 mylink_id · utm_source=mktpartner 를 붙입니다.
 * Empty-target home fallback stays in {@link buildMrtMylinkUrl} (affiliate.js).
 *
 * @param {string} targetUrl
 * @param {{ mylinkId?: string, utmContent?: string }} [options]
 * @returns {string}
 */
export function applyMrtMylinkParams(targetUrl, options = {}) {
  const url = new URL(targetUrl);
  const mylinkId = String(options.mylinkId ?? MRT_HOME_MYLINK_ID).trim();
  if (mylinkId) url.searchParams.set('mylink_id', mylinkId);
  url.searchParams.set('utm_source', 'mktpartner');
  const utmContent = String(options.utmContent ?? '').trim();
  if (utmContent) url.searchParams.set('utm_content', utmContent.slice(0, 100));
  return url.toString();
}
