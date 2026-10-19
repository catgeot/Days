/**
 * refresh-place-videos — mocked Supabase + YouTube. No network, no deploy.
 */
import {
  classifyYoutubeListItem,
  exceedsRemovalGuard,
} from "../_shared/placeVideoRefresh.mjs";

function assertEquals(actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`assertEquals failed:\n  actual: ${a}\n  expected: ${b}`);
}

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

type Row = { place_id: string; videos: unknown[]; last_updated: string };

const store = new Map<string, Row>();
const runRows: Record<string, unknown>[] = [];
let ytItems: Record<string, unknown> = {};
let ytBatchFail = new Set<string>();
let ytCalls = 0;
let lastYtPath = "";
let writeFailPlace = "";

const originalFetch = globalThis.fetch;
globalThis.fetch = (input: Request | URL | string) => {
  const url = String(input);
  if (url.includes("googleapis.com/youtube")) {
    ytCalls += 1;
    lastYtPath = new URL(url).pathname;
    const ids = new URL(url).searchParams.get("id")?.split(",") ?? [];
    if (ids.some((id) => ytBatchFail.has(id))) {
      return Promise.resolve(new Response(JSON.stringify({ error: { message: "fail" } }), { status: 500 }));
    }
    const items = ids.map((id) => ytItems[id]).filter(Boolean);
    return Promise.resolve(new Response(JSON.stringify({ items }), { status: 200 }));
  }
  return originalFetch(input);
};

function staleRows(cutoff: string): Row[] {
  return [...store.values()]
    .filter((row) => row.last_updated < cutoff)
    .sort((a, b) => a.place_id.localeCompare(b.place_id));
}

(globalThis as Record<string, unknown>).__createSupabaseClient = () => ({
  from: (table: string) => {
    if (table === "place_videos_refresh_runs") {
      return {
        insert(payload: Record<string, unknown>) {
          runRows.push(payload);
          return Promise.resolve({ error: null });
        },
        select() {
          return {
            order() {
              return {
                limit() {
                  return {
                    maybeSingle() {
                      const latest = runRows[runRows.length - 1] ?? null;
                      return Promise.resolve({ data: latest, error: null });
                    },
                  };
                },
              };
            },
          };
        },
      };
    }
    if (table !== "place_videos") throw new Error(`unexpected table ${table}`);
    let cutoff = "";
    return {
      select() {
        return this;
      },
      lt(_col: string, val: string) {
        cutoff = val;
        return this;
      },
      order() {
        return this;
      },
      range(from: number, to: number) {
        const all = staleRows(cutoff);
        const slice = all.slice(from, to + 1);
        return Promise.resolve({ data: slice, error: null });
      },
      update(payload: { videos: unknown[]; last_updated: string }) {
        return {
          eq(_col: string, placeId: string) {
            if (writeFailPlace === placeId) {
              return Promise.resolve({ error: { message: "write fail" } });
            }
            const row = store.get(placeId);
            if (row) {
              store.set(placeId, {
                ...row,
                videos: payload.videos,
                last_updated: payload.last_updated,
              });
            }
            return Promise.resolve({ error: null });
          },
        };
      },
    };
  },
});

Deno.env.set("REFRESH_VIDEOS_TOKEN", "cron-secret");
Deno.env.set("YOUTUBE_API_KEY", "yt-key");
Deno.env.set("SUPABASE_URL", "http://supabase.test");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service");

await import("./index.ts");

const handle = (globalThis as Record<string, unknown>).__edgeHandler as (req: Request) => Promise<Response>;
if (typeof handle !== "function") throw new Error("handler missing");

function call(path: string, headers?: Record<string, string>) {
  return handle(new Request(`https://example.test/functions/v1/refresh-place-videos${path}`, {
    method: "POST",
    headers: {
      "x-refresh-videos-token": "cron-secret",
      ...headers,
    },
  }));
}

function reset() {
  store.clear();
  runRows.length = 0;
  ytItems = {};
  ytBatchFail = new Set();
  ytCalls = 0;
  lastYtPath = "";
  writeFailPlace = "";
}

Deno.test("401 without token", async () => {
  reset();
  const res = await call("", { "x-refresh-videos-token": "" });
  assertEquals(res.status, 401);
});

Deno.test("dry_run does not write; uses videos.list not search", async () => {
  reset();
  const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  store.set("paris", {
    place_id: "paris",
    videos: [{ id: "v1", title: "old" }],
    last_updated: old,
  });
  ytItems = {
    v1: {
      id: "v1",
      status: { privacyStatus: "public", embeddable: true },
      snippet: { title: "fresh", channelTitle: "ch" },
    },
  };
  const res = await call("?dry_run=1");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.dry_run, true);
  assertEquals(body.summary.removed, 0);
  assertEquals(store.get("paris")?.videos, [{ id: "v1", title: "old" }]);
  assertEquals(ytCalls, 1);
  assert(lastYtPath.endsWith("/videos"), "videos.list only");
});

Deno.test("409 cap_exceeded blocks writes", async () => {
  reset();
  const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  store.set("a", {
    place_id: "a",
    videos: [{ id: "gone1" }, { id: "gone2" }, { id: "gone3" }, { id: "gone4" }, { id: "keep" }],
    last_updated: old,
  });
  ytItems = {
    keep: {
      id: "keep",
      status: { privacyStatus: "public", embeddable: true },
      snippet: { title: "ok", channelTitle: "c" },
    },
  };
  const res = await call("");
  assertEquals(res.status, 409);
  const body = await res.json();
  assertEquals(body.error, "cap_exceeded");
  assertEquals(store.get("a")?.videos.length, 5);
  assert(Array.isArray(body.candidates));
});

