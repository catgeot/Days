import React, { useState } from 'react';
import { trackEvent } from '../../shared/analytics/trackEvent.js';
import {
  bookingClickParams,
  bookingProgramLabel,
  bookingScheduleText,
  visibleBookingListRows,
} from './lib/festivalBookingLinks.js';

const bookingButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-700';

function trackBookingClick(contentId, link, placement, uiLang) {
  trackEvent(
    'booking_click',
    bookingClickParams(contentId, link, { placement, uiLang }),
  );
}

function BookingRow({ contentId, link, uiLang, providerLabel }) {
  const name = bookingProgramLabel(link, uiLang);
  const schedule = bookingScheduleText(link);
  const price = String(link.priceText || '').trim();
  const detail = [name, schedule, price].filter(Boolean).join(' · ');
  return (
    <li className="flex items-start justify-between gap-3 border-t border-amber-100 py-2.5 first:border-t-0">
      <span className="min-w-0 text-sm leading-snug text-stone-800 break-keep">{detail}</span>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        data-festival-booking="list"
        className="shrink-0 text-sm font-bold text-amber-800 hover:text-amber-950"
        onClick={() => trackBookingClick(contentId, link, 'festival_detail_list', uiLang)}
      >
        {providerLabel}
        <span aria-hidden="true"> ↗</span>
      </a>
    </li>
  );
}

/**
 * Zero links: no DOM. One link: direct anchor. Two or more: inline list under the button.
 */
export function FestivalBookingActions({
  contentId,
  links,
  bookNowLabel,
  uiLang,
  programsTitle,
  moreLabel,
  providerLabel,
}) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (!Array.isArray(links) || links.length === 0) return null;

  if (links.length === 1) {
    const link = links[0];
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        data-festival-booking="top"
        className={bookingButtonClass}
        onClick={() => trackBookingClick(contentId, link, 'festival_detail_top', uiLang)}
      >
        {bookNowLabel}
        <span aria-hidden="true">↗</span>
      </a>
    );
  }

  const shown = visibleBookingListRows(links, { showAll });
  const hiddenCount = links.length - shown.length;

  return (
    <div data-festival-booking="group">
      <button
        type="button"
        className={bookingButtonClass}
        aria-expanded={open}
        data-festival-booking="toggle"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              trackEvent('booking_list_open', {
                festival_id: String(contentId ?? ''),
                item_count: links.length,
              });
            }
            return next;
          });
        }}
      >
        {bookNowLabel}
        <span aria-hidden="true">↗</span>
      </button>
      {open ? (
        <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-2" data-festival-booking-list="">
          {programsTitle ? (
            <p className="pb-1 text-xs font-bold text-stone-700">{programsTitle}</p>
          ) : null}
          <ul>
            {shown.map((link) => (
              <BookingRow
                key={link.id}
                contentId={contentId}
                link={link}
                uiLang={uiLang}
                providerLabel={providerLabel}
              />
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <button
              type="button"
              className="mt-1 w-full py-2 text-sm font-bold text-amber-900"
              data-festival-booking-more=""
              onClick={() => setShowAll(true)}
            >
              {moreLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
