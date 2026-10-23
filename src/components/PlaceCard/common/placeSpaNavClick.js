/** True when a primary Link should run SPA setMediaMode instead of default navigation. */
export function shouldHandlePlaceSpaNavClick(event) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  return true;
}
