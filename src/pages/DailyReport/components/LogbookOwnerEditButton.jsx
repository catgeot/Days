import React from 'react';
import { Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * @param {'public' | 'compact'} variant
 *   public — /p 공개 상세: 라벨 항상·44px 터치·고대비
 *   compact — /blog 내 기록 Detail: 툴바 형제 버튼과 동일(main 스타일)
 */
export default function LogbookOwnerEditButton({ reportId, className = '', variant = 'public' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!reportId) return null;

  const label = t('logbook.detail.edit');
  const ariaLabel = t('logbook.detail.editAria');
  const compact = variant === 'compact';

  const variantClass = compact
    ? 'flex shrink-0 whitespace-nowrap items-center gap-1.5 bg-gray-50 backdrop-blur-md text-gray-600 px-3 sm:px-4 py-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200 text-sm font-medium'
    : 'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-gray-500 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:border-gray-700 hover:bg-gray-50';

  return (
    <button
      type="button"
      data-logbook-owner-edit
      data-logbook-owner-edit-variant={variant}
      aria-label={ariaLabel}
      onClick={() => navigate(`/blog/write/${reportId}`)}
      className={`${variantClass} ${className}`.trim()}
    >
      <Edit
        size={compact ? 16 : 18}
        strokeWidth={compact ? 2 : 2.25}
        className={compact ? 'shrink-0 text-gray-600' : 'shrink-0 text-gray-900'}
        aria-hidden
      />
      <span className={compact ? 'hidden sm:inline' : 'whitespace-nowrap'}>{label}</span>
    </button>
  );
}
