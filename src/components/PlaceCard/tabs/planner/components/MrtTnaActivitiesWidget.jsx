import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ExternalLink, LayoutGrid, Loader2 } from 'lucide-react';
import {
  buildMrtTnaProductUrl,
  buildMrtTnaSearchMoreUrl,
  fetchMrtTnasForLocation,
  isMrtTnaNearbyKeyword,
  MRT_TNA_FETCH_SIZE,
  MRT_TNA_PLANNER_SIZE,
  resolveMrtTnaQuery,
} from '../../../../../utils/fetchMrtTnas';

const LG_MQ = '(min-width: 1024px)';

const TOUR_SORT_OPTIONS = [
  { id: 'recommended', label: '추천순' },
  { id: 'price_asc', label: '낮은 가격순' },
  { id: 'price_desc', label: '높은 가격순' },
  { id: 'rating_desc', label: '평점 높은순' },
];

function useIsLg() {
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LG_MQ).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(LG_MQ);
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return isLg;
}

function salePriceNum(item) {
  const n = Number(item?.salePrice);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function reviewScoreNum(item) {
  const n = Number(item?.reviewScore);
  return Number.isFinite(n) ? n : -1;
}

function sortTourItems(list, sortMode) {
  const arr = Array.isArray(list) ? list.slice() : [];
  if (sortMode === 'price_asc') {
    arr.sort((a, b) => {
      const pa = salePriceNum(a);
      const pb = salePriceNum(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pa - pb;
    });
    return arr;
  }
  if (sortMode === 'price_desc') {
    arr.sort((a, b) => {
      const pa = salePriceNum(a);
      const pb = salePriceNum(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pb - pa;
    });
    return arr;
  }
  if (sortMode === 'rating_desc') {
    arr.sort((a, b) => reviewScoreNum(b) - reviewScoreNum(a));
    return arr;
  }
  return arr;
}

function formatPrice(item) {
  if (item?.priceDisplay) return String(item.priceDisplay);
  const n = Number(item?.salePrice);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${n.toLocaleString('ko-KR')}원`;
}

function TnaCard({ item, size = 'md', theme = 'dark', imageClassName }) {
  const large = size === 'lg';
  const light = theme === 'light';
  const href = buildMrtTnaProductUrl(item);
  const price = formatPrice(item);
  const imgH = imageClassName || (large ? 'h-[96px]' : 'h-[72px]');

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      draggable={false}
      className={
        light
          ? 'rounded-xl border border-orange-200 bg-white overflow-hidden transition-colors hover:border-orange-300 hover:shadow-sm'
          : 'rounded-2xl border border-orange-400/30 bg-orange-500/10 overflow-hidden transition-colors hover:border-orange-300/45 hover:bg-orange-500/20'
      }
    >
      <div
        className={`relative w-full pointer-events-none ${
          light ? 'bg-gray-50' : 'bg-white/5'
        } ${imgH}`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${
              light ? 'text-gray-300' : 'text-white/30'
            } ${large ? 'text-xs' : 'text-[10px]'}`}
          >
            No image
          </div>
        )}
      </div>
      <div className={`pointer-events-none ${large ? 'space-y-1 p-2.5' : 'space-y-0.5 p-2'}`}>
        {item.category ? (
          <p
            className={`truncate ${
              light ? 'text-orange-600/80' : 'text-orange-100/70'
            } ${large ? 'text-[11px]' : 'text-[10px]'}`}
          >
            {item.category}
          </p>
        ) : null}
        <p
          className={`line-clamp-2 break-keep font-semibold leading-snug ${
            light ? 'text-gray-800' : 'text-white'
          } ${large ? 'text-[13px]' : 'text-[11px]'}`}
        >
          {item.itemName}
        </p>
        <div className="flex min-w-0 items-center justify-between gap-1">
          {item.reviewScore != null ? (
            <span
              className={`tabular-nums ${
                light ? 'text-amber-600' : 'text-orange-100/80'
              } ${large ? 'text-xs' : 'text-[10px]'}`}
            >
              ★ {item.reviewScore}
            </span>
          ) : (
            <span />
          )}
          {price ? (
            <span
              className={`truncate font-bold tabular-nums ${
                light ? 'text-gray-700' : 'text-white/90'
              } ${large ? 'text-xs' : 'text-[10px]'}`}
            >
              {price}
            </span>
          ) : null}
        </div>
      </div>
    </a>
  );
}

