/** Pure helpers for refresh-place-videos (YouTube videos.list compliance). */

export const STALE_DAYS = 20;
export const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;
export const METADATA_TTL_DAYS = 30;
export const METADATA_TTL_MS = METADATA_TTL_DAYS * 24 * 60 * 60 * 1000;
export const YT_VIDEOS_LIST_BATCH = 50;
export const DEFAULT_MAX_REMOVE_PCT = 5;
export const DAY_MS = 24 * 60 * 60 * 1000;

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

/** @param {string | null | undefined} raw @param {number} [fallback] */
export function parseCutoffDaysParam(raw, fallback = STALE_DAYS) {
  if (raw == null || String(raw).trim() === "") return fallback;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(30, Math.max(0, n));
}

/** @param {string | null | undefined} raw @param {number} [fallback] */
export function parseLimitParam(raw, fallback = 1000) {
  if (raw == null || String(raw).trim() === "") return fallback;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1000, Math.max(1, n));
}

const HTML_ENTITY_NAMED = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
};

export function staleCutoffIso(nowMs = Date.now(), cutoffDays = STALE_DAYS) {
  const days = parseCutoffDaysParam(String(cutoffDays), STALE_DAYS);
  return new Date(nowMs - days * DAY_MS).toISOString();
}

export function isMetadataExpired(lastUpdated, nowMs = Date.now()) {
  if (!lastUpdated) return true;
  const t = Date.parse(lastUpdated);
  if (!Number.isFinite(t)) return true;
  return nowMs - t > METADATA_TTL_MS;
}

/**
 * Strip YouTube non-ID metadata (title, channelTitle, publishedAt). Keeps id and GATEO fields.
 * @param {unknown} entry
 * @returns {{ video: Record<string, unknown>, stripped: boolean }}
 */
export function stripYoutubeNonIdMetadata(entry) {
  if (!entry || typeof entry !== "object") {
    return { video: {}, stripped: false };
  }
  const rec = { ...entry };
  let stripped = false;
  if ("title" in rec) {
    delete rec.title;
    stripped = true;
  }
  if ("channelTitle" in rec) {
    delete rec.channelTitle;
    stripped = true;
  }
  if ("publishedAt" in rec) {
    delete rec.publishedAt;
    stripped = true;
  }
  return { video: rec, stripped };
}

/** @param {unknown[]} videos */
export function stripVideosYoutubeMetadata(videos) {
  const list = Array.isArray(videos) ? videos : [];
  let strippedCount = 0;
  const out = list.map((entry) => {
    const { video, stripped } = stripYoutubeNonIdMetadata(entry);
    if (stripped) strippedCount += 1;
    return video;
  });
  return { videos: out, strippedCount };
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
 * @returns {{ keep: true, title: string, channelTitle: string | null, publishedAt: string | null } | { keep: false, reason: string }}
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
  const publishedAt = snippet.publishedAt != null
    ? String(snippet.publishedAt).trim() || null
    : null;
  if (!title) {
    return { keep: false, reason: "missing" };
  }
  return { keep: true, title, channelTitle, publishedAt };
}

/**
 * @param {unknown[]} cachedVideos
 * @param {Map<string, unknown>} ytById
 * @param {Set<string>} [batchFailedIds]
 */
export function refreshVideosForPlace(cachedVideos, ytById, batchFailedIds = new Set()) {
  const list = Array.isArray(cachedVideos) ? cachedVideos : [];
  const videos = [];
  const removals = [];
  let examined = 0;
  let removed = 0;
  let titleUpdates = 0;
  let batchFailed = false;

  for (const entry of list) {
    examined += 1;
    const id = videoIdFromCached(entry);
    if (!id) {
      removed += 1;
      removals.push({ videoId: "", reason: "invalid_id" });
      continue;
    }
    if (batchFailedIds.has(id)) {
      batchFailed = true;
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
    if (next.publishedAt !== verdict.publishedAt) titleUpdates += 1;
    next.publishedAt = verdict.publishedAt;
    videos.push(next);
  }

  return {
    videos,
    examined,
    removed,
    titleUpdates,
    kept: videos.length,
    removals,
    batchFailed,
  };
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

/**
 * Removal cap uses only places that completed YouTube checks (no batch-fail / skipped).
 * @param {Array<{ examined: number, removed: number, emptyPlace: boolean, checkOk?: boolean }>} parts
 */
export function summarizeRefreshRunForCap(parts, maxRatio = maxRemoveRatioFromPct(DEFAULT_MAX_REMOVE_PCT)) {
  const ok = parts.filter((p) => p.checkOk !== false);
  return summarizeRefreshRun(ok, maxRatio);
}
