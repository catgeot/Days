const INTERACTIVE_SELECTOR =
  'a,button,img,input,textarea,select,summary,details,[role="button"],[role="link"]';

export function hasReviewBodyTextSelection() {
  if (typeof window === 'undefined') return false;
  const selection = window.getSelection?.();
  if (!selection || selection.isCollapsed) return false;
  return selection.toString().trim().length > 0;
}

function isDomElement(target) {
  return Boolean(target && typeof target === 'object' && target.nodeType === 1);
}

export function isReviewBodyInteractiveClickTarget(target) {
  if (!isDomElement(target) || typeof target.closest !== 'function') return false;
  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

/** Body tap toggles expand unless the hit target is interactive or the user is selecting text. */
export function shouldToggleReviewBodyFromClick(event) {
  if (!event || event.defaultPrevented) return false;
  if (typeof event.button === 'number' && event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (hasReviewBodyTextSelection()) return false;
  const { target } = event;
  if (!isDomElement(target)) return false;
  if (isReviewBodyInteractiveClickTarget(target)) return false;
  return true;
}
