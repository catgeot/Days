import React, { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ChevronDown, ExternalLink, Plane } from 'lucide-react';
import { useLocale } from '../../../i18n/LocaleProvider';
import { tripWindowPresetsFromEvent } from '../../../utils/worldEventTripPresets';
import { getMrtAccommodationSearchUrl } from '../../../utils/affiliate';
import { getLocalizedPlaceName } from './locationDisplay';
import {
  formatWorldEventDateRange,
  getWorldEventTitle,
  getWorldEventsForSlug,
} from '../../../utils/worldEvents';

/**
 * @param {{ slug?: string | null, location?: { slug?: string, name?: string, name_en?: string } | null, variant?: 'dark' | 'summary', className?: string }} props
 */
export default function PlaceWorldEventsSection({
  slug,
  location = null,
  variant = 'dark',
  className = '',
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);

  const placeSlug = useMemo(() => {
    const fromProp = String(slug || '').trim().toLowerCase();
    if (fromProp) return fromProp;
    return String(location?.slug || '').trim().toLowerCase();
  }, [slug, location?.slug]);

  const events = useMemo(() => getWorldEventsForSlug(placeSlug), [placeSlug]);
  if (!events.length) return null;

  const stayKeyword =
    getLocalizedPlaceName(location, locale) ||
    location?.name ||
    location?.name_en ||
    '';

  const isSummary = variant === 'summary';

  const shellClass = isSummary
    ? 'rounded-xl border border-white/15 bg-white/[0.06] backdrop-blur-md'
    : 'rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md';

  const headerClass = isSummary
    ? 'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]'
    : 'flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]';

  const bodyClass = isSummary ? 'px-3 pb-3 pt-0 space-y-2' : 'px-4 pb-4 pt-0 space-y-3';

  return (
    <section className={`${shellClass} ${className}`.trim()} aria-label={t('place.worldEvents.title')}>
      <button
        type="button"
        className={headerClass}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={(event) => {
          event.stopPropagation();
          setExpanded((open) => !open);
        }}
      >
        <CalendarDays
          size={isSummary ? 15 : 16}
          className={`shrink-0 ${isSummary ? 'text-amber-300' : 'text-amber-200'}`}
          aria-hidden
        />
        <span className={`min-w-0 flex-1 font-bold ${isSummary ? 'text-xs text-white' : 'text-sm text-white'}`}>
          {t('place.worldEvents.title')}
        </span>
        <span className={`shrink-0 text-[10px] font-semibold ${isSummary ? 'text-white/50' : 'text-white/45'}`}>
          {t('place.worldEvents.count', { count: events.length })}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-white/60 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div id={panelId} className={bodyClass}>
          {events.map((event) => {
            const title = getWorldEventTitle(event, locale);
            const dateLabel = formatWorldEventDateRange(event, locale);
            const presets = tripWindowPresetsFromEvent(event);
            const { eventDetailHref, plannerHref } = presets;
            const stayHref = stayKeyword
              ? getMrtAccommodationSearchUrl(stayKeyword, {
                  isDomestic: false,
                  checkIn: presets.tripWindow.checkIn,
                  checkOut: presets.tripWindow.checkOut,
                })
              : '';

            return (
              <article
                key={event.id}
                className={
                  isSummary
                    ? 'rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 space-y-2'
                    : 'rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 space-y-2.5'
                }
              >
                <div className="space-y-1">
                  <h4 className={`font-bold leading-snug ${isSummary ? 'text-xs text-white' : 'text-sm text-white'}`}>
                    <Link
                      to={eventDetailHref}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-amber-100"
                    >
                      {title}
                    </Link>
                  </h4>
                  {dateLabel ? (
                    <p className={`${isSummary ? 'text-[10px]' : 'text-xs'} text-white/65`}>{dateLabel}</p>
                  ) : null}
                  {event.recurrenceNote ? (
                    <p className={`${isSummary ? 'text-[10px]' : 'text-xs'} text-white/50`}>{event.recurrenceNote}</p>
                  ) : null}
                  {event.venue?.name ? (
                    <p className={`${isSummary ? 'text-[10px]' : 'text-xs'} text-white/45`}>{event.venue.name}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                  <Link
                    to={eventDetailHref}
                    onClick={(e) => e.stopPropagation()}
                    className={
                      isSummary
                        ? 'inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-50 hover:bg-amber-500/30'
                        : 'inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/25'
                    }
                  >
                    {t('worldEventsHub.card.detailCta')}
                  </Link>
                  {plannerHref ? (
                    <Link
                      to={plannerHref}
                      onClick={(e) => e.stopPropagation()}
                      className={
                        isSummary
                          ? 'inline-flex items-center justify-center gap-1.5 rounded-full border border-indigo-300/70 bg-indigo-500/20 px-2.5 py-1.5 text-[11px] font-bold text-indigo-50 hover:bg-indigo-500/30'
                          : 'inline-flex items-center justify-center gap-1.5 rounded-full border border-indigo-300/80 bg-indigo-500/15 px-3 py-2 text-xs font-bold text-indigo-100 hover:bg-indigo-500/25'
                      }
                    >
                      {t('place.worldEvents.plannerCta')}
                      <Plane size={12} aria-hidden />
                    </Link>
                  ) : null}
                  {stayHref ? (
                    <a
                      href={stayHref}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      onClick={(e) => e.stopPropagation()}
                      className={
                        isSummary
                          ? 'inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-bold text-amber-50 hover:bg-amber-500/25'
                          : 'inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/20'
                      }
                    >
                      {t('place.worldEvents.stayCta', { keyword: stayKeyword })}
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  ) : null}
                  {event.sourceUrl ? (
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={
                        isSummary
                          ? 'inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/80 hover:bg-white/10'
                          : 'inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/10'
                      }
                    >
                      {t('place.worldEvents.official')}
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