Deno.test("default report-only (no APPLY) does not write without dry_run query", async () => {
  reset();
  Deno.env.delete("REFRESH_VIDEOS_APPLY");
  const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  store.set("tokyo", {
    place_id: "tokyo",
    videos: [{ id: "v1", title: "old" }],
    last_updated: old,
  });
  ytItems = {
    v1: {
      id: "v1",
      status: { privacyStatus: "public", embeddable: true },
      snippet: { title: "fresh", channelTitle: "ch" },
    },
  };
  const res = await call("");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.report_only, true);
  assertEquals(body.apply, false);
  assertEquals(store.get("tokyo")?.videos, [{ id: "v1", title: "old" }]);
});

Deno.test("apply path writes when REFRESH_VIDEOS_APPLY=on", async () => {
  reset();
  Deno.env.set("REFRESH_VIDEOS_APPLY", "on");
  const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  store.set("seoul", {
    place_id: "seoul",
    videos: [{ id: "v1", title: "old" }],
    last_updated: old,
  });
  ytItems = {
    v1: {
      id: "v1",
      status: { privacyStatus: "public", embeddable: true },
      snippet: { title: "fresh", channelTitle: "ch" },
    },
  };
  const res = await call("");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.apply, true);
  assertEquals(body.dry_run, false);
  assertEquals(store.get("seoul")?.videos[0]?.title, "fresh");
  Deno.env.delete("REFRESH_VIDEOS_APPLY");
});

Deno.test("empty row only bumps last_updated when apply on", async () => {
  reset();
  Deno.env.set("REFRESH_VIDEOS_APPLY", "on");
  const old = "2020-01-01T00:00:00.000Z";
  store.set("empty-cache", {
    place_id: "empty-cache",
    videos: [],
    last_updated: old,
  });
  const res = await call("");
  assertEquals(res.status, 200);
  assertEquals(ytCalls, 0);
  const row = store.get("empty-cache")!;
  assertEquals(row.videos, []);
  assert(row.last_updated > old);
  Deno.env.delete("REFRESH_VIDEOS_APPLY");
});

Deno.test("shared classification unit sanity", () => {
  const v = classifyYoutubeListItem({
    id: "x",
    status: { privacyStatus: "public", embeddable: true },
    snippet: { title: "a", channelTitle: "b", publishedAt: "2020-01-01T00:00:00Z" },
  });
  assert(v.keep === true);
  if (v.keep) assertEquals(v.publishedAt, "2020-01-01T00:00:00Z");
  assertEquals(exceedsRemovalGuard(20, 2, 0.05), true);
});

Deno.test("status=1 returns latest persisted run", async () => {
  reset();
  const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  store.set("paris", {
    place_id: "paris",
    videos: [{ id: "v1", title: "old" }],
    last_updated: old,
  });
  ytItems = {
    v1: {
      id: "v1",
      status: { privacyStatus: "public", embeddable: true },
      snippet: { title: "fresh", channelTitle: "ch", publishedAt: "2021-01-01T00:00:00Z" },
    },
  };
  await call("?dry_run=1");
  const res = await call("?status=1");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, true);
  assert(body.latest != null);
});

Deno.test("cutoff_days and limit echoed in response", async () => {
  reset();
  const res = await call("?dry_run=1&cutoff_days=99&limit=2");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.cutoff_days, 30);
  assertEquals(body.limit, 2);
});

Deno.test("youtube batch failure does not abort other places", async () => {
  reset();
  const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  store.set("a", {
    place_id: "a",
    videos: [{ id: "fail1", title: "x" }],
    last_updated: old,
  });
  store.set("b", {
    place_id: "b",
    videos: [{ id: "ok1", title: "y" }],
    last_updated: old,
  });
  ytBatchFail.add("fail1");
  ytItems = {
    ok1: {
      id: "ok1",
      status: { privacyStatus: "public", embeddable: true },
      snippet: { title: "fresh", channelTitle: "ch", publishedAt: "2020-01-01T00:00:00Z" },
    },
  };
  Deno.env.set("REFRESH_VIDEOS_APPLY", "on");
  const res = await call("");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, false);
  assert(body.failed_count >= 1);
  assertEquals(store.get("b")?.videos[0]?.title, "fresh");
  Deno.env.delete("REFRESH_VIDEOS_APPLY");
});

Deno.test("apply updates publishedAt from snippet", async () => {
  reset();
  Deno.env.set("REFRESH_VIDEOS_APPLY", "on");
  const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  store.set("rome", {
    place_id: "rome",
    videos: [{ id: "v1", title: "old", publishedAt: "2019-01-01T00:00:00Z" }],
    last_updated: old,
  });
  ytItems = {
    v1: {
      id: "v1",
      status: { privacyStatus: "public", embeddable: true },
      snippet: { title: "fresh", channelTitle: "ch", publishedAt: "2022-06-01T12:00:00Z" },
    },
  };
  const res = await call("");
  assertEquals(res.status, 200);
  assertEquals(store.get("rome")?.videos[0]?.publishedAt, "2022-06-01T12:00:00Z");
  Deno.env.delete("REFRESH_VIDEOS_APPLY");
});
