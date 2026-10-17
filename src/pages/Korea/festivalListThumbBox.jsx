import React from 'react';
import { MapPin } from 'lucide-react';
import { koreanApiTextProps } from '../../i18n/koreanApiText';
import { isGateoFestivalDateChipEnabled } from '../../shared/gateoFeatureFlags';
import { festivalItemThumbSrc } from './festivalListThumb';
import { FestivalPhotoFrame } from './festivalPhotoFrame';
import { hasFestivalThumbnail } from './socialPromoFestivalsLogic.js';

const FALLBACK_ICON = { sm: 16, md: 22, lg: 32 };

export function FestivalListThumbFallback({ size = 'sm', className = '' }) {
  const icon = FALLBACK_ICON[size] ?? FALLBACK_ICON.sm;
  return (
    <div
      data-thumb-fallback="1"
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-stone-200 text-amber-800/60 ${className}`.trim()}
      aria-hidden="true"
    >
      <MapPin size={icon} strokeWidth={1.75} />
    </div>
  );
}

/** Festival detail hero·필름스트립·탭·라이트박스·주변 카드 공통 핀 폴백 */
export function FestivalDetailPhotoFallback({ size = 'md', className = '' }) {
  return <FestivalListThumbFallback size={size} className={className} />;
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
