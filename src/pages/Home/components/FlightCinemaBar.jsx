import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, LayoutList, Plane } from 'lucide-react';

const ROUTE_META = '대권 항로(실제 비행경로와 다를 수 있습니다.)';

/**
 * @param {{
 *   routeIatas?: string[],
 *   flightHours?: number,
 *   flightLegHours?: { fromIata: string, toIata: string, hours: number }[],
 *   timezoneDiffHint?: string | null,
 * }} props
 */
function FlightRouteSummary({
  routeIatas = [],
  flightHours = 1,
  flightLegHours = [],
  timezoneDiffHint = null,
}) {
  const codes = routeIatas.filter(Boolean);
  const legs = flightLegHours.filter(Boolean);
  const showLegTimes = legs.length > 0 && codes.length >= 2;

  if (!codes.length) return null;

  if (!showLegTimes) {
    return (
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-bold text-white break-keep">{codes.join(' → ')}</p>
        {timezoneDiffHint ? (
          <p className="mt-0.5 text-[10px] font-medium text-sky-200/75 break-keep">{timezoneDiffHint}</p>
        ) : null}
        <p className="mt-0.5 text-[10px] font-medium text-white/45 break-keep">{ROUTE_META}</p>
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
      {timezoneDiffHint ? (
        <p className="mt-0.5 text-[10px] font-medium text-sky-200/75 break-keep">{timezoneDiffHint}</p>
      ) : null}
      <p className="mt-0.5 text-[10px] font-medium text-white/45 break-keep">{ROUTE_META}</p>
    </div>
  );
}

/**
 * @param {{
 *   primaryOptions?: { iata: string, label: string }[],
 *   extendedOptions?: { iata: string, label: string }[],
 *   selectedIata?: string,
 *   suggestedIata?: string | null,
 *   disabled?: boolean,
 *   onSelect?: (iata: string) => void,
 * }} props
 */
function FlightOriginPicker({
  primaryOptions = [],
  extendedOptions = [],
  selectedIata = 'ICN',
  suggestedIata = null,
  disabled = false,
  onSelect,
}) {
  const [showExtended, setShowExtended] = useState(false);
  const allOptions = [...primaryOptions, ...extendedOptions];
  if (!allOptions.length) return null;

  const selectedInExtended =
    extendedOptions.some((option) => option.iata === selectedIata) && !showExtended;

  const renderChip = (option) => {
    const active = option.iata === selectedIata;
    const suggested = suggestedIata && option.iata === suggestedIata && !active;
    return (
      <button
        key={option.iata}
        type="button"
        disabled={disabled || active}
        onClick={() => onSelect?.(option.iata)}
        className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold transition-colors ${
          active
            ? 'border-sky-300/70 bg-sky-400/25 text-white'
            : suggested
              ? 'border-violet-300/50 bg-violet-500/15 text-violet-100'
              : 'border-white/15 bg-white/5 text-white/75 hover:border-white/30 hover:bg-white/10'
        } ${disabled ? 'opacity-60 cursor-wait' : ''}`}
        title={option.officialKo || option.label}
      >
        {option.iata}
        {suggested ? ' · 제안' : ''}
      </button>
    );
  };

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45 break-keep">
          출발지
        </p>
        {extendedOptions.length > 0 ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowExtended((prev) => !prev)}
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-sky-200/80 hover:text-sky-100 break-keep"
          >
            {showExtended ? '접기' : '더보기'}
            {showExtended ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1">
        {primaryOptions.map(renderChip)}
        {selectedInExtended ? renderChip(extendedOptions.find((o) => o.iata === selectedIata)) : null}
      </div>
      {showExtended && extendedOptions.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1 border-t border-white/10 pt-1.5">
          {extendedOptions.map(renderChip)}
        </div>
      ) : null}
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
      <div className="flex flex-wrap gap-1">
        {alternatives.map((row) => {
          const active = row.key === selectedKey;
          return (
            <button
              key={row.key}
              type="button"
              disabled={disabled || active}
              onClick={() => onSelect?.(row.key)}
              className={`rounded-md border px-2 py-1 text-[10px] font-bold transition-colors break-keep ${
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
 * Flight OD arc cinema — 홈 지구본 미리보기 (여행 플랜 · 닫기).
 */
export default function FlightCinemaBar({
  routeIatas,
  flightHours,
  flightLegHours = [],
  originIata = 'ICN',
  primaryOriginOptions = [],
  extendedOriginOptions = [],
  browserOriginSuggestion = null,
  timezoneDiffHint = null,
  routeAlternatives = [],
  selectedRouteKey = null,
  isRouteUpdatePending = false,
  onSelectOrigin,
  onSelectRouteAlternative,
  plannerUrl = null,
  onClose,
  className = '',
}) {
  const routeAria = Array.isArray(routeIatas) && routeIatas.length >= 2
    ? routeIatas.join(' 경유 ')
    : '';

  const suggestedOriginIata = browserOriginSuggestion?.iata ?? null;

  return (
    <div
      className={`pointer-events-auto animate-fade-in-down ${className}`}
      role="region"
      aria-label={routeAria ? `항공 경로 ${routeAria}` : '항공 경로 시네마'}
    >
      <div className="flight-cinema-bar-shell relative">
        <div className="flight-cinema-bar-halo" aria-hidden="true" />
        <div className="flight-cinema-bar-card relative z-[1] flex flex-col gap-2 rounded-2xl border bg-black/85 px-3 py-2 backdrop-blur-xl md:px-4 md:py-2.5">
          <FlightOriginPicker
            primaryOptions={primaryOriginOptions}
            extendedOptions={extendedOriginOptions}
            selectedIata={originIata}
            suggestedIata={suggestedOriginIata}
            disabled={isRouteUpdatePending}
            onSelect={onSelectOrigin}
          />

          <div className="flex min-w-0 items-start gap-2">
            <Plane size={16} className="mt-0.5 shrink-0 text-sky-300" aria-hidden="true" />
            <FlightRouteSummary
              routeIatas={routeIatas}
              flightHours={flightHours}
              flightLegHours={flightLegHours}
              timezoneDiffHint={timezoneDiffHint}
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
