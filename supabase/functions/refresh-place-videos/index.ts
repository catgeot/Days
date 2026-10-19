import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  chunkVideoIds,
  parseMaxRemovePct,
  maxRemoveRatioFromPct,
  refreshVideosForPlace,
  staleCutoffIso,
  summarizeRefreshRun,
  videoIdFromCached,
} from "../_shared/placeVideoRefresh.mjs";

const BASE_URL = "https://www.googleapis.com/youtube/v3";
const TOKEN_HEADER = "x-refresh-videos-token";

type PlaceRow = {
  place_id: string;
  videos: unknown[] | null;
  last_updated: string | null;
};

type RunPart = {
  place_id: string;
  examined: number;
  removed: number;
  titleUpdates: number;
  emptyPlace: boolean;
  videos: unknown[];
  removals: Array<{ videoId: string; reason: string }>;
};

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function tokenAuthorized(req: Request): boolean {
  const expected = (Deno.env.get("REFRESH_VIDEOS_TOKEN") ?? "").trim();
  if (!expected) return false;
  const got = (req.headers.get(TOKEN_HEADER) ?? "").trim();
  return got.length > 0 && got === expected;
}

function youtubeApiKey(): string {
  return (Deno.env.get("YOUTUBE_API_KEY") ?? Deno.env.get("VITE_YOUTUBE_API_KEY") ?? "").trim();
}

function refreshVideosApplyEnabled(): boolean {
  return (Deno.env.get("REFRESH_VIDEOS_APPLY") ?? "").trim().toLowerCase() === "on";
}

function maxRemoveRatio(): number {
  return maxRemoveRatioFromPct(parseMaxRemovePct(Deno.env.get("REFRESH_VIDEOS_MAX_REMOVE_PCT")));
}

async function fetchVideosListBatch(
  apiKey: string,
  ids: string[],
): Promise<Map<string, unknown>> {
  const p = new URLSearchParams({
    part: "snippet,status",
    id: ids.join(","),
    key: apiKey,
  });
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/videos?${p.toString()}`);
  } catch {
    throw new Error("youtube_network");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as {
      error?: { message?: string; errors?: Array<{ reason?: string }> };
    };
    const reason = err.error?.errors?.[0]?.reason || err.error?.message || "youtube_error";
    throw new Error(String(reason).slice(0, 300));
  }
  const data = await res.json() as { items?: unknown[] };
  const map = new Map<string, unknown>();
  for (const item of data.items ?? []) {
    if (!item || typeof item !== "object") continue;
    const id = String((item as { id?: string }).id ?? "").trim();
    if (id) map.set(id, item);
  }
  return map;
}

async function loadStaleRows(
  admin: ReturnType<typeof createClient>,
  cutoffIso: string,
): Promise<PlaceRow[]> {
  const pageSize = 500;
  const rows: PlaceRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from("place_videos")
      .select("place_id, videos, last_updated")
      .lt("last_updated", cutoffIso)
      .order("place_id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error("place_videos_read_failed");
    const batch = (data ?? []) as PlaceRow[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204 });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ success: false, error: "method_not_allowed" }, 405);
  }
  if (!tokenAuthorized(req)) {
    return json({ success: false, error: "unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const dryRunQuery = url.searchParams.get("dry_run") === "1";
  const applyEnabled = refreshVideosApplyEnabled();
  const dryRun = dryRunQuery || !applyEnabled;
  const reportOnly = !applyEnabled;
  const maxRatio = maxRemoveRatio();
  const maxRemovePct = maxRatio * 100;

  const apiKey = youtubeApiKey();
  if (!apiKey) {
    return json({ success: false, error: "youtube_not_configured" }, 500);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const cutoffIso = staleCutoffIso();
  let staleRows: PlaceRow[];
  try {
    staleRows = await loadStaleRows(supabaseAdmin, cutoffIso);
  } catch {
    return json({ success: false, error: "place_videos_read_failed" }, 503);
  }

  const uniqueIds = new Set<string>();
  for (const row of staleRows) {
    const list = Array.isArray(row.videos) ? row.videos : [];
    for (const entry of list) {
      const id = videoIdFromCached(entry);
      if (id) uniqueIds.add(id);
    }
  }

  const ytById = new Map<string, unknown>();
  try {
    for (const batch of chunkVideoIds([...uniqueIds])) {
      const part = await fetchVideosListBatch(apiKey, batch);
      for (const [id, item] of part) ytById.set(id, item);
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : "youtube_error";
    return json({ success: false, error: reason }, 502);
  }

  const nowIso = new Date().toISOString();
  const parts: RunPart[] = [];
  for (const row of staleRows) {
    const list = Array.isArray(row.videos) ? row.videos : [];
    const emptyPlace = list.length === 0;
    const refreshed = refreshVideosForPlace(list, ytById);
    parts.push({
      place_id: row.place_id,
      examined: refreshed.examined,
      removed: refreshed.removed,
      titleUpdates: refreshed.titleUpdates,
      emptyPlace,
      videos: refreshed.videos,
      removals: refreshed.removals,
    });
  }

  const summary = summarizeRefreshRun(parts, maxRatio);
  const candidates = parts.flatMap((p) =>
    p.removals.map((r) => ({
      place_id: p.place_id,
      video_id: r.videoId,
      reason: r.reason,
    })),
  );

  if (summary.guardTriggered) {
    const report = {
      success: false,
      error: "cap_exceeded",
      dry_run: dryRun,
      report_only: reportOnly,
      apply: applyEnabled && !dryRunQuery,
      cutoff: cutoffIso,
      summary,
      candidates,
      message: `Would remove ${summary.removed} of ${summary.examined} cached videos (${(summary.removalRate * 100).toFixed(1)}%), above ${maxRemovePct}% cap — no rows written`,
    };
    console.log(JSON.stringify({ event: "refresh_place_videos_cap_exceeded", ...report }));
    return json(report, 409);
  }

  if (dryRun) {
    const report = {
      success: true,
      dry_run: true,
      report_only: reportOnly,
      apply: false,
      cutoff: cutoffIso,
      summary,
      candidates,
      places: parts.map((p) => ({
        place_id: p.place_id,
        examined: p.examined,
        removed: p.removed,
        kept: p.videos.length,
        titleUpdates: p.titleUpdates,
        emptyPlace: p.emptyPlace,
      })),
    };
    console.log(JSON.stringify({
      event: "refresh_place_videos_report",
      report_only: reportOnly,
      examined: summary.examined,
      removed: summary.removed,
      removal_pct: summary.examined > 0 ? (summary.removalRate * 100).toFixed(2) : "0",
      candidate_count: candidates.length,
    }));
    return json(report, 200);
  }

  let updated = 0;
  for (const part of parts) {
    const { error } = await supabaseAdmin
      .from("place_videos")
      .update({
        videos: part.videos,
        last_updated: nowIso,
      })
      .eq("place_id", part.place_id);
    if (error) {
      return json({
        success: false,
        error: "place_videos_write_failed",
        place_id: part.place_id,
        summary,
        updated,
      }, 500);
    }
    updated += 1;
  }

  return json({
    success: true,
    dry_run: false,
    report_only: false,
    apply: true,
    cutoff: cutoffIso,
    summary,
    candidates,
    updated,
  }, 200);
});
