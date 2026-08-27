import React from 'react';
import { useTranslation } from 'react-i18next';
import { getWorldEventTitle } from '../../utils/worldEvents';

/**
 * @param {{ event: import('../../utils/worldEvents').WorldEvent, locale?: string }} props
 */
export default function EventDetailHero({ event, locale = 'ko' }) {
  const { t } = useTranslation();
  const heroImage = String(event?.heroImage || '').trim();
  if (!heroImage) return null;

  const title = getWorldEventTitle(event, locale);

  return (
    <section className="mb-3 overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 shadow-sm">
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        <img
          src={heroImage}
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
        </div>
      </div>
    </section>
  );
}
