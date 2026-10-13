/** Vercel Preview·로컬에서만 Cloud QA 오버레이를 켠다. PROD(gateo.kr)에서는 항상 false. */
export function isCloudPreviewSurface() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (host === 'www.gateo.kr' || host === 'gateo.kr') return false;
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (import.meta.env.DEV) return true;
  return host.endsWith('.vercel.app');
}
