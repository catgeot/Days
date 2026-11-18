import { useEffect } from 'react';

/**
 * Esc uses the same close callback as the service-modal close button.
 * A child that already called preventDefault (date calendar) keeps the modal open.
 * @param {boolean} active
 * @param {() => void} close
 */
export function useServiceModalEscapeClose(active, close) {
  useEffect(() => {
    if (!active || typeof close !== 'function') return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, close]);
}
