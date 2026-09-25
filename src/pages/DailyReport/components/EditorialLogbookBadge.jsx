import React from 'react';
import { Lock } from 'lucide-react';
import { editorialLogbookDisclosure } from '../../../utils/logbookEditorial';

export default function EditorialLogbookBadge({ report, className = '' }) {
  const text = editorialLogbookDisclosure(report);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md leading-snug ${className}`}
    >
      <Lock size={12} className="shrink-0 text-indigo-700" aria-hidden />
      <span>{text}</span>
    </span>
  );
}
