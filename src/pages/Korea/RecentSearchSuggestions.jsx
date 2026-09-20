import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, X } from 'lucide-react';
import { filterRecentSearches } from './koreaRecentSearches';

/**
 * 검색창 활성 시 최근 검색어 목록 · draft로 부분 필터.
 * 바깥 클릭으로 검색바까지 닫는 처리는 호출측(dismissSearchUi)이 담당.
 * @param {{
 *   items: string[],
 *   draft: string,
 *   visible: boolean,
 *   onSelect: (keyword: string) => void,
 *   onRemove: (keyword: string) => void,
 *   onClearAll?: () => void,
 *   className?: string,
 * }} props
 */
export default function RecentSearchSuggestions({
  items,
  draft,
  visible,
  onSelect,
  onRemove,
  onClearAll,
  className = '',
}) {
  const { t } = useTranslation();
  const filtered = useMemo(
    () => filterRecentSearches(items, draft),
    [items, draft],
  );

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label={t('korea.recentSearch.ariaLabel')}
      className={`overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-1.5">
        <span className="text-[11px] font-bold text-stone-500">
          {t('korea.recentSearch.heading')}
        </span>
        {onClearAll ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClearAll}
            className="text-[11px] font-semibold text-stone-400 hover:text-stone-700"
          >
            {t('korea.recentSearch.clearAll')}
          </button>
        ) : null}
      </div>
      <ul className="max-h-56 overflow-y-auto py-1">
        {filtered.map((keyword) => (
          <li key={keyword} className="flex items-stretch">
            <button
              type="button"
              role="option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(keyword)}
              className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm text-stone-800 hover:bg-amber-50"
            >
              <Clock
                size={14}
                className="shrink-0 text-stone-400"
                aria-hidden="true"
              />
              <span className="truncate">{keyword}</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onRemove(keyword)}
              aria-label={t('korea.recentSearch.remove', { keyword })}
              className="shrink-0 px-2.5 text-stone-400 hover:bg-stone-50 hover:text-stone-700"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
