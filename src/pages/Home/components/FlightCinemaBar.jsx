import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Info, LayoutList, Loader2, Plane, Search } from 'lucide-react';
import {
  getLocalizedCountryName,
  getPlaceTitleLinesForLocale,
} from '../../../components/PlaceCard/common/locationDisplay';
import { useLocale } from '../../../i18n/LocaleProvider';
import { formatFlightRouteAlternativeLabel } from '../lib/flightCinemaRouteAlternatives';
import WhiteLabelWidget from '../../../components/PlaceCard/common/WhiteLabelWidget.jsx';
import FlightOriginSelector from './FlightOriginSelector.jsx';
import { getFlightOriginMetroHint } from '../lib/flightOriginMetroGateways.js';
import { useCoarsePointer, useMobileOverlayViewport } from '../../../shared/hooks/useMobileInputViewport.js';

const ROUTE_INFO_TOOLTIP_Z = 130;

/**
 * @param {{ metroHint?: string | null, showLegTimeHint?: boolean, t: (key: string, opts?: object) => string }} props
 */
function FlightRouteInfoTooltip({ metroHint = null, showLegTimeHint = true, t }) {
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
            zIndex: ROUTE_INFO_TOOLTIP_Z,
          }}
          className="rounded-lg border border-white/15 bg-black/95 px-2.5 py-2 text-[10px] font-medium leading-snug text-white/85 shadow-lg backdrop-blur-sm"
        >
          <p className="break-keep">{t('home.flightCinema.routeMeta')}</p>
          {showLegTimeHint ? (
            <>
              <p className="mt-1 break-keep text-white/65">{t('home.flightCinema.legTimeHint1')}</p>
              <p className="mt-1 break-keep text-white/65">{t('home.flightCinema.legTimeHint2')}</p>
            </>
          ) : null}
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
          aria-label={t('home.flightCinema.routeInfoAria')}
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
  'inline-flex min-h-[28px] items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-all motion-safe:active:scale-[0.98]';

/**
 * @param {{
 *   routeIatas?: string[],
 *   flightHours?: number,
 *   flightLegHours?: { fromIata: string, toIata: string, hours: number }[],
 *   originIata?: string | null,
 *   isPending?: boolean,
 *   t: (key: string, opts?: object) => string,
 * }} props
 */
