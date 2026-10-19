/** Pure helpers for refresh-place-videos (YouTube videos.list compliance). */

export const STALE_DAYS = 23;
export const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;
export const YT_VIDEOS_LIST_BATCH = 50;
export const DEFAULT_MAX_REMOVE_PCT = 5;

/** @param {string | undefined} raw @param {number} [fallbackPct] */
export function parseMaxRemovePct(raw, fallbackPct = DEFAULT_MAX_REMOVE_PCT) {
  const s = (raw ?? "").trim();
  if (!s) return fallbackPct;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return fallbackPct;
  return n;
}

export function maxRemoveRatioFromPct(pct) {
  const p = parseMaxRemovePct(String(pct), DEFAULT_MAX_REMOVE_PCT);
  return p / 100;
}

const HTML_ENTITY_NAMED = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
};

export function staleCutoffIso(nowMs = Date.now()) {
  return new Date(nowMs - STALE_MS).toISOString();
}

export function decodeHtmlEntities(input) {
  if (!input) return "";
  return String(input).replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const numStr = isHex ? body.slice(2) : body.slice(1);
      const code = parseInt(numStr, isHex ? 16 : 10);
      if (!Number.isFinite(code)) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const lower = body.toLowerCase();
    if (Object.hasOwn(HTML_ENTITY_NAMED, body)) return HTML_ENTITY_NAMED[body];
    if (Object.hasOwn(HTML_ENTITY_NAMED, lower)) return HTML_ENTITY_NAMED[lower];
    return match;
  });
}

export function chunkVideoIds(ids, size = YT_VIDEOS_LIST_BATCH) {
  const out = [];
  for (let i = 0; i < ids.length; i += size) {
    out.push(ids.slice(i, i + size));
  }
  return out;
}

/**
 * @param {unknown} entry
 * @returns {string}
 */
export function videoIdFromCached(entry) {
  if (!entry || typeof entry !== "object") return "";
  const id = entry.id ?? entry.videoId;
  if (typeof id !== "string") return "";
  const trimmed = id.trim();
  return trimmed;
}

/**
 * @param {unknown} item YouTube videos.list item
 * @returns {{ keep: true, title: string, channelTitle: string | null } | { keep: false, reason: string }}
 */
export function classifyYoutubeListItem(item) {
  if (!item || typeof item !== "object") {
    return { keep: false, reason: "missing" };
  }
  const status = item.status;
  if (!status || typeof status !== "object") {
    return { keep: false, reason: "missing" };
  }
  const privacy = String(status.privacyStatus ?? "").toLowerCase();
  if (privacy !== "public") {
    return { keep: false, reason: privacy ? `privacy:${privacy}` : "missing" };
  }
  if (status.embeddable === false) {
    return { keep: false, reason: "not_embeddable" };
  }
  const snippet = item.snippet;
  if (!snippet || typeof snippet !== "object") {
    return { keep: false, reason: "missing" };
  }
  const title = decodeHtmlEntities(String(snippet.title ?? "").trim());
  const channelTitle = snippet.channelTitle != null
    ? decodeHtmlEntities(String(snippet.channelTitle).trim())
    : null;
  if (!title) {
    return { keep: false, reason: "missing" };
  }
  return { keep: true, title, channelTitle };
}

/**
 * @param {unknown[]} cachedVideos
 * @param {Map<string, unknown>} ytById
 */
export function refreshVideosForPlace(cachedVideos, ytById) {
  const list = Array.isArray(cachedVideos) ? cachedVideos : [];
  const videos = [];
  const removals = [];
  let examined = 0;
  let removed = 0;
  let titleUpdates = 0;

  for (const entry of list) {
    examined += 1;
    const id = videoIdFromCached(entry);
    if (!id) {
      removed += 1;
      removals.push({ videoId: "", reason: "invalid_id" });
      continue;
    }
    const ytItem = ytById.get(id);
    if (!ytItem) {
      removed += 1;
      removals.push({ videoId: id, reason: "missing" });
      continue;
    }
    const verdict = classifyYoutubeListItem(ytItem);
    if (!verdict.keep) {
      removed += 1;
      removals.push({ videoId: id, reason: verdict.reason });
      continue;
    }
    const next = typeof entry === "object" && entry !== null
      ? { ...entry }
      : { id };
    next.id = id;
    if (next.title !== verdict.title) titleUpdates += 1;
    next.title = verdict.title;
    next.channelTitle = verdict.channelTitle;
    videos.push(next);
  }

  return { videos, examined, removed, titleUpdates, kept: videos.length, removals };
}

export function exceedsRemovalGuard(examined, removed, maxRatio = maxRemoveRatioFromPct(DEFAULT_MAX_REMOVE_PCT)) {
  if (!Number.isFinite(examined) || examined <= 0) return false;
  if (!Number.isFinite(removed) || removed < 0) return false;
  const cap = Number.isFinite(maxRatio) && maxRatio >= 0 ? maxRatio : maxRemoveRatioFromPct(DEFAULT_MAX_REMOVE_PCT);
  return removed / examined > cap;
}

/**
 * @param {Array<{ examined: number, removed: number, places: number, emptyPlace: boolean }>} parts
 */
export function summarizeRefreshRun(parts, maxRatio = maxRemoveRatioFromPct(DEFAULT_MAX_REMOVE_PCT)) {
  let places = 0;
  let placesWithVideos = 0;
  let examined = 0;
  let removed = 0;
  let titleUpdates = 0;
  let emptyPlacesTouched = 0;

  for (const p of parts) {
    places += 1;
    if (p.emptyPlace) emptyPlacesTouched += 1;
    else placesWithVideos += 1;
    examined += p.examined ?? 0;
    removed += p.removed ?? 0;
    titleUpdates += p.titleUpdates ?? 0;
  }

  return {
    places,
    placesWithVideos,
    emptyPlacesTouched,
    examined,
    removed,
    titleUpdates,
    removalRate: examined > 0 ? removed / examined : 0,
    guardTriggered: exceedsRemovalGuard(examined, removed, maxRatio),
    maxRemovePct: maxRatio * 100,
  };
}
