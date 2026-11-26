/** Vercel Preview·로컬에서만 Cloud QA 오버레이를 켠다. PROD(gateo.kr)에서는 항상 false. */
export function isCloudPreviewSurface() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (host === 'www.gateo.kr' || host === 'gateo.kr') return false;
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (import.meta.env.DEV) return true;
  return host.endsWith('.vercel.app');
}

export function isProductionSiteHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  return host === 'gateo.kr' || host === 'www.gateo.kr';
}

/**
 * Preview work log · flight mobile debug panel.
 * www.gateo.kr / gateo.kr never show them, even with ?devlog=1.
 * A *.vercel.app preview shows them only when the URL has ?devlog=1.
 * Localhost and a Vite dev server still show them.
 * @param {string} [hostname]
 * @param {{ dev?: boolean, search?: string }} [options]
 */
export function previewDebugChromeAllowed(hostname, { dev = false, search = '' } = {}) {
  if (isProductionSiteHost(hostname)) return false;
  const host = String(hostname || '').trim().toLowerCase();
  if (host.endsWith('.vercel.app')) {
    try {
      return new URLSearchParams(String(search || '')).get('devlog') === '1';
    } catch {
      return false;
    }
  }
  if (dev) return true;
  return host === 'localhost' || host === '127.0.0.1';
}