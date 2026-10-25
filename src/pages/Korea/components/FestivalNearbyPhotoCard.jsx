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
}) {
  const [urlIndex, setUrlIndex] = useState(0);
  const [photoReady, setPhotoReady] = useState(false);
  const [forceCompact, setForceCompact] = useState(false);

  const urls = thumbUrls.length ? thumbUrls : [];
  const activeUrl = !forceCompact && urlIndex < urls.length ? urls[urlIndex] : '';
  const dist = formatFestivalDistKm(distKm);
  const category =
    subtitleLines.find((line) => String(line || '').trim()) ||
    (variant === 'food' ? '' : '');
  const metaLine = [dist, ...subtitleLines.filter((line) => String(line || '').trim())]
    .filter(Boolean)
    .join(' · ');

  const showCompact = forceCompact || !activeUrl;
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
    ? 'flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition-colors [@media(hover:hover)]:hover:border-amber-300 [@media(hover:hover)]:hover:bg-amber-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90'
    : 'flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm';

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
            <span className="block text-[13px] font-bold leading-snug text-stone-900 line-clamp-2 break-keep">
              {title}
            </span>
            {metaLine ? (
              <span className="mt-0.5 block text-[10px] leading-snug text-stone-600 line-clamp-1 break-keep tabular-nums">
                {metaLine}
              </span>
            ) : null}
          </span>
        </div>
      ) : (
        <>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
            <FestivalPhotoFrame
              src={activeUrl}
              alt=""
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              pendingShimmer={!photoReady}
              fallback={
                <span
                  className="absolute inset-0 flex items-end bg-gradient-to-t from-stone-900/75 via-stone-400/30 to-stone-200 p-2"
                  data-nearby-photo-fallback=""
                >
                  <span className="text-sm font-bold text-white line-clamp-2 break-keep">
                    {title}
                  </span>
                </span>
              }
              onLoaded={() => setPhotoReady(true)}
              onFailed={() => {
                setPhotoReady(false);
                if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
                else setForceCompact(true);
              }}
            />
            <span
              className="pointer-events-none absolute bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-full bg-stone-900/80 px-2 py-0.5 text-[11px] font-bold text-white line-clamp-1 break-keep"
            >
              {title}
            </span>
          </div>
          {metaLine ? (
            <p className="px-2.5 py-2 text-[11px] leading-snug text-stone-600 break-keep line-clamp-2">
              {metaLine}
            </p>
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
