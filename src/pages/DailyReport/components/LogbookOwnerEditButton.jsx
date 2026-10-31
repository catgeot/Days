import React from 'react';
import { Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function LogbookOwnerEditButton({ reportId, className = '' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!reportId) return null;

  return (
    <button
      type="button"
      data-logbook-owner-edit
      onClick={() => navigate(`/blog/write/${reportId}`)}
      className={`flex items-center gap-1.5 bg-gray-50 backdrop-blur-md text-gray-600 px-3 sm:px-4 py-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200 text-sm font-medium ${className}`.trim()}
    >
      <Edit size={16} aria-hidden />
      <span className="hidden sm:inline">{t('logbook.detail.edit')}</span>
    </button>
  );
}
