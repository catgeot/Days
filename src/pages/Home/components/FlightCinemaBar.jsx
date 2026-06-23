import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutList, Loader2, Plane } from 'lucide-react';
import { getPlaceTitleLines } from '../../../components/PlaceCard/common/locationDisplay';
import FlightOriginSelector from './FlightOriginSelector.jsx';

const ROUTE_META = '대권 항로(실제 비행경로와 다를 수 있습니다.)';

/**
 * @param {{
 *   routeIatas?: string[],
 *   flightHours?: number,
 *   flightLegHours?: { fromIata: string, toIata: string, hours: number }[],
 *   timezoneDiffHint?: string | null,
 *   isPending?: boolean,
 * }} props
 */
function FlightRouteSummary({
  routeIatas = [],
  flightHours = 1,
  flightLegHours = [],
  timezoneDiffHint = null,
  isPending = false,
}) {
  const codes = routeIatas.filter(Boolean);
  const legs = flightLegHours.filter(Boolean);
  const showLegTimes = legs.length > 0 && codes.length >= 2;

  if (!codes.length) return null;

  const content = !showLegTimes ? (
    <div className="min-w-0 leading-tight">
      <p className="text-sm font-bold text-white break-keep">{codes.join(' → ')}</p>
      {timezoneDiffHint ? (
        <p className="mt-0.5 text-[10px] font-medium text-sky-200/75 break-keep">{timezoneDiffHint}</p>
      ) : null}
      <p className="mt-0.5 text-[10px] font-medium text-white/45 break-keep">{ROUTE_META}</p>
    </div>
  ) : (
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
      {timezoneDiffHint ? (
        <p className="mt-0.5 text-[10px] font-medium text-sky-200/75 break-keep">{timezoneDiffHint}</p>
      ) : null}
      <p className="mt-0.5 text-[10px] font-medium text-white/45 break-keep">{ROUTE_META}</p>
    </div>
  );

  return (
    <div
      className={`min-w-0 flex-1 transition-opacity ${isPending ? 'opacity-60' : ''}`}
      aria-busy={isPending}
    >
      {content}
    </div>
  );
}

/**
 * @param {{
 *   alternatives?: Array<{ key: string, label: string, flightHours?: number }>,
 *   selectedKey?: string | null,
 *   disabled?: boolean,
 *   onSelect?: (key: string) => void,
 * }} props
 */
