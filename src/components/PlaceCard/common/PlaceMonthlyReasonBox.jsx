import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  placeMonthlyReasonCopy,
  readPlaceMonthlyPickKey,
  resolvePlaceMonthlyPick,
} from '../../../pages/Home/lib/placeMonthlyReason.js';

/**
 * Compact “why this month” note. Sits above the place intro.
 */
export default function PlaceMonthlyReasonBox({ location, className = '' }) {
  const { t, i18n } = useTranslation();
  const route = useLocation();
  const { slug: routeSlug } = useParams();
  const slug = location?.slug || location?.canonical_slug || routeSlug;
  const pick = resolvePlaceMonthlyPick({
    slug,
    now: new Date(),
    monthKey: readPlaceMonthlyPickKey(route.search),
  });
  const copy = placeMonthlyReasonCopy(pick, i18n.language);
  if (!copy) return null;

  return (
    <aside
      data-testid="place-monthly-reason"
      data-month-key={copy.monthKey}
      className={`rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2.5 ${className}`.trim()}
    >
      <p className="text-[10px] font-bold tracking-wide text-amber-200/95">
        {t('place.monthlyReason.kicker', { month: copy.monthLabel })}
      </p>
      <p
        data-testid="place-monthly-reason-title"
        className="mt-1 break-keep text-[13px] font-semibold leading-snug text-white"
      >
        {copy.reason}
      </p>
      {copy.best ? (
        <p
          data-testid="place-monthly-reason-best"
          className="mt-1 break-keep text-[12px] leading-snug text-gray-100/95"
        >
          {copy.best}
        </p>
      ) : null}
      <p className="mt-1.5 text-[11px] leading-snug text-gray-400">
        {t('place.monthlyReason.source')}
        {' '}
        {copy.sources.map((source, index) => (
          <React.Fragment key={source.url}>
            {index > 0 ? ' · ' : null}
            <a
              data-testid="place-monthly-reason-source"
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sky-300/95 underline decoration-sky-300/40 underline-offset-2"
            >
              {source.label}
            </a>
          </React.Fragment>
        ))}
      </p>
    </aside>
  );
}
