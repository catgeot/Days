import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../../i18n/LocaleProvider';
import { koreanApiTextProps } from '../../../i18n/koreanApiText.js';
import { formatFestivalDetailDateRange } from '../festivalDateFilter.js';
import { festivalItemThumbSrc } from '../festivalListThumb.js';
import { FestivalPhotoFrame } from '../festivalPhotoFrame.js';
import { formatFestivalDistKm } from '../lib/formatFestivalDistKm.js';
import { festivalGridPlaceLabel } from '../festivalGridPlaceLabel.js';
import { isGateoFestivalDateChipEnabled } from '../../../shared/gateoFeatureFlags.js';

function FestivalGridThumbFallback() {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-stone-200 text-amber-800/40"
      aria-hidden="true"
    />
  );
}

/**
 * @param {{
 *   item: Record<string, unknown>,
 *   active?: boolean,
 *   onSelect: (item: Record<string, unknown>) => void,
 *   favorited?: boolean,
 *   onToggleFavorite?: (item: Record<string, unknown>) => void,
 *   distanceKm?: number,
 *   areaCode?: string,
 *   cityName?: string,
 * }} props
 */
export default function FestivalGridPhotoCard({
  item,
  active = false,
  onSelect,
  favorited = false,
  onToggleFavorite,
  distanceKm,
  areaCode = 'all',
  cityName = 'all',
}) {
  const { t } = useTranslation();
  const { isEnglish } = useLocale();
  const koText = koreanApiTextProps(isEnglish);
  const [urlIndex, setUrlIndex] = useState(0);

  const thumbCandidates = React.useMemo(() => {
    const primary = festivalItemThumbSrc(item);
    const extras = [
      item?.firstimage2,
      item?.imageUrl,
      item?.firstimage,
    ]
      .map((v) => String(v || '').trim())
      .filter(Boolean);
    const seen = new Set();
    const out = [];
    for (const raw of [primary, ...extras]) {
      if (!raw || seen.has(raw)) continue;
      seen.add(raw);
      out.push(raw);
    }
    return out;
  }, [item]);

  const activeUrl = thumbCandidates[urlIndex] || '';
  const range = formatFestivalDetailDateRange(
    item.eventStartDate,
    item.eventEndDate,
    undefined,
    isEnglish ? 'en' : 'ko',
  );
  const place = festivalGridPlaceLabel(item, { areaCode, cityName });
  const distanceLabel = formatFestivalDistKm(distanceKm);

  return (
    <article
      className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-colors ${
        active
          ? 'border-amber-400 ring-1 ring-amber-200'
          : 'border-stone-200 [@media(hover:hover)]:hover:border-amber-300'
      }`}
      data-festival-grid-card=""
    >
      <button
        type="button"
        data-festival-id={String(item?.contentId || '')}
        onClick={() => onSelect(item)}
        className="flex min-w-0 flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90 focus-visible:ring-offset-1"
      >
        <div className="relative aspect-[5/6] w-full overflow-hidden bg-stone-200">
          <FestivalPhotoFrame
            src={activeUrl}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            pendingShimmer={isGateoFestivalDateChipEnabled()}
            fallback={<FestivalGridThumbFallback />}
            onFailed={() => {
              if (urlIndex + 1 < thumbCandidates.length) {
                setUrlIndex((i) => i + 1);
              }
            }}
          />
          {distanceLabel ? (
            <span
              className="absolute left-2 top-2 rounded-full bg-stone-900/75 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white"
            >
              {distanceLabel}
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 px-2 pb-2 pt-1.5">
          <p
            className="text-[12px] font-bold leading-[1.28] text-stone-900 line-clamp-2 break-keep"
            {...koText}
          >
            {item.title}
          </p>
          {range ? (
            <p className="text-[11px] font-bold leading-snug text-amber-700 tabular-nums">
              {range}
            </p>
          ) : null}
          {place ? (
            <p className="text-[11px] leading-snug text-stone-500 line-clamp-1 break-keep">
              {place}
            </p>
          ) : null}
        </div>
      </button>
      {onToggleFavorite ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item);
          }}
          aria-label={
            favorited
              ? t('korea.common.favoriteRemove')
              : t('korea.common.favoriteAdd')
          }
          aria-pressed={favorited}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-stone-200/90 bg-white/95 text-stone-500 shadow-sm hover:border-amber-300 hover:bg-amber-50"
        >
          <Star
            size={15}
            className={
              favorited ? 'fill-amber-400 text-amber-500' : 'text-stone-400'
            }
            aria-hidden="true"
          />
        </button>
      ) : null}
    </article>
  );
}

export function FestivalGridSkeleton() {
  return (
    <div
      className="aspect-[5/6] animate-pulse rounded-2xl border border-stone-200 bg-stone-100"
      aria-hidden="true"
    />
  );
}
