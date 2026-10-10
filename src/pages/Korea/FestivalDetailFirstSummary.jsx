import React from 'react';
import { ExternalLink } from 'lucide-react';

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
 *   bookingSlot?: React.ReactNode,
 *   mooniSlot?: React.ReactNode,
 *   footnote?: React.ReactNode,
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
  bookingSlot,
  mooniSlot,
  footnote = null,
}) {
  const showOfficial = Boolean(homepage) && !hideOfficialHomepage;
  const hasFacts =
    dateText || timeText || feeText || placeText || bookingSlot || mooniSlot || showOfficial || footnote;
  if (!hasFacts) return null;

  return (
    <section
      data-festival-detail-summary=""
      className="rounded-2xl border border-stone-200/90 bg-gradient-to-b from-stone-50/90 to-white px-3.5 py-3 shadow-sm"
    >
      <dl className="space-y-2">
        <SummaryRow label={dateLabel} dataKey="date">
          {dateText}
        </SummaryRow>
        <SummaryRow label={timeLabel} dataKey="time">
          {timeText}
        </SummaryRow>
        <SummaryRow label={feeLabel} dataKey="fee">
          {feeText}
        </SummaryRow>
        <SummaryRow label={placeLabel} dataKey="place">
          {placeText}
        </SummaryRow>
      </dl>
      {footnote}
      {(bookingSlot || mooniSlot || showOfficial) && (
        <div className="mt-3 flex flex-col gap-2">
          {bookingSlot}
          {mooniSlot}
          {showOfficial ? (
            <a
              href={homepage}
              target="_blank"
              rel="noopener noreferrer"
              data-festival-official-home=""
              className={officialLinkClass}
            >
              <ExternalLink size={14} aria-hidden="true" />
              {officialLabel}
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}
