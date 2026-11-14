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
 * @param {{ eventStartDate?: string, eventStartdate?: string, eventstartdate?: string }} fields
 * @returns {number | null}
 */
export function festivalEditionYearFromEventFields(fields = {}) {
  const raw = fields.eventStartDate || fields.eventstartdate || fields.eventStartdate;
  return festivalEditionYearFromStart(raw);
}

/**
 * @param {{ caption?: string }} slide
 * @returns {boolean}
 */
export function isFestivalPosterCaption(slide = {}) {
  const cap = String(slide.caption || '').trim().toLowerCase();
  return /포스터/.test(cap) || /\bposter\b/.test(cap);
}

/**
 * When TourAPI omits a year on common.firstimage but ships a dated current poster slide, treat the common hero as prior.
 * @param {{
 *   posterYear?: number | null,
 *   festivalYear?: number | null,
 *   activeUrl?: string,
 *   commonFirstImage?: string,
 *   slides?: { url?: string, caption?: string }[],
 * }} args
 */
export function shouldMarkPriorEditionPosterMeta({
  posterYear = null,
  festivalYear = null,
  activeUrl = '',
  commonFirstImage = '',
  slides = [],
} = {}) {
  if (isPriorEditionPoster(posterYear, festivalYear)) return true;
  if (!Number.isFinite(festivalYear) || posterYear != null) return false;
  const active = String(activeUrl || '').trim();
  const common = String(commonFirstImage || '').trim();
  if (!active || !common || active !== common) return false;
  for (const slide of slides) {
    if (String(slide.url || '').trim() === active) continue;
    if (!isFestivalPosterCaption(slide)) continue;
    const year = detectPosterEditionYear(slide);
    if (year === festivalYear) return true;
  }
  return false;
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