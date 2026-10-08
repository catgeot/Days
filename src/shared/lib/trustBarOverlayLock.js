const EVENT = 'gateo:trust-bar-overlay';

let depth = 0;

function emit() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(EVENT, { detail: { hidden: depth > 0 } }),
  );
}

/** Hide global TrustLinkBar while detail/modal overlays are open. */
export function pushTrustBarOverlayLock() {
  depth += 1;
  if (depth === 1) emit();
  return () => {
    if (depth <= 0) return;
    depth -= 1;
    if (depth === 0) emit();
  };
}

export const TRUST_BAR_OVERLAY_EVENT = EVENT;
