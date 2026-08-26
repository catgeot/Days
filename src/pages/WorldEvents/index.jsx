import React, { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  ExternalLink,
  Globe2,
  Home,
  MapPin,
  Plane,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { useLocale } from '../../i18n/LocaleProvider';
import { tripWindowPresetsFromEvent } from '../../utils/worldEventTripPresets';
import { getMrtAccommodationSearchUrl } from '../../utils/affiliate';
import {
  formatWorldEventDateRange,
  getWorldEventPlaceMeta,
  getWorldEventTitle,
  getWorldEventsForHubRegion,
} from '../../utils/worldEvents';
import { WORLD_EVENT_HUB_REGIONS } from './worldEventHubRegions';

function chipClass(active) {
  return `shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
    active
      ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
      : 'border-stone-200 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50'
  }`;
}

/**
 * @param {{ event: import('../../utils/worldEvents').WorldEvent, locale: string, t: import('i18next').TFunction }} props
 */
function WorldEventHubCard({ event, locale, t }) {
  const placeMeta = getWorldEventPlaceMeta(event.slug, locale);
  const title = getWorldEventTitle(event, locale);
  const dateLabel = formatWorldEventDateRange(event, locale);
  const presets = tripWindowPresetsFromEvent(event);
  const { eventDetailHref, detailHref: placeHref, plannerHref } = presets;
  const stayHref = placeMeta.label
    ? getMrtAccommodationSearchUrl(placeMeta.label, {
        isDomestic: false,
        checkIn: presets.tripWindow.checkIn,
        checkOut: presets.tripWindow.checkOut,
      })
    : '';

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm transition-colors hover:border-amber-200 hover:bg-amber-50/30">
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <CalendarDays size={16} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-sm font-extrabold leading-snug text-stone-900 sm:text-[15px]">
              <Link
                to={eventDetailHref}
                state={{ returnTo: '/world-events' }}
                className="hover:text-amber-900"
              >
                {title}
              </Link>
            </h2>
            <p className="flex items-center gap-1 text-xs font-semibold text-stone-600">
              <MapPin size={12} className="shrink-0 text-amber-700" aria-hidden />
              <span className="truncate">
                {placeMeta.label}
                {placeMeta.country ? (
                  <span className="font-normal text-stone-500"> · {placeMeta.country}</span>
                ) : null}
              </span>
            </p>
            {dateLabel ? (
              <p className="text-xs text-stone-500">{dateLabel}</p>
            ) : null}
            {event.recurrenceNote ? (
              <p className="text-[11px] text-stone-400">{event.recurrenceNote}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to={eventDetailHref}
            state={{ returnTo: '/world-events' }}
            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
          >
            <CalendarDays size={12} aria-hidden />
            {t('worldEventsHub.card.detailCta')}
          </Link>
          <Link
            to={placeHref}
            state={{ returnTo: '/world-events' }}
            className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:border-amber-300 hover:bg-amber-50"
          >
            <Globe2 size={12} aria-hidden />
            {t('worldEventsHub.card.placeCta')}
          </Link>
          {plannerHref ? (
            <Link
              to={plannerHref}
              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
            >
              <Plane size={12} aria-hidden />
              {t('place.worldEvents.plannerCta')}
            </Link>
          ) : null}
          {stayHref ? (
            <a
              href={stayHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:border-amber-300 hover:bg-amber-50"
            >
              {t('place.worldEvents.stayCta', { keyword: placeMeta.label })}
              <ExternalLink size={11} aria-hidden />
            </a>
          ) : null}
          {event.sourceUrl ? (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-bold text-stone-600 hover:border-amber-300 hover:bg-amber-50"
            >
              {t('place.worldEvents.official')}
              <ExternalLink size={11} aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function WorldEventsHub() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const regionId = searchParams.get('region') || 'all';
  const validRegionIds = useMemo(
    () => new Set(['all', ...WORLD_EVENT_HUB_REGIONS.map((region) => region.id)]),
    [],
  );
  const activeRegion = validRegionIds.has(regionId) ? regionId : 'all';

  const events = useMemo(
    () => getWorldEventsForHubRegion(activeRegion),
    [activeRegion],
  );

  const regionChips = useMemo(
    () => [
      { id: 'all', label: t('worldEventsHub.region.all') },
      ...WORLD_EVENT_HUB_REGIONS.map((region) => ({
        id: region.id,
        label: t(`worldEventsHub.region.${region.id}`),
      })),
    ],
    [t],
  );

  const headline =
    activeRegion === 'all'
      ? t('worldEventsHub.headlineAll', { count: events.length })
      : t('worldEventsHub.headlineRegion', {
          region: t(`worldEventsHub.region.${activeRegion}`),
          count: events.length,
        });

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title={t('worldEventsHub.seoTitle')}
        description={t('worldEventsHub.seoDescription')}
        url="/world-events"
      />

      <header className="relative z-30 shrink-0 border-b border-stone-200/80 bg-stone-100/95 pt-[max(0.5rem,env(safe-area-inset-top,0px))] backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-3 pb-2.5 md:px-5 lg:max-w-6xl lg:px-8">
          <div className="rounded-2xl border border-stone-200/90 bg-white px-3 py-2.5 shadow-sm md:px-4">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700">
                  World
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg">
                  {t('worldEventsHub.title')}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/korea"
                  className="hidden rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100 sm:inline-flex"
                >
                  {t('worldEventsHub.koreaLink')}
                </Link>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  <Home size={14} aria-hidden />
                  {t('korea.common.home')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-3 py-3 md:px-5 lg:max-w-6xl lg:px-8">
          <p className="px-1 text-sm text-stone-600">{t('worldEventsHub.intro')}</p>

          <div className="mt-3 space-y-2">
            <div
              className="custom-scrollbar flex gap-2 overflow-x-auto pb-1"
              role="tablist"
              aria-label={t('worldEventsHub.regionChipsAria')}
            >
              {regionChips.map((chip) => {
                const active = chip.id === activeRegion;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={chipClass(active)}
                    onClick={() => {
                      if (chip.id === 'all') {
                        setSearchParams({});
                      } else {
                        setSearchParams({ region: chip.id });
                      }
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            <p className="px-1 text-[11px] font-bold tracking-wide text-stone-500">
              {headline}
            </p>
          </div>

          <div className="page-scroll-end-pad mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {events.length === 0 ? (
              <p className="col-span-full px-1 py-6 text-sm text-stone-500">
                {t('worldEventsHub.empty')}
              </p>
            ) : (
              events.map((event) => (
                <WorldEventHubCard
                  key={event.id}
                  event={event}
                  locale={locale}
                  t={t}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
