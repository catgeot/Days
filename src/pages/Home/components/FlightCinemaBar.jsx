import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutList, Plane } from 'lucide-react';

const ROUTE_META = '대권 항로(실제 비행경로와 다를 수 있습니다.)';

/**
 * @param {{
 *   routeIatas?: string[],
 *   flightHours?: number,
 *   flightLegHours?: { fromIata: string, toIata: string, hours: number }[],
 *   isConnecting?: boolean,
 * }} props
 */
function FlightRouteSummary({
  routeIatas = [],
  flightHours = 1,
  flightLegHours = [],
  isConnecting = false,
}) {
  const codes = routeIatas.filter(Boolean);
  const legs = flightLegHours.filter(Boolean);
  const connectionLabel = isConnecting ? '경유' : '직항';
  const showLegTimes = isConnecting && legs.length > 0 && codes.length >= 2;

  if (!codes.length) return null;

  if (!showLegTimes) {
    return (
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-bold text-white break-keep">{codes.join(' → ')}</p>
        <p className="mt-0.5 text-[10px] font-medium text-white/45 break-keep">
          약 {flightHours}시간 · {connectionLabel} · {ROUTE_META}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full leading-tight">
      <p
        className="overflow-x-auto whitespace-nowrap text-sm leading-snug [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`${codes.join(' 경유 ')} 총 약 ${flightHours}시간`}
      >
        {codes.map((code, index) => (
          <React.Fragment key={`${code}-${index}`}>
            <span className="font-bold tabular-nums text-white">{code}</span>
            {index < legs.length ? (
              <span className="mx-1 text-[10px] font-medium tabular-nums text-sky-300/85 sm:mx-1.5">
                ~{legs[index].hours}h
              </span>
            ) : null}
          </React.Fragment>
        ))}
        <span className="ml-1 text-[11px] font-semibold text-sky-200/90">
          (총 {flightHours}h)
        </span>
      </p>
      <p className="mt-0.5 text-[10px] font-medium text-white/45 break-keep">{ROUTE_META}</p>
    </div>
  );
}

/**
 * Flight OD arc cinema — 홈 지구본 미리보기 (여행 플랜 · 닫기).
 */
export default function FlightCinemaBar({
  routeIatas,
  flightHours,
  flightLegHours = [],
  isConnecting = false,
  plannerUrl = null,
  onClose,
  className = '',
}) {
  const routeAria = Array.isArray(routeIatas) && routeIatas.length >= 2
    ? routeIatas.join(' 경유 ')
    : '';

  return (
    <div
      className={`pointer-events-auto animate-fade-in-down ${className}`}
      role="region"
      aria-label={routeAria ? `항공 경로 ${routeAria}` : '항공 경로 시네마'}
    >
      <div className="flight-cinema-bar-shell relative">
        <div className="flight-cinema-bar-halo" aria-hidden="true" />
        <div className="flight-cinema-bar-card relative z-[1] flex flex-col gap-2 rounded-2xl border bg-black/85 px-3 py-2 backdrop-blur-xl md:px-4 md:py-2.5">
          <div className="flex min-w-0 items-start gap-2">
            <Plane size={16} className="mt-0.5 shrink-0 text-sky-300" aria-hidden="true" />
            <FlightRouteSummary
              routeIatas={routeIatas}
              flightHours={flightHours}
              flightLegHours={flightLegHours}
              isConnecting={isConnecting}
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {plannerUrl ? (
              <Link
                to={plannerUrl}
                onClick={onClose}
                title="플래너 탭에서 전체 여정 보기"
                className="flight-cinema-bar-planner shrink-0 inline-flex items-center gap-1 rounded-lg border border-violet-200/70 bg-gradient-to-b from-violet-500/55 to-violet-600/45 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all hover:from-violet-400/65 hover:to-violet-500/55 active:scale-[0.98] sm:gap-1.5 sm:px-3 sm:text-xs"
              >
                <LayoutList size={13} className="opacity-95" aria-hidden="true" />
                여행 플랜
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto shrink-0 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all active:scale-[0.98] sm:px-3 sm:text-xs"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
