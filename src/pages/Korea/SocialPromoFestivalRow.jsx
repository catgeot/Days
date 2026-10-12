import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import { koreanApiTextProps } from '../../i18n/koreanApiText';
import { festivalItemThumbSrc } from './festivalListThumb';
import { festivalListDisplayTitle } from './festivalDisplayTitle.js';
import { normalizeFestivalItemImages } from './socialPromoFestivalsLogic.js';

function formatYmdLabel(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return '';
  return `${Number(s.slice(4, 6))}.${s.slice(6, 8)}`;
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
  const koText = koreanApiTextProps(isEnglish);
  const rowItem = normalizeFestivalItemImages(item);
  const img = festivalItemThumbSrc(rowItem);
  const title = festivalListDisplayTitle(rowItem, locale);
  const [imgFailed, setImgFailed] = useState(false);
  const start = formatYmdLabel(item.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate);
  const range = start && end ? `${start} – ${end}` : start || end;

  useEffect(() => {
    setImgFailed(false);
  }, [img]);

  return (
    <button
      type="button"
      data-social-promo-card=""
      data-festival-id={String(item?.contentId || '')}
      onClick={() => onSelect(item)}
      className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-amber-100 bg-white p-2 text-left shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40"
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
        {img && !imgFailed ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            {...koText}
          />
        ) : (
          <div
            data-thumb-fallback="1"
            className="flex h-full w-full items-center justify-center bg-stone-100 text-[9px] font-bold text-stone-400"
            aria-hidden="true"
          >
            🎪
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold leading-tight text-stone-900 truncate break-keep">
          {title}
        </p>
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
