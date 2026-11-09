const activeLayerStack = [];

export function registerGateoPhotoLightboxLayer(layerId) {
  if (!layerId || activeLayerStack.includes(layerId)) return;
  activeLayerStack.push(layerId);
}

export function unregisterGateoPhotoLightboxLayer(layerId) {
  const idx = activeLayerStack.indexOf(layerId);
  if (idx >= 0) activeLayerStack.splice(idx, 1);
}

export function isTopGateoPhotoLightboxLayer(layerId) {
  if (!layerId || activeLayerStack.length === 0) return false;
  return activeLayerStack[activeLayerStack.length - 1] === layerId;
}

function parseZIndex(value) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : 0;
}

export function effectiveZIndex(el) {
  if (!el || typeof document === 'undefined') return 0;
  let max = 0;
  let node = el;
  while (node && node !== document.documentElement) {
    const z = parseZIndex(window.getComputedStyle(node).zIndex);
    if (z > max) max = z;
    node = node.parentElement;
  }
  return max;
}

export function isGateoPhotoLightboxElementVisible(el) {
  if (!el?.isConnected) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

/**
 * True when another modal dialog is stacked above this lightbox root (mooni, manage sheet, etc.).
 */
export function gateoModalBlocksLightboxEscape(lightboxRoot) {
  if (!lightboxRoot || typeof document === 'undefined') return false;
  const lbZ = effectiveZIndex(lightboxRoot);
  const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
  for (const dialog of dialogs) {
    if (lightboxRoot.contains(dialog)) continue;
    if (!isGateoPhotoLightboxElementVisible(dialog)) continue;
    if (effectiveZIndex(dialog) > lbZ) return true;
  }
  return false;
}

let escapeHandledForEvent = false;

export function markGateoPhotoLightboxEscapeHandled() {
  escapeHandledForEvent = true;
}

export function consumeGateoPhotoLightboxEscapeHandled() {
  const handled = escapeHandledForEvent;
  escapeHandledForEvent = false;
  return handled;
}

export function resetGateoPhotoLightboxEscapeHandled() {
  escapeHandledForEvent = false;
}
