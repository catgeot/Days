import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * One booking row for an overseas arrival-airport → lodging leg.
 * `href` is already null when the flag is off or the airport has no listing.
 */
export default function AirportPickupLegRow({ href, light = true }) {
  const { t } = useTranslation();
  if (!href) return null;
  const className = light
    ? 'mt-3 inline-flex min-h-11 items-center rounded-xl border border-sky-900/25 bg-white px-3 text-sm font-bold text-sky-900 underline-offset-2 hover:bg-sky-50'
    : 'mt-3 inline-flex min-h-11 items-center rounded-xl border border-sky-100/40 bg-slate-950 px-3 text-sm font-bold text-sky-100 underline-offset-2 hover:bg-slate-900';
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      data-airport-pickup-row=""
      className={className}
      onClick={(event) => event.stopPropagation()}
    >
      {t('place.facts.airportPickup')}
    </a>
  );
}