function FlightRouteAlternatives({
  alternatives = [],
  selectedKey = null,
  disabled = false,
  onSelect,
}) {
  if (!alternatives || alternatives.length <= 1) return null;

  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/45 break-keep">
        경유 후보
      </p>
      <div className="flex flex-wrap gap-1.5">
        {alternatives.map((row) => {
          const active = row.key === selectedKey;
          return (
            <button
              key={row.key}
              type="button"
              disabled={disabled || active}
              aria-current={active ? 'true' : undefined}
              onClick={() => onSelect?.(row.key)}
              className={`min-h-[44px] rounded-md border px-3 py-2 text-xs font-bold transition-colors break-keep motion-safe:active:scale-[0.98] ${
                active
                  ? 'border-amber-300/60 bg-amber-400/20 text-amber-50'
                  : 'border-white/15 bg-white/5 text-white/75 hover:border-white/30 hover:bg-white/10'
              } ${disabled ? 'opacity-60 cursor-wait' : ''}`}
              title={row.routeIatas?.join(' → ') || row.label}
            >
              {row.label}
              {typeof row.flightHours === 'number' ? ` · ${row.flightHours}h` : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   location?: Record<string, unknown> | null,
 *   routeIatas?: string[],
 *   flightHours?: number,
 *   flightLegHours?: { fromIata: string, toIata: string, hours: number }[],
 *   originIata?: string,
 *   browserOriginHint?: string | null,
 *   timezoneDiffHint?: string | null,
 *   routeAlternatives?: Array<{ key: string, label: string, flightHours?: number }>,
 *   selectedRouteKey?: string | null,
 *   isRouteUpdatePending?: boolean,
 *   onSelectOrigin?: (iata: string) => void,
 *   onApplyBrowserOriginSuggestion?: () => void,
 *   onSelectRouteAlternative?: (key: string) => void,
 *   plannerUrl?: string | null,
 *   onClose?: () => void,
 *   className?: string,
 * }} props
 */
export default function FlightCinemaBar({
  location = null,
  routeIatas,
  flightHours,
  flightLegHours = [],
  originIata = 'ICN',
  browserOriginHint = null,
  timezoneDiffHint = null,
  routeAlternatives = [],
  selectedRouteKey = null,
  isRouteUpdatePending = false,
  onSelectOrigin,
  onApplyBrowserOriginSuggestion,
  onSelectRouteAlternative,
  plannerUrl = null,
  onClose,
  className = '',
}) {
  const routeAria = Array.isArray(routeIatas) && routeIatas.length >= 2
    ? routeIatas.join(' 경유 ')
    : '';

  const { primaryName } = getPlaceTitleLines(location);

  return (
    <div
      className={`pointer-events-auto animate-fade-in-down ${className}`}
      role="region"
      aria-label={routeAria ? `항공 경로 ${routeAria}` : '항공 경로 시네마'}
    >
      <div className="flight-cinema-bar-shell relative">
        <div className="flight-cinema-bar-halo" aria-hidden="true" />
        <div className="flight-cinema-bar-card relative z-[1] flex flex-col gap-2 rounded-2xl border bg-black/85 px-3 py-2 backdrop-blur-xl md:px-4 md:py-2.5">
          {location ? (
            <div className="min-w-0 border-b border-white/10 pb-2">
              <p className="text-[9px] font-bold tracking-widest uppercase text-blue-300/90 truncate leading-none">
                {location?.country || 'Global'}
              </p>
              <p className="mt-0.5 text-sm font-bold text-white truncate leading-tight">
                {primaryName || location?.name}
              </p>
            </div>
          ) : null}

          <FlightOriginSelector
            variant="bar"
            selectedIata={originIata}
            disabled={isRouteUpdatePending}
            browserOriginHint={browserOriginHint}
            onSelect={onSelectOrigin}
            onApplyBrowserOriginSuggestion={onApplyBrowserOriginSuggestion}
          />

          <div className="flex min-w-0 items-start gap-2">
            {isRouteUpdatePending ? (
              <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-sky-300" aria-hidden="true" />
            ) : (
              <Plane size={16} className="mt-0.5 shrink-0 text-sky-300" aria-hidden="true" />
            )}
            <FlightRouteSummary
              routeIatas={routeIatas}
              flightHours={flightHours}
              flightLegHours={flightLegHours}
              timezoneDiffHint={timezoneDiffHint}
              isPending={isRouteUpdatePending}
            />
          </div>

          <FlightRouteAlternatives
            alternatives={routeAlternatives}
            selectedKey={selectedRouteKey}
            disabled={isRouteUpdatePending}
            onSelect={onSelectRouteAlternative}
          />

          <div className="flex items-center gap-1.5 sm:gap-2">
            {plannerUrl ? (
              <Link
                to={plannerUrl}
                onClick={onClose}
                title="플래너 탭에서 전체 여정 보기"
                className="flight-cinema-bar-planner shrink-0 inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-violet-200/70 bg-gradient-to-b from-violet-500/55 to-violet-600/45 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:from-violet-400/65 hover:to-violet-500/55 motion-safe:active:scale-[0.98] sm:gap-1.5 sm:px-3"
              >
                <LayoutList size={14} className="opacity-95" aria-hidden="true" />
                여행 플랜
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto shrink-0 min-h-[44px] rounded-lg border border-white/25 bg-white/10 px-3 py-2.5 text-xs font-bold text-white transition-all motion-safe:active:scale-[0.98] sm:px-3"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
