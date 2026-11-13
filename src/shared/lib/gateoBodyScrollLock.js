let depth = 0;
/** @type {{ overflow: string, overflowY: string } | null} */
let saved = null;

export function resetGateoBodyScrollLockForTests() {
  depth = 0;
  saved = null;
}

export function gateoBodyScrollLockDepth() {
  return depth;
}

/**
 * Ref-counted body scroll lock for stacked modals/sheets.
 * Restores inline overflow only when the last lock is released.
 */
export function pushGateoBodyScrollLock() {
  if (typeof document === 'undefined') return () => {};

  depth += 1;
  if (depth === 1) {
    const body = document.body;
    saved = {
      overflow: body.style.overflow,
      overflowY: body.style.overflowY,
    };
    body.style.overflow = 'hidden';
    body.style.overflowY = 'hidden';
  }

  return () => {
    if (typeof document === 'undefined') return;
    if (depth <= 0) return;
    depth -= 1;
    if (depth === 0 && saved) {
      const body = document.body;
      body.style.overflow = saved.overflow;
      body.style.overflowY = saved.overflowY;
      saved = null;
    }
  };
}
