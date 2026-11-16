/** Snippet length for crawler meta description (place intro). */
export const META_DESCRIPTION_MIN = 120;
export const META_DESCRIPTION_MAX = 155;

const SENTENCE_END = '.!?。！？';

const SYNTHETIC_EN_PLACE_INTRO =
  /^Discover\s+.+\s+—\s+(?:a|an)\s+(?:beach and island getaway|cultural heritage destination|city travel guide|nature and wildlife destination|adventure travel destination|travel destination)\s+with photos, videos, and trip planning on GATEO\.?$/;

/**
 * Generated EN filler when a place has no English intro.
 * Same sentence `buildSyntheticPlaceDescEn` writes into gallery meta.
 */
export function isSyntheticEnglishPlaceIntro(text) {
  return SYNTHETIC_EN_PLACE_INTRO.test(String(text || '').trim());
}

export function stripHtmlAndMarkdown(value) {
  let s = String(value ?? '');
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/!\[[^\]]*]\([^)]*\)/g, ' ');
  s = s.replace(/\[([^\]]+)]\([^)]*\)/g, '$1');
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/&nbsp;/gi, ' ');
  s = s.replace(/&quot;/gi, '"');
  s = s.replace(/&#34;/g, '"');
  s = s.replace(/&#39;|&apos;/gi, "'");
  s = s.replace(/&lt;/gi, '<');
  s = s.replace(/&gt;/gi, '>');
  s = s.replace(/&amp;/gi, '&');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s+([.,!?;:])/g, '$1');
  return s;
}

function lastSentenceEnd(text, min, max) {
  const limit = Math.min(text.length, max);
  for (let i = limit - 1; i >= 0; i -= 1) {
    const ch = text[i];
    if (!SENTENCE_END.includes(ch)) continue;
    const next = text[i + 1];
    if (next != null && !/\s/.test(next)) continue;
    const end = i + 1;
    if (end >= min && end <= max) return end;
    if (end < min) return -1;
  }
  return -1;
}

function tidyWordCut(cut) {
  let s = String(cut || '')
    .trim()
    .replace(/[,:;·\-–—]+$/u, '')
    .trim();
  s = s.replace(/\s+(?:and|or|the|a|an|with|for|of|to|in|on|&)$/i, '').trim();
  s = s.replace(/[,:;·\-–—]+$/u, '').trim();
  return s;
}

function cutAtWordBoundary(text, max) {
  const limit = Math.min(max, text.length);
  for (let i = limit; i >= 0; i -= 1) {
    if (i < text.length && !/\s/.test(text[i])) continue;
    const cut = tidyWordCut(text.slice(0, i));
    if (cut) return cut;
  }
  return text.slice(0, limit).trim();
}

/**
 * Trim visible text to about 120–155 characters.
 * Shorter text is kept whole. Longer text prefers a sentence end inside the
 * window, then the last whitespace so a word is not cut in half.
 */
export function trimMetaDescription(
  value,
  { min = META_DESCRIPTION_MIN, max = META_DESCRIPTION_MAX } = {},
) {
  const clean = stripHtmlAndMarkdown(value);
  if (!clean || clean.length <= max) return clean;
  const sentenceEnd = lastSentenceEnd(clean, min, max);
  if (sentenceEnd > 0) return clean.slice(0, sentenceEnd).trim();
  return cutAtWordBoundary(clean, max);
}

function galleryIntroLead(placeName, locale) {
  const name = String(placeName || '').trim();
  if (!name) return '';
  if (locale === 'en') return `Browse ${name} travel photos and gallery images.`;
  return `${name} 여행 사진과 갤러리.`;
}

/**
 * City intro already baked into gallery crawler description
 * (`{lead} {intro}`), the same source /place/fez/gallery serves.
 * Returns '' when that intro is missing or is the synthetic EN filler.
 */
export function extractCityIntroFromGalleryDescription(description, placeName, locale) {
  const loc = locale === 'en' ? 'en' : 'ko';
  const text = String(description || '').trim();
  const lead = galleryIntroLead(placeName, loc);
  if (!lead || !text.startsWith(lead)) return '';
  const intro = stripHtmlAndMarkdown(text.slice(lead.length));
  if (!intro) return '';
  if (loc === 'en' && isSyntheticEnglishPlaceIntro(intro)) return '';
  return intro;
}

export function placeBaseFallbackDescription(placeName, locale) {
  const name = String(placeName || '').trim();
  if (locale === 'en') {
    return `Plan ${name}: sights, a trip planner, and an AI docent on GATEO.`;
  }
  return `${name} 여행. 명소, 플래너, AI 도슨트를 GATEO에서 확인하세요.`;
}

export function buildPlaceBaseDescription({ placeName, galleryDescription, locale }) {
  const loc = locale === 'en' ? 'en' : 'ko';
  const intro = extractCityIntroFromGalleryDescription(galleryDescription, placeName, loc);
  if (!intro) return placeBaseFallbackDescription(placeName, loc);
  return trimMetaDescription(intro) || placeBaseFallbackDescription(placeName, loc);
}
