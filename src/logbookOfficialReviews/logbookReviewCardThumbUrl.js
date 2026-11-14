/**
 * Card-grid thumb URLs — Wikimedia originals are rewritten to /thumb/…/{N}px-…
 * Other hosts unchanged unless Unsplash already has imgix-style query params.
 */

const WIKIMEDIA_HOST = 'upload.wikimedia.org';
/** Some originals reject thumbs below 960 (e.g. 26MB Rome JPEG). */
const WIKI_CARD_SRC_WIDTH = 960;
const WIKI_CARD_SRCSET_WIDTH = 1280;

/**
 * @param {string} src
 * @param {number} widthPx
 * @returns {string|null}
 */
export function wikimediaCommonsCardThumbUrl(src, widthPx) {
  const raw = String(src || '').trim();
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.hostname !== WIKIMEDIA_HOST) return null;
  const path = parsed.pathname;
  if (path.includes('/wikipedia/commons/thumb/')) return raw;

  const match = path.match(/^\/wikipedia\/commons\/([^/])\/([^/]{2})\/(.+)$/i);
  if (!match) return null;
  const [, h1, h2, filePart] = match;
  const fileName = filePart.includes('/') ? filePart.slice(filePart.lastIndexOf('/') + 1) : filePart;
  const pxLabel = `${widthPx}px-${fileName}`;
  parsed.pathname = `/wikipedia/commons/thumb/${h1}/${h2}/${filePart}/${pxLabel}`;
  return parsed.toString();
}

const UNSPLASH_IMGIX_KEYS = new Set(['w', 'h', 'fit', 'q', 'auto', 'fm', 'crop']);

function unsplashHasImgixParams(searchParams) {
  for (const key of searchParams.keys()) {
    if (UNSPLASH_IMGIX_KEYS.has(key)) return true;
  }
  return false;
}

/**
 * @param {string} src
 * @returns {{ src: string|null, srcSet: string|null, sizes: string|null }}
 */
export function optimizeLogbookReviewCardThumbUrl(src) {
  const raw = String(src || '').trim();
  if (!raw) return { src: null, srcSet: null, sizes: null };

  const wikiSrc = wikimediaCommonsCardThumbUrl(raw, WIKI_CARD_SRC_WIDTH);
  if (wikiSrc) {
    const wikiHi = wikimediaCommonsCardThumbUrl(raw, WIKI_CARD_SRCSET_WIDTH);
    const srcSet = wikiHi ? `${wikiSrc} ${WIKI_CARD_SRC_WIDTH}w, ${wikiHi} ${WIKI_CARD_SRCSET_WIDTH}w` : null;
    return {
      src: wikiSrc,
      srcSet,
      sizes: srcSet ? '(min-width: 1280px) 400px, 50vw' : null,
    };
  }

  if (raw.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(raw);
      if (unsplashHasImgixParams(parsed.searchParams)) {
        parsed.searchParams.set('w', '640');
        parsed.searchParams.set('q', '70');
        return { src: parsed.toString(), srcSet: null, sizes: null };
      }
    } catch {
      /* keep raw */
    }
  }

  return { src: raw, srcSet: null, sizes: null };
}