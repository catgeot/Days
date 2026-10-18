import React, { useLayoutEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

function ReserveLine() {
  return (
    <span
      className="inline-block h-5 w-28 rounded bg-stone-200/80"
      data-festival-summary-reserve=""
      aria-hidden="true"
    />
  );
}

function SummaryRow({ label, children, dataKey }) {
  if (!children) return null;
  return (
    <div className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-2 gap-y-0.5 sm:grid-cols-[4.75rem_minmax(0,1fr)]">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-stone-400 pt-0.5">
        {label}
      </dt>
      <dd
        className="text-sm font-medium leading-snug text-stone-800 whitespace-pre-wrap break-keep"
        {...(dataKey ? { [`data-festival-summary-${dataKey}`]: '' } : {})}
      >
        {children}
      </dd>
    </div>
  );
}

const officialLinkClass =
  'flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-bold text-stone-800 transition-colors hover:border-stone-300 hover:bg-stone-100';

/**
 * @param {{
 *   dateLabel: string,
 *   timeLabel: string,
 *   feeLabel: string,
 *   placeLabel: string,
 *   dateText?: string,
 *   timeText?: string,
 *   feeText?: string | null,
 *   placeText?: string,
 *   homepage?: string,
 *   hideOfficialHomepage?: boolean,
 *   officialLabel: string,
 *   officialHttpNotice?: string | null,
 *   onOfficialHomeClick?: () => void,
 *   bookingSlot?: React.ReactNode,
 *   mooniSlot?: React.ReactNode,
 *   footnote?: React.ReactNode,
 *   hideEventHours?: boolean,
 * }} props
 */
export function FestivalDetailFirstSummary({
  dateLabel,
  timeLabel,
  feeLabel,
  placeLabel,
  dateText,
  timeText,
  feeText,
  placeText,
  homepage,
  hideOfficialHomepage,
  officialLabel,
  officialHttpNotice = null,
  onOfficialHomeClick,
  bookingSlot,
  mooniSlot,
  footnote = null,
  reserveDetail = false,
  hideEventHours = false,
}) {
  const showOfficial = Boolean(homepage) && !hideOfficialHomepage;
  const reserveTime = reserveDetail && !timeText && !hideEventHours;
  const reserveFee = reserveDetail && !feeText;
  const reservePlaceLine = reserveDetail && placeText && !String(placeText).includes('\n');
  const reserveOfficial = reserveDetail && !showOfficial;
  const reserveSlack = reserveTime || reserveFee || reservePlaceLine || reserveOfficial;
  const sectionRef = useRef(null);
  const sectionMin = useRef(0);
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!reserveDetail || !el) return;
    const height = Math.ceil(el.getBoundingClientRect().height);
    if (height > 0) sectionMin.current = height;
  }, [reserveDetail, reserveSlack, timeText, feeText, placeText, showOfficial]);
  const hasFacts =
    dateText || timeText || feeText || placeText || bookingSlot || mooniSlot || showOfficial || footnote
    || reserveTime || reserveFee || reserveOfficial;
  if (!hasFacts) return null;

  return (
    <section
      ref={sectionRef}
      data-festival-detail-summary=""
      className="rounded-2xl border border-stone-200/90 bg-gradient-to-b from-stone-50/90 to-white px-3.5 py-3 shadow-sm"
      style={reserveDetail && sectionMin.current > 0 ? { minHeight: sectionMin.current } : undefined}
    >
      <dl className="space-y-2">
        <SummaryRow label={dateLabel} dataKey="date">
          {dateText}
        </SummaryRow>
        {hideEventHours && !timeText ? null : (
          <SummaryRow label={timeLabel} dataKey="time">
            {timeText || (reserveTime ? <ReserveLine /> : null)}
          </SummaryRow>
        )}
        <SummaryRow label={feeLabel} dataKey="fee">
          {feeText || (reserveFee ? <ReserveLine /> : null)}
        </SummaryRow>
        <SummaryRow label={placeLabel} dataKey="place">
          {placeText ? (
            <>
              {placeText}
              {reservePlaceLine ? '\n\u00a0' : null}
            </>
          ) : null}
        </SummaryRow>
      </dl>
      {reserveSlack ? <div className="h-2.5" data-festival-summary-slack="" aria-hidden="true" /> : null}
      {footnote}
      {(bookingSlot || mooniSlot || showOfficial || reserveOfficial) && (
        <div className="mt-3 flex flex-col gap-2">
          {bookingSlot}
          {mooniSlot}
          {showOfficial ? (
            <div className="flex flex-col gap-1.5">
              <a
                href={homepage}
                target="_blank"
                rel="noopener noreferrer"
                data-festival-official-home=""
                className={officialLinkClass}
                onClick={() => onOfficialHomeClick?.()}
              >
                <ExternalLink size={14} aria-hidden="true" />
                {officialLabel}
              </a>
              {officialHttpNotice ? (
                <p
                  className="px-1 text-[11px] font-medium leading-snug text-stone-500"
                  data-festival-official-home-http-notice=""
                >
                  {officialHttpNotice}
                </p>
              ) : null}
            </div>
          ) : reserveOfficial ? (
            <div className={`${officialLinkClass} text-transparent`} aria-hidden="true">
              <ExternalLink size={14} aria-hidden="true" />
              {officialLabel}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
