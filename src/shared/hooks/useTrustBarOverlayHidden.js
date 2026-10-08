import { useEffect, useState } from 'react';
import { TRUST_BAR_OVERLAY_EVENT } from '../lib/trustBarOverlayLock.js';

export function useTrustBarOverlayHidden() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onEvent = (event) => {
      setHidden(Boolean(event.detail?.hidden));
    };
    window.addEventListener(TRUST_BAR_OVERLAY_EVENT, onEvent);
    return () => window.removeEventListener(TRUST_BAR_OVERLAY_EVENT, onEvent);
  }, []);

  return hidden;
}
