import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Landmark, Building2, Compass, Loader2 } from 'lucide-react';
import {
  fetchPlaceChatIntroSummaryForLocation,
  needsPlaceChatIntroHydration,
} from '../../lib/placeChatIntro';

const BADGE_STYLES = {
  여행지: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40',
  도시: 'bg-blue-500/25 text-blue-200 border-blue-400/40',
  명소: 'bg-amber-500/25 text-amber-200 border-amber-400/40',
  지역: 'bg-teal-500/25 text-teal-200 border-teal-400/40',
  해변: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/40',
  시장: 'bg-orange-500/25 text-orange-200 border-orange-400/40',
  사찰: 'bg-violet-500/25 text-violet-200 border-violet-400/40',
  전망: 'bg-sky-500/25 text-sky-200 border-sky-400/40',
  박물관: 'bg-rose-500/25 text-rose-200 border-rose-400/40',
  동네: 'bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-400/40',
  장소: 'bg-white/15 text-white/90 border-white/30',
};

const normalizeCompare = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·・.,]/g, '');

/** 위치 줄: 이름에 이미 포함된 상위 도시는 생략 */
function buildLocationLine(item) {
  const name = String(item?.name || '').trim();
  const parent = String(item?.parentCity || '').trim();
  const country = String(item?.country || '').trim();
  const parts = [];
  if (parent && parent !== name && !name.includes(parent)) {
    parts.push(parent);
  }
  if (country && country !== name && country !== parent) {
    parts.push(country);
  }
  return parts.join(' · ');
}

/**
 * 위치 줄·뱃지와 동일한 합성 문구면 설명란을 숨김.
 * (예: 위치「미야코지마 · 일본」+ 설명「미야코지마 · 해변」)
 */
function resolveCardDesc(item, locationLine) {
  const desc = String(item?.desc || '').trim();
  if (!desc) return '';

  const d = normalizeCompare(desc);
  if (locationLine && d === normalizeCompare(locationLine)) return '';

  const parent = String(item?.parentCity || '').trim();
  const country = String(item?.country || '').trim();
  const badge = String(item?.badge || '').trim();
  const name = String(item?.name || '').trim();

  const syntheticPairs = [
    [parent, badge],
    [parent, name],
    [parent, country],
    [parent, '지역'],
    [name, country],
    [name, badge],
  ];
  for (const [a, b] of syntheticPairs) {
    if (a && b && d === normalizeCompare(`${a} · ${b}`)) return '';
  }

  if (d === normalizeCompare(name)) return '';
  return desc;
}

function SuggestionIcon({ kind }) {
  if (kind === 'spot') return <Compass size={16} className="text-emerald-300 shrink-0" />;
  if (kind === 'city') return <Building2 size={16} className="text-blue-300 shrink-0" />;
  if (kind === 'attraction') return <Landmark size={16} className="text-amber-300 shrink-0" />;
  return <MapPin size={16} className="text-white/70 shrink-0" />;
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
    : 'w-full mb-6 rounded-2xl border border-white/20 bg-white/[0.08] overflow-hidden';

  return (
    <div className={shellClass}>
      <div
        className={`flex items-center justify-between gap-2 ${
          isPopover
            ? 'shrink-0 border-b border-white/15 px-3 py-2'
            : 'px-4 py-2.5 border-b border-white/12'
        }`}
      >
        <span className="text-[11px] text-white/75">
          {title || `'${query}' 제안`}
        </span>
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-sky-200">
            <Loader2 size={12} className="animate-spin" />
            불러오는 중
          </span>
        )}
      </div>

      {items.length === 0 && !loading ? (
        <p className={`text-sm text-white/70 text-center break-keep ${isPopover ? 'px-3 py-4' : 'px-4 py-6'}`}>
          제안이 없습니다. Enter로 AI·지도 검색을 이어갈 수 있어요.
        </p>
      ) : (
        <ul
          className={`divide-y divide-white/10 ${
            isPopover ? '' : 'max-h-[min(52vh,420px)] overflow-y-auto'
          }`}
        >
          {items.map((item) => {
            const badge = item.badge || '장소';
            const badgeClass = BADGE_STYLES[badge] || BADGE_STYLES['장소'];
            const locationLine = buildLocationLine(item);
            const desc = resolveCardDesc(item, locationLine);
            const subtitle = [locationLine, desc]
              .filter(Boolean)
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .slice(0, 2)
              .join(' · ');

            return (
              <li key={item.id || `${item.name}-${item.lat}`}>
                <button
                  type="button"
                  onClick={() => onSelect?.(item)}
                  className={`w-full flex items-start gap-3 text-left hover:bg-white/[0.1] transition-colors ${
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
                      <p className="mt-0.5 text-xs text-white/70 truncate break-keep">{subtitle}</p>
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
 * place_chat_intro 캐시가 있으면 빈/합성 desc를 채워 표시 (AI 호출 없음).
 */
export function SearchDisambiguationCards({
  title,
  candidates = [],
  onSelect,
  onCancel,
}) {
  const [introByKey, setIntroByKey] = useState({});

  const candidateKey = useMemo(
    () =>
      candidates
        .map((c) => `${c?.id || ''}|${c?.name || ''}|${c?.lat}|${c?.lng}`)
        .join(';'),
    [candidates]
  );

  useEffect(() => {
    let cancelled = false;
    setIntroByKey({});
    if (!candidates.length) return undefined;

    (async () => {
      const next = {};
      await Promise.all(
        candidates.map(async (item, index) => {
          if (!needsPlaceChatIntroHydration(item)) return;
          const summary = await fetchPlaceChatIntroSummaryForLocation(item);
          if (!summary) return;
          next[index] = summary;
        })
      );
      if (!cancelled) setIntroByKey(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [candidateKey, candidates]);

  if (!candidates.length) return null;

  return (
    <div className="w-full pb-16 pt-2 animate-fade-in">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white break-keep">
            {title || '원하는 장소를 선택하세요'}
          </h3>
          <p className="mt-1 text-xs text-white/70 break-keep">
            위치가 여러 곳일 수 있어요. 카드를 누르면 해당 장소로 이동합니다.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 text-xs text-white/75 hover:text-white transition-colors"
          >
            닫기
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-start">
        {candidates.map((item, index) => {
          const badge = item.badge || '장소';
          const badgeClass = BADGE_STYLES[badge] || BADGE_STYLES['장소'];
          const locationLine = buildLocationLine(item);
          const hydrated = introByKey[index]
            ? { ...item, desc: introByKey[index] }
            : item;
          const desc = resolveCardDesc(hydrated, locationLine);
          return (
            <button
              key={item.id || `${item.name}-${item.lat}`}
              type="button"
              onClick={() => onSelect?.(hydrated)}
              className="h-auto w-full rounded-2xl border border-white/25 bg-[#32281f]/95 p-4 text-left shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:border-sky-300/50 hover:bg-[#3a2f25] transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <SuggestionIcon kind={item.kind} />
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                  {badge}
                </span>
              </div>
              <div className="text-[15px] md:text-sm font-bold text-white break-keep leading-snug">{item.name}</div>
              {item.name_en && item.name_en !== item.name ? (
                <div className="mt-1 text-[13px] text-white/90 leading-snug">{item.name_en}</div>
              ) : null}
              {locationLine ? (
                <div className="mt-2 text-[13px] text-amber-50/80 break-keep">{locationLine}</div>
              ) : null}
              {desc ? (
                <p className="mt-2.5 text-[13px] md:text-sm leading-[1.55] text-amber-50/90 break-keep whitespace-normal">
                  {desc}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SearchSuggestionList;