function OpenTourToolbar({
  moreHref,
  count,
  sortMode,
  onSortChange,
  densityZoomed,
  onDensityToggle,
}) {
  return (
    <div className="mb-5 space-y-2.5">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-1.5 px-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {count ? (
            <p className="shrink-0 text-xs font-semibold tabular-nums text-orange-100/75">
              {count}개
            </p>
          ) : null}
          <a
            href={moreHref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex shrink-0 items-center rounded-md border border-orange-300/45 bg-orange-500/20 px-2 py-1 text-[10px] font-bold text-orange-50 hover:bg-orange-500/30 hover:border-orange-300/60 active:scale-[0.98] transition-all"
          >
            마이리얼트립에서 보기
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-pressed={densityZoomed}
            aria-label={densityZoomed ? '기본 그리드로' : '확대해서 보기'}
            title={densityZoomed ? '기본 그리드로' : '확대해서 보기'}
            onClick={(e) => {
              e.stopPropagation();
              onDensityToggle?.();
            }}
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${
              densityZoomed
                ? 'border-orange-300/50 bg-orange-500/30 text-orange-50'
                : 'border-white/12 bg-black/40 text-orange-100/70 hover:border-orange-300/35 hover:bg-white/5 hover:text-orange-50'
            }`}
          >
            <LayoutGrid size={14} strokeWidth={2.25} aria-hidden="true" />
          </button>
          <label className="relative flex shrink-0 items-center">
            <span className="sr-only">투어 정렬</span>
            <ArrowUpDown
              size={11}
              className="pointer-events-none absolute left-1.5 text-orange-200/70"
              aria-hidden="true"
            />
            <select
              value={sortMode}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                onSortChange?.(e.target.value);
              }}
              className="appearance-none rounded-md border border-white/12 bg-black/40 py-1 pl-5 pr-5 text-[10px] font-semibold text-orange-50 outline-none hover:border-orange-300/35 focus:border-orange-300/50"
            >
              {TOUR_SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-zinc-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="rounded-2xl border border-orange-400/25 bg-orange-500/10 px-3 py-2.5">
        <p className="text-center text-sm font-semibold leading-snug text-orange-100/80 break-keep">
          현지에서 즐길 투어·액티비티를 골라보세요
        </p>
      </div>
    </div>
  );
}

/**
 * 국내 TNA 투어·티켓 목록 — Edge fetch-mrt-tnas.
 * @param {{ location: object, variant?: 'open'|'planner', itemCount?: number, showMoreLink?: boolean, linkSponsoredLabel?: boolean }} props
 */
export default function MrtTnaActivitiesWidget({
  location,
  variant = 'open',
  itemCount,
  showMoreLink = true,
  linkSponsoredLabel = false,
}) {
  const planner = variant === 'planner';
  const theme = planner ? 'light' : 'dark';
  const isLg = useIsLg();
  const limit = Math.max(
    1,
    Number(itemCount) || (planner ? MRT_TNA_PLANNER_SIZE : MRT_TNA_FETCH_SIZE),
  );
  const query = useMemo(
    () => resolveMrtTnaQuery(location),
    [
      location?.slug,
      location?.name,
      location?.name_en,
      location?.name_ko,
      location?.parentCity,
      location?.originalQuery,
    ],
  );
  const placeKey = `${location?.slug || ''}|${query.keyword}|${(query.altKeywords || []).join(',')}`;

  const [status, setStatus] = useState('idle');
  const [items, setItems] = useState([]);
  const [keywordUsed, setKeywordUsed] = useState(query.keyword);
  const [sortMode, setSortMode] = useState('recommended');
  const [densityZoomed, setDensityZoomed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setItems([]);
    setKeywordUsed(query.keyword);
    setSortMode('recommended');
    setDensityZoomed(false);

    (async () => {
      const result = await fetchMrtTnasForLocation(location, { size: limit });
      if (cancelled) return;
      if (!result) {
        setStatus('error');
        return;
      }
      setItems(Array.isArray(result.items) ? result.items.slice(0, limit) : []);
      setKeywordUsed(result.keywordUsed || query.keyword);
      setStatus('ok');
    })();

    return () => {
      cancelled = true;
    };
  }, [placeKey, limit]);

  const moreHref = buildMrtTnaSearchMoreUrl(keywordUsed || query.keyword);
  const empty = status === 'ok' && items.length === 0;
  const nearbyExpand = isMrtTnaNearbyKeyword(location, keywordUsed);
  const sortedItems = useMemo(
    () => sortTourItems(items, sortMode),
    [items, sortMode],
  );

  const openToolbar =
    !planner ? (
      <OpenTourToolbar
        moreHref={moreHref}
        count={status === 'ok' ? sortedItems.length : 0}
        sortMode={sortMode}
        onSortChange={setSortMode}
        densityZoomed={densityZoomed}
        onDensityToggle={() => setDensityZoomed((v) => !v)}
      />
    ) : null;

  if (status === 'loading' || status === 'idle') {
    return (
      <div>
        {openToolbar}
        <div
          className={`flex items-center justify-center gap-2 ${
            planner ? 'min-h-[120px] text-sm text-gray-500' : 'min-h-[200px] text-sm text-orange-100/80'
          }`}
        >
          <Loader2 size={18} className="animate-spin shrink-0" aria-hidden="true" />
          <span className="break-keep">투어·티켓을 불러오는 중입니다…</span>
        </div>
      </div>
    );
  }

  if (status === 'error' || empty) {
    return (
      <div>
        {openToolbar}
        <div
          className={`flex flex-col items-center justify-center gap-3 text-center ${
            planner ? 'min-h-[120px] px-2 py-4' : 'min-h-[200px] px-4 py-8'
          }`}
        >
          <p
            className={`text-sm break-keep ${
              planner ? 'text-gray-600' : 'text-white/75'
            }`}
          >
            {status === 'error'
              ? '투어 목록을 불러오지 못했습니다.'
              : '이 지역에 맞는 투어·티켓을 찾지 못했습니다.'}
          </p>
          <a
            href={moreHref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={
              planner
                ? 'inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100'
                : 'inline-flex items-center gap-1.5 rounded-xl border border-orange-300/40 bg-orange-500/25 px-3 py-2 text-sm font-semibold text-orange-50 hover:bg-orange-500/35'
            }
          >
            마이리얼트립에서 검색
            <ExternalLink size={14} className="shrink-0" aria-hidden="true" />
          </a>
          {linkSponsoredLabel ? (
            <p className={`text-[10px] ${planner ? 'text-gray-400' : 'text-white/40'}`}>
              Sponsored
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const openGridClass = densityZoomed
    ? isLg
      ? 'grid grid-cols-3 gap-2.5'
      : 'grid grid-cols-1 gap-2.5'
    : 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4';
  const openImageClass = densityZoomed
    ? isLg
      ? 'h-[140px]'
      : 'h-[180px]'
    : 'h-[110px]';

  return (
    <div className="space-y-4">
      {openToolbar}
      {nearbyExpand ? (
        <div
          className={`rounded-xl px-3 py-2.5 text-center break-keep ${
            planner
              ? 'border border-orange-200/80 bg-orange-50/90'
              : 'border border-orange-300/25 bg-orange-500/15'
          }`}
        >
          <p
            className={`text-[13px] font-semibold leading-snug ${
              planner ? 'text-orange-900' : 'text-orange-50'
            }`}
          >
            인근 {keywordUsed} 투어를 보여드려요
          </p>
          <p
            className={`mt-1 text-[12px] leading-relaxed ${
              planner ? 'text-orange-800/75' : 'text-orange-100/80'
            }`}
          >
            이 명소 전용 상품이 거의 없어 가까운 여행지 목록으로 안내합니다
          </p>
        </div>
      ) : null}
      <div
        className={
          planner ? 'grid grid-cols-1 gap-2 sm:grid-cols-3' : openGridClass
        }
      >
        {sortedItems.map((item) => (
          <TnaCard
            key={item.gid || item.productUrl}
            item={item}
            size={planner ? 'md' : 'lg'}
            theme={theme}
            imageClassName={planner ? undefined : openImageClass}
          />
        ))}
      </div>
      {showMoreLink ? (
        <div className="flex flex-col items-center gap-1.5 pt-8 pb-4 mt-3">
          <a
            href={moreHref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={
              planner
                ? 'inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800 underline-offset-2 hover:underline'
                : 'inline-flex items-center gap-1.5 text-sm font-semibold text-orange-100/90 hover:text-orange-50 underline-offset-2 hover:underline'
            }
          >
            마이리얼트립에서 더보기
            <ExternalLink size={14} className="shrink-0" aria-hidden="true" />
          </a>
          {linkSponsoredLabel ? (
            <p className={`text-[10px] ${planner ? 'text-gray-400' : 'text-white/40'}`}>
              Sponsored
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
