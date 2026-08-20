import React from 'react';
import { Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { plannerCaption } from '../readableText';

/**
 * 항공 시네마 Bar 「여행 플랜」 진입 시 — 플래너 ICN 기준·Bar 출발지 차이 안내.
 * @param {{ cinemaOriginIata?: string | null, onDismiss?: () => void }} props
 */
export default function FlightCinemaPlannerNotice({ cinemaOriginIata = null, onDismiss }) {
  const { t } = useTranslation();
  const showOriginDiff =
    cinemaOriginIata && cinemaOriginIata !== 'ICN';

  return (
    <div
      role="status"
      className="mb-4 shrink-0 rounded-xl border border-sky-200/90 bg-gradient-to-r from-sky-50 to-blue-50/80 px-3 py-2.5 shadow-sm"
    >
      <div className="flex items-start gap-2">
        <Info size={16} className="mt-0.5 shrink-0 text-sky-600" aria-hidden="true" />
        <p className={`min-w-0 flex-1 ${plannerCaption} text-sky-950/90`}>
          {t('place.planner.banners.cinemaNotice.intro')}{' '}
          <span className="font-semibold text-sky-900">
            {t('place.planner.banners.cinemaNotice.icnDepart')}
          </span>{' '}
          {t('place.planner.banners.cinemaNotice.basis')}
          {showOriginDiff ? (
            <>
              {' '}
              {t('place.planner.banners.cinemaNotice.originDiff', { iata: cinemaOriginIata })}
            </>
          ) : null}
        </p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sky-700/70 transition-colors hover:bg-sky-100/80 hover:text-sky-900"
            aria-label={t('place.planner.banners.cinemaNotice.dismiss')}
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
