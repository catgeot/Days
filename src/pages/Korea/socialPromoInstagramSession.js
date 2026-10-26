export const SOCIAL_PROMO_INSTAGRAM_VISIT_KEY = 'gateo:festival-social-promo:instagram-visit';
export const SOCIAL_PROMO_INSTAGRAM_DISMISS_KEY = 'gateo:festival-social-promo:dismissed';

export function normalizeUtmSource(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function isInstagramUtmSource(value) {
  const normalized = normalizeUtmSource(value);
  return normalized === 'instagram' || normalized === 'ig';
}

export function isInstagramReferrerHostname(hostname) {
  const host = String(hostname ?? '').trim().toLowerCase();
  if (!host) return false;
  if (host === 'instagram.com' || host === 'l.instagram.com') return true;
  return host.endsWith('.instagram.com');
}

export function isInstagramReferrerUrl(referrer) {
  const raw = String(referrer ?? '').trim();
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return isInstagramReferrerHostname(url.hostname);
  } catch {
    return false;
  }
}

/**
 * @param {{ searchParams?: URLSearchParams | string, referrer?: string }} ctx
 */
export function detectInstagramLandingSignal(ctx = {}) {
  const params =
    ctx.searchParams instanceof URLSearchParams
      ? ctx.searchParams
      : new URLSearchParams(String(ctx.searchParams ?? ''));
  if (isInstagramUtmSource(params.get('utm_source'))) return true;
  return isInstagramReferrerUrl(ctx.referrer);
}

/**
 * @param {Storage | null | undefined} storage
 * @param {{ searchParams?: URLSearchParams | string, referrer?: string }} ctx
 */
export function recordInstagramVisitIfLanding(storage, ctx = {}) {
  if (!storage || typeof storage.getItem !== 'function') return false;
  if (storage.getItem(SOCIAL_PROMO_INSTAGRAM_VISIT_KEY) === '1') return true;
  if (!detectInstagramLandingSignal(ctx)) return false;
  storage.setItem(SOCIAL_PROMO_INSTAGRAM_VISIT_KEY, '1');
  return true;
}

export function hasInstagramVisitSession(storage) {
  return storage?.getItem?.(SOCIAL_PROMO_INSTAGRAM_VISIT_KEY) === '1';
}

export function isSocialPromoRowDismissed(storage) {
  return storage?.getItem?.(SOCIAL_PROMO_INSTAGRAM_DISMISS_KEY) === '1';
}

export function dismissSocialPromoRow(storage) {
  storage?.setItem?.(SOCIAL_PROMO_INSTAGRAM_DISMISS_KEY, '1');
}

/**
 * @param {{
 *   storage?: Storage | null,
 *   searchParams?: URLSearchParams | string,
 *   referrer?: string,
 *   dismissed?: boolean,
 *   visitRecorded?: boolean,
 *   regionDefault?: boolean,
 * }} opts
 */
export function shouldShowInstagramSocialPromoStrip(opts = {}) {
  if (opts.dismissed ?? isSocialPromoRowDismissed(opts.storage)) return false;
  if (opts.regionDefault === false) return false;
  if (opts.visitRecorded === true) return true;
  if (opts.visitRecorded === false) return false;
  if (hasInstagramVisitSession(opts.storage)) return true;
  return detectInstagramLandingSignal({
    searchParams: opts.searchParams,
    referrer: opts.referrer,
  });
}
