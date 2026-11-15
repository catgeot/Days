/** @param {Element | null | undefined} el */
export function clearLogbookHubScrollRestored(el) {
  if (el instanceof HTMLElement) {
    delete el.dataset.logbookHubScrollRestored;
    delete el.dataset.logbookHubScrollTarget;
  }
  epoch += 1;
  abandonedEpoch = -1;
  phase = 'idle';
  landed = false;
  seeks = 0;
  seekStart = 0;
  settleUntil = 0;
  activeEl = null;
  activeTarget = 0;
  stopScheduled();
  unlisten();
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

const USER_INPUT_EVENTS = ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'];
const SEEK_CAP_MS = 1800;
const SETTLE_MS = 400;
const TICK_MS = 50;
const MAX_SEEKS = 2;
const LISTEN_CAPTURE = true;

let epoch = 0;
let abandonedEpoch = -1;
let phase = 'idle';
let landed = false;
let seeks = 0;
let seekStart = 0;
let settleUntil = 0;
let timer = 0;
/** @type {EventTarget[]} */
let bound = [];
let pageShowBound = false;
/** @type {HTMLElement | null} */
let activeEl = null;
let activeTarget = 0;

function sessionAbandoned() {
  return abandonedEpoch === epoch;
}

function stopScheduled() {
  if (timer && typeof window !== 'undefined') window.clearTimeout(timer);
  timer = 0;
}

function unlisten() {
  for (const target of bound) {
    for (const type of USER_INPUT_EVENTS) {
      target.removeEventListener(type, onUserIntent, LISTEN_CAPTURE);
    }
  }
  bound = [];
  if (pageShowBound && typeof window !== 'undefined') {
    window.removeEventListener('pageshow', onPageShow);
    pageShowBound = false;
  }
}

function abandonSession() {
  abandonedEpoch = epoch;
  phase = 'done';
  stopScheduled();
  unlisten();
}

/** @param {Event} event */
function onUserIntent(event) {
  if (sessionAbandoned()) return;
  if (phase !== 'seeking' && phase !== 'settling') return;
  if (event.type === 'wheel') {
    const wheel = /** @type {WheelEvent} */ (event);
    if (!wheel.deltaY && !wheel.deltaX) return;
  }
  abandonSession();
}

function onPageShow() {
  if (sessionAbandoned() || (phase !== 'seeking' && phase !== 'settling')) return;
  if (!activeEl || !activeEl.isConnected) return;
  const ok = applyLogbookHubScrollRestore(activeEl, activeTarget);
  if (ok && phase === 'seeking') beginSettle();
}

/** @param {EventTarget | null | undefined} target */
function bindInput(target) {
  if (!target || bound.includes(target)) return;
  for (const type of USER_INPUT_EVENTS) {
    target.addEventListener(type, onUserIntent, { capture: true, passive: true });
  }
  bound.push(target);
}

/** @param {HTMLElement} el */
function ensureListeners(el) {
  if (typeof window === 'undefined') return;
  bindInput(window);
  if (typeof document !== 'undefined') bindInput(document);
  bindInput(el);
  const scroller = document.querySelector?.('[data-logbook-main-scroll]');
  if (scroller instanceof HTMLElement) bindInput(scroller);
  if (!pageShowBound) {
    window.addEventListener('pageshow', onPageShow);
    pageShowBound = true;
  }
}

function beginSettle() {
  landed = true;
  phase = 'settling';
  settleUntil = performance.now() + SETTLE_MS;
}

function finishQuiet() {
  phase = 'done';
  stopScheduled();
  unlisten();
}

/** @param {number} gen */
function arm(gen) {
  if (timer || sessionAbandoned() || typeof window === 'undefined') return;
  timer = window.setTimeout(() => tick(gen), TICK_MS);
}

/** @param {number} gen */
function tick(gen) {
  timer = 0;
  if (gen !== epoch || sessionAbandoned() || phase === 'done' || phase === 'idle') return;
  if (!activeEl || !activeEl.isConnected) {
    finishQuiet();
    return;
  }
  const ok = applyLogbookHubScrollRestore(activeEl, activeTarget);
  const now = performance.now();
  if (ok && phase === 'seeking') beginSettle();
  if (phase === 'settling' && now >= settleUntil) {
    finishQuiet();
    return;
  }
  if (phase === 'seeking' && now - seekStart >= SEEK_CAP_MS) {
    finishQuiet();
    return;
  }
  arm(gen);
}

/**
 * Restores hub scroll inside a short seek/settle window.
 * The first wheel, touchstart, touchmove, keydown, or pointerdown — on window,
 * document, or the hub scroller, capture — abandons every queued tick for this
 * return. Effect cleanup does not drop those listeners: a later list-height
 * pass must not re-pin after the user has already moved.
 * @param {HTMLElement} el
 * @param {number} targetY
 * @returns {() => void}
 */
export function scheduleLogbookHubScrollRestore(el, targetY) {
  if (!el || !(el instanceof HTMLElement) || !Number.isFinite(targetY)) return () => {};
  if (sessionAbandoned()) return () => {};
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
  ensureListeners(el);
  if (sessionAbandoned()) return () => {};
  const ok = applyLogbookHubScrollRestore(el, targetY);
  if (ok && phase === 'seeking') beginSettle();
  if (!timer && (phase === 'seeking' || phase === 'settling')) arm(gen);

  return () => {};
}
