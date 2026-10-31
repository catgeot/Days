import React from 'react';
import { Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function LogbookOwnerEditButton({ reportId, className = '' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!reportId) return null;

  const label = t('logbook.detail.edit');
  const ariaLabel = t('logbook.detail.editAria');

  return (
    <button
      type="button"
      data-logbook-owner-edit
      aria-label={ariaLabel}
      onClick={() => navigate(`/blog/write/${reportId}`)}
      className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-gray-500 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:border-gray-700 hover:bg-gray-50 ${className}`.trim()}
    >
      <Edit size={18} strokeWidth={2.25} className="shrink-0 text-gray-900" aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
