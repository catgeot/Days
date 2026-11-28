/**
 * Poster edition year from TourAPI captions, filenames, or credits (not OCR).
 * @param {string} text
 * @returns {number[]}
 */
export function extractEditionYearsFromText(text) {
  const years = [];
  for (const m of String(text || '').matchAll(/(?<![\d])(20\d{2})(?![\d])/g)) {
    const y = Number(m[1]);
    if (y >= 2000 && y <= 2099) years.push(y);
  }
  return [...new Set(years)];
}

/**
 * @param {string | number | null | undefined} eventStartDate TourAPI YYYYMMDD
 * @returns {number | null}
 */
export function festivalEditionYearFromStart(eventStartDate) {
  const ymd = String(eventStartDate ?? '').trim();
  if (/^\d{8}$/.test(ymd)) return Number(ymd.slice(0, 4));
  const label = String(eventStartDate ?? '').match(/(20\d{2})/);
  return label ? Number(label[1]) : null;
}

/**
 * @param {{ url?: string, caption?: string, credit?: string }} meta
 * @returns {number | null}
 */
export function detectPosterEditionYear(meta = {}) {
  const captionFirst = extractEditionYearsFromText(
    `${meta.caption || ''} ${meta.credit || ''}`,
  );
  if (captionFirst.length === 1) return captionFirst[0];
  if (captionFirst.length > 1) return Math.min(...captionFirst);
  const fromUrl = extractEditionYearsFromText(meta.url || '');
  if (fromUrl.length) return Math.min(...fromUrl);
  return null;
}

/**
 * @param {number | null | undefined} posterYear
 * @param {number | null | undefined} festivalYear
 */
export function isPriorEditionPoster(posterYear, festivalYear) {
  return Number.isFinite(posterYear)
    && Number.isFinite(festivalYear)
    && posterYear < festivalYear;
}

/**
 * @param {{ eventStartDate?: string, eventStartdate?: string, eventstartdate?: string } | null | undefined} fields
 * @returns {number | null}
 */
export function festivalEditionYearFromEventFields(fields) {
  if (fields == null || typeof fields !== 'object') return null;
  const raw = fields.eventStartDate || fields.eventstartdate || fields.eventStartdate;
  return festivalEditionYearFromStart(raw);
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function hasExplicitPriorEditionMarker(text = '') {
  const raw = String(text || '');
  if (/예년/.test(raw)) return true;
  const lower = raw.toLowerCase();
  return /\bprevious\s+year\b/.test(lower)
    || /\bprior\s+(year|edition)\b/.test(lower);
}

/**
 * Prior-edition label only with positive evidence (dated caption/URL or explicit prior-year copy).
 * Yearless images are never labelled.
 * @param {{
 *   posterYear?: number | null,
 *   festivalYear?: number | null,
 *   caption?: string,
 *   credit?: string,
 * }} args
 */
export function shouldMarkPriorEditionPosterMeta({
  posterYear = null,
  festivalYear = null,
  caption = '',
  credit = '',
} = {}) {
  if (isPriorEditionPoster(posterYear, festivalYear)) return true;
  return hasExplicitPriorEditionMarker(`${caption} ${credit}`);
}

/**
 * @param {number} index
 * @param {string[]} imageUrls
 * @param {string[]} imageCaptions
 * @param {string[]} imageCredits
 */
export function festivalPosterMetaAtIndex(index, imageUrls, imageCaptions, imageCredits) {
  const i = Number.isInteger(index) && index >= 0 ? index : 0;
  return {
    url: imageUrls[i] || '',
    caption: imageCaptions[i] || '',
    credit: imageCredits[i] || '',
  };
}

export function normalizeFestivalImageUrl(url) {
  return String(url || '')
    .trim()
    .replace(/^http:\/\//i, 'https://')
    .replace(/[?#].*$/, '');
}

/**
 * OCR-only prior-edition posters (no year in TourAPI metadata). Ordering only.
 * @type {{ contentId: string, url: string, note?: string }[]}
 */
export const FESTIVAL_GALLERY_DEMOTION_ENTRIES = [
  {
    contentId: '1095732',
    url: 'https://tong.visitkorea.or.kr/cms/resource/39/4147239_image2_1.jpg',
    note:
      'TourAPI imgname says 2026; CMS asset is the printed 2025 poster (visible in lightbox).',
  },
];

const festivalGalleryDemotionUrlsById = (() => {
  const byFestival = new Map();
  for (const row of FESTIVAL_GALLERY_DEMOTION_ENTRIES) {
    const id = String(row?.contentId || '').trim();
    const url = normalizeFestivalImageUrl(row?.url);
    if (!id || !url) continue;
    let set = byFestival.get(id);
    if (!set) {
      set = new Set();
      byFestival.set(id, set);
    }
    set.add(url);
  }
  return byFestival;
})();

/**
 * @param {string} contentId
 * @param {string} url
 */
export function isFestivalGalleryDemotionListed(contentId, url) {
  const id = String(contentId || '').trim();
  if (!id) return false;
  const set = festivalGalleryDemotionUrlsById.get(id);
  if (!set?.size) return false;
  return set.has(normalizeFestivalImageUrl(url));
}

/**
 * @param {{ url?: string, caption?: string, credit?: string }} slide
 * @param {number | null | undefined} festivalYear
 * @param {string} [contentId]
 */
export function shouldDemoteFestivalGallerySlide(slide, festivalYear, contentId = '') {
  if (!slide?.url) return false;
  if (isFestivalGalleryDemotionListed(contentId, slide.url)) return true;
  const posterYear = detectPosterEditionYear({
    url: slide.url,
    caption: slide.caption || '',
    credit: slide.credit || '',
  });
  return isPriorEditionPoster(posterYear, festivalYear);
}

/**
 * Stable partition: non-dated and same-or-later edition first; prior-edition posters last.
 * @param {{ url: string, caption?: string, credit?: string }[]} slides
 * @param {{ festivalYear?: number | null, contentId?: string }} [opts]
 */
export function reorderFestivalGallerySlides(slides, opts = {}) {
  const list = Array.isArray(slides) ? slides : [];
  const festivalYear = opts.festivalYear;
  const contentId = String(opts.contentId || '').trim();
  if (!list.length) return [];
  const leading = [];
  const trailing = [];
  for (const slide of list) {
    if (shouldDemoteFestivalGallerySlide(slide, festivalYear, contentId)) {
      trailing.push(slide);
    } else {
      leading.push(slide);
    }
  }
  if (!trailing.length) return [...list];
  return [...leading, ...trailing];
}