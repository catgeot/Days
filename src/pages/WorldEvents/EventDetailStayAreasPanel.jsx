import React from 'react';
import { useTranslation } from 'react-i18next';
import { getMrtAccommodationSearchUrl } from '../../utils/affiliate';
import { getWorldEventStayAreas } from '../../utils/worldEvents';

/**
 * @param {{
 *   event: import('../../utils/worldEvents').WorldEvent,
 *   locale: string,
 *   checkIn?: string,
 *   checkOut?: string,
 * }} props
 */
export default function EventDetailStayAreasPanel({ event, locale, checkIn, checkOut }) {
  const { t } = useTranslation();
  const stayAreas = getWorldEventStayAreas(event, locale);

  if (stayAreas.length === 0) return null;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-extrabold text-stone-900">{t('worldEventDetail.stayAreas')}</h2>
      <div className="mt-2 space-y-2">
        {stayAreas.map((area) => {
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
  );
}
