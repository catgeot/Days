import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Sparkles } from 'lucide-react';
import { getMrtAccommodationSearchUrl } from '../../utils/affiliate';
import {
  formatWorldEventDateRange,
  getWorldEventPlaceMeta,
  getWorldEventTitle,
} from '../../utils/worldEvents';

/**
 * @param {{ event: import('../../utils/worldEvents').WorldEvent, locale: string, checkIn?: string, checkOut?: string }} props
 */
export default function EventDetailStaticPanel({ event, locale, checkIn, checkOut }) {
  const { t } = useTranslation();
  const title = getWorldEventTitle(event, locale);
  const dateLabel = formatWorldEventDateRange(event, locale);
  const placeMeta = getWorldEventPlaceMeta(event.slug, locale);
  const typeKey = String(event.type || 'festival');
  const typeLabel = t(`worldEventDetail.type.${typeKey}`, { defaultValue: typeKey });
  const typeIntro = t(`worldEventDetail.typeIntro.${typeKey}`, { defaultValue: '' });
  const hasTier05 =
    Boolean(event.detailOverview) ||
    (Array.isArray(event.highlights) && event.highlights.length > 0) ||
    (Array.isArray(event.stayAreas) && event.stayAreas.length > 0) ||
    event.recommendedNights != null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
            {typeLabel}
          </span>
          {event.recurrenceNote ? (
            <span className="text-[11px] font-semibold text-stone-500">{event.recurrenceNote}</span>
          ) : null}
        </div>

        <h1 className="mt-2 text-xl font-extrabold leading-snug text-stone-900 sm:text-2xl">
          {title}
        </h1>

        {dateLabel ? (
          <p className="mt-1 text-sm font-semibold text-stone-700">{dateLabel}</p>
        ) : null}

        {event.venue?.name ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-stone-600">
            <MapPin size={14} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
            <span>{event.venue.name}</span>
          </p>
        ) : null}

        <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-600">
          <MapPin size={14} className="shrink-0 text-stone-400" aria-hidden />
          <span>
            {placeMeta.label}
            {placeMeta.country ? (
              <span className="text-stone-500"> · {placeMeta.country}</span>
            ) : null}
          </span>
        </p>

        {event.recommendedNights != null ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-amber-950">
            {t('worldEventDetail.recommendedNights', { nights: event.recommendedNights })}
          </p>
        ) : null}
      </section>

      {event.detailOverview ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-extrabold text-stone-900">{t('worldEventDetail.overview')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">{event.detailOverview}</p>
        </section>
      ) : null}

      {Array.isArray(event.highlights) && event.highlights.length > 0 ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-stone-900">
            <Sparkles size={15} className="text-amber-700" aria-hidden />
            {t('worldEventDetail.highlights')}
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-stone-700">
            {event.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {typeIntro ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-extrabold text-stone-900">{t('worldEventDetail.typeGuide')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">{typeIntro}</p>
        </section>
      ) : null}

      {event.bookingHints ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-extrabold text-stone-900">{t('worldEventDetail.bookingHints')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">{event.bookingHints}</p>
        </section>
      ) : null}

      {Array.isArray(event.stayAreas) && event.stayAreas.length > 0 ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-extrabold text-stone-900">{t('worldEventDetail.stayAreas')}</h2>
          <div className="mt-2 space-y-2">
            {event.stayAreas.map((area) => {
              const keyword = area.mrtKeyword || area.name;
              const stayHref =
                keyword && checkIn && checkOut
                  ? getMrtAccommodationSearchUrl(keyword, {
                      isDomestic: false,
                      checkIn,
                      checkOut,
                    })
                  : '';

              return (
                <article
                  key={`${area.name}-${area.mrtKeyword || ''}`}
                  className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5"
                >
                  <p className="text-sm font-bold text-stone-900">{area.name}</p>
                  {area.note ? (
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">{area.note}</p>
                  ) : null}
                  {stayHref ? (
                    <a
                      href={stayHref}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="mt-2 inline-flex text-xs font-bold text-amber-800 hover:text-amber-900"
                    >
                      {t('place.worldEvents.stayCta', { keyword: area.name })}
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {!hasTier05 && !event.bookingHints && !typeIntro ? (
        <section className="rounded-2xl border border-dashed border-stone-200 bg-white/70 p-4 text-sm text-stone-500">
          {t('worldEventDetail.staticFallback')}
        </section>
      ) : null}
    </div>
  );
}
