import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { splitCardAccessNumberTokens } from '../../components/chat/mooniAccessNumberToken.js';
import {
  bookingLink,
  buildAccessView,
  buildTrainGradeDetail,
  buildTrainGradeSummary,
  fetchFestivalTransportCard,
  formatClockRange,
  formatDurationRange,
  formatFareRange,
  formatRunCount,
  groupOptionsByMode,
  preferredOriginId,
  selectAccessCards,
  transportFactsFromView,
  tripComLink,
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

function Nowrap({ children }) {
  return (
    <span className="whitespace-nowrap break-normal" data-mooni-access-number="true">
      {children}
    </span>
  );
}

/** MOONi answer span. word-break:normal blocks ancestor break-keep from splitting 46,600원 in WebKit. */
function AccessNumberText({ text }) {
  const parts = splitCardAccessNumberTokens(text);
  if (parts.length === 1 && !parts[0].accessNumber) return parts[0].text;
  return parts.map((part, index) => (
    part.accessNumber
      ? (
        <span
          key={index}
          style={{ whiteSpace: 'nowrap', wordBreak: 'normal' }}
          data-mooni-access-number="true"
        >
          {part.text}
        </span>
      )
      : <span key={index}>{part.text}</span>
  ));
}

function GradeLine({ option, locale }) {
  const clock = formatClockRange(option.firstDeparture, option.lastDeparture, locale);
  const duration = formatDurationRange(option.durationMin, option.durationMax, locale);
  const fare = formatFareRange(option.fareAdultMin, option.fareAdultMax, locale);
  const count = formatRunCount(option, locale);
  const grade = String(option.grade || '').trim();
  const pieces = [
    grade,
    clock ? <Nowrap>{clock}</Nowrap> : '',
    duration ? <Nowrap>{duration}</Nowrap> : '',
    fare ? <Nowrap>{fare}</Nowrap> : '',
    count,
  ].filter(Boolean);
  if (!pieces.length) return null;
  return (
    <li className="text-xs leading-snug text-stone-600 break-keep" data-festival-access-grade="">
      {pieces.map((piece, index) => (
        <span key={index}>
          {index > 0 ? ' · ' : null}
          {piece}
        </span>
      ))}
    </li>
  );
}

function SummaryLine({ line }) {
  return (
    <p className="text-sm leading-snug text-stone-800 break-keep" data-festival-access-summary-line="">
      {(line.parts || []).map((part, index) => (
        part.strong
          ? <strong key={index} className="font-bold text-stone-950"><AccessNumberText text={part.text} /></strong>
          : <span key={index}><AccessNumberText text={part.text} /></span>
      ))}
    </p>
  );
}

function BookingBlock({ book, trip, t }) {
  if (!book && !trip) return null;
  return (
    <div className="mt-2 space-y-2">
      {book ? (
        <div>
          <a
            href={book.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-bold text-amber-800 hover:text-amber-950"
            data-festival-access-book=""
          >
            {book.text}
          </a>
          {book.segment ? (
            <p className="mt-0.5 text-xs leading-snug text-stone-500 break-keep" data-festival-access-pick="">
              {t('korea.festival.detail.accessPickSegment', book.segment)}
            </p>
          ) : null}
        </div>
      ) : null}
      {trip ? (
        <div>
          <a
            href={trip.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-semibold text-stone-700 hover:text-stone-950"
            data-festival-access-trip=""
          >
            {trip.text}
          </a>
          <p className="mt-0.5 text-xs leading-snug text-stone-500 break-keep" data-festival-access-trip-note="">
            {t('korea.festival.detail.accessTripNote')}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function TrainGradeDetails({ rows, locale }) {
  return (
    <ul className="mt-2 space-y-2.5 border-t border-stone-100 pt-2" data-festival-access-grades="" style={{ overflowAnchor: 'none' }}>
      {rows.map((option) => {
        const detail = buildTrainGradeDetail(option, locale);
        return (
          <li
            key={`${option.grade}|${option.firstDeparture}|${option.fareAdultMin}`}
            className="flex items-start justify-between gap-3"
            data-festival-access-grade=""
          >
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug text-stone-900 break-keep">{detail.grade}</p>
              <p className="text-xs leading-snug text-stone-500"><AccessNumberText text={detail.clock} /></p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs leading-snug text-stone-700"><AccessNumberText text={detail.durationText} /></p>
              <p className="text-xs leading-snug text-stone-500"><AccessNumberText text={detail.aside} /></p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TrainSegmentBody({ segment, locale, trainDate, t }) {
  const summary = buildTrainGradeSummary(segment.rows, { locale, trainDate });
  const [open, setOpen] = useState(false);
  const scrollPinRef = useRef(null);
  const book = bookingLink(segment.rows[0], locale);
  const trip = tripComLink(segment.rows[0], locale);
  useLayoutEffect(() => {
    const pin = scrollPinRef.current;
    if (!pin) return;
    const { scroller, top } = pin;
    const restore = () => {
      if (scroller.scrollTop !== top) scroller.scrollTop = top;
    };
    restore();
    scroller.addEventListener('scroll', restore);
    scrollPinRef.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scroller.removeEventListener('scroll', restore);
        restore();
      });
    });
  }, [open]);
  return (
    <>
      <div className="mt-1.5 space-y-1" data-festival-access-summary="">
        {summary.lines.map((line, index) => (
          <SummaryLine key={index} line={line} />
        ))}
      </div>
      <BookingBlock book={book} trip={trip} t={t} />
      {summary.expandable ? (
        <button
          type="button"
          className="mt-2 text-sm font-bold text-stone-900 underline underline-offset-2"
          data-festival-access-more=""
          aria-expanded={open}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            // WebKit anchors the sheet when the grade list mounts. Freeze this toggle.
            const scroller = event.currentTarget.closest('[role="dialog"]');
            if (scroller) {
              scroller.style.overflowAnchor = 'none';
              scrollPinRef.current = { scroller, top: scroller.scrollTop };
            }
            setOpen((value) => !value);
          }}
        >
          {open
            ? t('korea.festival.detail.accessFewerTrains')
            : t('korea.festival.detail.accessMoreTrains', { count: summary.gradeCount })}
        </button>
      ) : null}
      {open ? <TrainGradeDetails rows={segment.rows} locale={locale} /> : null}
    </>
  );
}

function SegmentCard({ segment, locale, trainDate, t }) {
  const train = segment.mode === 'train';
  const book = train ? null : bookingLink(segment.rows[0], locale);
  return (
    <li
      className="rounded-xl border border-stone-200 bg-white px-3 py-2.5"
      data-festival-access-row=""
      data-festival-access-segment={`${segment.depStation}|${segment.arrStation}|${segment.mode}`}
      data-festival-access-mode={segment.mode}
    >
      <p className="text-sm font-bold leading-snug text-stone-900 break-keep">
        {segment.depStation}
        <span aria-hidden="true"> → </span>
        {segment.arrStation}
      </p>
      {train ? (
        <TrainSegmentBody segment={segment} locale={locale} trainDate={trainDate} t={t} />
      ) : (
        <>
          <ul className="mt-1 space-y-0.5">
            {segment.rows.map((option) => (
              <GradeLine
                key={`${option.grade}|${option.firstDeparture}|${option.fareAdultMin}`}
                option={option}
                locale={locale}
              />
            ))}
          </ul>
          <BookingBlock book={book} trip={null} t={t} />
        </>
      )}
    </li>
  );
}

function SegmentGroups({ cards, locale, trainDate, t }) {
  const groups = groupOptionsByMode(cards);
  if (!groups.length) return null;
  return groups.map((group) => (
    <div key={group.mode} className="space-y-1.5">
      <p className="text-[11px] font-bold text-stone-500">{t(MODE_LABEL[group.mode])}</p>
      <ul className="space-y-1.5">
        {group.options.map((segment) => (
          <SegmentCard
            key={segment.key}
            segment={segment}
            locale={locale}
            trainDate={trainDate}
            t={t}
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
 *   onTransportFacts?: (facts: Record<string, unknown> | null) => void,
 * }} props
 */
export default function FestivalAccessCard({
  contentId,
  eventStartDate,
  eventEndDate,
  detailSettled = false,
  onAskMooni = null,
  onTransportFacts = null,
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
      setOriginId(preferredOriginId(next.origins, contentId));
      setPhase(next.status);
    });
    return () => {
      cancel = true;
    };
  }, [supported, contentId, trainDate, detailSettled, eventStartDate, eventEndDate]);

  const origin = view?.origins?.find((row) => row.originId === originId) || view?.origins?.[0] || null;

  useEffect(() => {
    if (!onTransportFacts) return;
    if (phase !== 'ready' || !origin) {
      onTransportFacts(null);
      return;
    }
    onTransportFacts(transportFactsFromView(view, origin, locale));
  }, [onTransportFacts, phase, origin, view, locale]);

  if (!supported) return null;

  const source = phase === 'ready' ? view?.source : null;
  const cards = phase === 'ready' && origin ? selectAccessCards(origin) : [];
  const directCards = cards.filter((card) => !card.transfer);
  const transferCards = cards.filter((card) => card.transfer);

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
            <SegmentGroups cards={directCards} locale={locale} trainDate={source?.trainDate || ''} t={t} />
            {transferCards.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-stone-500">{t('korea.festival.detail.accessTransfer')}</p>
                <SegmentGroups cards={transferCards} locale={locale} trainDate={source?.trainDate || ''} t={t} />
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
