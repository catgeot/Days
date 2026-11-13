import React from 'react';
import {
  Bike,
  CalendarDays,
  Landmark,
  MapPin,
  Utensils,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const VARIANT_ICONS = {
  food: Utensils,
  leports: Bike,
  culture: Landmark,
  attraction: MapPin,
  festival: CalendarDays,
  hub: MapPin,
};

/**
 * 명승 상세 모달 — TourAPI 주변 목록 섹션 제목.
 * @param {{
 *   variant: 'food' | 'leports' | 'culture' | 'attraction' | 'festival' | 'hub',
 *   title: string,
 *   description?: string,
 *   count?: number,
 *   compact?: boolean,
 * }} props
 */
export default function ScenicNearbySectionHeader({
  variant,
  title,
  description,
  count,
  compact = false,
}) {
  const { t } = useTranslation();
  const Icon = VARIANT_ICONS[variant] || MapPin;
  const showCount = typeof count === 'number' && count > 0;

  if (compact) {
    return (
      <p
        className="text-sm font-bold leading-snug text-stone-900 lg:text-base break-keep"
        data-scenic-nearby-section-heading=""
        data-scenic-nearby-section-variant={variant}
        data-scenic-nearby-section-compact=""
      >
        {title}
        {showCount ? (
          <span className="font-bold tabular-nums text-stone-700">
            {t('korea.theme.spotDetail.nearSectionCount', { count })}
          </span>
        ) : null}
      </p>
    );
  }

  return (
    <header
      className="rounded-xl border border-stone-200/90 bg-gradient-to-r from-stone-50 via-white to-amber-50/50 px-3.5 py-3 shadow-[0_1px_0_rgba(28,25,23,0.04)]"
      data-scenic-nearby-section-heading=""
      data-scenic-nearby-section-variant={variant}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-950 shadow-sm ring-1 ring-stone-200/90"
          aria-hidden="true"
        >
          <Icon size={20} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="flex min-w-0 flex-wrap items-baseline gap-x-1 text-base font-bold leading-snug text-stone-900 lg:text-lg break-keep">
            <span>{title}</span>
            {showCount ? (
              <span className="text-sm font-bold tabular-nums text-stone-800 lg:text-base">
                {t('korea.theme.spotDetail.nearSectionCount', { count })}
              </span>
            ) : null}
          </h3>
          {description ? (
            <p className="text-sm font-medium leading-snug text-stone-700 break-keep">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
