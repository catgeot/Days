import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, X } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import { localizedSocialPromoRegionPlaceLabel } from '../../i18n/koreaRegionLabels.js';
import { festivalListDisplayTitleLines } from './festivalDisplayTitle.js';
import { FestivalListThumbBox } from './festivalListThumbBox.jsx';
import { normalizeFestivalItemImages } from './socialPromoFestivalsLogic.js';
import { formatFestivalDetailDateRange } from './festivalDateFilter.js';

export function SocialPromoNearLine({ card, onSelect }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const item = card?.item;
  if (!item?.contentId) return null;
  const title = String(item.title || '').trim();
  const range = formatFestivalDetailDateRange(
    item.eventStartDate,
    item.eventEndDate,
    undefined,
    locale,
  );
  const city = localizedSocialPromoRegionPlaceLabel(locale, item);
  return (
    <button
      type="button"
      data-social-promo-near-line=""
      data-festival-id={String(item.contentId)}
      onClick={() => onSelect?.(item)}
      className="mb-2 flex h-9 w-full min-w-0 items-center gap-1 rounded-xl border border-dashed border-amber-400 bg-amber-50/70 px-2.5 text-left text-[12px] leading-none text-stone-800"
    >
      <span className="min-w-0 flex-1 truncate">
        <span className="font-bold text-amber-950">{t('korea.festival.socialPromoNearLead')}</span>
        <span className="text-stone-400"> · </span>
        <span className="font-bold text-amber-950">{title}</span>
        {range ? <span className="text-stone-700">{` ${range}`}</span> : null}
        {city ? <span className="text-stone-600">{` (${city})`}</span> : null}
      </span>
      <span className="shrink-0 text-stone-400" aria-hidden="true">›</span>
    </button>
  );
}

export default function SocialPromoFestivalRow({
  cards,
  loading = false,
  onSelect,
  onDismiss,
}) {
  const { t } = useTranslation();
  if (!cards?.length) return null;

  return (
    <section
      className="relative mb-3 w-full max-w-full rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white px-3 pb-2.5 pt-2 shadow-sm md:w-fit"
      data-social-promo-festival-row=""
      data-social-promo-loading={loading ? 'true' : 'false'}
      aria-label={t('korea.festival.socialPromoTitle')}
      aria-busy={loading || undefined}
    >
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 px-0.5 text-[11px] font-bold tracking-wide text-amber-950 break-keep">
          {t('korea.festival.socialPromoTitle')}
        </h3>
        {onDismiss ? (
          <button
            type="button"
            data-social-promo-dismiss=""
            className="-mr-1 -mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-amber-100/80 hover:text-stone-900"
            aria-label={t('korea.festival.socialPromoClose')}
            onClick={onDismiss}
          >
            <X size={20} strokeWidth={2.25} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div
        className="mt-1.5 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-social-promo-scroll=""
      >
        {cards.map(({ item, entry }) =>
          loading || !item ? (
            <SocialPromoCardSkeleton
              key={String(entry?.contentId || 'slot')}
            />
          ) : (
            <SocialPromoCard
              key={String(item.contentId)}
              item={item}
              onSelect={onSelect}
            />
          ),
        )}
      </div>
    </section>
  );
}

function SocialPromoCardSkeleton() {
  return (
    <div
      className="flex w-[110px] shrink-0 flex-col overflow-hidden rounded-lg border border-amber-100 bg-white"
      data-social-promo-card-skeleton=""
      aria-hidden="true"
    >
      <div className="aspect-[8/3] w-full animate-pulse bg-stone-200" />
      <div className="space-y-1 p-1.5">
        <div className="h-3 w-full animate-pulse rounded bg-stone-200" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-amber-100" />
      </div>
    </div>
  );
}

function SocialPromoCard({ item, onSelect }) {
  const { isEnglish, locale } = useLocale();
  const rowItem = normalizeFestivalItemImages(item);
  const titleLines = festivalListDisplayTitleLines(rowItem, locale);
  const range = formatFestivalDetailDateRange(
    item.eventStartDate,
    item.eventEndDate,
    undefined,
    locale,
  );
  const regionPlace = localizedSocialPromoRegionPlaceLabel(locale, item);
  return (
    <button
      type="button"
      data-social-promo-card=""
      data-festival-id={String(item?.contentId || '')}
      onClick={() => onSelect(item)}
      className="flex w-[110px] shrink-0 flex-col overflow-hidden rounded-lg border border-amber-100 bg-white text-left shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40"
    >
      <div className="relative aspect-[8/3] w-full overflow-hidden bg-stone-100">
        <FestivalListThumbBox
          item={rowItem}
          isEnglish={isEnglish}
          fill
          className="absolute inset-0 rounded-none"
        />
      </div>
      <div className="flex min-h-[2.75rem] flex-col gap-0.5 p-1.5">
        {titleLines?.secondary ? (
          <>
            <p
              className="line-clamp-2 text-[10px] font-bold leading-snug text-stone-900"
              data-social-promo-title-en=""
            >
              {titleLines.primary}
            </p>
            <p
              className="line-clamp-2 text-[9px] font-semibold leading-snug text-stone-600"
              data-social-promo-title-ko=""
            >
              {titleLines.secondary}
            </p>
          </>
        ) : (
          <p
            className="line-clamp-2 text-[10px] font-bold leading-snug text-stone-900"
            data-social-promo-title=""
          >
            {titleLines?.primary}
          </p>
        )}
        {regionPlace ? (
          <p
            className="truncate text-[9px] font-semibold text-stone-500"
            data-social-promo-region=""
          >
            {regionPlace}
          </p>
        ) : null}
        {range ? (
          <p className="mt-auto flex items-center gap-0.5 text-[9px] font-bold text-amber-800">
            <CalendarDays size={9} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{range}</span>
          </p>
        ) : null}
      </div>
    </button>
  );
}
