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
import { TripcomFlightSearchProvider } from '../../../components/PlaceCard/tabs/planner/TripcomFlightSearchContext.jsx';
import { buildPlacePlannerPath } from '../../../utils/placePlannerPath.js';
import {
  estimateFlightHours,
  estimateFlightHoursChain,
  estimateFlightLegHours,
  getAirportHubCoords,
  resolveFlightCinemaOd,
} from './globeFlightCinema.js';
import { resolveFlightRouteHubsForCinema } from '../../../utils/resolveFlightRouteEdge.js';

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

      let normalizedOrigin = String(originIata || '').trim().toUpperCase();
      let normalizedDest = String(destIata || '').trim().toUpperCase();

      let resolvedOrigin = origin ?? (normalizedOrigin ? getAirportHubCoords(normalizedOrigin) : null);
      let resolvedDest = dest ?? (normalizedDest ? getAirportHubCoords(normalizedDest) : null);

      let hubIatas = [];
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
        hubIatas = od.hubIatas ?? [];
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
        routeIatas = od?.routeIatas ?? [normalizedOrigin, ...hubIatas, normalizedDest];
        isConnecting = hubIatas.length > 0 || Boolean(od?.isConnecting);
        flightHours = od?.flightHours ?? estimateFlightHours(resolvedOrigin, resolvedDest);
        flightLegHours = od?.flightLegHours ?? estimateFlightLegHours(routeIatas);
      }

      if (!resolvedOrigin || !resolvedDest) return false;
      if (normalizedOrigin === normalizedDest) return false;

      const waitForReady = globeRef.current?.waitForFlightCinemaReady?.bind(globeRef.current);
      if (typeof waitForReady === 'function') {
        const ready = await waitForReady({ timeoutMs: 8000 });
        if (!ready) return false;
      } else if (globeRef.current?.isFlightCinemaReady?.() === false) {
        return false;
      }

      const edgeHubs = await resolveFlightRouteHubsForCinema(location, {
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
        onComplete: (reason) => finishCinema(reason),
      });

      if (!started) {
        pendingCompleteRef.current = null;
        return false;
      }

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
      });
      return true;
      } finally {
        requestInFlightRef.current = false;
        setRequestPending(false);
      }
    },
    [endTourForCinema, finishCinema, globeRef, isTourActive]
  );

  const closeFlightCinema = useCallback(() => {
    globeRef.current?.closeFlightCinema?.();
    finishCinema('close');
  }, [finishCinema, globeRef]);

  const value = useMemo(
    () => ({
      flightCinemaActive: Boolean(active),
      flightCinemaRequestPending: requestPending,
      requestFlightCinema,
      closeFlightCinema,
    }),
    [active, closeFlightCinema, requestFlightCinema, requestPending]
  );

  const barPortal =
    active && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-x-0 bottom-0 z-[120] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none md:bottom-8">
            <FlightCinemaBar
              className="w-full max-w-md md:max-w-lg"
              routeIatas={active.routeIatas}
              flightHours={active.flightHours}
              flightLegHours={active.flightLegHours}
              isConnecting={active.isConnecting}
              plannerUrl={
                active.location?.slug ? buildPlacePlannerPath(active.location.slug) : null
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
