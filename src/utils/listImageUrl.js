/**
 * List/thumbnail image URLs — keep detail/hero on full resolution.
 */

const VISITKOREA_HOSTS = ['tong.visitkorea.or.kr', 'cdn.visitkorea.or.kr'];

function isVisitKoreaHost(hostname) {
  return VISITKOREA_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
}

/**
 * @param {string | null | undefined} url
 * @param {{ role?: 'list' | 'hero', width?: number }} [opts]
 * @returns {string}
 */
export function resolveListImageUrl(url, opts = {}) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  const role = opts.role || 'list';
  if (role === 'hero') return raw;

  const maxWidth = opts.width ?? 192;

  try {
    const parsed = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
    if (isVisitKoreaHost(parsed.hostname)) {
      // CMS: _image2_1 is ~940px; _image1_1 is a smaller variant on the same asset.
      if (/_image2_1\.(jpe?g|png|webp)$/i.test(parsed.pathname)) {
        parsed.pathname = parsed.pathname.replace(
          /_image2_1\.(jpe?g|png|webp)$/i,
          '_image1_1.$1',
        );
        return parsed.toString();
      }
    }
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
