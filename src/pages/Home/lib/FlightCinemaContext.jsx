import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import FlightCinemaBar from '../components/FlightCinemaBar.jsx';
import { useVisualViewportBottomAnchor } from '../../../shared/hooks/useMobileInputViewport.js';
import { TripcomFlightSearchProvider } from '../../../components/PlaceCard/tabs/planner/TripcomFlightSearchContext.jsx';
import { buildPlacePlannerPathFromFlightCinema } from '../../../utils/placePlannerPath.js';
import {
  estimateFlightHours,
  estimateFlightHoursChain,
  estimateFlightLegHours,
  getAirportHubCoords,
  resolveFlightCinemaOd,
} from './globeFlightCinema.js';
import {
  resolveFlightRouteAlternativesForCinema,
  resolveFlightRouteHubsForCinema,
} from '../../../utils/resolveFlightRouteEdge.js';
import {
  hasExplicitDirectFlightRoute,
  hasManualFlightRouteHubOverride,
} from '../../../utils/rentalAirportMatch.js';
import { buildFlightRouteAlternativeKey } from './flightCinemaRouteAlternatives.js';
import {
  estimateAirportTimezoneDiffHours,
  formatBrowserTimezoneOriginHint,
  formatTimezoneDiffHint,
} from './flightCinemaTimezone.js';
import { suggestFlightOriginFromBrowserTimezone } from './flightCinemaOriginOptions.js';
import { persistFlightOriginIata } from './flightOriginPreference.js';

const FlightCinemaContext = createContext(null);

/**
 * @param {{
 *   children: React.ReactNode,
 *   globeRef: React.RefObject<{ startFlightCinema?: Function, closeFlightCinema?: Function, endTour?: Function, isFlightCinemaReady?: Function, waitForFlightCinemaReady?: Function } | null>,
 *   isTourActive?: boolean,
 *   endTourForCinema?: () => Promise<void>,
 *   onActiveChange?: (active: boolean) => void,
 * }} props
 */
