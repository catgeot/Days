import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { useLocale } from '../../../i18n/LocaleProvider';
import { tripWindowPresetsFromEvent } from '../../../utils/worldEventTripPresets';
import {
  formatWorldEventDateRange,
  getWorldEventTitle,
  getWorldEventsForSlug,
} from '../../../utils/worldEvents';

const PREVIEW_LIMIT = 3;

/**
 * Desktop chat panel — flag-on teaser (not full accordion list).
 * @param {{ location: object, onViewAllTab: () => void, className?: string }} props
 */
export default function PlaceWorldEventsChatPreview({ location, onViewAllTab, className = '' }) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const placeSlug = useMemo(
    () => String(location?.slug || '').trim().toLowerCase(),
    [location?.slug],
  );
  const events = useMemo(() => getWorldEventsForSlug(placeSlug), [placeSlug]);
  if (!events.length) return null;

  const preview = events.slice(0, PREVIEW_LIMIT);

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-md space-y-2.5 shrink-0 ${className}`.trim()}
      aria-label={t('place.worldEvents.title')}
    >
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="shrink-0 text-amber-200" aria-hidden />
        <h3 className="min-w-0 flex-1 text-sm font-bold text-white">{t('place.worldEvents.title')}</h3>
        <span className="shrink-0 text-[10px] font-semibold text-white/45">
          {t('place.worldEvents.count', { count: events.length })}
        </span>
      </div>
      <ul className="space-y-2">
        {preview.map((event) => {
          const title = getWorldEventTitle(event, locale);
          const dateLabel = formatWorldEventDateRange(event, locale);
          const { eventDetailHref } = tripWindowPresetsFromEvent(event);
          return (
            <li key={event.id} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              <Link to={eventDetailHref} className="block text-sm font-bold text-white hover:text-amber-100">
                {title}
              </Link>
              {dateLabel ? (
                <p className="mt-0.5 text-[11px] text-white/60">{dateLabel}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onViewAllTab}
        className="w-full rounded-full border border-amber-300/60 bg-amber-500/15 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/25 transition-colors"
      >
        {t('place.worldEvents.viewAllTab')}
      </button>
    </section>
  );
}
