export const FOOTER_MODAL_OPEN_EVENT = 'gateo:open-footer-modal';

export function openFooterModal(tab = 'about') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FOOTER_MODAL_OPEN_EVENT, { detail: { tab } }));
}