function FlightRouteSummary({
  routeIatas = [],
  flightHours = 1,
  flightLegHours = [],
  originIata = null,
  isPending = false,
  t,
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
      <div className="flex min-w-0 items-center gap-2">
        <p className="min-w-0 flex-1 text-sm font-bold text-white break-keep">{codes.join(' → ')}</p>
        <FlightRouteInfoTooltip metroHint={metroHint} showLegTimeHint={false} t={t} />
      </div>
    </div>
  ) : (
    <div className="min-w-0 max-w-full leading-tight">
      <div className="flex min-w-0 items-center gap-2.5">
        <p
          className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-sm leading-snug [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t('home.flightCinema.routeAria', {
            codes: codes.join(' · '),
            hours: flightHours,
          })}
        >
          {codes.map((code, index) => (
            <React.Fragment key={`${code}-${index}`}>
              <span className="font-bold tabular-nums text-white">{code}</span>
              {index < legs.length ? (
                <span
                  className="mx-1.5 text-[10px] font-medium tabular-nums text-sky-300/85 sm:mx-2"
                  title={t('home.flightCinema.legTimeTitle')}
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
            title={t('home.flightCinema.totalHoursTitle', { hours: flightHours })}
          >
            {t('home.flightCinema.totalHours', { hours: flightHours })}
          </span>
          <FlightRouteInfoTooltip metroHint={metroHint} t={t} />
        </span>
      </div>
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
 *   t: (key: string, opts?: object) => string,
 *   directLabel: string,
 * }} props
 */
function FlightRouteAlternatives({
  alternatives = [],
  selectedKey = null,
  disabled = false,
  onSelect,
  t,
  directLabel,
}) {
  const [expanded, setExpanded] = useState(false);

  if (!alternatives || alternatives.length <= 1) return null;

  const activeRow = alternatives.find((row) => row.key === selectedKey) || alternatives[0];
  const formatAltLabel = (row) => formatFlightRouteAlternativeLabel(
    row.originIata,
    row.destIata,
    row.hubIatas,
    { directLabel },
  );
  const activeSummary = activeRow
    ? `${formatAltLabel(activeRow)}${typeof activeRow.flightHours === 'number' ? ` · ${activeRow.flightHours}h` : ''}`
    : '';

  return (
    <div className="min-w-0">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className={`inline-flex max-w-full min-h-0 items-center gap-1 py-0 text-left transition-colors hover:text-sky-100 motion-safe:active:opacity-80 ${disabled ? 'opacity-60 cursor-wait' : ''}`}
      >
        <span className="shrink-0 text-[10px] font-medium text-sky-200/70">{t('home.flightCinema.routeAlternatives')}</span>
        <span className="shrink-0 text-[10px] text-white/35" aria-hidden="true">·</span>
        <span className="inline-flex min-w-0 items-center gap-1 text-[10px] font-semibold text-sky-100/90">
          <span className="truncate">{activeSummary || t('home.flightCinema.alternativesCount', { count: alternatives.length })}</span>
          <ChevronDown
            size={13}
            strokeWidth={2.5}
            className={`shrink-0 text-sky-200/80 transition-transform motion-safe:duration-200 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>
      {expanded ? (
        <div className="mt-1 mb-0.5 flex max-w-full gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {alternatives.map((row) => {
            const active = row.key === selectedKey;
            return (
              <button
                key={row.key}
                type="button"
                disabled={disabled || active}
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect?.(row.key)}
                className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold transition-colors break-keep motion-safe:active:scale-[0.98] ${
                  active
                    ? 'border-amber-300/50 bg-amber-400/15 text-amber-100/90'
                    : 'border-white/15 bg-white/[0.05] text-white/80 hover:border-white/30 hover:bg-white/10'
                } ${disabled ? 'opacity-60 cursor-wait' : ''}`}
                title={row.routeIatas?.join(' → ') || formatAltLabel(row)}
              >
                {formatAltLabel(row)}
                {typeof row.flightHours === 'number' ? ` · ${row.flightHours}h` : ''}
              </button>
            );
          })}
        </div>
      ) : null}
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
 *   onCompactLayoutChange?: (layout: { compact: boolean; searchActive: boolean } | null) => void,
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
  onCompactLayoutChange,
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const directLabel = t('home.flightCinema.direct');
  const routeAria = Array.isArray(routeIatas) && routeIatas.length >= 2
    ? routeIatas.join(' · ')
    : '';

  const { primaryName } = getPlaceTitleLinesForLocale(location, locale);
  const countryLabel = getLocalizedCountryName(location, locale) || 'Global';
  const [originExpanded, setOriginExpanded] = useState(false);
  const [originSearchActive, setOriginSearchActive] = useState(false);
  const isMobileCoarse = useCoarsePointer();

  const searchUiOpen = !location || originExpanded;
  const isOriginCompact = isMobileCoarse && (
    (location && originExpanded) || (!location && originSearchActive)
  );
  const isOriginSearchMode = isOriginCompact && originSearchActive;

  useMobileOverlayViewport(isOriginSearchMode);

  useEffect(() => {
    if (!originExpanded) setOriginSearchActive(false);
  }, [originExpanded]);

  useEffect(() => {
    if (!isOriginSearchMode || typeof window === 'undefined') return;
    window.scrollTo(0, 0);
  }, [isOriginSearchMode]);

  useEffect(() => {
    if (!onCompactLayoutChange) return undefined;
    if (!isOriginCompact) {
      onCompactLayoutChange(null);
      return undefined;
    }
    onCompactLayoutChange({ compact: true, searchActive: isOriginSearchMode });
    return () => onCompactLayoutChange(null);
  }, [isOriginCompact, isOriginSearchMode, onCompactLayoutChange]);

  const originSelectorProps = {
    selectedIata: originIata,
    disabled: isRouteUpdatePending,
    browserOriginHint,
    onSelect: (iata) => {
      onSelectOrigin?.(iata);
      setOriginExpanded(false);
    },
    onApplyBrowserOriginSuggestion,
    onSearchActiveChange: setOriginSearchActive,
  };

  return (
    <div
      className={`pointer-events-auto animate-fade-in-down ${className}`}
      role="region"
      aria-label={routeAria ? t('home.flightCinema.regionAria', { route: routeAria }) : t('home.flightCinema.regionLabel')}
    >
      <div className="flight-cinema-bar-shell relative">
        {!isOriginCompact ? <div className="flight-cinema-bar-halo" aria-hidden="true" /> : null}
        <div
          className={`flight-cinema-bar-card relative z-[1] flex flex-col gap-1.5 rounded-2xl border bg-black/85 backdrop-blur-xl md:px-4 md:py-2 ${
            isOriginCompact ? 'overflow-visible px-2.5 py-2' : 'px-3 py-2'
          }`}
        >
          {location ? (
            <div className={`space-y-1.5 ${isOriginCompact ? '' : 'border-b border-white/10 pb-1.5'}`}>
              {!isOriginCompact ? (
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-blue-300/90 truncate leading-none">
                    {countryLabel}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-bold text-white leading-tight">
                    {primaryName || location?.name}
                    {timezoneDiffHint ? (
                      <span className="ml-1.5 text-[10px] font-semibold tabular-nums text-sky-100/95">
                        (
                        {timezoneDiffHint}
                        )
                      </span>
                    ) : null}
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
              ) : null}
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

          {!isOriginCompact ? (
          <>
          <div className="flex min-w-0 items-start gap-2">
            {isRouteUpdatePending ? (
              <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-sky-300" aria-hidden="true" />
            ) : (
              <Plane size={16} className="mt-0.5 shrink-0 text-sky-300" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <FlightRouteSummary
                routeIatas={routeIatas}
                flightHours={flightHours}
                flightLegHours={flightLegHours}
                originIata={originIata}
                isPending={isRouteUpdatePending}
                t={t}
              />
              <div className="-mt-1">
                <FlightRouteAlternatives
                  alternatives={routeAlternatives}
                  selectedKey={selectedRouteKey}
                  disabled={isRouteUpdatePending}
                  onSelect={onSelectRouteAlternative}
                  t={t}
                  directLabel={directLabel}
                />
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 border-t border-white/10 pt-2">
            {plannerUrl ? (
              <Link
                to={plannerUrl}
                onClick={onClose}
                title={t('home.flightCinema.plannerTitle')}
                className={`flight-cinema-bar-planner shrink-0 ${BAR_BTN} border-violet-200/70 bg-gradient-to-b from-violet-500/55 to-violet-600/45 text-white shadow-sm hover:from-violet-400/65 hover:to-violet-500/55`}
              >
                <LayoutList size={12} className="opacity-95" aria-hidden="true" />
                {t('place.nav.planner')}
              </Link>
            ) : null}
            {location ? (
              <WhiteLabelWidget
                location={location}
                essentialGuide={essentialGuide}
                departureIata={originIata}
                tracking="globe-flight-cinema"
                customTrigger={
                  <button
                    type="button"
                    className={`flight-cinema-bar-cta shrink-0 ${BAR_BTN} border-sky-300/50 bg-sky-500/20 text-sky-50 hover:border-sky-200/60 hover:bg-sky-500/30`}
                  >
                    <Search size={12} aria-hidden="true" />
                    {t('home.flightCinema.searchFlights')}
                  </button>
                }
              />
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className={`ml-auto shrink-0 ${BAR_BTN} border-white/25 bg-white/10 text-white hover:bg-white/15`}
            >
              {t('home.flightCinema.close')}
            </button>
          </div>
          </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
