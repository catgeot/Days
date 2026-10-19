/**
 * List/thumbnail image URLs — keep detail/hero on full resolution.
 */

const VISITKOREA_HOSTS = ['tong.visitkorea.or.kr', 'cdn.visitkorea.or.kr'];

function isVisitKoreaHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  return VISITKOREA_HOSTS.some(
    (host) => h === host || h.endsWith(`.${host}`),
  );
}

/**
 * VisitKorea hotlink — no-referrer often blocks CDN; stock keeps no-referrer.
 * @param {string | null | undefined} url
 * @returns {'no-referrer' | undefined}
 */
export function resolveGalleryTileReferrerPolicy(url) {
  try {
    const host = new URL(String(url || '').trim()).hostname;
    if (isVisitKoreaHost(host)) return undefined;
  } catch {
    /* invalid url */
  }
  return 'no-referrer';
}

/**
 * @param {string | null | undefined} url
 * @param {{ role?: 'list' | 'hero', width?: number }} [opts]
 * @returns {string}
 */
export function resolveListImageUrl(url, opts = {}) {
  let raw = String(url || '').trim();
  if (!raw) return '';
  if (raw.startsWith('//')) raw = `https:${raw}`;
  else if (/^http:\/\//i.test(raw)) raw = raw.replace(/^http:\/\//i, 'https://');
  const role = opts.role || 'list';
  if (role === 'hero') return raw;

  const maxWidth = opts.width ?? 192;

  try {
    const parsed = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
    // VisitKorea CMS: keep _image2_1 for list — _image1_1 is not consistently smaller on the wire.
    if (parsed.hostname === 'images.unsplash.com') {
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', String(maxWidth));
      parsed.searchParams.set('q', '80');
      return parsed.toString();
    }
  } catch {
    return raw;
  }
  return raw;
}
