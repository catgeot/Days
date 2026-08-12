import React, { useEffect, useMemo } from 'react';
import { Clock, X } from 'lucide-react';
import { filterRecentSearches } from './koreaRecentSearches';

/**
 * 검색창 활성 시 최근 검색어 목록 · draft로 부분 필터.
 * 검색 루트 밖(칩·빈 영역) pointerdown 시 onRequestClose.
 * @param {{
 *   items: string[],
 *   draft: string,
 *   visible: boolean,
 *   onSelect: (keyword: string) => void,
 *   onRemove: (keyword: string) => void,
 *   onClearAll?: () => void,
 *   onRequestClose?: () => void,
 *   rootRef?: { current: HTMLElement | null },
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
  onRequestClose,
  rootRef,
  className = '',
}) {
  const filtered = useMemo(
    () => filterRecentSearches(items, draft),
    [items, draft],
  );

  useEffect(() => {
    if (!visible || !onRequestClose) return undefined;
    const handlePointerDown = (e) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      const root = rootRef?.current;
      if (root && root.contains(target)) return;
      onRequestClose();
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [visible, onRequestClose, rootRef]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="최근 검색어"
      className={`overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-1.5">
        <span className="text-[11px] font-bold text-stone-500">최근 검색</span>
        {onClearAll ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClearAll}
            className="text-[11px] font-semibold text-stone-400 hover:text-stone-700"
          >
            전체 지우기
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
              aria-label={`${keyword} 최근 검색에서 삭제`}
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
