/** @param {Element | null | undefined} el */
export function clearLogbookHubScrollRestored(el) {
  if (el instanceof HTMLElement) {
    delete el.dataset.logbookHubScrollRestored;
    delete el.dataset.logbookHubScrollTarget;
  }
  cancelActiveRestore();
}

/**
 * @param {Element | null | undefined} el
 * @param {number} targetY
 */
export function applyLogbookHubScrollRestore(el, targetY) {
  if (!el || !(el instanceof HTMLElement) || !Number.isFinite(targetY)) return false;
  if (Math.abs(el.scrollTop - targetY) >= 6) {
    el.scrollTop = targetY;
  }
  const closeEnough = Math.abs(el.scrollTop - targetY) < 6;
  if (closeEnough) {
    el.dataset.logbookHubScrollRestored = '1';
    el.dataset.logbookHubScrollTarget = String(Math.round(targetY));
  }
  return closeEnough;
}

const USER_INPUT_EVENTS = ['wheel', 'touchmove', 'keydown', 'pointerdown'];
const SEEK_CAP_MS = 1800;
const SETTLE_MS = 400;
const TICK_MS = 50;
const MAX_SEEKS = 2;

let epoch = 0;
let lockedEpoch = -1;
let phase = 'idle';
let landed = false;
let seeks = 0;
let seekStart = 0;
let settleUntil = 0;
let timer = null;
let listening = false;
let refs = 0;
/** @type {HTMLElement | null} */
let activeEl = null;
let activeTarget = 0;

function stopTimer() {
  if (timer != null) {
    window.clearTimeout(timer);
    timer = null;
  }
}

function unlisten() {
  if (!listening || typeof window === 'undefined') return;
  listening = false;
  for (const type of USER_INPUT_EVENTS) {
    window.removeEventListener(type, onUserIntent, true);
  }
  window.removeEventListener('pageshow', onPageShow);
}

function cancelActiveRestore() {
  epoch += 1;
  lockedEpoch = -1;
  phase = 'idle';
  landed = false;
  seeks = 0;
  seekStart = 0;
  settleUntil = 0;
  activeEl = null;
  activeTarget = 0;
  stopTimer();
  unlisten();
}

function finishRestore() {
  phase = 'done';
  stopTimer();
  unlisten();
}

/** @param {Event} event */
function onUserIntent(event) {
  if (phase !== 'seeking' && phase !== 'settling') return;
  if (event.type === 'wheel') {
    const wheel = /** @type {WheelEvent} */ (event);
    if (!wheel.deltaY && !wheel.deltaX) return;
  }
  lockedEpoch = epoch;
  finishRestore();
}

function onPageShow() {
  if (phase !== 'seeking' && phase !== 'settling') return;
  if (!activeEl || !activeEl.isConnected) return;
  const ok = applyLogbookHubScrollRestore(activeEl, activeTarget);
  if (ok && phase === 'seeking') beginSettle();
}

function ensureListeners() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  for (const type of USER_INPUT_EVENTS) {
    window.addEventListener(type, onUserIntent, { capture: true, passive: true });
  }
  window.addEventListener('pageshow', onPageShow);
}

function beginSettle() {
  landed = true;
  phase = 'settling';
  settleUntil = performance.now() + SETTLE_MS;
}

/** @param {number} gen */
function arm(gen) {
  if (timer != null || typeof window === 'undefined') return;
  timer = window.setTimeout(() => tick(gen), TICK_MS);
}

/** @param {number} gen */
function tick(gen) {
  timer = null;
  if (gen !== epoch) return;
  if (lockedEpoch === epoch || phase === 'done' || phase === 'idle') return;
  if (!activeEl || !activeEl.isConnected) {
    stopTimer();
    unlisten();
    return;
  }
  const ok = applyLogbookHubScrollRestore(activeEl, activeTarget);
  const now = performance.now();
  if (ok && phase === 'seeking') beginSettle();
  if (phase === 'settling' && now >= settleUntil) {
    finishRestore();
    return;
  }
  if (phase === 'seeking' && now - seekStart >= SEEK_CAP_MS) {
    finishRestore();
    return;
  }
  arm(gen);
}

/**
 * Restores hub scroll once. Late layout may re-align only inside a short seek/settle
 * window. wheel, touchmove, keydown, and pointerdown stop it immediately.
 * Scroll is not observed — a scroll listener re-pins the saved position after the user moves.
 * @param {HTMLElement} el
 * @param {number} targetY
 * @returns {() => void}
 */
export function scheduleLogbookHubScrollRestore(el, targetY) {
  if (!el || !(el instanceof HTMLElement) || !Number.isFinite(targetY)) return () => {};
  if (lockedEpoch === epoch) return () => {};
  if (phase === 'done' && landed) return () => {};
  if (phase === 'done' && !landed) {
    if (seeks >= MAX_SEEKS) return () => {};
    phase = 'idle';
  }

  activeEl = el;
  activeTarget = targetY;
  const gen = epoch;
  if (phase === 'idle') {
    phase = 'seeking';
    seekStart = performance.now();
    seeks += 1;
  }
  ensureListeners();
  const ok = applyLogbookHubScrollRestore(el, targetY);
  if (ok && phase === 'seeking') beginSettle();
  if (timer == null && (phase === 'seeking' || phase === 'settling')) arm(gen);

  refs += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    refs = Math.max(0, refs - 1);
    if (refs === 0 && phase !== 'done' && lockedEpoch !== epoch) {
      stopTimer();
      unlisten();
    }
  };
}
