import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import { koreanApiTextProps } from '../../i18n/koreanApiText';
import { resolveListImageUrl } from '../../utils/listImageUrl';
function formatYmdLabel(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return '';
  return `${Number(s.slice(4, 6))}.${s.slice(6, 8)}`;
}

function festivalImage(item) {
  const raw = item?.imageUrl || item?.firstimage || '';
  return resolveListImageUrl(raw, { role: 'list' }) || '';
}

export default function SocialPromoFestivalRow({ cards, onSelect }) {
  const { t } = useTranslation();
  if (!cards?.length) return null;

  return (
    <section
      className="mb-3 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white px-3 py-2.5 shadow-sm"
      data-social-promo-festival-row=""
      aria-label={t('korea.festival.socialPromoTitle')}
    >
      <h3 className="px-0.5 text-[11px] font-bold tracking-wide text-amber-950 break-keep">
        {t('korea.festival.socialPromoTitle')}
      </h3>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map(({ item }) => (
          <SocialPromoCard
            key={String(item.contentId)}
            item={item}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

function SocialPromoCard({ item, onSelect }) {
  const { isEnglish } = useLocale();
  const koText = koreanApiTextProps(isEnglish);
  const img = festivalImage(item);
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
      className="flex min-w-[min(100%,14.5rem)] max-w-[14.5rem] flex-1 items-center gap-2 rounded-xl border border-amber-100 bg-white p-2 text-left shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
        {img && !imgFailed ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            {...koText}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-stone-100 text-[9px] font-bold text-stone-400"
            aria-hidden="true"
          >
            🎪
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p
          className="text-[12px] font-bold leading-snug text-stone-900 line-clamp-2 break-keep"
          {...koText}
        >
          {item.title}
        </p>
        {range ? (
          <p className="flex items-center gap-1 text-[10px] font-bold text-amber-800">
            <CalendarDays size={10} aria-hidden="true" />
            <span className="truncate">{range}</span>
          </p>
        ) : null}
      </div>
    </button>
  );
}
