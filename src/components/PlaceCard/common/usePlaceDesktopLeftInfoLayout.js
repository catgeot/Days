import { useSyncExternalStore } from 'react';
import { isGateoPlaceDesktopLeftInfoEnabled } from '../../../shared/gateoFeatureFlags.js';

export const PLACE_DESKTOP_LEFT_INFO_LG_MQ = '(min-width: 1024px)';

function getLgMatches() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(PLACE_DESKTOP_LEFT_INFO_LG_MQ).matches;
}

function subscribeLgMq(onStoreChange) {
  const mq = window.matchMedia(PLACE_DESKTOP_LEFT_INFO_LG_MQ);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

export function usePlaceDesktopLeftInfoLayout() {
  const enabled = isGateoPlaceDesktopLeftInfoEnabled();
  const isLg = useSyncExternalStore(subscribeLgMq, getLgMatches, () => false);

  return {
    enabled,
    isLg,
    mountInLeftOverview: enabled && isLg,
    mountInGallery: !enabled || !isLg,
  };
}