export function FlightCinemaProvider({
  children,
  globeRef,
  isTourActive = false,
  endTourForCinema,
  onActiveChange,
}) {
  const [active, setActive] = useState(null);
  const [requestPending, setRequestPending] = useState(false);
  const activeRef = useRef(null);
  const pendingCompleteRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const [barCompactLayout, setBarCompactLayout] = useState(null);
  const barKeyboardAnchorStyle = useVisualViewportBottomAnchor(barCompactLayout?.compact ?? false, {
    pad: 8,
  });

  const handleBarCompactLayoutChange = useCallback((layout) => {
    setBarCompactLayout(layout);
  }, []);

  const browserOriginSuggestion = useMemo(() => suggestFlightOriginFromBrowserTimezone(), []);
  const browserOriginHint = useMemo(
    () => formatBrowserTimezoneOriginHint(browserOriginSuggestion),
    [browserOriginSuggestion]
  );

  useEffect(() => {
    activeRef.current = active;
    onActiveChange?.(Boolean(active));
  }, [active, onActiveChange]);

  const finishCinema = useCallback((reason) => {
    if (!activeRef.current && !pendingCompleteRef.current) return;
    const onComplete = pendingCompleteRef.current;
    pendingCompleteRef.current = null;
    activeRef.current = null;
    setActive(null);
    onComplete?.(reason);
  }, []);

  useEffect(() => {
    if (!isTourActive || !active) return;
    globeRef.current?.closeFlightCinema?.();
    finishCinema('interrupt');
  }, [active, finishCinema, globeRef, isTourActive]);

  const launchFlightCinema = useCallback(
    async ({
      originIata,
      destIata,
      origin,
      dest,
      location = null,
      essentialGuide = null,
      hubIatas: hubIatasParam,
      routeAlternatives = [],
      selectedRouteKey,
      skipEdgeHubResolve = false,
      relaunch = false,
      onComplete,
    }) => {
      let normalizedOrigin = String(originIata || '').trim().toUpperCase();
      let normalizedDest = String(destIata || '').trim().toUpperCase();

      let resolvedOrigin = origin ?? (normalizedOrigin ? getAirportHubCoords(normalizedOrigin) : null);
      let resolvedDest = dest ?? (normalizedDest ? getAirportHubCoords(normalizedDest) : null);

      let hubIatas = hubIatasParam ?? [];
      let routeIatas = [];
      let isConnecting = false;
      let flightHours = 1;
      let flightLegHours = [];

      if (!resolvedOrigin || !resolvedDest || !normalizedOrigin || !normalizedDest) {
        const od = resolveFlightCinemaOd(location, {
          originIata: normalizedOrigin || undefined,
          essentialGuide,
        });
        if (!od) return false;
        normalizedOrigin = od.originIata;
        normalizedDest = od.destIata;
        resolvedOrigin = od.origin;
        resolvedDest = od.dest;
        hubIatas = hubIatasParam ?? od.hubIatas ?? [];
        routeIatas = od.routeIatas ?? [normalizedOrigin, normalizedDest];
        isConnecting = Boolean(od.isConnecting);
        flightHours = od.flightHours ?? estimateFlightHours(resolvedOrigin, resolvedDest);
        flightLegHours = od.flightLegHours ?? estimateFlightLegHours(routeIatas);
      } else {
        const od = resolveFlightCinemaOd(location, {
          originIata: normalizedOrigin,
          essentialGuide,
        });
        hubIatas = hubIatasParam ?? od?.hubIatas ?? [];
        routeIatas = [normalizedOrigin, ...hubIatas, normalizedDest];
        isConnecting = hubIatas.length > 0 || Boolean(od?.isConnecting);
        flightHours = od?.flightHours ?? estimateFlightHours(resolvedOrigin, resolvedDest);
        flightLegHours = od?.flightLegHours ?? estimateFlightLegHours(routeIatas);
      }

      if (!resolvedOrigin || !resolvedDest) return false;
      if (normalizedOrigin === normalizedDest) return false;

      const isRelaunch = relaunch || Boolean(activeRef.current);
      if (!isRelaunch) {
        const waitForReady = globeRef.current?.waitForFlightCinemaReady?.bind(globeRef.current);
        if (typeof waitForReady === 'function') {
          const ready = await waitForReady({ timeoutMs: 8000 });
          if (!ready) return false;
        } else if (globeRef.current?.isFlightCinemaReady?.() === false) {
          return false;
        }
      }

      const edgeHubs = skipEdgeHubResolve
        ? null
        : await resolveFlightRouteHubsForCinema(location, {
            originIata: normalizedOrigin,
            destIata: normalizedDest,
            essentialGuide,
          });

      if (edgeHubs) {
        hubIatas = edgeHubs.hubIatas ?? [];
        if (edgeHubs.destIata && edgeHubs.destIata !== normalizedDest) {
          normalizedDest = edgeHubs.destIata;
          resolvedDest = getAirportHubCoords(normalizedDest) ?? resolvedDest;
        }
        routeIatas = [normalizedOrigin, ...hubIatas, normalizedDest];
        isConnecting = hubIatas.length > 0;
        const chainPoints = [
          resolvedOrigin,
          ...hubIatas.map((iata) => getAirportHubCoords(iata)).filter(Boolean),
          resolvedDest,
        ];
        flightHours = estimateFlightHoursChain(chainPoints);
        flightLegHours = estimateFlightLegHours(routeIatas);
      } else if (hubIatasParam != null) {
        routeIatas = [normalizedOrigin, ...hubIatas, normalizedDest];
        isConnecting = hubIatas.length > 0;
        const chainPoints = [
          resolvedOrigin,
          ...hubIatas.map((iata) => getAirportHubCoords(iata)).filter(Boolean),
          resolvedDest,
        ];
        flightHours = estimateFlightHoursChain(chainPoints);
        flightLegHours = estimateFlightLegHours(routeIatas);
      }

      pendingCompleteRef.current = onComplete ?? null;

      const started = globeRef.current?.startFlightCinema?.({
        originIata: normalizedOrigin,
        destIata: normalizedDest,
        origin: resolvedOrigin,
        dest: resolvedDest,
        location,
        hubIatas,
        essentialGuide,
        relaunch: isRelaunch,
        onComplete: (reason) => finishCinema(reason),
      });

      if (!started) {
        pendingCompleteRef.current = null;
        return false;
      }

      const routeKey =
        selectedRouteKey ?? buildFlightRouteAlternativeKey(normalizedOrigin, normalizedDest, hubIatas);
      const timezoneDiffHours = estimateAirportTimezoneDiffHours(normalizedOrigin, normalizedDest);

      setActive({
        originIata: normalizedOrigin,
        destIata: normalizedDest,
        hubIatas,
        routeIatas,
        isConnecting,
        flightHours,
        flightLegHours,
        location,
        essentialGuide,
        routeAlternatives,
        selectedRouteKey: routeKey,
        timezoneDiffHint: formatTimezoneDiffHint(timezoneDiffHours),
      });
      return true;
    },
    [finishCinema, globeRef]
  );

  const requestFlightCinema = useCallback(
    async ({
      originIata,
      destIata,
      origin,
      dest,
      location = null,
      essentialGuide = null,
      hubIatas: hubIatasParam,
      onComplete,
    }) => {
      if (requestInFlightRef.current) return false;

      requestInFlightRef.current = true;
      setRequestPending(true);

      try {
        if (isTourActive) {
          const endTour = endTourForCinema ?? globeRef.current?.endTour?.bind(globeRef.current);
          if (typeof endTour === 'function') {
            await endTour();
          } else {
            return false;
          }
        }

        let routeAlternatives = [];
        const normalizedOrigin = String(originIata || 'ICN').trim().toUpperCase();
        const normalizedDest = String(
          destIata || resolveFlightCinemaOd(location, { essentialGuide })?.destIata || ''
        )
          .trim()
          .toUpperCase();

        const canFetchAlternatives =
          location &&
          normalizedDest.length === 3 &&
          !hasManualFlightRouteHubOverride(location) &&
          !hasExplicitDirectFlightRoute(location);

        if (canFetchAlternatives) {
          routeAlternatives = await resolveFlightRouteAlternativesForCinema(location, {
            originIata: normalizedOrigin,
            destIata: normalizedDest,
            essentialGuide,
            topN: 3,
          });
        }

        return await launchFlightCinema({
          originIata,
          destIata,
          origin,
          dest,
          location,
          essentialGuide,
          hubIatas: hubIatasParam,
          routeAlternatives,
          onComplete,
        });
      } finally {
        requestInFlightRef.current = false;
        setRequestPending(false);
      }
    },
    [endTourForCinema, globeRef, isTourActive, launchFlightCinema]
  );

  const selectFlightRouteAlternative = useCallback(
    async (alternativeKey) => {
      const current = activeRef.current;
      if (!current || requestInFlightRef.current) return false;

      const picked = current.routeAlternatives?.find((row) => row.key === alternativeKey);
      if (!picked || picked.key === current.selectedRouteKey) return false;

      const previous = current;
      const timezoneDiffHours = estimateAirportTimezoneDiffHours(picked.originIata, picked.destIata);
      setActive({
        ...current,
        originIata: picked.originIata,
        destIata: picked.destIata,
        hubIatas: picked.hubIatas ?? [],
        routeIatas: picked.routeIatas ?? [
          picked.originIata,
          ...(picked.hubIatas ?? []),
          picked.destIata,
        ],
        selectedRouteKey: picked.key,
        flightHours: picked.flightHours ?? current.flightHours,
        flightLegHours: picked.flightLegHours ?? current.flightLegHours,
        isConnecting: Boolean(picked.hubIatas?.length),
        timezoneDiffHint: formatTimezoneDiffHint(timezoneDiffHours),
      });

      requestInFlightRef.current = true;
      setRequestPending(true);

      try {
        const ok = await launchFlightCinema({
          originIata: picked.originIata,
          destIata: picked.destIata,
          location: current.location,
          essentialGuide: current.essentialGuide,
          hubIatas: picked.hubIatas,
          routeAlternatives: current.routeAlternatives,
          selectedRouteKey: picked.key,
          skipEdgeHubResolve: true,
          relaunch: true,
        });
        if (!ok) setActive(previous);
        return ok;
      } finally {
        requestInFlightRef.current = false;
        setRequestPending(false);
      }
    },
    [globeRef, launchFlightCinema]
  );

  const updateFlightCinemaOrigin = useCallback(
    async (nextOriginIata) => {
      const current = activeRef.current;
      const normalized = String(nextOriginIata ?? '').trim().toUpperCase();
      if (!current || !normalized || normalized === current.originIata || requestInFlightRef.current) {
        return false;
      }

      persistFlightOriginIata(normalized);

      requestInFlightRef.current = true;
      setRequestPending(true);
      // closeFlightCinema 금지 — onComplete→finishCinema→써머리 복귀. startFlightCinema가 forceReset으로 arc만 교체.

      try {
        let routeAlternatives = [];
        const canFetchAlternatives =
          current.location &&
          !hasManualFlightRouteHubOverride(current.location) &&
          !hasExplicitDirectFlightRoute(current.location);

        if (canFetchAlternatives) {
          routeAlternatives = await resolveFlightRouteAlternativesForCinema(current.location, {
            originIata: normalized,
            destIata: current.destIata,
            essentialGuide: current.essentialGuide,
            topN: 3,
          });
        }

        return await launchFlightCinema({
          originIata: normalized,
          destIata: current.destIata,
          location: current.location,
          essentialGuide: current.essentialGuide,
          routeAlternatives,
          relaunch: true,
        });
      } finally {
        requestInFlightRef.current = false;
        setRequestPending(false);
      }
    },
    [globeRef, launchFlightCinema]
  );

  const closeFlightCinema = useCallback(() => {
    globeRef.current?.closeFlightCinema?.();
    finishCinema('close');
  }, [finishCinema, globeRef]);

  const handleApplyBrowserOriginSuggestion = useCallback(() => {
    if (!browserOriginSuggestion?.iata || requestInFlightRef.current) return false;
    return updateFlightCinemaOrigin(browserOriginSuggestion.iata);
  }, [browserOriginSuggestion, updateFlightCinemaOrigin]);

  const value = useMemo(
    () => ({
      flightCinemaActive: Boolean(active),
      flightCinemaRequestPending: requestPending,
      requestFlightCinema,
      closeFlightCinema,
      selectFlightRouteAlternative,
      updateFlightCinemaOrigin,
      browserOriginSuggestion,
      browserOriginHint,
    }),
    [
      active,
      browserOriginHint,
      browserOriginSuggestion,
      closeFlightCinema,
      requestFlightCinema,
      requestPending,
      selectFlightRouteAlternative,
      updateFlightCinemaOrigin,
    ]
  );

  const barPortal =
    active && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`fixed inset-x-0 z-[120] flex justify-center px-4 pointer-events-none max-md:transition-[bottom] max-md:duration-200 ${
              barCompactLayout?.compact
                ? ''
                : 'bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))] md:bottom-8'
            }`}
            style={barCompactLayout?.compact ? barKeyboardAnchorStyle : undefined}
          >
            <FlightCinemaBar
              className="w-full max-w-md md:max-w-lg"
              onCompactLayoutChange={handleBarCompactLayoutChange}
              location={active.location}
              essentialGuide={active.essentialGuide}
              routeIatas={active.routeIatas}
              flightHours={active.flightHours}
              flightLegHours={active.flightLegHours}
              isConnecting={active.isConnecting}
              originIata={active.originIata}
              destIata={active.destIata}
              browserOriginHint={browserOriginHint}
              timezoneDiffHint={active.timezoneDiffHint}
              routeAlternatives={active.routeAlternatives}
              selectedRouteKey={active.selectedRouteKey}
              isRouteUpdatePending={requestPending}
              onSelectOrigin={updateFlightCinemaOrigin}
              onApplyBrowserOriginSuggestion={
                browserOriginSuggestion?.iata ? handleApplyBrowserOriginSuggestion : undefined
              }
              onSelectRouteAlternative={selectFlightRouteAlternative}
              plannerUrl={
                active.location?.slug
                  ? buildPlacePlannerPathFromFlightCinema(active.location.slug, {
                      originIata: active.originIata,
                    })
                  : null
              }
              onClose={closeFlightCinema}
            />
          </div>,
          document.body
        )
      : null;

  return (
    <TripcomFlightSearchProvider>
      <FlightCinemaContext.Provider value={value}>
        {children}
        {barPortal}
      </FlightCinemaContext.Provider>
    </TripcomFlightSearchProvider>
  );
}

export function useFlightCinema() {
  const context = useContext(FlightCinemaContext);
  if (!context) {
    throw new Error('useFlightCinema must be used within FlightCinemaProvider');
  }
  return context;
}

/** Provider 밖·Tour 중 — cinema 생략 */
export function useOptionalFlightCinemaRequest() {
  return useContext(FlightCinemaContext)?.requestFlightCinema ?? null;
}
