import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import { festivalListDisplayTitleLines } from './festivalDisplayTitle.js';
import { FestivalListThumbBox } from './festivalListThumbBox.jsx';
import {
  normalizeFestivalItemImages,
  socialPromoPlaceLabel,
} from './socialPromoFestivalsLogic.js';

function formatYmdLabel(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return '';
  return `${Number(s.slice(4, 6))}.${s.slice(6, 8)}`;
}

export function SocialPromoNearLine({ card, onSelect }) {
  const { t } = useTranslation();
  const item = card?.item;
  if (!item?.contentId) return null;
  const title = String(item.title || '').trim();
  const start = formatYmdLabel(item.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate);
  const range = start && end ? `${start} – ${end}` : start || end;
  const city = socialPromoPlaceLabel(item);
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

export default function SocialPromoFestivalRow({ cards, loading = false, onSelect }) {
  const { t } = useTranslation();
  if (!cards?.length) return null;

  return (
    <section
      className="mb-3 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white px-3 py-2.5 shadow-sm"
      data-social-promo-festival-row=""
      data-social-promo-loading={loading ? 'true' : 'false'}
      aria-label={t('korea.festival.socialPromoTitle')}
      aria-busy={loading || undefined}
    >
      <h3 className="px-0.5 text-[11px] font-bold tracking-wide text-amber-950 break-keep">
        {t('korea.festival.socialPromoTitle')}
      </h3>
      <div className="mt-2 flex flex-col gap-1.5">
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
      className="flex w-full items-center gap-2 rounded-xl border border-amber-100 bg-white p-2"
      data-social-promo-card-skeleton=""
      aria-hidden="true"
    >
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-stone-200" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="h-3.5 w-full max-w-[14rem] animate-pulse rounded bg-stone-200" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-amber-100" />
      </div>
    </div>
  );
}

function SocialPromoCard({ item, onSelect }) {
  const { isEnglish, locale } = useLocale();
  const rowItem = normalizeFestivalItemImages(item);
  const titleLines = festivalListDisplayTitleLines(rowItem, locale);
  const start = formatYmdLabel(item.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate);
  const range = start && end ? `${start} – ${end}` : start || end;

  return (
    <button
      type="button"
      data-social-promo-card=""
      data-festival-id={String(item?.contentId || '')}
      onClick={() => onSelect(item)}
      className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-amber-100 bg-white p-2 text-left shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40"
    >
      <FestivalListThumbBox item={rowItem} isEnglish={isEnglish} />
      <div className="min-w-0 flex-1">
        {titleLines?.secondary ? (
          <>
            <p
              className="text-[12px] font-bold leading-snug text-stone-900 break-keep"
              data-social-promo-title-en=""
            >
              {titleLines.primary}
            </p>
            <p
              className="text-[11px] font-semibold leading-snug text-stone-600 break-keep"
              data-social-promo-title-ko=""
            >
              {titleLines.secondary}
            </p>
          </>
        ) : (
          <p className="text-[12px] font-bold leading-snug text-stone-900 break-keep">
            {titleLines?.primary}
          </p>
        )}
        {range ? (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-800">
            <CalendarDays size={10} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{range}</span>
          </p>
        ) : null}
      </div>
    </button>
  );
}
