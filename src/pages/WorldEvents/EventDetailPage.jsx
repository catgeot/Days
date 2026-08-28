import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Globe2,
  Home,
  Plane,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { useLocale } from '../../i18n/LocaleProvider';
import { getMrtAccommodationSearchUrl } from '../../utils/affiliate';
import { tripWindowPresetsFromEvent } from '../../utils/worldEventTripPresets';
import {
  formatWorldEventDateRange,
  getWorldEventById,
  getWorldEventLocation,
  getWorldEventPlaceMeta,
  getWorldEventTitle,
} from '../../utils/worldEvents';
import { fetchEventTravelGuide } from '../../utils/fetchEventTravelGuide';
import { loadEventTravelGuideFixture } from '../../utils/loadEventTravelGuideFixture';
import { shouldShowEventTravelGuidePanel } from '../../utils/eventTravelGuideSurface';
import { buildPlacePlannerPathFromEvent } from '../../utils/placePlannerPath';
import { buildWorldEventMooniSeed, hasWorldEventD2Chips } from '../../utils/worldEventChips';
import { hasWorldEventD3Media } from '../../utils/worldEventMedia';
import { hasWorldEventD5bBodyUx } from '../../utils/worldEventGlossary';
import { buildMooniBoundSpotFromLocation } from '../Home/lib/placeChatIntro';
import MooniBoundChatHost from '../Home/components/MooniBoundChatHost';
import EventActionChips from './EventActionChips';
import EventDetailHero from './EventDetailHero';
import EventDetailMediaSection from './EventDetailMediaSection';
import EventDetailStaticPanel from './EventDetailStaticPanel';
import EventStayStrip from './EventStayStrip';
import EventTravelGuidePanel from './EventTravelGuidePanel';
import EventMooniFab from './EventMooniFab';
import EventMooniChips from './EventMooniChips';
import EventTermExplainModal from './EventTermExplainModal';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigate = useNavigate();

  const event = useMemo(() => getWorldEventById(eventId), [eventId]);
  const [travelGuide, setTravelGuide] = useState(null);
  const [travelGuideRaw, setTravelGuideRaw] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!event?.id) {
      setTravelGuide(null);
      setTravelGuideRaw(null);
      return undefined;
    }

    fetchEventTravelGuide(event.id).then(async (result) => {
      if (cancelled) return;

      if (result.guide) {
        setTravelGuide(result.guide);
        setTravelGuideRaw(result.raw);
        return;
      }

      try {
        const fixture = await loadEventTravelGuideFixture(event.id);
        if (fixture) {
          setTravelGuide(fixture);
          setTravelGuideRaw({
            guide: fixture,
            model: 'fixture-v0.2',
            schema_version: '0.2',
          });
          return;
        }
      } catch (err) {
        console.warn('[EventDetailPage] fixture load failed', err);
      }

      setTravelGuide(null);
      setTravelGuideRaw(null);
    });

    return () => {
      cancelled = true;
    };
  }, [event?.id]);

  if (!event) {
    return <Navigate to="/world-events" replace />;
  }

  const title = getWorldEventTitle(event, locale);
  const dateLabel = formatWorldEventDateRange(event, locale);
  const placeMeta = getWorldEventPlaceMeta(event.slug, locale);
  const location = useMemo(() => getWorldEventLocation(event.slug), [event.slug]);
  const presets = tripWindowPresetsFromEvent(event);
  const [tripDates, setTripDates] = useState(() => ({
    checkIn: presets.tripWindow.checkIn,
    checkOut: presets.tripWindow.checkOut,
  }));
  const [mooniOpen, setMooniOpen] = useState(false);
  const [mooniBoundSpot, setMooniBoundSpot] = useState(null);
  const [mooniInitialQuery, setMooniInitialQuery] = useState(null);
  const [glossaryTermId, setGlossaryTermId] = useState(null);

  useEffect(() => {
    setTripDates({
      checkIn: presets.tripWindow.checkIn,
      checkOut: presets.tripWindow.checkOut,
    });
  }, [event.id, presets.tripWindow.checkIn, presets.tripWindow.checkOut]);

  const { checkIn, checkOut } = tripDates;
  const plannerHref = buildPlacePlannerPathFromEvent(presets.slug, {
    checkIn,
    checkOut,
    eventId: presets.eventId,
  });
  const { detailHref: placeHref } = presets;
  const stayHref = placeMeta.label
    ? getMrtAccommodationSearchUrl(placeMeta.label, {
        isDomestic: false,
        checkIn,
        checkOut,
      })
    : '';

  const seoDescription = [
    dateLabel,
    placeMeta.label,
    event.detailOverview || event.bookingHints || t('worldEventDetail.seoDescription'),
  ]
    .filter(Boolean)
    .join(' · ');

  const showD2Chips = hasWorldEventD2Chips(event.id);
  const showD3Media = hasWorldEventD3Media(event.id);
  const showD5bBodyUx = hasWorldEventD5bBodyUx(event);

  const openEventMooni = useCallback(
    (prompt = null) => {
      const location = getWorldEventLocation(event.slug);
      const spot = buildMooniBoundSpotFromLocation({
        ...location,
        displayLabel: title ? `${title} · ${location.name}` : location.name,
      });
      if (!spot) return;
      const eventContext = buildWorldEventMooniSeed(event, locale);
      const nextSpot = eventContext ? { ...spot, eventContext } : spot;
      const nextQuery = prompt ? { text: prompt } : null;
      const promptText = nextQuery?.text?.trim() || '';

      setMooniBoundSpot(nextSpot);

      if (promptText && mooniOpen) {
        setMooniOpen(false);
        setMooniInitialQuery(null);
        window.setTimeout(() => {
          setMooniBoundSpot(nextSpot);
          setMooniInitialQuery(nextQuery);
          setMooniOpen(true);
        }, 0);
        return;
      }

      setMooniInitialQuery(nextQuery);
      setMooniOpen(true);
    },
    [event, locale, title, mooniOpen],
  );

  const closeEventMooni = useCallback(() => {
    setMooniOpen(false);
    setMooniBoundSpot(null);
    setMooniInitialQuery(null);
  }, []);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title={t('worldEventDetail.seoTitle', { title })}
        description={seoDescription}
        url={`/world-events/${event.id}`}
      />

      <header className="relative z-30 shrink-0 border-b border-stone-200/80 bg-stone-100/95 pt-[max(0.5rem,env(safe-area-inset-top,0px))] backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-3 pb-2.5 md:px-5 lg:max-w-6xl lg:px-8">
          <div className="rounded-2xl border border-stone-200/90 bg-white px-3 py-2.5 shadow-sm md:px-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/world-events')}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
              >
                <ArrowLeft size={14} aria-hidden />
                {t('worldEventDetail.backToHub')}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700">
                  World
                </p>
                <p className="truncate text-sm font-extrabold tracking-tight md:text-base">
                  {title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
              >
                <Home size={14} aria-hidden />
                {t('korea.common.home')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-3 py-3 md:px-5 lg:max-w-6xl lg:px-8">
          {showD3Media ? <EventDetailHero event={event} locale={locale} /> : null}

          <div className="mb-3 flex flex-wrap gap-2">
            {plannerHref ? (
              <Link
                to={plannerHref}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
              >
                <Plane size={13} aria-hidden />
                {t('place.worldEvents.plannerCta')}
              </Link>
            ) : null}
            {stayHref ? (
              <a
                href={stayHref}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:border-amber-300 hover:bg-amber-50"
              >
                <CalendarDays size={13} aria-hidden />
                {t('place.worldEvents.stayCta', { keyword: placeMeta.label })}
                <ExternalLink size={11} aria-hidden />
              </a>
            ) : null}
            {placeHref ? (
              <Link
                to={placeHref}
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700 hover:border-amber-300 hover:bg-amber-50"
              >
                <Globe2 size={13} aria-hidden />
                {t('worldEventsHub.card.placeCta')}
              </Link>
            ) : null}
            {event.sourceUrl ? (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-600 hover:border-amber-300 hover:bg-amber-50"
              >
                {t('place.worldEvents.official')}
                <ExternalLink size={11} aria-hidden />
              </a>
            ) : null}
          </div>

          {showD2Chips && !showD5bBodyUx ? (
            <EventActionChips event={event} locale={locale} />
          ) : null}

          <EventDetailStaticPanel
            event={event}
            locale={locale}
            checkIn={checkIn}
            checkOut={checkOut}
            location={location}
            onGlossaryTermClick={showD5bBodyUx ? setGlossaryTermId : undefined}
          />

          {showD3Media ? <EventDetailMediaSection event={event} locale={locale} /> : null}

          <div className="mt-4">
            <EventStayStrip
              event={event}
              location={location}
              checkIn={checkIn}
              checkOut={checkOut}
              visitPresets={presets.visitPresets}
              onDatesChange={setTripDates}
              locale={locale}
            />
          </div>

          {showD2Chips ? (
            <div className="mt-4">
              <EventMooniChips event={event} locale={locale} onSelect={openEventMooni} />
            </div>
          ) : null}

          {travelGuide && shouldShowEventTravelGuidePanel(event.id) ? (
            <div className="mt-4">
              <EventTravelGuidePanel
                guide={travelGuide}
                rawRow={travelGuideRaw}
                locale={locale}
              />
            </div>
          ) : null}
        </div>
      </main>
      <EventMooniFab onClick={() => openEventMooni()} />
      <EventTermExplainModal
        event={event}
        termId={glossaryTermId}
        locale={locale}
        onClose={() => setGlossaryTermId(null)}
      />
      <MooniBoundChatHost
        isOpen={mooniOpen}
        boundSpot={mooniBoundSpot}
        initialQuery={mooniInitialQuery}
        onClose={closeEventMooni}
      />
    </div>
  );
}
