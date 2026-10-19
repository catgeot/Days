import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  chunkVideoIds,
  isMetadataExpired,
  parseCutoffDaysParam,
  parseLimitParam,
  parseMaxRemovePct,
  maxRemoveRatioFromPct,
  refreshVideosForPlace,
  staleCutoffIso,
  stripVideosYoutubeMetadata,
  summarizeRefreshRun,
  summarizeRefreshRunForCap,
  videoIdFromCached,
} from "../_shared/placeVideoRefresh.mjs";

const BASE_URL = "https://www.googleapis.com/youtube/v3";
const TOKEN_HEADER = "x-refresh-videos-token";
const RUNS_TABLE = "place_videos_refresh_runs";

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
  publishedAtUpdates: number;
  emptyPlace: boolean;
  videos: unknown[];
  removals: Array<{ videoId: string; reason: string }>;
  checkOk: boolean;
  metadataBlanked: number;
  sourceLastUpdated: string | null;
};

type RunFailure = { place_id: string; stage: string; error: string };

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

function runMode(dryRun: boolean, reportOnly: boolean): "report_only" | "dry_run" | "apply" {
  if (reportOnly) return "report_only";
  if (dryRun) return "dry_run";
  return "apply";
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
  limit: number,
): Promise<PlaceRow[]> {
  const pageSize = 500;
  const rows: PlaceRow[] = [];
  let from = 0;
  while (rows.length < limit) {
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
  return rows.slice(0, limit);
}

function placeUsesBatchFailedId(row: PlaceRow, batchFailedIds: Set<string>): boolean {
  const list = Array.isArray(row.videos) ? row.videos : [];
  for (const entry of list) {
    const id = videoIdFromCached(entry);
    if (id && batchFailedIds.has(id)) return true;
  }
  return false;
}

async function persistRun(
  admin: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin.from(RUNS_TABLE).insert(payload);
  if (error) {
    console.log(JSON.stringify({ event: "refresh_place_videos_run_persist_failed" }));
  }
}

async function latestRun(admin: ReturnType<typeof createClient>) {
  const { data, error } = await admin
    .from(RUNS_TABLE)
    .select("*")
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error: "runs_read_failed", latest: null };
  return { ok: true, latest: data };
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
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  if (url.searchParams.get("status") === "1") {
    const status = await latestRun(supabaseAdmin);
    return json(status, status.ok ? 200 : 503);
  }

  const startedAt = new Date().toISOString();
  const dryRunQuery = url.searchParams.get("dry_run") === "1";
  const applyEnabled = refreshVideosApplyEnabled();
  const dryRun = dryRunQuery || !applyEnabled;
  const reportOnly = !applyEnabled;
  const maxRatio = maxRemoveRatio();
  const maxRemovePct = maxRatio * 100;
  const cutoffDays = parseCutoffDaysParam(url.searchParams.get("cutoff_days"));
  const limit = parseLimitParam(url.searchParams.get("limit"));

  const apiKey = youtubeApiKey();
  if (!apiKey) {
    const finishedAt = new Date().toISOString();
    await persistRun(supabaseAdmin, {
      started_at: startedAt,
      finished_at: finishedAt,
      mode: runMode(dryRun, reportOnly),
      cutoff_days: cutoffDays,
      places: 0,
      examined: 0,
      removed: 0,
      updated: 0,
      failed_count: 0,
      success: false,
      error: "youtube_not_configured",
    });
    return json({ success: false, error: "youtube_not_configured", cutoff_days: cutoffDays, limit }, 500);
  }

  const cutoffIso = staleCutoffIso(Date.now(), cutoffDays);
  let staleRows: PlaceRow[];
  try {
    staleRows = await loadStaleRows(supabaseAdmin, cutoffIso, limit);
  } catch {
    const finishedAt = new Date().toISOString();
    await persistRun(supabaseAdmin, {
      started_at: startedAt,
      finished_at: finishedAt,
      mode: runMode(dryRun, reportOnly),
      cutoff_days: cutoffDays,
      places: 0,
      examined: 0,
      removed: 0,
      updated: 0,
      failed_count: 1,
      success: false,
      error: "place_videos_read_failed",
    });
    return json({ success: false, error: "place_videos_read_failed", cutoff_days: cutoffDays, limit }, 503);
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
  const batchFailedIds = new Set<string>();
  for (const batch of chunkVideoIds([...uniqueIds])) {
    try {
      const part = await fetchVideosListBatch(apiKey, batch);
      for (const [id, item] of part) ytById.set(id, item);
    } catch {
      for (const id of batch) batchFailedIds.add(id);
    }
  }

  const nowIso = new Date().toISOString();
  const parts: RunPart[] = [];
  const failures: RunFailure[] = [];
  let metadataBlankedTotal = 0;
  let metadataBlankedWould = 0;

  for (const row of staleRows) {
    const list = Array.isArray(row.videos) ? row.videos : [];
    const emptyPlace = list.length === 0;
    const batchFail = !emptyPlace && placeUsesBatchFailedId(row, batchFailedIds);

    if (batchFail) {
      failures.push({
        place_id: row.place_id,
        stage: "youtube_batch",
        error: "youtube_batch_failed",
      });
      let videos = list;
      let metadataBlanked = 0;
      if (isMetadataExpired(row.last_updated)) {
        const stripped = stripVideosYoutubeMetadata(list);
        videos = stripped.videos;
        metadataBlanked = stripped.strippedCount;
        metadataBlankedWould += metadataBlanked;
        if (applyEnabled && !dryRunQuery) metadataBlankedTotal += metadataBlanked;
      }
      parts.push({
        place_id: row.place_id,
        examined: 0,
        removed: 0,
        titleUpdates: 0,
        publishedAtUpdates: 0,
        emptyPlace,
        videos,
        removals: [],
        checkOk: false,
        metadataBlanked,
        sourceLastUpdated: row.last_updated,
      });
      continue;
    }

    const refreshed = refreshVideosForPlace(list, ytById, batchFailedIds);
    if (refreshed.batchFailed) {
      failures.push({
        place_id: row.place_id,
        stage: "youtube_batch",
        error: "youtube_batch_failed",
      });
    }
    parts.push({
      place_id: row.place_id,
      examined: refreshed.examined,
      removed: refreshed.removed,
      titleUpdates: refreshed.titleUpdates,
      publishedAtUpdates: refreshed.publishedAtUpdates,
      emptyPlace,
      videos: refreshed.videos,
      removals: refreshed.removals,
      checkOk: !refreshed.batchFailed,
      metadataBlanked: 0,
      sourceLastUpdated: row.last_updated,
    });
  }

  const summary = summarizeRefreshRun(parts.filter((p) => p.checkOk), maxRatio);
  const capSummary = summarizeRefreshRunForCap(parts, maxRatio);
  const candidates = parts.flatMap((p) =>
    p.removals.map((r) => ({
      place_id: p.place_id,
      video_id: r.videoId,
      reason: r.reason,
    })),
  );

  const failed_count = failures.length;
  const baseReport = {
    cutoff: cutoffIso,
    cutoff_days: cutoffDays,
    limit,
    failed_count,
    failures,
    metadata_blanked: dryRun || reportOnly ? metadataBlankedWould : metadataBlankedTotal,
    metadata_blanked_would: metadataBlankedWould,
  };

  if (capSummary.guardTriggered) {
    const report = {
      success: false,
      error: "cap_exceeded",
      dry_run: dryRun,
      report_only: reportOnly,
      apply: applyEnabled && !dryRunQuery,
      ...baseReport,
      summary: capSummary,
      candidates,
      message: `Would remove ${capSummary.removed} of ${capSummary.examined} successfully-checked videos (${(capSummary.removalRate * 100).toFixed(1)}%), above ${maxRemovePct}% cap — no rows written`,
    };
    console.log(JSON.stringify({ event: "refresh_place_videos_cap_exceeded", ...report }));
    const finishedAt = new Date().toISOString();
    await persistRun(supabaseAdmin, {
      started_at: startedAt,
      finished_at: finishedAt,
      mode: runMode(dryRun, reportOnly),
      cutoff_days: cutoffDays,
      places: parts.length,
      examined: capSummary.examined,
      removed: capSummary.removed,
      updated: 0,
      failed_count,
      success: false,
      error: "cap_exceeded",
    });
    return json(report, 409);
  }

  if (dryRun) {
    const report = {
      success: failed_count === 0,
      dry_run: true,
      report_only: reportOnly,
      apply: false,
      ...baseReport,
      summary,
      candidates,
      places: parts.map((p) => ({
        place_id: p.place_id,
        examined: p.examined,
        removed: p.removed,
        kept: p.videos.length,
        titleUpdates: p.titleUpdates,
        publishedAtUpdates: p.publishedAtUpdates,
        emptyPlace: p.emptyPlace,
        checkOk: p.checkOk,
        metadataBlanked: p.metadataBlanked,
      })),
    };
    console.log(JSON.stringify({
      event: "refresh_place_videos_report",
      report_only: reportOnly,
      examined: summary.examined,
      removed: summary.removed,
      failed_count,
      removal_pct: summary.examined > 0 ? (summary.removalRate * 100).toFixed(2) : "0",
      candidate_count: candidates.length,
    }));
    const finishedAt = new Date().toISOString();
    await persistRun(supabaseAdmin, {
      started_at: startedAt,
      finished_at: finishedAt,
      mode: runMode(true, reportOnly),
      cutoff_days: cutoffDays,
      places: parts.length,
      examined: summary.examined,
      removed: summary.removed,
      updated: 0,
      failed_count,
      success: failed_count === 0,
      error: failed_count > 0 ? "partial_failures" : null,
    });
    return json(report, 200);
  }

  let updated = 0;
  for (const part of parts) {
    const writeVideos = part.checkOk
      ? part.videos
      : (part.metadataBlanked > 0 ? part.videos : null);
    if (!part.checkOk && writeVideos == null) continue;
    if (part.emptyPlace && part.checkOk) {
      const { error } = await supabaseAdmin
        .from("place_videos")
        .update({ videos: [], last_updated: nowIso })
        .eq("place_id", part.place_id);
      if (error) {
        failures.push({
          place_id: part.place_id,
          stage: "db_write",
          error: "place_videos_write_failed",
        });
        continue;
      }
      updated += 1;
      continue;
    }
    if (!part.checkOk && writeVideos != null) {
      const { error } = await supabaseAdmin
        .from("place_videos")
        .update({ videos: writeVideos })
        .eq("place_id", part.place_id);
      if (error) {
        failures.push({
          place_id: part.place_id,
          stage: "db_write",
          error: "place_videos_write_failed",
        });
      } else {
        updated += 1;
      }
      continue;
    }
    if (!part.checkOk) continue;

    const { error } = await supabaseAdmin
      .from("place_videos")
      .update({
        videos: part.videos,
        last_updated: nowIso,
      })
      .eq("place_id", part.place_id);
    if (error) {
      failures.push({
        place_id: part.place_id,
        stage: "db_write",
        error: "place_videos_write_failed",
      });
      continue;
    }
    updated += 1;
  }

  const finalFailed = failures.length;
  const body = {
    success: finalFailed === 0,
    dry_run: false,
    report_only: false,
    apply: true,
    ...baseReport,
    failed_count: finalFailed,
    failures,
    summary,
    candidates,
    updated,
  };
  const finishedAt = new Date().toISOString();
  await persistRun(supabaseAdmin, {
    started_at: startedAt,
    finished_at: finishedAt,
    mode: "apply",
    cutoff_days: cutoffDays,
    places: parts.length,
    examined: summary.examined,
    removed: summary.removed,
    updated,
    failed_count: finalFailed,
    success: finalFailed === 0,
    error: finalFailed > 0 ? "partial_failures" : null,
  });
  return json(body, 200);
});
