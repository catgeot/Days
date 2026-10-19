import { getCollapsedPreviewText } from './placeReviewContentBlocks.js';
import { stripReviewInlineMarkdown } from './reviewInlineMarkdown.js';

const BADGE_PREFIX = 'GATEO 리뷰어 · ';
const VISIT_STORY_TITLE_MAX = 40;

/**
 * Short label for «다녀온 이야기» rows (place_reviews has no title column).
 * @param {{ content?: string, content_blocks?: unknown, is_editorial?: boolean }} review
 * @param {number} [maxLen]
 */
export function placeReviewVisitStoryDisplayTitle(review, maxLen = VISIT_STORY_TITLE_MAX) {
  const raw = getCollapsedPreviewText(review);
  const plain = stripReviewInlineMarkdown(raw).replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  if (plain.length <= maxLen) return plain;

  const slice = plain.slice(0, maxLen);
  const sentenceBreak = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('。'),
  );
  if (sentenceBreak >= Math.floor(maxLen * 0.45)) {
    const end = plain[sentenceBreak] === '。' ? sentenceBreak + 1 : sentenceBreak + 1;
    return `${plain.slice(0, end).trim()}…`;
  }

  const wordBreak = slice.lastIndexOf(' ');
  if (wordBreak >= Math.floor(maxLen * 0.35)) {
    return `${slice.slice(0, wordBreak).trim()}…`;
  }
  return `${slice.trim()}…`;
}

export function placeReviewVisibleInVisitStories(review) {
  return review?.is_public === true && Boolean(placeReviewVisitStoryDisplayTitle(review));
}

export function isUserReviewForStats(review) {
  return !review?.is_editorial;
}

export function formatGateoReviewerBadge(personaLabel) {
  let label = (personaLabel || '').trim();
  if (!label) {
    return 'GATEO 리뷰어';
  }
  if (label.startsWith(BADGE_PREFIX)) {
    label = label.slice(BADGE_PREFIX.length).trim();
  } else if (label.startsWith('GATEO 리뷰어')) {
    label = label.slice('GATEO 리뷰어'.length).replace(/^[·\s]+/, '').trim();
  }
  return label ? `${BADGE_PREFIX}${label}` : 'GATEO 리뷰어';
}
