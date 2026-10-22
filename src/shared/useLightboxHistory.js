import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveLightboxHistoryEnabled } from './gateoFeatureFlags';
import { createLightboxHistorySession } from './lightboxHistory';

/**
 * `open` must be a boolean. A photo change that stays open must not flip it.
 * `options.always` keeps festival lightbox history on when the place flag is off.
 */
export function useLightboxHistory(open, onCloseFromPop, options) {
  const always = options?.always === true;
  const location = useLocation();
  const routeKey = `${location.pathname}${location.search}${location.hash}`;
  const routeRef = useRef(routeKey);
  const onCloseRef = useRef(onCloseFromPop);
  onCloseRef.current = onCloseFromPop;

  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    const session = createLightboxHistorySession(window, {
      enabled: resolveLightboxHistoryEnabled(always),
      onCloseFromPop: () => onCloseRef.current?.(),
    });
    session.open();
    return () => session.dispose();
  }, [open, always]);

  useEffect(() => {
    if (!open) {
      routeRef.current = routeKey;
      return undefined;
    }
    if (routeRef.current === routeKey) return undefined;
    routeRef.current = routeKey;
    onCloseRef.current?.();
    return undefined;
  }, [open, routeKey]);
}
