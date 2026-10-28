import { useEffect, useState } from 'react';
import { isGateoPlaceDesktopLeftInfoEnabled } from '../../../shared/gateoFeatureFlags.js';

export const PLACE_DESKTOP_LEFT_INFO_LG_MQ = '(min-width: 1024px)';

export function usePlaceDesktopLeftInfoLayout() {
  const enabled = isGateoPlaceDesktopLeftInfoEnabled();
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(PLACE_DESKTOP_LEFT_INFO_LG_MQ).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(PLACE_DESKTOP_LEFT_INFO_LG_MQ);
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return {
    enabled,
    isLg,
    mountInLeftOverview: enabled && isLg,
    mountInGallery: !enabled || !isLg,
  };
}
