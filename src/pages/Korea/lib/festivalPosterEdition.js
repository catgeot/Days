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