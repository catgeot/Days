import React from 'react';
import { useTranslation } from 'react-i18next';
import { getRentalAirportDisplayName } from '../../utils/rentalAirportMatch.js';

/**
 * Secondary booking row for an overseas arrival-airport → lodging leg.
 * Light (MOONi): slate-900 / slate-800 on slate-100.
 * Dark (place card): sky-50 / sky-100 on slate-800.
 */
export default function AirportPickupLegRow({ row, light = true, className = '' }) {
  const { t, i18n } = useTranslation();
  if (!row?.href) return null;
  const airport = getRentalAirportDisplayName(row.iata, i18n.language) || row.iata;
  const place = String(i18n.language || '').toLowerCase().startsWith('en')
    ? row.placeEn
    : row.placeKo;
  const title = place
    ? t('place.facts.airportPickupLeg', { airport, iata: row.iata, place })
    : t('place.facts.airportPickupLegNoPlace', { airport, iata: row.iata });
  const partner = row.partner === 'mrt'
    ? t('place.facts.airportPickupPartnerMrt')
    : t('place.facts.airportPickupPartnerTrip');
  const shell = light
    ? 'flex w-full flex-col items-start gap-0.5 rounded-lg border border-slate-700 bg-slate-100 px-3 py-2.5 text-left'
    : 'flex w-full flex-col items-start gap-0.5 rounded-lg border border-sky-100/35 bg-slate-800 px-3 py-2.5 text-left';
  const titleClass = light
    ? 'text-sm font-bold leading-snug text-slate-900 break-keep'
    : 'text-sm font-bold leading-snug text-sky-50 break-keep';
  const subClass = light
    ? 'text-[11px] font-semibold leading-snug text-slate-800 break-keep'
    : 'text-[11px] font-semibold leading-snug text-sky-100 break-keep';
  return (
    <a
      href={row.href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      data-airport-pickup-row=""
      data-airport-pickup-partner={row.partner}
      className={`${shell} ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      <span className={titleClass}>{title}</span>
      <span className={subClass}>{partner}</span>
    </a>
  );
}
