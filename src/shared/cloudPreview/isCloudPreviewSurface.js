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
 * 작업 로그·모바일 위젯 로그. Dev, localhost, or a Vercel git-branch preview.
 * Production hosts stay hidden even when a debug query or localStorage flag is set.
 */
export function previewDebugChromeAllowed(hostname, { dev = false } = {}) {
  if (isProductionSiteHost(hostname)) return false;
  if (dev) return true;
  const host = String(hostname || '').trim().toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return host.endsWith('.vercel.app') && host.includes('-git-');
}
