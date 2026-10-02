import React from 'react';
import { trackEvent } from '../../shared/analytics/trackEvent.js';
import { bookingClickParams } from './lib/festivalBookingLinks.js';

const bookingButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-700';

/**
 * Single direct booking link. Zero links render nothing (no fallback copy).
 * Two or more links are handled when the list UI is present; until then they stay hidden.
 */
export function FestivalBookingActions({
  contentId,
  links,
  bookNowLabel,
  uiLang,
}) {
  if (!Array.isArray(links) || links.length !== 1) return null;
  const link = links[0];
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      data-festival-booking="top"
      className={bookingButtonClass}
      onClick={() => {
        trackEvent(
          'booking_click',
          bookingClickParams(contentId, link, {
            placement: 'festival_detail_top',
            uiLang,
          }),
        );
      }}
    >
      {bookNowLabel}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
