/** Chip asks wait this long for festival detail, then send with whatever is already known. */
export const FESTIVAL_DETAIL_ASK_WAIT_MS = 12_000;

const FESTIVAL_ASK_CANCELLED = Object.freeze({ festivalAsk: 'cancelled' });

export function isFestivalAskCancelled(value) {
  return Boolean(value && value.festivalAsk === 'cancelled');
}

function narrativeText(ctx) {
  return [
    ctx?.overview,
    ctx?.sceneOverview,
    ctx?.program,
  ].some((value) => String(value || '').trim());
}

/** Detail is still in flight and the overview/program have not arrived. */
export function festivalContextNeedsDetailWait(ctx) {
  return Boolean(ctx?.detailPending) && !narrativeText(ctx);
}

function delay(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    if (!signal) return;
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Read the latest festival context. While detail is pending and narrative is empty,
 * poll the live spot (not the send closure) until it arrives, the timeout elapses,
 * or the ask is cancelled (close, unmount, or a different contentId).
 * A cancelled wait does not return the replacement festival's context.
 * @param {() => { festivalContext?: Record<string, unknown> | null } | null | undefined} readSpot
 * @param {{ timeoutMs?: number, intervalMs?: number, signal?: AbortSignal, contentId?: string, isCancelled?: () => boolean }} [options]
 */
export async function readFestivalContextForAsk(readSpot, options = {}) {
  const read = () => {
    const spot = typeof readSpot === 'function' ? readSpot() : readSpot;
    return spot?.festivalContext ?? null;
  };
  const expectedId = options.contentId == null || options.contentId === ''
    ? ''
    : String(options.contentId);
  const cancelled = () => {
    if (options.signal?.aborted) return true;
    if (typeof options.isCancelled === 'function' && options.isCancelled()) return true;
    if (!expectedId) return false;
    return String(read()?.contentId || '') !== expectedId;
  };
  if (cancelled()) return FESTIVAL_ASK_CANCELLED;

  let ctx = read();
  const timeoutMs = Math.max(0, Number(options.timeoutMs ?? FESTIVAL_DETAIL_ASK_WAIT_MS) || 0);
  if (!festivalContextNeedsDetailWait(ctx) || timeoutMs === 0) return ctx;
  const intervalMs = Math.max(10, Number(options.intervalMs) || 50);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const remaining = timeoutMs - (Date.now() - started);
    await delay(Math.min(intervalMs, remaining), options.signal);
    if (cancelled()) return FESTIVAL_ASK_CANCELLED;
    ctx = read();
    if (!festivalContextNeedsDetailWait(ctx)) return ctx;
  }
  if (cancelled()) return FESTIVAL_ASK_CANCELLED;
  return read();
}
