import React from 'react';

export const GATEO_REVIEWER_PHOTO_BADGE_TEST_ID = 'logbook-official-review-hub-card-reviewer';

export function GateoReviewerPhotoBadge({
  label,
  testId = GATEO_REVIEWER_PHOTO_BADGE_TEST_ID,
  className = '',
}) {
  if (!label) return null;
  return (
    <span
      className={`pointer-events-none absolute top-2 right-2 z-[2] max-w-[calc(100%-3rem)] rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold leading-tight text-white line-clamp-2 break-keep shadow-sm backdrop-blur-[2px] ${className}`.trim()}
      data-testid={testId}
    >
      {label}
    </span>
  );
}