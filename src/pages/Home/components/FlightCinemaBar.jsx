import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Info, LayoutList, Loader2, Plane, Search } from 'lucide-react';
import { getPlaceTitleLines } from '../../../components/PlaceCard/common/locationDisplay';
import WhiteLabelWidget from '../../../components/PlaceCard/common/WhiteLabelWidget.jsx';
import FlightOriginSelector from './FlightOriginSelector.jsx';
import { getFlightOriginMetroHint } from '../lib/flightOriginMetroGateways.js';

const ROUTE_META = '대권 항로(실제 비행경로와 다를 수 있습니다.)';

const LEG_TIME_TITLE = '구간 추정 비행 시간(환승 대기·체크인 미포함)';

const ROUTE_TIME_TOOLTIP_Z = 130;

/**
 * @param {{ metroHint?: string | null }} props
 */
function FlightRouteTimeTooltip({ metroHint = null }) {
  const tooltipId = useId();
  const rootRef = useRef(null);
  const tooltipRef = useRef(null);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState(null);

  const showTooltip = pinned || hovered;

  const updateTooltipPosition = useCallback(() => {
    const anchor = rootRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const width = Math.min(256, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));

    setTooltipStyle({
      left,
      top: rect.top - 8,
      width,
      transform: 'translateY(-100%)',
    });
  }, []);

  useEffect(() => {
    if (!showTooltip) {
      setTooltipStyle(null);
      return undefined;
    }

    updateTooltipPosition();
    window.addEventListener('scroll', updateTooltipPosition, true);
    window.addEventListener('resize', updateTooltipPosition);
    return () => {
      window.removeEventListener('scroll', updateTooltipPosition, true);
      window.removeEventListener('resize', updateTooltipPosition);
    };
  }, [showTooltip, updateTooltipPosition]);

  useEffect(() => {
    if (!pinned) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      if (tooltipRef.current?.contains(event.target)) return;
      setPinned(false);
    };

    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [pinned]);

  const tooltipPanel = showTooltip && tooltipStyle
    ? createPortal(
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'fixed',
            left: tooltipStyle.left,
            top: tooltipStyle.top,
            width: tooltipStyle.width,
            transform: tooltipStyle.transform,
            zIndex: ROUTE_TIME_TOOLTIP_Z,
          }}
          className="rounded-lg border border-white/15 bg-black/95 px-2.5 py-2 text-[10px] font-medium leading-snug text-white/85 shadow-lg backdrop-blur-sm"
        >
          <p className="break-keep">구간 ~Nh는 대권 거리 기준 추정 비행 시간이에요.</p>
          <p className="mt-1 break-keep text-white/65">환승 대기·체크인은 포함되지 않아요.</p>
          {metroHint ? (
            <p className="mt-1.5 break-keep text-amber-200/90">{metroHint}</p>
          ) : null}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        ref={rootRef}
        className="relative inline-flex shrink-0 align-middle"
        onMouseEnter={() => {
          if (window.matchMedia('(hover: hover)').matches) setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          type="button"
          aria-label="구간 시간 안내"
          aria-expanded={showTooltip}
          aria-controls={tooltipId}
          onClick={() => setPinned((open) => !open)}
          className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full border border-sky-400/25 bg-sky-500/15 text-sky-200/90 transition-colors hover:border-sky-300/45 hover:bg-sky-500/25 hover:text-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-300/60 motion-safe:active:scale-[0.98]"
        >
          <Info size={12} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
      {tooltipPanel}
    </>
  );
}

const BAR_BTN =
  'inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all motion-safe:active:scale-[0.98]';

/**
 * @param {{
 *   routeIatas?: string[],
 *   flightHours?: number,
 *   flightLegHours?: { fromIata: string, toIata: string, hours: number }[],
 *   originIata?: string | null,
 *   timezoneDiffHint?: string | null,
 *   isPending?: boolean,
 * }} props
 */
