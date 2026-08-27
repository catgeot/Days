import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BedDouble, CalendarDays, Loader2, Plane } from 'lucide-react';
import {
  buildMrtMylinkUrl,
  buildTripcomPlannerFlightUrl,
  getPlannerFlightArrivalIata,
} from '../../utils/affiliate';
import {
  getTripcomLinkRel,
  getTripcomPackageLinkTarget,
} from '../../components/PlaceCard/common/partnerNavigation';
import {
  GuestStepper,
  StayRangeCalendar,
  formatStayDateLabel,
} from '../Home/components/stayDateControls';
import {
  canShowMrtStayStrip,
  fetchMrtStaysForLocation,
  mrtStayNights,
  normalizeMrtGuestCounts,
  normalizeMrtStayDates,
} from '../../utils/fetchMrtStays';
import { resolveFlightDepartureIataForTrip } from '../Home/lib/flightOriginPreference.js';
import { resolveTripcomPartnerLocale } from '../../utils/tripcomPartnerLocale.js';
import { getWorldEventPlaceMeta } from '../../utils/worldEvents';

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatPrice(n, t, language) {
  if (n == null || !Number.isFinite(Number(n)) || Number(n) <= 0) return null;
  const formatted = Number(n).toLocaleString(language?.startsWith('en') ? 'en-US' : 'ko-KR');
  return t('home.stayStrip.priceFrom', { price: formatted });
}

