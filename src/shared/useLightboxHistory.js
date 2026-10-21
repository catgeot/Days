import { useEffect, useRef } from 'react';
import { isGateoLightboxHistoryEnabled } from './gateoFeatureFlags';
import { createLightboxHistorySession } from './lightboxHistory';

/** `open` must be a boolean. A photo change that stays open must not flip it. */
export function useLightboxHistory(open, onCloseFromPop) {
  const onCloseRef = useRef(onCloseFromPop);
  onCloseRef.current = onCloseFromPop;

  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    const session = createLightboxHistorySession(window, {
      enabled: isGateoLightboxHistoryEnabled(),
      onCloseFromPop: () => onCloseRef.current?.(),
    });
    session.open();
    return () => session.dispose();
  }, [open]);
}
