/** Chip asks wait this long for festival detail, then send with whatever is already known. */
export const FESTIVAL_DETAIL_ASK_WAIT_MS = 12_000;

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

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Read the latest festival context. While detail is pending and narrative is empty,
 * poll the live spot (not the send closure) until it arrives or the timeout elapses.
 * @param {() => { festivalContext?: Record<string, unknown> | null } | null | undefined} readSpot
 * @param {{ timeoutMs?: number, intervalMs?: number }} [options]
 */
export async function readFestivalContextForAsk(readSpot, options = {}) {
  const read = () => {
    const spot = typeof readSpot === 'function' ? readSpot() : readSpot;
    return spot?.festivalContext ?? null;
  };
  let ctx = read();
  const timeoutMs = Math.max(0, Number(options.timeoutMs ?? FESTIVAL_DETAIL_ASK_WAIT_MS) || 0);
  if (!festivalContextNeedsDetailWait(ctx) || timeoutMs === 0) return ctx;
  const intervalMs = Math.max(10, Number(options.intervalMs) || 50);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const remaining = timeoutMs - (Date.now() - started);
    await delay(Math.min(intervalMs, remaining));
    ctx = read();
    if (!festivalContextNeedsDetailWait(ctx)) return ctx;
  }
  return read();
}
