import React from 'react';
import {
  editorialLogbookBadgeLabel,
  editorialLogbookBadgeLocale,
  editorialLogbookSecondaryNotice,
} from '../../../utils/logbookEditorial';

const chipClassName =
  'inline-flex items-center text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-200/90 px-2 py-0.5 rounded-full leading-snug';

export default function EditorialLogbookBadge({ report, variant = 'feed', className = '' }) {
  const badgeLocale = editorialLogbookBadgeLocale(report);
  const primary = editorialLogbookBadgeLabel(badgeLocale);

  if (variant === 'detail') {
    const secondary = editorialLogbookSecondaryNotice(badgeLocale);
    return (
      <div className={`flex flex-col gap-1 ${className}`.trim()}>
        <span className={chipClassName}>{primary}</span>
        <p className="text-[11px] text-gray-500 leading-snug">{secondary}</p>
      </div>
    );
  }

  return <span className={`${chipClassName} ${className}`.trim()}>{primary}</span>;
}
