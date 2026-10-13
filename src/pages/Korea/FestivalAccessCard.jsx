import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  bookingLink,
  buildAccessView,
  fetchFestivalTransportCard,
  formatClockRange,
  formatDurationRange,
  formatFareRange,
  formatRunCount,
  groupOptionsByMode,
  preferredOriginId,
  resolveFestivalTrainDate,
  shouldQueryFestivalTransport,
} from './lib/festivalTransportCard.js';

const MODE_LABEL = {
  train: 'korea.festival.detail.accessTrain',
  expBus: 'korea.festival.detail.accessExpBus',
  suburbsBus: 'korea.festival.detail.accessSuburbsBus',
};

const askClass =
  'flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 transition-colors hover:border-amber-300 hover:bg-amber-50';

function OptionRow({ option, locale }) {
  const clock = formatClockRange(option.firstDeparture, option.lastDeparture, locale);
  const duration = formatDurationRange(option.durationMin, option.durationMax, locale);
  const fare = formatFareRange(option.fareAdultMin, option.fareAdultMax, locale);
  const count = formatRunCount(option, locale);
  const grade = String(option.grade || '').trim();
  const facts = [grade, clock, duration, fare, count].filter(Boolean);
  const book = bookingLink(option, locale);
  return (
    <li
      className="rounded-xl border border-stone-200 bg-white px-3 py-2"
      data-festival-access-row=""
      data-festival-access-mode={option.mode}
    >
      <p className="text-sm font-bold leading-snug text-stone-900 break-keep">
        {option.depStation}
        <span aria-hidden="true"> → </span>
        {option.arrStation}
      </p>
      {facts.length > 0 ? (
        <p className="mt-0.5 text-xs leading-snug text-stone-600 break-keep">{facts.join(' · ')}</p>
      ) : null}
      {book ? (
        <a
          href={book.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex text-xs font-bold text-amber-800 hover:text-amber-950"
        >
          {book.text}
        </a>
      ) : null}
    </li>
  );
}

function OptionGroups({ options, locale, t }) {
  const groups = groupOptionsByMode(options);
  if (!groups.length) return null;
  return groups.map((group) => (
    <div key={group.mode} className="space-y-1.5">
      <p className="text-[11px] font-bold text-stone-500">{t(MODE_LABEL[group.mode])}</p>
      <ul className="space-y-1.5">
        {group.options.map((option) => (
          <OptionRow
            key={`${option.mode}|${option.depStationId}|${option.arrStationId}|${option.grade}|${option.firstDeparture}`}
            option={option}
            locale={locale}
          />
        ))}
      </ul>
    </div>
  ));
}

/**
 * TAGO card for the three probed festivals. Other festivals render nothing.
 * @param {{
 *   contentId?: string,
 *   eventStartDate?: string,
 *   eventEndDate?: string,
 *   detailSettled?: boolean,
 *   onAskMooni?: ((event: React.MouseEvent) => void) | null,
 * }} props
 */
export default function FestivalAccessCard({
  contentId,
  eventStartDate,
  eventEndDate,
  detailSettled = false,
  onAskMooni = null,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const supported = shouldQueryFestivalTransport(contentId);
  const trainDate = useMemo(() => {
    if (!supported) return null;
    if (!detailSettled && !eventStartDate && !eventEndDate) return null;
    return resolveFestivalTrainDate(eventStartDate, eventEndDate);
  }, [supported, detailSettled, eventStartDate, eventEndDate]);
  const [phase, setPhase] = useState(supported ? 'loading' : 'unsupported');
  const [view, setView] = useState(null);
  const [originId, setOriginId] = useState('');

  useEffect(() => {
    if (!supported) return undefined;
    if (!detailSettled && !eventStartDate && !eventEndDate) return undefined;
    if (!trainDate) {
      setPhase('outOfRange');
      setView(null);
      return undefined;
    }
    let cancel = false;
    setPhase('loading');
    setView(null);
    fetchFestivalTransportCard({ contentId, trainDate }).then((result) => {
      if (cancel) return;
      if (result.status !== 'ready') {
        setPhase(result.status === 'outOfRange' ? 'outOfRange' : 'unavailable');
        setView(null);
        return;
      }
      const next = buildAccessView(result.card);
      setView(next);
      setOriginId(preferredOriginId(next.origins));
      setPhase(next.status);
    });
    return () => {
      cancel = true;
    };
  }, [supported, contentId, trainDate, detailSettled, eventStartDate, eventEndDate]);

  if (!supported) return null;

  const origin = view?.origins?.find((row) => row.originId === originId) || view?.origins?.[0] || null;
  const source = phase === 'ready' ? view?.source : null;

  return (
    <section className="space-y-2 pt-1" id="festival-access" data-festival-section="access">
      <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
        {t('korea.festival.detail.accessTitle')}
      </p>
      <div
        className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-3"
        data-festival-access-status={phase}
      >
        {phase === 'loading' ? (
          <div className="flex items-center gap-2 py-1 text-sm text-stone-500">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            {t('korea.festival.detail.accessLoading')}
          </div>
        ) : null}
        {phase === 'unavailable' ? (
          <p className="text-xs text-stone-500">{t('korea.festival.detail.accessUnavailable')}</p>
        ) : null}
        {phase === 'empty' ? (
          <p className="text-xs text-stone-500">{t('korea.festival.detail.accessEmpty')}</p>
        ) : null}
        {phase === 'outOfRange' ? (
          <p className="text-xs text-stone-500">{t('korea.festival.detail.accessOutOfRange')}</p>
        ) : null}
        {phase === 'ready' && origin ? (
          <>
            {view.origins.length > 1 ? (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label={t('korea.festival.detail.accessOrigins')}>
                {view.origins.map((row) => {
                  const selected = row.originId === origin.originId;
                  return (
                    <button
                      key={row.originId}
                      type="button"
                      aria-pressed={selected}
                      data-festival-access-origin={row.originId}
                      onClick={() => setOriginId(row.originId)}
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${
                        selected
                          ? 'border-amber-400 bg-amber-50 text-amber-950'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}
                    >
                      {row.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-bold text-stone-700">{origin.label}</p>
            )}
            <OptionGroups options={origin.direct} locale={locale} t={t} />
            {origin.hops.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-stone-500">{t('korea.festival.detail.accessTransfer')}</p>
                <OptionGroups options={origin.hops} locale={locale} t={t} />
              </div>
            ) : null}
            {origin.arexUnverified ? (
              <p className="text-xs leading-snug text-stone-500">{t('korea.festival.detail.accessArex')}</p>
            ) : null}
            {source ? (
              <p className="text-[11px] leading-snug text-stone-500 break-keep">
                {[
                  source.source,
                  source.trainDate
                    ? t('korea.festival.detail.accessTrainDate', { date: source.trainDate })
                    : '',
                  source.busDate
                    ? t('korea.festival.detail.accessBusDate', { date: source.busDate })
                    : '',
                ].filter(Boolean).join(' · ')}
                {source.busSameDayOnly ? ` · ${t('korea.festival.detail.accessBusSameDay')}` : ''}
              </p>
            ) : null}
          </>
        ) : null}
        {onAskMooni ? (
          <button type="button" data-festival-access-mooni="" onClick={onAskMooni} className={askClass}>
            {t('korea.festival.detail.accessAskMooni')}
          </button>
        ) : null}
      </div>
    </section>
  );
}
