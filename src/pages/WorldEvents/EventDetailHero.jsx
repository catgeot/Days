import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getWorldEventTitle } from '../../utils/worldEvents';
import { getWorldEventHeroImages } from '../../utils/worldEventGlossary';

/**
 * @param {{ event: import('../../utils/worldEvents').WorldEvent, locale?: string }} props
 */
export default function EventDetailHero({ event, locale = 'ko' }) {
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

  return (
    <div className="mb-4 space-y-3">
      <section
        className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 shadow-sm"
        aria-label={t('worldEventDetail.media.heroAlt', { title })}
      >
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
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
      </section>

      {images.length > 1 ? (
        <section
          className="rounded-2xl border border-stone-200 bg-white p-2.5 shadow-sm"
          aria-label={t('worldEventDetail.heroGallery.thumbnailsAria')}
        >
          <p className="mb-2 px-0.5 text-[10px] font-bold tracking-[0.15em] uppercase text-stone-500">
            {t('worldEventDetail.heroGallery.thumbnailsAria')}
          </p>
          <div
            className="flex gap-2 overflow-x-auto px-0.5 py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="listbox"
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
                    'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm transition-colors sm:h-[4.5rem] sm:w-[4.5rem]',
                    selected ? 'border-amber-400 ring-2 ring-amber-300/70' : 'border-stone-200',
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
        </section>
      ) : null}
    </div>
  );
}
