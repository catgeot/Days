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
import {
  estimateFlightHours,
  getAirportHubCoords,
  resolveFlightCinemaOd,
} from './globeFlightCinema.js';

const FlightCinemaContext = createContext(null);

/**
 * @param {{
 *   children: React.ReactNode,
 *   globeRef: React.RefObject<{ startFlightCinema?: Function, skipFlightCinema?: Function, closeFlightCinema?: Function, endTour?: Function } | null>,
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
  const activeRef = useRef(null);
  const pendingCompleteRef = useRef(null);

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
      } else {
        const od = resolveFlightCinemaOd(location, {
          originIata: normalizedOrigin,
          essentialGuide,
        });
        hubIatas = hubIatasParam ?? od?.hubIatas ?? [];
        routeIatas = od?.routeIatas ?? [normalizedOrigin, ...hubIatas, normalizedDest];
        isConnecting = hubIatas.length > 0 || Boolean(od?.isConnecting);
        flightHours = od?.flightHours ?? estimateFlightHours(resolvedOrigin, resolvedDest);
      }

      if (!resolvedOrigin || !resolvedDest) return false;
      if (normalizedOrigin === normalizedDest) return false;

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
      });
      return true;
    },
    [endTourForCinema, finishCinema, globeRef, isTourActive]
  );

  const skipFlightCinema = useCallback(() => {
    globeRef.current?.skipFlightCinema?.();
  }, [globeRef]);

  const closeFlightCinema = useCallback(() => {
    globeRef.current?.closeFlightCinema?.();
    finishCinema('close');
  }, [finishCinema, globeRef]);

  const value = useMemo(
    () => ({
      flightCinemaActive: Boolean(active),
      requestFlightCinema,
      skipFlightCinema,
      closeFlightCinema,
    }),
    [active, closeFlightCinema, requestFlightCinema, skipFlightCinema]
  );

  const barPortal =
    active && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-x-0 bottom-0 z-[120] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none md:bottom-8">
            <FlightCinemaBar
              className="w-full max-w-md md:max-w-lg"
              routeIatas={active.routeIatas}
              flightHours={active.flightHours}
              isConnecting={active.isConnecting}
              onSkip={skipFlightCinema}
              onClose={closeFlightCinema}
            />
          </div>,
          document.body
        )
      : null;

  return (
    <FlightCinemaContext.Provider value={value}>
      {children}
      {barPortal}
    </FlightCinemaContext.Provider>
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
