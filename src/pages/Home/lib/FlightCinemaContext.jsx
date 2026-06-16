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

  useEffect(() => {
    onActiveChange?.(Boolean(active));
  }, [active, onActiveChange]);

  const finishCinema = useCallback((reason) => {
    const onComplete = pendingCompleteRef.current;
    pendingCompleteRef.current = null;
    pendingStartRef.current = null;
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
      onComplete: (reason) => finishCinema(reason),
    });

    if (started) {
      pendingStartRef.current = null;
      return;
    }

    globeRef.current?.closeFlightCinema?.();
    pendingStartRef.current = null;
    const fallback = pendingCompleteRef.current;
    pendingCompleteRef.current = null;
    setActive(null);
    fallback?.('failed');
  }, [active, finishCinema, globeRef]);

  const requestFlightCinema = useCallback(
    ({ originIata, destIata, onComplete }) => {
      if (isTourActive) return false;

      const origin = getAirportHubCoords(originIata);
      const dest = getAirportHubCoords(destIata);
      if (!origin || !dest) return false;

      const normalizedOrigin = String(originIata).trim().toUpperCase();
      const normalizedDest = String(destIata).trim().toUpperCase();
      if (normalizedOrigin === normalizedDest) return false;

      if (active) {
        globeRef.current?.closeFlightCinema?.();
        finishCinema('restart');
      }

      pendingCompleteRef.current = onComplete;
      pendingStartRef.current = {
        originIata: normalizedOrigin,
        destIata: normalizedDest,
        origin,
        dest,
      };
      setActive({
        originIata: normalizedOrigin,
        destIata: normalizedDest,
        flightHours: estimateFlightHours(origin, dest),
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
