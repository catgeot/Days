import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  chunkVideoIds,
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
  const dryRun = url.searchParams.get("dry_run") === "1";

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
    });
  }

  const summary = summarizeRefreshRun(parts);
  if (summary.guardTriggered) {
    return json({
      success: false,
      error: "removal_guard",
      dry_run: dryRun,
      cutoff: cutoffIso,
      summary,
      message: `Would remove ${summary.removed} of ${summary.examined} cached videos (${(summary.removalRate * 100).toFixed(1)}%), above ${20}% cap — no rows written`,
    }, 409);
  }

  if (dryRun) {
    return json({
      success: true,
      dry_run: true,
      cutoff: cutoffIso,
      summary,
      places: parts.map((p) => ({
        place_id: p.place_id,
        examined: p.examined,
        removed: p.removed,
        kept: p.videos.length,
        titleUpdates: p.titleUpdates,
        emptyPlace: p.emptyPlace,
      })),
    }, 200);
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
    cutoff: cutoffIso,
    summary,
    updated,
  }, 200);
});