/** Trip 항공+호텔 — packages/list 직링크 (일정·인원 prefill) */
function EventFlightHotelCta({
  location,
  checkIn,
  checkOut,
  adultCount,
  childCount,
  departureIata,
  className = '',
}) {
  const { t, i18n } = useTranslation();
  const packageUrl = useMemo(() => {
    if (!location) return null;
    const depart = departureIata
      ? resolveFlightDepartureIataForTrip(departureIata)
      : undefined;
    return buildTripcomPlannerFlightUrl(location, {
      departureIata: depart,
      tracking: 'event-detail-flight',
      mode: 'packages',
      departDate: checkIn,
      returnDate: checkOut,
      checkIn,
      checkOut,
      adultCount,
      childCount,
      partnerLocale: resolveTripcomPartnerLocale(i18n.language),
    });
  }, [location, checkIn, checkOut, adultCount, childCount, departureIata, i18n.language]);

  if (!location || !packageUrl) return null;

  const linkTarget = getTripcomPackageLinkTarget();
  const linkRel = getTripcomLinkRel(linkTarget);

  return (
    <a
      href={packageUrl}
      target={linkTarget}
      rel={linkRel}
      aria-label={t('worldEventDetail.stayStrip.flightCta')}
      className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-[11px] font-bold text-sky-900 no-underline transition-colors hover:bg-sky-100 active:scale-[0.98] ${className}`}
    >
      <Plane size={13} aria-hidden />
      {t('worldEventDetail.stayStrip.flightCta')}
    </a>
  );
}

function StayCard({ item, price }) {
  const productHref = item.productUrl ? buildMrtMylinkUrl(item.productUrl) : null;
  if (!productHref) return null;

  return (
    <a
      href={productHref}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex w-[148px] shrink-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40 sm:w-[168px]"
    >
      <div className="relative h-[88px] w-full bg-stone-100">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-stone-400">—</div>
        )}
      </div>
      <div className="space-y-0.5 p-2">
        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-stone-900">
          {item.itemName}
        </p>
        {price ? (
          <p className="truncate text-[10px] font-bold tabular-nums text-amber-800">{price}</p>
        ) : null}
      </div>
    </a>
  );
}

/**
 * @param {{
 *   event: import('../../utils/worldEvents').WorldEvent,
 *   location: Record<string, unknown>,
 *   checkIn: string,
 *   checkOut: string,
 *   visitPresets?: Array<{ id: string, checkIn: string, checkOut: string, nights: number }>,
 *   onDatesChange?: (next: { checkIn: string, checkOut: string }) => void,
 *   locale?: string,
 *   placeLabel?: string,
 * }} props
 */
export default function EventStayStrip({
  event,
  location,
  checkIn,
  checkOut,
  visitPresets = [],
  onDatesChange,
  locale = 'ko',
  placeLabel: placeLabelOverride,
}) {
  const { t, i18n } = useTranslation();
  const rootRef = useRef(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);
  const [guests, setGuests] = useState(() => normalizeMrtGuestCounts(2, 0));
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState('idle');
  const fetchedKeyRef = useRef('');

  const placeMeta = placeLabelOverride
    ? { label: placeLabelOverride }
    : getWorldEventPlaceMeta(event?.slug, locale);
  const eligible = canShowMrtStayStrip(location);
  const nights = mrtStayNights(checkIn, checkOut);
  const datesKey = `${checkIn}|${checkOut}|a${guests.adultCount}c${guests.childCount}`;
  const fetchKey = `${event?.id}|${datesKey}`;

  useEffect(() => {
    setDraftIn(checkIn);
    setDraftOut(checkOut);
  }, [checkIn, checkOut]);

  const applyDates = useCallback(
    (nextIn, nextOut) => {
      const synced = normalizeMrtStayDates(nextIn, nextOut);
      setDraftIn(synced.checkIn);
      setDraftOut(synced.checkOut);
      setCalendarOpen(false);
      onDatesChange?.(synced);
    },
    [onDatesChange],
  );

  const handleCalendarPick = useCallback(
    (nextIn, nextOut) => {
      applyDates(nextIn, nextOut);
    },
    [applyDates],
  );

  useEffect(() => {
    if (!calendarOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setCalendarOpen(false);
    };
    const onPointer = (e) => {
      if (!rootRef.current || rootRef.current.contains(e.target)) return;
      setCalendarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [calendarOpen]);

  useEffect(() => {
    if (!eligible) {
      setStatus('idle');
      setItems(null);
      return undefined;
    }
    if (fetchedKeyRef.current === fetchKey) return undefined;

    let cancelled = false;
    setStatus('loading');

    (async () => {
      const result = await fetchMrtStaysForLocation(location, {
        checkIn,
        checkOut,
        ...guests,
      });
      if (cancelled) return;
      fetchedKeyRef.current = fetchKey;
      if (result?.items?.length) {
        setItems(result.items.slice(0, 12));
        setStatus('ready');
      } else {
        setItems([]);
        setStatus('empty');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eligible, fetchKey, location, checkIn, checkOut, guests]);

  const flightArrivalIata = getPlannerFlightArrivalIata(location);
  const departureIata = resolveFlightDepartureIataForTrip('ICN');
  const showFlightCta = Boolean(location && flightArrivalIata);

  if (!eligible) return null;

  const presetLabel = (id) => t(`worldEventDetail.stayStrip.presets.${id}`, { defaultValue: id });

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-amber-700" aria-hidden />
        <h2 className="text-sm font-extrabold text-stone-900">{t('worldEventDetail.stayStrip.title')}</h2>
      </div>
      <p className="mt-1 text-xs text-stone-500">{t('worldEventDetail.stayStrip.hint')}</p>

      {visitPresets.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visitPresets.map((preset) => {
            const active = preset.checkIn === checkIn && preset.checkOut === checkOut;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyDates(preset.checkIn, preset.checkOut)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  active
                    ? 'border-amber-400 bg-amber-100 text-amber-950'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {presetLabel(preset.id)}
                <span className="ml-1 font-semibold text-stone-500">
                  {t('worldEventDetail.aiGuide.nights', { count: preset.nights })}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div ref={rootRef} className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-2.5">
        <button
          type="button"
          onClick={() => setCalendarOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left hover:border-amber-300"
        >
          <span className="text-xs font-semibold text-stone-500">{t('worldEventDetail.stayStrip.dates')}</span>
          <span className="text-sm font-bold tabular-nums text-stone-900">
            {formatStayDateLabel(draftIn)} – {formatStayDateLabel(draftOut)}
            <span className="ml-1 text-xs font-semibold text-amber-800">
              ({t('worldEventDetail.aiGuide.nights', { count: nights })})
            </span>
          </span>
          <CalendarDays size={14} className="shrink-0 text-amber-700" aria-hidden />
        </button>

        {calendarOpen ? (
          <div className="mt-2">
            <StayRangeCalendar
              checkIn={draftIn}
              checkOut={draftOut}
              todayYmd={todayYmd()}
              onPick={handleCalendarPick}
              onCancel={() => setCalendarOpen(false)}
              accent="sky"
              monthsVisible={1}
            />
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-2">
          <GuestStepper
            label={t('home.stayStrip.adult')}
            value={guests.adultCount}
            min={1}
            max={8}
            accent="light"
            onChange={(n) => setGuests((g) => normalizeMrtGuestCounts(n, g.childCount))}
          />
          <GuestStepper
            label={t('home.stayStrip.child')}
            value={guests.childCount}
            min={0}
            max={8}
            accent="light"
            onChange={(n) => setGuests((g) => normalizeMrtGuestCounts(g.adultCount, n))}
          />
          {showFlightCta ? (
            <span className="ml-auto">
              <EventFlightHotelCta
                location={location}
                checkIn={checkIn}
                checkOut={checkOut}
                adultCount={guests.adultCount}
                childCount={guests.childCount}
                departureIata={departureIata}
              />
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-2 flex items-center gap-1.5">
          <BedDouble size={14} className="text-amber-700" aria-hidden />
          <h3 className="text-xs font-extrabold text-stone-800">
            {t('worldEventDetail.stayStrip.staysTitle', { place: placeMeta.label })}
          </h3>
        </div>

        {status === 'loading' ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-stone-500">
            <Loader2 size={18} className="animate-spin text-amber-600" aria-hidden />
            {t('home.stayStrip.loadingStays')}
          </div>
        ) : null}

        {status === 'empty' ? (
          <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-3 py-6 text-center text-xs text-stone-500">
            {t('worldEventDetail.stayStrip.empty')}
          </p>
        ) : null}

        {status === 'ready' && items?.length ? (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {items.map((item) => (
              <StayCard
                key={item.itemId || item.productUrl || item.itemName}
                item={item}
                price={formatPrice(item.salePrice, t, i18n.language)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
