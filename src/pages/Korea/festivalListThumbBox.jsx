import React from 'react';
import { MapPin } from 'lucide-react';
import { koreanApiTextProps } from '../../i18n/koreanApiText';
import { isGateoFestivalDateChipEnabled } from '../../shared/gateoFeatureFlags';
import { festivalItemThumbSrc } from './festivalListThumb';
import { FestivalPhotoFrame } from './festivalPhotoFrame';
import { hasFestivalThumbnail } from './socialPromoFestivalsLogic.js';

export function FestivalListThumbFallback({ size = 'sm' }) {
  const icon = size === 'sm' ? 16 : 22;
  return (
    <div
      data-thumb-fallback="1"
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-stone-200 text-amber-800/50"
      aria-hidden="true"
    >
      <MapPin size={icon} strokeWidth={1.75} />
    </div>
  );
}

/**
 * @param {{ item: Record<string, unknown>, isEnglish?: boolean, className?: string }} props
 */
export function FestivalListThumbBox({ item, isEnglish = false, className = '' }) {
  const koText = koreanApiTextProps(isEnglish);
  const src = festivalItemThumbSrc(item);
  const canTryImage = Boolean(src) && hasFestivalThumbnail(item);

  return (
    <div
      className={`h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100 ${className}`.trim()}
    >
      {canTryImage ? (
        <FestivalPhotoFrame
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          lang={koText.lang}
          translate={koText.translate}
          pendingShimmer={isGateoFestivalDateChipEnabled()}
          fallback={<FestivalListThumbFallback size="sm" />}
        />
      ) : (
        <FestivalListThumbFallback size="sm" />
      )}
    </div>
  );
}
