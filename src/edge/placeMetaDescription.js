/** Snippet length for crawler meta description (place intro). */
export const META_DESCRIPTION_MIN = 120;
export const META_DESCRIPTION_MAX = 155;
/** Sentence ends shorter than this are not used when a longer cut is required. */
export const META_DESCRIPTION_SENTENCE_FLOOR = 70;

const SENTENCE_END = '.!?。！？';
const ELLIPSIS = '…';

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

function isSentenceBoundary(text, index) {
  const ch = text[index];
  if (!SENTENCE_END.includes(ch)) return false;
  const next = text[index + 1];
  return next == null || /\s/.test(next);
}

/** Last `.` `!` `?` `。` (including Korean `다.` / `요.`) with length in [floor, max]. */
function lastSentenceEnd(text, floor, max) {
  const limit = Math.min(text.length, max);
  for (let i = limit - 1; i >= 0; i -= 1) {
    if (!isSentenceBoundary(text, i)) continue;
    const end = i + 1;
    if (end > max) continue;
    if (end >= floor) return end;
    return -1;
  }
  return -1;
}

function endsWithSentencePunctuation(text) {
  if (!text) return false;
  return SENTENCE_END.includes(text[text.length - 1]) || text.endsWith(ELLIPSIS);
}

function cutAtWordBoundary(text, max) {
  const limit = Math.min(max, text.length);
  for (let i = limit; i >= 0; i -= 1) {
    if (i < text.length && !/\s/.test(text[i])) continue;
    const cut = text
      .slice(0, i)
      .trim()
      .replace(/[,:;·\-–—]+$/u, '')
      .trim();
    if (cut) return cut;
  }
  return text.slice(0, limit).trim();
}

/**
 * Trim visible text to at most 155 characters.
 * Prefer the last sentence end inside the max, including one between 70 and 119.
 * If none is at least 70 characters, cut on a word boundary and append `…`.
 */
export function trimMetaDescription(
  value,
  { max = META_DESCRIPTION_MAX, sentenceFloor = META_DESCRIPTION_SENTENCE_FLOOR } = {},
) {
  const clean = stripHtmlAndMarkdown(value);
  if (!clean) return '';
  const sentenceEnd = lastSentenceEnd(clean, sentenceFloor, Math.min(clean.length, max));
  if (sentenceEnd > 0) return clean.slice(0, sentenceEnd).trim();
  if (clean.length <= max && endsWithSentencePunctuation(clean)) return clean;
  const room = max - ELLIPSIS.length;
  let cut = clean.length <= room ? clean.trim() : cutAtWordBoundary(clean, room);
  cut = cut.replace(/[,:;·\-–—]+$/u, '').trim();
  if (!cut) return ELLIPSIS;
  if (endsWithSentencePunctuation(cut)) return cut;
  return `${cut}${ELLIPSIS}`;
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
