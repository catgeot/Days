import { useEffect, useRef } from 'react';
import { trackEvent } from './trackEvent.js';

/**
 * One tab view is the tab plus the place slug. A new location object for the
 * same place (route sync replaces the pin after addScoutPin) is not a new view.
 * @param {object | null | undefined} location
 * @param {string | null | undefined} mediaMode
 */
export function placeTabViewKey(location, mediaMode) {
  if (!location || !mediaMode) return '';
  const slug = location.slug || (location.id ? String(location.id).toLowerCase() : 'unknown');
  return `${String(mediaMode).toLowerCase()}\0${slug}`;
}

/**
 * Fires tab_view once per tab+place. Fires again when the tab or the place changes.
 * @param {object | null | undefined} location
 * @param {string} mediaMode
 */
export function usePlaceTabView(location, mediaMode) {
  const lastKeyRef = useRef('');

  useEffect(() => {
    const key = placeTabViewKey(location, mediaMode);
    if (!key || lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    const slug = location.slug || (location.id ? String(location.id).toLowerCase() : 'unknown');
    trackEvent('tab_view', {
      tab_name: String(mediaMode).toLowerCase(),
      place_slug: slug,
      place_name: location.name || 'Unknown',
    });
  }, [location, mediaMode]);
}
