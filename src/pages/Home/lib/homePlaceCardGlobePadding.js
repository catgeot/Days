export const PLACE_SUMMARY_CARD_SELECTOR = '.place-summary-card';

export const PLACE_CARD_GLOBE_PAD_DESKTOP_MIN = 1024;

export const PLACE_CARD_GLOBE_PAD_FALLBACK = {
  mobile: { top: 88, bottom: 400, left: 20, right: 20 },
  desktop: { top: 72, bottom: 40, left: 40, right: 460 },
};

/**
 * Mapbox flyTo/easeTo padding so the pin sits in the visible map area beside the
 * home place summary card (bottom sheet on mobile, right dock on lg+).
 */
export function computePlaceCardGlobeFlyPadding({
  viewportWidth = 390,
  viewportHeight = 844,
  cardRect = null,
  desktopMinWidth = PLACE_CARD_GLOBE_PAD_DESKTOP_MIN,
} = {}) {
  const desktop = Number(viewportWidth) >= desktopMinWidth;
  const fallback = desktop
    ? PLACE_CARD_GLOBE_PAD_FALLBACK.desktop
    : PLACE_CARD_GLOBE_PAD_FALLBACK.mobile;

  if (!cardRect || cardRect.width < 1 || cardRect.height < 1) {
    return { ...fallback };
  }

  if (desktop) {
    const gap = 20;
    const right = Math.max(
      fallback.right,
      Math.ceil(Number(viewportWidth) - Number(cardRect.left) + gap),
    );
    return {
      top: fallback.top,
      bottom: fallback.bottom,
      left: fallback.left,
      right,
    };
  }

  const top = Math.max(fallback.top, 80);
  const bottom = Math.max(
    0,
    Math.ceil(Number(viewportHeight) - Number(cardRect.top) + 16),
  );
  return {
    top,
    bottom,
    left: fallback.left,
    right: fallback.right,
  };
}

export function measurePlaceSummaryCardRect(doc = typeof document === 'undefined' ? null : document) {
  if (!doc?.querySelector) return null;
  const el = doc.querySelector(PLACE_SUMMARY_CARD_SELECTOR);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return {
    top: r.top,
    left: r.left,
    right: r.right,
    bottom: r.bottom,
    width: r.width,
    height: r.height,
  };
}

export function resolvePlaceCardGlobeFlyPadding(doc = typeof document === 'undefined' ? null : document) {
  if (!doc?.documentElement) {
    return { ...PLACE_CARD_GLOBE_PAD_FALLBACK.mobile };
  }
  const viewportWidth = doc.documentElement.clientWidth || window.innerWidth;
  const viewportHeight = doc.documentElement.clientHeight || window.innerHeight;
  return computePlaceCardGlobeFlyPadding({
    viewportWidth,
    viewportHeight,
    cardRect: measurePlaceSummaryCardRect(doc),
  });
}