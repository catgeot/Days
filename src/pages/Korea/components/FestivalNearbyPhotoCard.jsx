import React, { useState } from 'react';
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
}) {
  const [urlIndex, setUrlIndex] = useState(0);
  const [photoReady, setPhotoReady] = useState(false);
  const [forceText, setForceText] = useState(false);

  const urls = thumbUrls.length ? thumbUrls : [];
  const activeUrl = !forceText && urlIndex < urls.length ? urls[urlIndex] : '';
  const dist = formatFestivalDistKm(distKm);
  const lines = [
    dist,
    ...subtitleLines.filter((line) => String(line || '').trim()),
  ].filter(Boolean);

  const showTextCard = forceText || !activeUrl;
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

  return (
    <Tag
      {...tagProps}
      className={
        clickable
          ? 'flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition-colors [@media(hover:hover)]:hover:border-amber-300 [@media(hover:hover)]:hover:bg-amber-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90'
          : 'flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm'
      }
      data-nearby-photo-card=""
    >
      {showTextCard ? (
        <div
          className="flex min-h-[7.5rem] flex-1 flex-col justify-center gap-1 bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 px-3 py-4"
          data-nearby-text-card=""
        >
          <p className="text-base font-bold leading-snug text-stone-900 line-clamp-3 break-keep">
            {title}
          </p>
          {lines.length ? (
            <p className="text-[11px] leading-snug text-stone-600 break-keep line-clamp-2">
              {lines.join(' · ')}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
            {imagePending && !photoReady ? (
              <span
                className="absolute inset-0 animate-pulse bg-stone-200"
                data-nearby-thumb-pending=""
                aria-hidden="true"
              />
            ) : null}
            <FestivalPhotoFrame
              src={activeUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              fallback={
                <span
                  className="absolute inset-0 flex items-end bg-gradient-to-t from-stone-900/75 via-stone-400/30 to-stone-200 p-2"
                  data-nearby-text-card=""
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
                else setForceText(true);
              }}
            />
            <span
              className="pointer-events-none absolute bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-full bg-stone-900/80 px-2 py-0.5 text-[11px] font-bold text-white line-clamp-1 break-keep"
            >
              {title}
            </span>
          </div>
          {lines.length ? (
            <p className="px-2.5 py-2 text-[11px] leading-snug text-stone-600 break-keep line-clamp-2">
              {lines.join(' · ')}
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
