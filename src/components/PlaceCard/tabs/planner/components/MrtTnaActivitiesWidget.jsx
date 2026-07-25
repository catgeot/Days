import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import {
  buildMrtTnaProductUrl,
  buildMrtTnaSearchMoreUrl,
  fetchMrtTnasForLocation,
  MRT_TNA_FETCH_SIZE,
  MRT_TNA_PLANNER_SIZE,
  resolveMrtTnaQuery,
} from '../../../../../utils/fetchMrtTnas';

function formatPrice(item) {
  if (item?.priceDisplay) return String(item.priceDisplay);
  const n = Number(item?.salePrice);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${n.toLocaleString('ko-KR')}원`;
}

function TnaCard({ item, size = 'md', theme = 'dark' }) {
  const large = size === 'lg';
  const light = theme === 'light';
  const href = buildMrtTnaProductUrl(item);
  const price = formatPrice(item);

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
        } ${large ? 'h-[96px]' : 'h-[72px]'}`}
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

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setItems([]);
    setKeywordUsed(query.keyword);

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

  if (status === 'loading' || status === 'idle') {
    return (
      <div
        className={`flex items-center justify-center gap-2 ${
          planner ? 'min-h-[120px] text-sm text-gray-500' : 'min-h-[200px] text-sm text-orange-100/80'
        }`}
      >
        <Loader2 size={18} className="animate-spin shrink-0" aria-hidden="true" />
        <span className="break-keep">투어·티켓을 불러오는 중입니다…</span>
      </div>
    );
  }

  if (status === 'error' || empty) {
    return (
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
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={
          planner
            ? 'grid grid-cols-1 gap-2 sm:grid-cols-3'
            : 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        }
      >
        {items.map((item) => (
          <TnaCard
            key={item.gid || item.productUrl}
            item={item}
            size={planner ? 'md' : 'lg'}
            theme={theme}
          />
        ))}
      </div>
      {showMoreLink ? (
        <div className="flex flex-col items-center gap-1 pt-1">
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
