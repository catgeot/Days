import React, { useState } from 'react';
import { MapPin, UtensilsCrossed } from 'lucide-react';
import { FestivalPhotoFrame } from '../festivalPhotoFrame.js';
import { formatFestivalDistKm } from '../lib/formatFestivalDistKm.js';
import { nearbyRowThumbCandidateUrls } from '../lib/nearbySightImages.js';

/**
 * @param {{
 *   title: string,
 *   distKm?: number,
 *   subtitleLines?: string[],
 *   thumbUrls?: string[],
 *   imagePending?: boolean,
 *   onActivate?: () => void,
 *   clickable?: boolean,
 *   variant?: 'sights' | 'food',
 *   eagerImage?: boolean,
 * }} props
 */
export default function FestivalNearbyPhotoCard({
  title,
  distKm,
  subtitleLines = [],
  thumbUrls = [],
  imagePending = false,
  onActivate,
  clickable = false,
  variant = 'sights',
  eagerImage = false,
}) {
  const [urlIndex, setUrlIndex] = useState(0);
  const [photoReady, setPhotoReady] = useState(false);
  const [forceCompact, setForceCompact] = useState(false);

  const urls = thumbUrls.length ? thumbUrls : [];
  const activeUrl = !forceCompact && urlIndex < urls.length ? urls[urlIndex] : '';
  const dist = formatFestivalDistKm(distKm);
  const subtitles = subtitleLines
    .map((line) => String(line || '').trim())
    .filter(Boolean);
  const category = subtitles[0] || '';
  const showCompact = forceCompact || !activeUrl;
  const metaLine = showCompact
    ? [dist].filter(Boolean).join(' · ')
    : [dist, ...subtitles].filter(Boolean).join(' · ');
  const Tag = clickable ? 'button' : 'div';
  const tagProps = clickable
    ? {
        type: 'button',
        onClick: (event) => {
          onActivate?.();
          event.currentTarget.blur();
        },
      }
    : {};

  const cardTone = clickable
    ? 'flex h-full w-full min-w-0 flex-col rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition-colors [@media(hover:hover)]:hover:border-amber-300 [@media(hover:hover)]:hover:bg-amber-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90'
    : 'flex h-full w-full min-w-0 flex-col rounded-2xl border border-stone-200 bg-white text-left shadow-sm';

  const CategoryIcon = variant === 'food' ? UtensilsCrossed : MapPin;

  return (
    <Tag
      {...tagProps}
      className={cardTone}
      data-nearby-photo-card=""
      data-nearby-card-variant={variant}
    >
      {showCompact ? (
        <div
          className="flex min-h-0 items-center gap-2.5 px-2.5 py-2.5"
          data-nearby-compact-card=""
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-stone-200 text-amber-800/70"
            aria-hidden="true"
          >
            {imagePending ? (
              <span
                className="h-5 w-5 animate-pulse rounded-md bg-stone-300/80"
                data-nearby-thumb-pending=""
              />
            ) : (
              <CategoryIcon size={16} strokeWidth={1.75} />
            )}
          </span>
          <span className="min-w-0 flex-1">
            {category ? (
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-stone-500 line-clamp-1 break-keep">
                {category}
              </span>
            ) : null}
            <span className="block max-h-[2.65rem] text-[13px] font-bold leading-[1.3] text-stone-900 line-clamp-2 break-words overflow-hidden">
              {title}
            </span>
            {metaLine ? (
              <span className="mt-0.5 block text-[10px] leading-[1.25] text-stone-600 line-clamp-1 break-keep tabular-nums overflow-hidden">
                {metaLine}
              </span>
            ) : null}
          </span>
        </div>
      ) : (
        <>
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-t-2xl bg-stone-200">
            <FestivalPhotoFrame
              src={activeUrl}
              alt={title}
              loading={eagerImage ? 'eager' : 'lazy'}
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              pendingShimmer={!photoReady}
              fallback={
                <span
                  className="absolute inset-0 bg-gradient-to-br from-stone-200 via-stone-300/80 to-amber-100/60"
                  data-nearby-photo-fallback=""
                  aria-hidden="true"
                />
              }
              onLoaded={() => setPhotoReady(true)}
              onFailed={() => {
                setPhotoReady(false);
                if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
              }}
            />
            <span
              className="pointer-events-none absolute bottom-2 left-2 max-w-[calc(100%-0.5rem)] rounded-lg bg-stone-900/80 px-2 py-1 text-[11px] font-bold leading-snug text-white line-clamp-2 break-words"
            >
              {title}
            </span>
          </div>
          {metaLine ? (
            <div className="shrink-0 space-y-0.5 px-2.5 pb-3.5 pt-2 text-[11px] leading-normal text-stone-600 rounded-b-2xl">
              {dist ? (
                <p className="truncate tabular-nums">{dist}</p>
              ) : null}
              {subtitles.length ? (
                <p className="min-w-0 truncate">{subtitles.join(' · ')}</p>
              ) : null}
            </div>
          ) : (
            <span className="block h-2" aria-hidden="true" />
          )}
        </>
      )}
    </Tag>
  );
}

/**
 * @param {object} spot
 * @param {string | undefined} extraThumb
 */
export function nearbyCardThumbUrls(spot, extraThumb) {
  return nearbyRowThumbCandidateUrls(spot, extraThumb);
}
