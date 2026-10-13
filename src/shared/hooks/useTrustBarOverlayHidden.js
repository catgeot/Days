import { useEffect, useState } from 'react';
import {
  isTrustBarOverlayLocked,
  TRUST_BAR_OVERLAY_EVENT,
} from '../lib/trustBarOverlayLock.js';

export function useTrustBarOverlayHidden() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onEvent = (event) => {
      setHidden(Boolean(event.detail?.hidden));
    };
    // Deeplink sheets lock in a child effect before this listener exists.
    setHidden(isTrustBarOverlayLocked());
    window.addEventListener(TRUST_BAR_OVERLAY_EVENT, onEvent);
    return () => window.removeEventListener(TRUST_BAR_OVERLAY_EVENT, onEvent);
  }, []);

  return hidden;
}
