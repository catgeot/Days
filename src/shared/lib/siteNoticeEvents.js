export const OPEN_UPDATES_LIST_EVENT = 'gateo:open-updates-list';

export function openUpdatesList() {
  window.dispatchEvent(new CustomEvent(OPEN_UPDATES_LIST_EVENT));
}