function FlightRouteSummary({
  routeIatas = [],
  flightHours = 1,
  flightLegHours = [],
  originIata = null,
  timezoneDiffHint = null,
  isPending = false,
}) {
  const codes = routeIatas.filter(Boolean);
  const legs = flightLegHours.filter(Boolean);
  const showLegTimes = legs.length > 0 && codes.length >= 2;
  const metroHint = getFlightOriginMetroHint(originIata, {
    flightHours,
    hopCount: Math.max(0, codes.length - 1),
  });

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
      <div className="flex min-w-0 items-center gap-2.5">
        <p
          className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-sm leading-snug [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`${codes.join(' 경유 ')} 총 약 ${flightHours}시간`}
        >
          {codes.map((code, index) => (
            <React.Fragment key={`${code}-${index}`}>
              <span className="font-bold tabular-nums text-white">{code}</span>
              {index < legs.length ? (
                <span
                  className="mx-1.5 text-[10px] font-medium tabular-nums text-sky-300/85 sm:mx-2"
                  title={`${legs[index].fromIata}→${legs[index].toIata} ${LEG_TIME_TITLE}`}
                >
                  ~{legs[index].hours}h
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </p>
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <span
            className="whitespace-nowrap text-[11px] font-semibold tabular-nums text-sky-200/90"
            title={`총 ${flightHours}시간 — 구간 합산 추정(환승 대기 미포함)`}
          >
            (총 {flightHours}h)
          </span>
          <FlightRouteTimeTooltip metroHint={metroHint} />
        </span>
      </div>
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
              className={`min-h-[32px] rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors break-keep motion-safe:active:scale-[0.98] ${
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
 *   essentialGuide?: Record<string, unknown> | null,
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
  essentialGuide = null,
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
  const [originExpanded, setOriginExpanded] = useState(false);

  const originSelectorProps = {
    selectedIata: originIata,
    disabled: isRouteUpdatePending,
    browserOriginHint,
    onSelect: (iata) => {
      onSelectOrigin?.(iata);
      setOriginExpanded(false);
    },
    onApplyBrowserOriginSuggestion,
  };

  return (
    <div
      className={`pointer-events-auto animate-fade-in-down ${className}`}
      role="region"
      aria-label={routeAria ? `항공 경로 ${routeAria}` : '항공 경로 시네마'}
    >
      <div className="flight-cinema-bar-shell relative">
        <div className="flight-cinema-bar-halo" aria-hidden="true" />
        <div className="flight-cinema-bar-card relative z-[1] flex flex-col gap-1.5 rounded-2xl border bg-black/85 px-3 py-2 backdrop-blur-xl md:px-4 md:py-2">
          {location ? (
            <div className="space-y-1.5 border-b border-white/10 pb-1.5">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-blue-300/90 truncate leading-none">
                    {location?.country || 'Global'}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-white truncate leading-tight">
                    {primaryName || location?.name}
                  </p>
                </div>
                {!originExpanded ? (
                  <FlightOriginSelector
                    variant="bar-header"
                    {...originSelectorProps}
                    onExpandRequest={() => setOriginExpanded(true)}
                  />
                ) : null}
              </div>
              {originExpanded ? (
                <FlightOriginSelector
                  variant="bar"
                  initialExpanded
                  onCollapseRequest={() => setOriginExpanded(false)}
                  {...originSelectorProps}
                />
              ) : null}
            </div>
          ) : (
            <FlightOriginSelector variant="bar" {...originSelectorProps} />
          )}

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
              originIata={originIata}
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

          <div className="flex items-center gap-1.5">
            {plannerUrl ? (
              <Link
                to={plannerUrl}
                onClick={onClose}
                title="플래너 탭에서 전체 여정 보기"
                className={`flight-cinema-bar-planner shrink-0 ${BAR_BTN} border-violet-200/70 bg-gradient-to-b from-violet-500/55 to-violet-600/45 text-white shadow-sm hover:from-violet-400/65 hover:to-violet-500/55 sm:gap-1.5`}
              >
                <LayoutList size={13} className="opacity-95" aria-hidden="true" />
                여행 플랜
              </Link>
            ) : null}
            {location ? (
              <WhiteLabelWidget
                location={location}
                essentialGuide={essentialGuide}
                customTrigger={
                  <button
                    type="button"
                    className={`flight-cinema-bar-cta shrink-0 ${BAR_BTN} border-sky-300/50 bg-sky-500/20 text-sky-50 hover:border-sky-200/60 hover:bg-sky-500/30`}
                  >
                    <Search size={13} aria-hidden="true" />
                    항공권 검색
                  </button>
                }
              />
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className={`ml-auto shrink-0 ${BAR_BTN} border-white/25 bg-white/10 text-white hover:bg-white/15 sm:px-2.5`}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
