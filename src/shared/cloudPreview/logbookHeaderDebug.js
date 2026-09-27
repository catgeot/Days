import { isCloudPreviewSurface } from './isCloudPreviewSurface.js';
import { installFlightDebugGlobalHooks, logFlightDebug } from './flightDebug.js';

export function isLogbookHeaderDebugEnabled() {
  if (typeof window === 'undefined') return false;
  if (!window.location.pathname.startsWith('/blog')) return false;
  return isCloudPreviewSurface() || import.meta.env.DEV;
}

export function logLogbookHeaderDebug(tag, detail) {
  if (!isLogbookHeaderDebugEnabled()) return;
  installFlightDebugGlobalHooks();
  logFlightDebug(tag, detail);
}

export function describeHitElement(el) {
  if (!(el instanceof Element)) return 'none';
  const profile = el.closest('[data-logbook-header-profile]');
  if (profile) return 'profile-btn';
  const tag = el.tagName.toLowerCase();
  const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 4).join('.') : '';
  return cls ? `${tag}.${cls}` : tag;
}
