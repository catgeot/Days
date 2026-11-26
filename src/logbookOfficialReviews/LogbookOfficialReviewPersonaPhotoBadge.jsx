import React from 'react';

export const LOGBOOK_OFFICIAL_REVIEW_PERSONA_PHOTO_BADGE_CLASS =
  'pointer-events-none absolute top-2 right-2 z-[2] max-w-[calc(100%-1rem)] rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold leading-tight text-white line-clamp-2 break-keep';

export function LogbookOfficialReviewPersonaPhotoBadge({
  children,
  className = '',
  testId = 'logbook-official-review-hub-card-reviewer',
}) {
  if (children == null || children === '') return null;
  return (
    <span
      className={`${LOGBOOK_OFFICIAL_REVIEW_PERSONA_PHOTO_BADGE_CLASS}${className ? ` ${className}` : ''}`}
      data-testid={testId}
    >
      {children}
    </span>
  );
}