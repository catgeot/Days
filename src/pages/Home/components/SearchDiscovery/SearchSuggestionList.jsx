import React from 'react';
import { MapPin, Landmark, Building2, Compass, Loader2 } from 'lucide-react';

const BADGE_STYLES = {
  여행지: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  도시: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  명소: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  해변: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  시장: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  사찰: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  전망: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
  박물관: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  동네: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
  장소: 'bg-white/10 text-gray-300 border-white/15',
};

function SuggestionIcon({ kind }) {
  if (kind === 'spot') return <Compass size={16} className="text-emerald-400 shrink-0" />;
  if (kind === 'city') return <Building2 size={16} className="text-blue-400 shrink-0" />;
  if (kind === 'attraction') return <Landmark size={16} className="text-amber-400 shrink-0" />;
  return <MapPin size={16} className="text-gray-400 shrink-0" />;
}

/**
 * 타이핑 제안 리스트 (검색사이트형)
 * @param {'panel' | 'popover'} [variant] — popover는 검색바 드롭다운용
 */
export function SearchSuggestionList({
  items = [],
  loading = false,
  query = '',
  onSelect,
  title,
  variant = 'panel',
}) {
  if (!query.trim()) return null;

  const isPopover = variant === 'popover';
  const shellClass = isPopover
    ? 'w-full overflow-hidden'
    : 'w-full mb-6 rounded-2xl border border-white/[0.1] bg-white/[0.03] overflow-hidden';

  return (
    <div className={shellClass}>
      <div
        className={`flex items-center justify-between gap-2 ${
          isPopover
            ? 'shrink-0 border-b border-white/[0.08] px-3 py-2'
            : 'px-4 py-2.5 border-b border-white/[0.06]'
        }`}
      >
        <span className="text-[11px] text-gray-400">
          {title || `'${query}' 제안`}
        </span>
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-300/80">
            <Loader2 size={12} className="animate-spin" />
            불러오는 중
          </span>
        )}
      </div>

      {items.length === 0 && !loading ? (
        <p className={`text-sm text-gray-500 text-center break-keep ${isPopover ? 'px-3 py-4' : 'px-4 py-6'}`}>
          제안이 없습니다. Enter로 AI·지도 검색을 이어갈 수 있어요.
        </p>
      ) : (
        <ul
          className={`divide-y divide-white/[0.05] ${
            isPopover ? '' : 'max-h-[min(52vh,420px)] overflow-y-auto'
          }`}
        >
          {items.map((item) => {
            const badge = item.badge || '장소';
            const badgeClass = BADGE_STYLES[badge] || BADGE_STYLES['장소'];
            const subtitle = [item.parentCity, item.country, item.desc]
              .filter(Boolean)
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .slice(0, 2)
              .join(' · ');

            return (
              <li key={item.id || `${item.name}-${item.lat}`}>
                <button
                  type="button"
                  onClick={() => onSelect?.(item)}
                  className={`w-full flex items-start gap-3 text-left hover:bg-white/[0.06] transition-colors ${
                    isPopover ? 'px-3 py-2.5' : 'px-4 py-3'
                  }`}
                >
                  <div className="mt-0.5">
                    <SuggestionIcon kind={item.kind} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">{item.name}</span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                        {badge}
                      </span>
                    </div>
                    {subtitle ? (
                      <p className="mt-0.5 text-xs text-gray-500 truncate break-keep">{subtitle}</p>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Enter 후 모호함 해소용 선택 카드
 */
export function SearchDisambiguationCards({
  title,
  candidates = [],
  onSelect,
  onCancel,
}) {
  if (!candidates.length) return null;

  return (
    <div className="w-full pb-16 pt-2 animate-fade-in">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white break-keep">
            {title || '원하는 장소를 선택하세요'}
          </h3>
          <p className="mt-1 text-xs text-gray-500 break-keep">
            위치가 여러 곳일 수 있어요. 카드를 누르면 해당 장소로 이동합니다.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 text-xs text-gray-400 hover:text-white transition-colors"
          >
            닫기
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {candidates.map((item) => {
          const badge = item.badge || '장소';
          const badgeClass = BADGE_STYLES[badge] || BADGE_STYLES['장소'];
          return (
            <button
              key={item.id || `${item.name}-${item.lat}`}
              type="button"
              onClick={() => onSelect?.(item)}
              className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4 text-left hover:border-blue-400/40 hover:bg-white/[0.07] transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <SuggestionIcon kind={item.kind} />
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                  {badge}
                </span>
              </div>
              <div className="text-sm font-bold text-white break-keep">{item.name}</div>
              {item.name_en && item.name_en !== item.name ? (
                <div className="mt-0.5 text-xs text-gray-500">{item.name_en}</div>
              ) : null}
              <div className="mt-2 text-xs text-gray-400 break-keep">
                {[item.parentCity, item.country].filter(Boolean).join(' · ')}
              </div>
              {item.desc ? (
                <p className="mt-2 text-[11px] text-gray-500 line-clamp-2 break-keep">{item.desc}</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SearchSuggestionList;
