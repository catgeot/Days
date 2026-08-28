import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { getWorldEventTitle } from '../../utils/worldEvents';
import { getWorldEventHeroImages } from '../../utils/worldEventGlossary';

/**
 * @param {{
 *   event: import('../../utils/worldEvents').WorldEvent,
 *   locale?: string,
 *   dateLabel?: string,
 *   placeLabel?: string,
 *   placeCountry?: string,
 *   venueName?: string,
 *   recurrenceNote?: string,
 *   typeLabel?: string,
 * }} props
 */
export default function EventDetailHero({
  event,
  locale = 'ko',
  dateLabel = '',
  placeLabel = '',
  placeCountry = '',
  venueName = '',
  recurrenceNote = '',
  typeLabel = '',
}) {
  const { t } = useTranslation();
  const images = useMemo(() => getWorldEventHeroImages(event), [event]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) return null;

  const title = getWorldEventTitle(event, locale);
  const activeImage = images[activeIndex] || images[0];
  const activeCaption =
    locale === 'en' && activeImage.captionEn
      ? activeImage.captionEn
      : activeImage.captionKo || '';
  const showMetaStrip = Boolean(dateLabel || placeLabel || venueName || recurrenceNote || typeLabel);

  return (
    <section className="mb-3 overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 shadow-sm">
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        <img
          src={activeImage.url}
          alt={t('worldEventDetail.media.heroAlt', { title })}
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-200/90">
            {t('worldEventDetail.media.heroEyebrow')}
          </p>
          <p className="mt-1 line-clamp-2 text-lg font-extrabold leading-snug text-white sm:text-xl">
            {title}
          </p>
          {activeCaption ? (
            <p className="mt-1 line-clamp-1 text-xs font-semibold text-white/85">{activeCaption}</p>
          ) : null}
        </div>
        {images.length > 1 ? (
          <span className="absolute bottom-4 right-4 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
            {activeIndex + 1}/{images.length}
          </span>
        ) : null}
      </div>

      {showMetaStrip ? (
        <div className="border-t border-stone-700/40 bg-stone-950/90 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {typeLabel ? (
              <span className="inline-flex rounded-full border border-amber-300/70 bg-amber-50/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-100">
                {typeLabel}
              </span>
            ) : null}
            {recurrenceNote ? (
              <span className="text-[11px] font-semibold text-stone-300">{recurrenceNote}</span>
            ) : null}
          </div>
          {dateLabel ? (
            <p className="mt-1.5 text-sm font-semibold text-white">{dateLabel}</p>
          ) : null}
          {venueName ? (
            <p className="mt-1 flex items-start gap-1.5 text-xs text-stone-300">
              <MapPin size={13} className="mt-0.5 shrink-0 text-amber-200/80" aria-hidden />
              <span>{venueName}</span>
            </p>
          ) : null}
          {placeLabel ? (
            <p className="mt-1 flex items-start gap-1.5 text-xs text-stone-300">
              <MapPin size={13} className="mt-0.5 shrink-0 text-amber-200/80" aria-hidden />
              <span>
                {placeLabel}
                {placeCountry ? <span className="text-stone-400"> · {placeCountry}</span> : null}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      {images.length > 1 ? (
        <div
          className="flex gap-2 overflow-x-auto border-t border-stone-700/40 bg-stone-950/90 px-3 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="listbox"
          aria-label={t('worldEventDetail.heroGallery.thumbnailsAria')}
        >
          {images.map((image, index) => {
            const selected = index === activeIndex;
            const thumbCaption =
              locale === 'en' && image.captionEn ? image.captionEn : image.captionKo || '';
            return (
              <button
                key={`${image.url}-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={t('worldEventDetail.heroGallery.imageAlt', {
                  title,
                  index: index + 1,
                })}
                onClick={() => setActiveIndex(index)}
                className={[
                  'relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border transition-colors',
                  selected ? 'border-amber-300 ring-2 ring-amber-300/60' : 'border-stone-600/80',
                ].join(' ')}
              >
                <img
                  src={image.url}
                  alt={thumbCaption || ''}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
