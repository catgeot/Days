import {
  getWorldEventBookingHints,
  getWorldEventDetailOverview,
  getWorldEventStayAreas,
} from './worldEvents.js';

function isEnLocale(locale) {
  return locale === 'en';
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {import('./worldEvents.js').WorldEvent} event
 * @param {string} locale
 * @param {{ showRecommendedNights?: boolean }} [opts]
 */
export function refineWorldEventDetailOverview(event, locale, opts = {}) {
  let text = getWorldEventDetailOverview(event, locale);
  if (!text || isEnLocale(locale)) return text;

  if (opts.showRecommendedNights && event.recommendedNights != null) {
    text = text
      .replace(/\s*[^.!?]*\d+\s*월\s*초[^.!?]*\d+[~\-–]\d+박[^.!?]*[.!?]?/gu, '')
      .replace(/\s*[^.!?]*\d+[~\-–]\d+박[^.!?]*[.!?]?/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  return text;
}

/**
 * @param {import('./worldEvents.js').WorldEvent} event
 * @param {string} locale
 * @param {{ hideStayAreaListing?: boolean }} [opts]
 */
export function refineWorldEventBookingHints(event, locale, opts = {}) {
  let text = getWorldEventBookingHints(event, locale);
  if (!text || isEnLocale(locale) || !opts.hideStayAreaListing) return text;

  const areas = getWorldEventStayAreas(event, locale);
  for (const area of areas) {
    const tokens = String(area.name || '')
      .split(/[·/,]/)
      .map((part) => part.trim())
      .filter(Boolean);
    for (const token of tokens) {
      if (token.length < 2) continue;
      const re = new RegExp(`(^|[·\\s—-])${escapeRegex(token)}(?=([·\\s—-]|$))`, 'gu');
      text = text.replace(re, '$1');
    }
  }

  return text
    .replace(/\s*·\s*·+/g, ' · ')
    .replace(/^\s*·\s*/, '')
    .replace(/\s*·\s*—/g, ' —')
  .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * @param {import('./worldEvents.js').WorldEvent} event
 * @param {string} locale
 * @param {{ showTypeIntro?: boolean, showRecommendedNights?: boolean, showBookingHints?: boolean }} ctx
 */
export function resolveWorldEventDetailSections(event, locale, ctx = {}) {
  const overview = refineWorldEventDetailOverview(event, locale, {
    showRecommendedNights: ctx.showRecommendedNights,
  });
  const bookingHints = refineWorldEventBookingHints(event, locale, {
    hideStayAreaListing: Boolean(ctx.hideStayAreaListing),
  });

  return {
    detailOverview: overview,
    bookingHints,
    showRecommendedNights: Boolean(ctx.showRecommendedNights && event.recommendedNights != null),
    showTypeIntro: Boolean(ctx.showTypeIntro),
    showBookingHints: Boolean(ctx.showBookingHints && bookingHints),
  };
}