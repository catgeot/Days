import React from 'react';
import { Info, X } from 'lucide-react';
import { plannerCaption } from '../readableText';

/**
 * 항공 시네마 Bar 「여행 플랜」 진입 시 — 플래너 ICN 기준·Bar 출발지 차이 안내.
 * @param {{ cinemaOriginIata?: string | null, onDismiss?: () => void }} props
 */
export default function FlightCinemaPlannerNotice({ cinemaOriginIata = null, onDismiss }) {
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
          항공 경로 화면에서 이동했습니다. 아래 여행 플랜은{' '}
          <span className="font-semibold text-sky-900">인천(ICN) 출발</span> 기준입니다.
          {showOriginDiff ? (
            <>
              {' '}
              지도에서 선택한 출발지(
              <span className="font-mono font-semibold">{cinemaOriginIata}</span>
              )와 다를 수 있어요.
            </>
          ) : null}
        </p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sky-700/70 transition-colors hover:bg-sky-100/80 hover:text-sky-900"
            aria-label="안내 닫기"
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
