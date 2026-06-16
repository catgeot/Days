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
 *   globeRef: React.RefObject<{ startFlightCinema?: Function, skipFlightCinema?: Function, closeFlightCinema?: Function } | null>,
 *   isTourActive?: boolean,
 *   onActiveChange?: (active: boolean) => void,
 * }} props
 */
export function FlightCinemaProvider({
  children,
  globeRef,
  isTourActive = false,
  onActiveChange,
}) {
  const [active, setActive] = useState(null);
  const pendingCompleteRef = useRef(null);
  const pendingStartRef = useRef(null);
  const pendingLocationRef = useRef(null);

  useEffect(() => {
    onActiveChange?.(Boolean(active));
  }, [active, onActiveChange]);

  const finishCinema = useCallback((reason) => {
    const onComplete = pendingCompleteRef.current;
    pendingCompleteRef.current = null;
    pendingStartRef.current = null;
    pendingLocationRef.current = null;
    setActive(null);
    onComplete?.(reason);
  }, []);

  useEffect(() => {
    if (!active || !pendingStartRef.current) return;

    const payload = pendingStartRef.current;

    const started = globeRef.current?.startFlightCinema?.({
      originIata: payload.originIata,
      destIata: payload.destIata,
      origin: payload.origin,
      dest: payload.dest,
      location: pendingLocationRef.current,
      onComplete: (reason) => finishCinema(reason),
    });

    if (started) {
      pendingStartRef.current = null;
      return;
    }

    globeRef.current?.closeFlightCinema?.();
    pendingStartRef.current = null;
    pendingLocationRef.current = null;
    const fallback = pendingCompleteRef.current;
    pendingCompleteRef.current = null;
    setActive(null);
    fallback?.('failed');
  }, [active, finishCinema, globeRef]);

  const requestFlightCinema = useCallback(
    ({
      originIata,
      destIata,
      origin,
      dest,
      location = null,
      onComplete,
    }) => {
      if (isTourActive) return false;

      let normalizedOrigin = String(originIata || '').trim().toUpperCase();
      let normalizedDest = String(destIata || '').trim().toUpperCase();

      let resolvedOrigin = origin ?? (normalizedOrigin ? getAirportHubCoords(normalizedOrigin) : null);
      let resolvedDest = dest ?? (normalizedDest ? getAirportHubCoords(normalizedDest) : null);

      if (!resolvedOrigin || !resolvedDest || !normalizedOrigin || !normalizedDest) {
        const od = resolveFlightCinemaOd(location, {
          originIata: normalizedOrigin || undefined,
        });
        if (!od) return false;
        normalizedOrigin = od.originIata;
        normalizedDest = od.destIata;
        resolvedOrigin = od.origin;
        resolvedDest = od.dest;
      }

      if (!resolvedOrigin || !resolvedDest) return false;
      if (normalizedOrigin === normalizedDest) return false;

      if (active) {
        globeRef.current?.closeFlightCinema?.();
        finishCinema('restart');
      }

      pendingCompleteRef.current = onComplete ?? null;
      pendingLocationRef.current = location;
      pendingStartRef.current = {
        originIata: normalizedOrigin,
        destIata: normalizedDest,
        origin: resolvedOrigin,
        dest: resolvedDest,
      };
      setActive({
        originIata: normalizedOrigin,
        destIata: normalizedDest,
        flightHours: estimateFlightHours(resolvedOrigin, resolvedDest),
      });
      return true;
    },
    [active, finishCinema, globeRef, isTourActive]
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
              originIata={active.originIata}
              destIata={active.destIata}
              flightHours={active.flightHours}
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
