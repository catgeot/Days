const BADGE_PREFIX = 'GATEO 리뷰어 · ';

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
