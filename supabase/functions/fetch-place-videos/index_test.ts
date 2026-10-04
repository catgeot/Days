/**
 * fetch-place-videos S1+D1+D4. Mocked YouTube fetch + supabase client. No network, no deploy.
 */
import catalog from "./placeVideoCatalog.json" with { type: "json" };
import travelSpots from "../../../src/pages/Home/data/travelSpots-list.json" with { type: "json" };
import cityHubs from "../../../src/pages/Home/data/cityAttractionHubs.json" with { type: "json" };
function assertEquals(actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`assertEquals failed:\n  actual: ${a}\n  expected: ${b}`);
}

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

type Row = {
  place_id: string;
  videos: unknown[];
  fail_count: number;
  last_error: string | null;
  next_retry_at: string | null;
  last_updated: string | null;
};

const store = new Map<string, Row>();
const counts = new Map<string, number>();
const festivals: Array<{ cache_key: string; payload: unknown }> = [];
const attractions = new Map<string, { title: string }>();
const state: {
  rpcError: boolean;
  forceLimited: boolean;
  festivalError: boolean;
  yt: "three" | "empty" | "quota" | "boom";
  proxyBody: { ok?: boolean; items: unknown };
  proxyStatus: number;
} = {
  rpcError: false,
  forceLimited: false,
  festivalError: false,
  yt: "three",
  proxyBody: { items: [] },
  proxyStatus: 200,
};
let ytCalls = 0;
let lastYtUrl = "";
let listScans = 0;
let proxyCalls = 0;

function ytItem(id: string) {
  return {
    id: { videoId: id },
    snippet: {
      title: `Title ${id}`,
      description: "desc",
      channelTitle: "ch",
      publishedAt: "2020-01-01T00:00:00Z",
    },
  };
}

const originalFetch = globalThis.fetch;
globalThis.fetch = (input: Request | URL | string, init?: RequestInit) => {
  const url = String(input);
  if (url.includes("/functions/v1/tourapi-proxy")) {
    proxyCalls += 1;
    return Promise.resolve(new Response(JSON.stringify(state.proxyBody), { status: state.proxyStatus }));
  }
  if (!url.includes("googleapis.com/youtube")) {
    return originalFetch(input, init);
  }
  ytCalls += 1;
  lastYtUrl = url;
  if (state.yt === "boom") return Promise.reject(new Error("network down"));
  if (state.yt === "quota") {
    return Promise.resolve(new Response(JSON.stringify({
      error: { message: "quota", errors: [{ reason: "quotaExceeded" }] },
    }), { status: 403 }));
  }
  if (state.yt === "empty") {
    return Promise.resolve(new Response(JSON.stringify({ items: [] }), { status: 200 }));
  }
  return Promise.resolve(new Response(JSON.stringify({
    items: [ytItem("v1"), ytItem("v2"), ytItem("v3")],
    nextPageToken: "NEXT",
  }), { status: 200 }));
};

(globalThis as Record<string, unknown>).__createSupabaseClient = () => ({
  from: (table: string) => {
    if (table === "tourapi_attraction") {
      let contentId = "";
      const api = {
        select() {
          return api;
        },
        eq(_col: string, value: string) {
          contentId = value;
          return api;
        },
        maybeSingle() {
          const row = attractions.get(contentId);
          return Promise.resolve({
            data: row ? { content_id: contentId, title: row.title } : null,
            error: null,
          });
        },
      };
      return api;
    }
    if (table === "tourapi_festival_cache") {
      const api = {
        select() {
          return api;
        },
        in(_col: string, values: string[]) {
          if (state.festivalError) return Promise.resolve({ data: null, error: { message: "festival down" } });
          return Promise.resolve({
            data: festivals.filter((row) => values.includes(row.cache_key)),
            error: null,
          });
        },
        like(_col: string, pattern: string) {
          listScans += 1;
          if (state.festivalError) return Promise.resolve({ data: null, error: { message: "festival down" } });
          const prefix = pattern.replace(/%/g, "");
          return Promise.resolve({
            data: festivals.filter((row) => row.cache_key.startsWith(prefix)),
            error: null,
          });
        },
      };
      return api;
    }
    let id = "";
    const api = {
      select() {
        return api;
      },
      eq(_col: string, value: string) {
        id = value;
        return api;
      },
      maybeSingle() {
        return Promise.resolve({ data: store.get(id) ?? null, error: null });
      },
      upsert(payload: Row) {
        const prev = store.get(payload.place_id);
        store.set(payload.place_id, { ...prev, ...payload });
        return Promise.resolve({ error: null });
      },
    };
    return api;
  },
  rpc: (_name: string, args: { p_key: string; p_limit: number; p_cost?: number }) => {
    if (state.rpcError) return Promise.resolve({ data: null, error: { message: "rpc down" } });
    if (state.forceLimited) return Promise.resolve({ data: false, error: null });
    const cost = Number(args.p_cost ?? 1);
    const n = (counts.get(args.p_key) ?? 0) + cost;
    counts.set(args.p_key, n);
    return Promise.resolve({ data: n <= args.p_limit, error: null });
  },
});

Deno.env.set("YOUTUBE_API_KEY", "test-key");
Deno.env.set("SUPABASE_URL", "http://supabase.test");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");

await import("./index.ts");

const handle = (globalThis as Record<string, unknown>).__edgeHandler as (req: Request) => Promise<Response>;
if (typeof handle !== "function") throw new Error("handler was not captured");

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.sig";

function post(body: Record<string, unknown>, headers?: Record<string, string>): Promise<Response> {
  return handle(new Request("https://example.test/fetch-place-videos", {
    method: "POST",
    headers: {
      Origin: "https://www.gateo.kr",
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT}`,
      "x-real-ip": "203.0.113.10",
      ...headers,
    },
    body: JSON.stringify(body),
  }));
}

function reset() {
  store.clear();
  counts.clear();
  festivals.length = 0;
  attractions.clear();
  state.rpcError = false;
  state.forceLimited = false;
  state.festivalError = false;
  state.yt = "three";
  state.proxyBody = { items: [] };
  state.proxyStatus = 200;
  ytCalls = 0;
  lastYtUrl = "";
  listScans = 0;
  proxyCalls = 0;
  Deno.env.delete("FETCH_PLACE_VIDEOS_IP_DAILY_UNITS");
  Deno.env.delete("FETCH_PLACE_VIDEOS_ALLOW_FREE_SEARCH");
  Deno.env.delete("FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER");
  Deno.env.delete("FETCH_PLACE_VIDEOS_XFF_TRUSTED_HOPS");
}

function youtubeQuery(): string {
  return new URL(lastYtUrl).searchParams.get("q") ?? "";
}

Deno.test("401 when JWT is missing", async () => {
  reset();
  const res = await post({ query: "파리", placeId: "paris" }, { Authorization: "" });
  assertEquals(res.status, 401);
  assertEquals(ytCalls, 0);
});

Deno.test("403 for an origin outside the allow list and no YouTube call", async () => {
  reset();
  const res = await post({ query: "파리", placeId: "paris" }, { Origin: "https://evil.example" });
  assertEquals(res.status, 403);
  assertEquals(ytCalls, 0);
});

Deno.test("400 for placeId evil:1 and no YouTube call", async () => {
  reset();
  const res = await post({ query: "파리", placeId: "evil:1" });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "bad_place_id");
  assertEquals(ytCalls, 0);
});

Deno.test("429 when the rate limit RPC denies the call", async () => {
  reset();
  state.forceLimited = true;
  const res = await post({ query: "파리", placeId: "paris" });
  assertEquals(res.status, 429);
  const body = await res.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "rate_limited");
  assertEquals(ytCalls, 0);
});

Deno.test("503 when the rate limit RPC errors and YouTube is not called", async () => {
  reset();
  state.rpcError = true;
  const res = await post({ query: "파리", placeId: "paris" });
  assertEquals(res.status, 503);
  assertEquals(ytCalls, 0);
});

Deno.test("fewer than 10 results do not call YouTube again", async () => {
  reset();
  const first = await post({ query: "파리", placeId: "paris", maxResults: 10 });
  assertEquals(first.status, 200);
  const firstBody = await first.json();
  assertEquals(firstBody.success, true);
  assertEquals(firstBody.videos.length, 3);
  assertEquals(ytCalls, 1);
  assert(lastYtUrl.includes("videoEmbeddable=true"), "S1 videoEmbeddable");
  assert(lastYtUrl.includes("videoSyndicated=true"), "S1 videoSyndicated");
  const row = store.get("paris");
  assertEquals(row?.videos.length, 3);
  assertEquals(row?.fail_count, 0);
  assertEquals(row?.last_error, null);
  assertEquals(row?.next_retry_at, null);

  const second = await post({ query: "파리", placeId: "paris", maxResults: 10 });
  assertEquals(second.status, 200);
  const secondBody = await second.json();
  assertEquals(secondBody.videos.length, 3);
  assertEquals(ytCalls, 1);
});

Deno.test("quotaExceeded keeps cached videos and does not start a backoff", async () => {
  reset();
  const expired = new Date(Date.now() - DAY).toISOString();
  store.set("paris", {
    place_id: "paris",
    videos: [{ id: "keep-me", title: "old" }],
    fail_count: 0,
    last_error: null,
    next_retry_at: expired,
    last_updated: "2020-01-01T00:00:00.000Z",
  });
  state.yt = "quota";
  const first = await post({ query: "파리", placeId: "paris" });
  assertEquals(first.status, 200);
  const body = await first.json();
  assertEquals(body.success, true);
  assertEquals(body.stale, true);
  assertEquals(body.videos, [{ id: "keep-me", title: "old" }]);
  assertEquals(ytCalls, 1);
  const row = store.get("paris")!;
  assertEquals(row.videos, [{ id: "keep-me", title: "old" }]);
  assertEquals(row.last_error, null);
  assertEquals(row.fail_count, 0);
  assertEquals(row.next_retry_at, expired);

  state.yt = "three";
  const second = await post({ query: "파리", placeId: "paris" });
  assertEquals(second.status, 200);
  const secondBody = await second.json();
  assertEquals(secondBody.videos.length, 3);
  assertEquals(ytCalls, 2);
  assertEquals(store.get("paris")?.fail_count, 0);
  assertEquals(store.get("paris")?.next_retry_at, null);
});

Deno.test("a failed search does not delete existing videos", async () => {
  reset();
  store.set("tokyo", {
    place_id: "tokyo",
    videos: [{ id: "stay", title: "kept" }],
    fail_count: 0,
    last_error: null,
    next_retry_at: new Date(Date.now() - DAY).toISOString(),
    last_updated: "2020-01-01T00:00:00.000Z",
  });
  state.yt = "boom";
  const expired = store.get("tokyo")!.next_retry_at;
  const res = await post({ query: "도쿄", placeId: "tokyo" });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.stale, true);
  assertEquals(body.videos, [{ id: "stay", title: "kept" }]);
  assertEquals(store.get("tokyo")?.videos, [{ id: "stay", title: "kept" }]);
  assertEquals(store.get("tokyo")?.fail_count, 0);
  assertEquals(store.get("tokyo")?.next_retry_at, expired);
  assertEquals(ytCalls, 1);

  state.yt = "three";
  const again = await post({ query: "도쿄", placeId: "tokyo" });
  assertEquals(again.status, 200);
  assertEquals(ytCalls, 2);
});

Deno.test("place-tab empty results use a 3 day retry and keep a later call off YouTube", async () => {
  reset();
  state.yt = "empty";
  const first = await post({ query: "파리", placeId: "paris" });
  assertEquals(first.status, 200);
  assertEquals(ytCalls, 2);
  const row = store.get("paris")!;
  assertEquals(row.videos, []);
  assertEquals(row.last_error, "empty");
  const retryIn = Date.parse(row.next_retry_at!) - Date.now();
  assert(retryIn > 2.5 * DAY && retryIn < 3.5 * DAY, `empty ttl not ~3 days (${retryIn})`);
  const second = await post({ query: "파리", placeId: "paris" });
  assertEquals(second.status, 200);
  assertEquals(ytCalls, 2);
});

Deno.test("pageToken uses the same auth gate and does not write", async () => {
  reset();
  const missing = await post(
    { query: "파리", placeId: "paris", pageToken: "NEXT" },
    { Authorization: "" },
  );
  assertEquals(missing.status, 401);
  assertEquals(ytCalls, 0);

  const res = await post({ query: "파리", placeId: "paris", pageToken: "NEXT" });
  assertEquals(res.status, 200);
  assertEquals(ytCalls, 1);
  assertEquals(store.size, 0);
});

const DAY = 24 * 60 * 60 * 1000;

Deno.test("place route slugs from travel spots and hubs are allowed", async () => {
  reset();
  const slugRe = /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/;
  const spots = travelSpots as Array<{ slug?: string }>;
  const missing: string[] = [];
  for (const spot of spots) {
    const slug = String(spot.slug || "").trim().toLowerCase();
    if (!slug || !slugRe.test(slug)) continue;
    if (!Object.hasOwn(catalog.places, slug)) missing.push(slug);
  }
  for (const hub of cityHubs as Array<{ hubId?: string }>) {
    const id = String(hub.hubId || "").trim().toLowerCase();
    if (!id || !slugRe.test(id)) continue;
    if (!Object.hasOwn(catalog.places, id)) missing.push(id);
  }
  assertEquals(missing.slice(0, 8), []);
  assert(missing.length === 0, `route ids missing from allowlist: ${missing.slice(0, 5).join(",")}`);

  const sample = spots
    .map((spot) => String(spot.slug || "").trim().toLowerCase())
    .find((slug) => slugRe.test(slug));
  const hubSample = (cityHubs as Array<{ hubId?: string }>)
    .map((hub) => String(hub.hubId || "").trim().toLowerCase())
    .find((id) => slugRe.test(id));
  assert(Boolean(sample), "travelSpots-list has no slug");
  assert(Boolean(hubSample), "city hubs have no hubId");
  const res = await post({ query: "client query <ignored>", placeId: sample });
  assertEquals(res.status, 200);
  assert(!youtubeQuery().includes("client"), youtubeQuery());
  const places = catalog.places as Record<string, string>;
  assert(youtubeQuery().includes(places[sample as string]), youtubeQuery());
  const hubRes = await post({ query: "client hub", placeId: hubSample });
  assertEquals(hubRes.status, 200);
  assert(!youtubeQuery().includes("client hub"), youtubeQuery());

  for (const placeId of ["scenic:not-a-real-slug", "festival:999999", "world-event:not-a-real-event:ko", "evil:1"]) {
    const denied = await post({ query: "anything", placeId });
    assertEquals(denied.status, 400);
    assertEquals((await denied.json()).error, "bad_place_id");
  }
});

Deno.test("server derives the YouTube query and strips brackets from festival titles", async () => {
  reset();
  festivals.push({
    cache_key: "detail:ko:42",
    payload: {
      intro: null,
      common: { title: "<b>진주</b>", contentid: "42", eventstartdate: "20260301" },
      info: [],
    },
  });
  const scenicCatalog = catalog.scenic as Record<string, string>;
  const worldCatalog = catalog.worldEvents as Record<string, string>;
  const scenicId = Object.keys(scenicCatalog)[0];
  const worldId = Object.keys(worldCatalog)[0];
  assert(Boolean(scenicId), "scenic catalog");
  assert(Boolean(worldId), "world event catalog");

  const place = await post({ query: "ignore-me http://evil.example", placeId: "paris" });
  assertEquals(place.status, 200);
  assert(youtubeQuery().includes("Paris"), youtubeQuery());
  assert(!youtubeQuery().includes("ignore-me"), youtubeQuery());
  assert(!youtubeQuery().includes("<"), youtubeQuery());

  const fest = await post({ query: "client-title <nope>", placeId: "festival:42" });
  assertEquals(fest.status, 200);
  const festQ = youtubeQuery();
  assert(festQ.includes("진주"), festQ);
  assert(festQ.includes("2026"), festQ);
  assert(!festQ.includes("<"), festQ);
  assert(!festQ.split(" ").includes("b"), festQ);
  assert(!festQ.includes("/b"), festQ);
  assert(!festQ.includes("client-title"), festQ);
  assertEquals(listScans, 0);

  const scenic = await post({ query: "client scenic", placeId: `scenic:${scenicId}` });
  assertEquals(scenic.status, 200);
  assert(!youtubeQuery().includes("client scenic"), youtubeQuery());

  const world = await post({ query: "client world", placeId: `world-event:${worldId}` });
  assertEquals(world.status, 200);
  assert(youtubeQuery().includes(worldCatalog[worldId].slice(0, 12)), youtubeQuery());
  assert(!youtubeQuery().includes("client world"), youtubeQuery());
});

Deno.test("a festival listed only in the rolling window is accepted", async () => {
  reset();
  festivals.push({
    cache_key: "list:ko:rolling12:20260101:20261231",
    payload: { items: [{ contentId: "77", title: "보령 머드축제", eventStartDate: "20260701" }] },
  });
  const res = await post({ query: "ignored", placeId: "festival:77" });
  assertEquals(res.status, 200);
  assert(youtubeQuery().includes("보령 머드축제"), youtubeQuery());
  assertEquals(listScans, 1);
  assertEquals(ytCalls >= 1, true);
});

Deno.test("global unit ceiling counts the fallback search separately", async () => {
  reset();
  counts.set("global:yt:u", 5900);
  state.yt = "empty";
  const res = await post({ query: "ignore <me>", placeId: "paris" });
  assertEquals(res.status, 429);
  assertEquals((await res.json()).error, "global_quota");
  assertEquals(ytCalls, 1);
  assert(youtubeQuery().includes("Paris"), youtubeQuery());
  assert(!youtubeQuery().includes("ignore"), youtubeQuery());
  assertEquals(counts.get("global:yt:u"), 6100);
  assertEquals(store.has("paris"), false);
});

Deno.test("ip daily cap counts real searches up to the env ceiling", async () => {
  reset();
  Deno.env.set("FETCH_PLACE_VIDEOS_IP_DAILY_UNITS", "200");
  const first = await post({ placeId: "paris" });
  const second = await post({ placeId: "busan" });
  const third = await post({ placeId: "tokyo" });
  assertEquals(first.status, 200);
  assertEquals(second.status, 200);
  assertEquals(third.status, 429);
  assertEquals((await third.json()).error, "ip_quota");
  assertEquals(counts.get("ip:203.0.113.10:u"), 300);
  assertEquals(store.has("tokyo"), false);
  assertEquals(ytCalls, 2);
  assert(![...counts.keys()].some((key) => key.endsWith(":share")), [...counts.keys()].join(","));
});

Deno.test("page tokens are capped per IP per place and per place", async () => {
  reset();
  for (let i = 0; i < 3; i += 1) {
    const res = await post({ placeId: "paris", pageToken: `T${i}` });
    assertEquals(res.status, 200);
  }
  const blocked = await post({ placeId: "paris", pageToken: "T3" });
  assertEquals(blocked.status, 429);
  assertEquals((await blocked.json()).error, "page_ip_limited");

  const other = await post(
    { placeId: "paris", pageToken: "T-other" },
    { "x-forwarded-for": "1.2.3.4, 198.51.100.8", "x-real-ip": "9.9.9.9" },
  );
  assertEquals(other.status, 200);
  assert(counts.has("page:ip:198.51.100.8:paris"), [...counts.keys()].join(","));
  assert(![...counts.keys()].some((key) => key.includes("1.2.3.4") || key.includes("9.9.9.9")), [...counts.keys()].join(","));

  counts.set("page:place:sokcho", 30);
  const placeCap = await post(
    { placeId: "sokcho", pageToken: "T-place" },
    { "x-forwarded-for": "203.0.113.77" },
  );
  assertEquals(placeCap.status, 429);
  assertEquals((await placeCap.json()).error, "page_place_limited");
  assertEquals(ytCalls, 4);
});

Deno.test("an expired row still serves its videos when the global quota is exhausted", async () => {
  reset();
  store.set("paris", {
    place_id: "paris",
    videos: [{ id: "keep-me", title: "old" }],
    fail_count: 0,
    last_error: null,
    next_retry_at: new Date(Date.now() - DAY).toISOString(),
    last_updated: "2020-01-01T00:00:00.000Z",
  });
  counts.set("global:yt:u", 6000);
  const res = await post({ query: "ignore", placeId: "paris" });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertEquals(body.stale, true);
  assertEquals(body.videos, [{ id: "keep-me", title: "old" }]);
  assertEquals(ytCalls, 0);
  const kept = store.get("paris")!;
  assertEquals(kept.videos, [{ id: "keep-me", title: "old" }]);
  assertEquals(kept.fail_count, 0);
  assert(Date.parse(kept.next_retry_at!) < Date.now(), "quota must not push next_retry_at forward");

  counts.set("global:yt:u", 0);
  const again = await post({ query: "ignore", placeId: "paris" });
  assertEquals(again.status, 200);
  assertEquals(ytCalls, 1);
});

Deno.test("parallel searches share one unit counter", async () => {
  reset();
  const ids = ["paris", "busan", "tokyo", "naha", "sokcho"];
  const results = await Promise.all(ids.map((placeId) => post({ placeId })));
  const statuses = await Promise.all(results.map(async (res) => ({
    status: res.status,
    error: res.status === 200 ? "" : (await res.json()).error,
  })));
  const ok = statuses.filter((row) => row.status === 200).length;
  const limited = statuses.filter((row) => row.error === "ip_quota").length;
  assertEquals(ok, 5);
  assertEquals(limited, 0);
  assertEquals(ytCalls, 5);
  assertEquals(counts.get("ip:203.0.113.10:u"), 500);
});

Deno.test("IPv6 addresses in one /64 share a rate-limit bucket", async () => {
  reset();
  const sameA = "2001:db8:abcd:12:1111:2222:3333:4444";
  const sameB = "2001:db8:abcd:12:aaaa:bbbb:cccc:dddd";
  const other = "2001:db8:abcd:13::1";
  const first = await post({ placeId: "paris", pageToken: "A" }, { "x-forwarded-for": sameA, "x-real-ip": "203.0.113.10" });
  const second = await post({ placeId: "paris", pageToken: "B" }, { "x-forwarded-for": sameB });
  assertEquals(first.status, 200);
  assertEquals(second.status, 200);
  const bucket = "page:ip:2001:0db8:abcd:0012::/64:paris";
  assertEquals(counts.get(bucket), 2);
  assert(![...counts.keys()].some((key) => key.includes("203.0.113.10")), [...counts.keys()].join(","));
  const third = await post({ placeId: "paris", pageToken: "C" }, { "x-forwarded-for": other });
  assertEquals(third.status, 200);
  assertEquals(counts.get("page:ip:2001:0db8:abcd:0013::/64:paris"), 1);
  assertEquals(counts.get(bucket), 2);
});

Deno.test("a detail cache title lives on common.title and tag names are stripped", async () => {
  reset();
  festivals.push({
    cache_key: "detail:ko:88",
    payload: {
      intro: null,
      common: { title: "&lt;b&gt;진주&lt;/b&gt;", contentid: "88" },
      info: [],
    },
  });
  const res = await post({ query: "client <b>nope</b>", placeId: "festival:88" });
  assertEquals(res.status, 200);
  const q = youtubeQuery();
  assertEquals(q.includes("진주"), true);
  assert(!q.split(" ").includes("b"), q);
  assert(!q.includes("/b"), q);
  assert(!q.includes("client"), q);
  assertEquals(listScans, 0);
});

Deno.test("an unknown festival does not scan the list until the rate check passes", async () => {
  reset();
  Deno.env.set("FETCH_PLACE_VIDEOS_IP_DAILY_UNITS", "10000");
  festivals.push({
    cache_key: "list:ko:rolling12:20260101:20261231",
    payload: { items: [{ contentId: "77", title: "보령 머드축제", eventStartDate: "20260701" }] },
  });
  const places = ["paris", "busan", "tokyo", "naha", "sokcho", "vatican"];
  for (const placeId of places) {
    const res = await post({ placeId });
    assertEquals(res.status, 200);
  }
  assertEquals(listScans, 0);
  const blocked = await post({ placeId: "festival:77" });
  assertEquals(blocked.status, 429);
  assertEquals((await blocked.json()).error, "rate_limited");
  assertEquals(listScans, 0);
});

Deno.test("a live TourAPI content id is accepted from the attraction cache or the proxy", async () => {
  reset();
  attractions.set("126248", { title: "<b>불갑산</b>도립공원" });
  const cached = await post({ query: "client scenic", placeId: "scenic:126248" });
  assertEquals(cached.status, 200);
  const cachedQ = youtubeQuery();
  assert(cachedQ.includes("불갑산"), cachedQ);
  assert(!cachedQ.split(" ").includes("b"), cachedQ);
  assert(!cachedQ.includes("client"), cachedQ);
  assertEquals(proxyCalls, 0);
  assertEquals(listScans, 0);

  reset();
  state.proxyBody = { ok: true, items: [{ contentid: "555", title: "<b>진주</b> 냉면" }] };
  const live = await post({ query: "client food", placeId: "scenic:555" });
  assertEquals(live.status, 200);
  const liveQ = youtubeQuery();
  assert(liveQ.includes("진주"), liveQ);
  assert(liveQ.includes("냉면"), liveQ);
  assert(!liveQ.split(" ").includes("b"), liveQ);
  assert(!liveQ.includes("client"), liveQ);
  assertEquals(proxyCalls, 1);

  reset();
  state.proxyBody = { ok: false, items: [] };
  const mismatch = await post({ query: "client", placeId: "scenic:555" });
  assertEquals(mismatch.status, 400);
  assertEquals(proxyCalls, 1);
  assertEquals(ytCalls, 0);
  assertEquals(store.has("scenic:555"), false);
});

Deno.test("free-search ids never spend quota, even if the old env flag is set", async () => {
  reset();
  Deno.env.set("FETCH_PLACE_VIDEOS_ALLOW_FREE_SEARCH", "1");
  for (const placeId of ["search-37.5-127.0", "loc-abc", "city-12-34", "label-busan"]) {
    const res = await post({ query: "클라이언트 지명", placeId });
    assertEquals(res.status, 400);
    assertEquals((await res.json()).error, "bad_place_id");
  }
  assertEquals(ytCalls, 0);
  assertEquals(proxyCalls, 0);
  assertEquals(counts.size, 0);
  assertEquals(store.size, 0);
});

Deno.test("default ip daily cap is 1000 units", async () => {
  reset();
  const ids = Object.keys(catalog.places).slice(0, 11);
  assertEquals(ids.length, 11);
  for (let i = 0; i < ids.length; i += 1) {
    if (i === 6 || i === 10) counts.delete("ip:203.0.113.10:m");
    const res = await post({ placeId: ids[i] });
    if (i < 10) {
      assertEquals(res.status, 200);
    } else {
      assertEquals(res.status, 429);
      assertEquals((await res.json()).error, "ip_quota");
    }
  }
  assertEquals(ytCalls, 10);
  assertEquals(counts.get("ip:203.0.113.10:u"), 1100);
  assertEquals(store.has(ids[10]), false);
});

Deno.test("a spoofed left XFF hop does not open a new ip bucket", async () => {
  reset();
  Deno.env.set("FETCH_PLACE_VIDEOS_IP_DAILY_UNITS", "200");
  const places = ["paris", "busan", "tokyo"];
  for (let i = 0; i < places.length; i += 1) {
    const res = await post(
      { placeId: places[i] },
      { "x-forwarded-for": `198.51.100.${i}, 203.0.113.10` },
    );
    if (i < 2) assertEquals(res.status, 200);
    else {
      assertEquals(res.status, 429);
      assertEquals((await res.json()).error, "ip_quota");
    }
  }
  assertEquals(counts.get("ip:203.0.113.10:u"), 300);
  assert(![...counts.keys()].some((key) => key.includes("198.51.100")), [...counts.keys()].join(","));
  assertEquals(ytCalls, 2);
});

Deno.test("cf-connecting-ip is used only when that header is configured", async () => {
  reset();
  Deno.env.set("FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER", "cf-connecting-ip");
  const res = await post(
    { placeId: "paris", pageToken: "CF" },
    { "cf-connecting-ip": "203.0.113.50", "x-forwarded-for": "1.2.3.4, 198.51.100.8" },
  );
  assertEquals(res.status, 200);
  assert(counts.has("page:ip:203.0.113.50:paris"), [...counts.keys()].join(","));
  assert(![...counts.keys()].some((key) => key.includes("1.2.3.4") || key.includes("198.51.100.8")), [...counts.keys()].join(","));

  reset();
  Deno.env.set("FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER", "cf-connecting-ip");
  const fallback = await post(
    { placeId: "paris", pageToken: "FB" },
    { "x-forwarded-for": "1.2.3.4, 198.51.100.8" },
  );
  assertEquals(fallback.status, 200);
  assert(counts.has("page:ip:198.51.100.8:paris"), [...counts.keys()].join(","));
});

Deno.test("detailCommon uses its own budget and only caches a confirmed empty hit", async () => {
  reset();
  counts.set("global:yt:u", 6000);
  state.proxyBody = { ok: true, items: [{ contentid: "555", title: "진주" }] };
  const afterDetail = await post({ placeId: "scenic:555" });
  assertEquals(afterDetail.status, 429);
  assertEquals((await afterDetail.json()).error, "global_quota");
  assertEquals(proxyCalls, 1);
  assertEquals(counts.get("global:detail:u"), 1);
  assertEquals(store.has("scenic:555"), false);

  reset();
  counts.set("global:detail:u", 400);
  state.proxyBody = { ok: true, items: [{ contentid: "555", title: "진주" }] };
  const blocked = await post({ placeId: "scenic:555" });
  assertEquals(blocked.status, 429);
  assertEquals((await blocked.json()).error, "rate_limited");
  assertEquals(proxyCalls, 0);
  assertEquals(store.has("scenic:555"), false);
  assertEquals(counts.get("global:yt:u") ?? 0, 0);

  reset();
  state.proxyBody = { ok: false, items: [] };
  const outage = await post({ placeId: "scenic:555" });
  assertEquals(outage.status, 400);
  assertEquals(proxyCalls, 1);
  assertEquals(store.has("scenic:555"), false);
  const again = await post({ placeId: "scenic:555" });
  assertEquals(again.status, 400);
  assertEquals(proxyCalls, 2);
  assertEquals(store.has("scenic:555"), false);

  reset();
  state.proxyBody = { ok: true, items: [] };
  const unknown = await post({ placeId: "scenic:555" });
  assertEquals(unknown.status, 400);
  assertEquals(proxyCalls, 1);
  assertEquals(ytCalls, 0);
  const row = store.get("scenic:555");
  assert(row, "negative cache row");
  assertEquals(row?.videos, []);
  assertEquals(row?.fail_count, 0);
  assertEquals(row?.last_error, "unknown_content");
  const retryIn = Date.parse(row?.next_retry_at ?? "") - Date.now();
  assert(retryIn > 0.5 * DAY && retryIn < 1.5 * DAY, `unknown ttl not ~1 day (${retryIn})`);
  assertEquals(counts.get("global:yt:u") ?? 0, 0);

  const second = await post({ placeId: "scenic:555" });
  assertEquals(second.status, 200);
  assertEquals((await second.json()).videos, []);
  assertEquals(proxyCalls, 1);

  reset();
  state.proxyBody = { ok: true, items: null };
  const broken = await post({ placeId: "scenic:555" });
  assertEquals(broken.status, 400);
  assertEquals(proxyCalls, 1);
  assertEquals(store.has("scenic:555"), false);
  const brokenAgain = await post({ placeId: "scenic:555" });
  assertEquals(brokenAgain.status, 400);
  assertEquals(proxyCalls, 2);
  assertEquals(store.has("scenic:555"), false);
});

Deno.test("detailCommon costs 1 per call, so five calls fit under 400 and 200", async () => {
  reset();
  for (let i = 1; i <= 5; i += 1) {
    const id = String(990000 + i);
    state.proxyBody = { ok: true, items: [{ contentid: id, title: `명소${i}` }] };
    const res = await post({ placeId: `scenic:${id}` });
    assertEquals(res.status, 200);
  }
  assertEquals(proxyCalls, 5);
  assertEquals(counts.get("global:detail:u"), 5);
  assertEquals(counts.get("ip:203.0.113.10:detail"), 5);

  counts.set("global:detail:u", 400);
  state.proxyBody = { ok: true, items: [{ contentid: "990010", title: "한도" }] };
  const globalBlocked = await post({ placeId: "scenic:990010" });
  assertEquals(globalBlocked.status, 429);
  assertEquals((await globalBlocked.json()).error, "rate_limited");
  assertEquals(proxyCalls, 5);
  assertEquals(counts.get("global:detail:u"), 401);

  counts.set("ip:198.51.100.9:detail", 200);
  state.proxyBody = { ok: true, items: [{ contentid: "990011", title: "아이피" }] };
  const ipBlocked = await post(
    { placeId: "scenic:990011" },
    { "x-real-ip": "198.51.100.9" },
  );
  assertEquals(ipBlocked.status, 429);
  assertEquals((await ipBlocked.json()).error, "rate_limited");
  assertEquals(proxyCalls, 5);
  assertEquals(counts.get("ip:198.51.100.9:detail"), 201);
});

Deno.test("a placeholder place name does not read or write the video cache", async () => {
  reset();
  const cached = {
    place_id: "알 수 없는 지역",
    videos: [{ id: "other", title: "다른 핀" }],
    fail_count: 0,
    last_error: null,
    next_retry_at: new Date(Date.now() + DAY).toISOString(),
    last_updated: "2020-01-01T00:00:00.000Z",
  };
  store.set("알 수 없는 지역", cached);
  const res = await post({ placeId: "알 수 없는 지역" });
  assertEquals(res.status, 400);
  assertEquals(store.get("알 수 없는 지역"), cached);
  assertEquals(ytCalls, 0);
  assertEquals(proxyCalls, 0);
});

Deno.test("unknown content does not wipe videos that are already cached", async () => {
  reset();
  store.set("scenic:556", {
    place_id: "scenic:556",
    videos: [{ id: "keep", title: "old" }],
    fail_count: 0,
    last_error: null,
    next_retry_at: new Date(Date.now() - DAY).toISOString(),
    last_updated: "2020-01-01T00:00:00.000Z",
  });
  state.proxyBody = { ok: true, items: [] };
  const keptVideos = await post({ placeId: "scenic:556" });
  assertEquals(keptVideos.status, 200);
  assertEquals((await keptVideos.json()).stale, true);
  assertEquals(store.get("scenic:556")?.videos, [{ id: "keep", title: "old" }]);
  assertEquals(store.get("scenic:556")?.fail_count, 0);
  assertEquals(proxyCalls, 1);
  const again = await post({ placeId: "scenic:556" });
  assertEquals(again.status, 200);
  assertEquals(proxyCalls, 1);
});

Deno.test("forged excludeVideoIds do not empty the cached search", async () => {
  reset();
  const res = await post({
    placeId: "paris",
    excludeVideoIds: ["v1", "v2", "v3"],
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.videos.length, 3);
  assertEquals(store.get("paris")?.videos.length, 3);
  assertEquals(store.get("paris")?.last_error, null);

  const page = await post({
    placeId: "paris",
    pageToken: "NEXT",
    excludeVideoIds: ["v1", "v2", "v3"],
  });
  assertEquals(page.status, 200);
  assertEquals((await page.json()).videos, []);
  assertEquals(store.get("paris")?.videos.length, 3);
});

Deno.test("a per-minute rejection still returns stored videos", async () => {
  reset();
  store.set("paris", {
    place_id: "paris",
    videos: [{ id: "keep-me", title: "old" }],
    fail_count: 0,
    last_error: null,
    next_retry_at: new Date(Date.now() - DAY).toISOString(),
    last_updated: "2020-01-01T00:00:00.000Z",
  });
  counts.set("ip:203.0.113.10:m", 6);
  const res = await post({ placeId: "paris" });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.stale, true);
  assertEquals(body.videos, [{ id: "keep-me", title: "old" }]);
  assertEquals(ytCalls, 0);
  assertEquals(store.get("paris")?.fail_count, 0);
  assert(Date.parse(store.get("paris")?.next_retry_at ?? "") < Date.now(), "minute cap must not write a backoff");
});

Deno.test("ports and ipv4-mapped addresses share one bucket", async () => {
  reset();
  const mapped = await post(
    { placeId: "paris", pageToken: "A" },
    { "x-forwarded-for": "::ffff:203.0.113.50" },
  );
  const port = await post(
    { placeId: "paris", pageToken: "B" },
    { "x-forwarded-for": "203.0.113.50:443" },
  );
  assertEquals(mapped.status, 200);
  assertEquals(port.status, 200);
  assertEquals(counts.get("page:ip:203.0.113.50:paris"), 2);
});

Deno.test("CLIENT_IP_HEADER=x-real-ip does not override the rightmost XFF hop", async () => {
  reset();
  Deno.env.set("FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER", "x-real-ip");
  const res = await post(
    { placeId: "paris", pageToken: "R" },
    { "x-forwarded-for": "1.2.3.4, 198.51.100.8", "x-real-ip": "9.9.9.9" },
  );
  assertEquals(res.status, 200);
  assert(counts.has("page:ip:198.51.100.8:paris"), [...counts.keys()].join(","));
  assert(![...counts.keys()].some((key) => key.includes("9.9.9.9") || key.includes("1.2.3.4")), [...counts.keys()].join(","));
});

Deno.test("an entity-wrapped word is kept when tags are stripped", async () => {
  reset();
  festivals.push({
    cache_key: "detail:ko:89",
    payload: {
      intro: null,
      common: { title: "&lt;탈춤&gt;", contentid: "89" },
      info: [],
    },
  });
  const res = await post({ placeId: "festival:89" });
  assertEquals(res.status, 200);
  const q = youtubeQuery();
  assert(q.includes("탈춤"), q);
  assert(!q.includes("lt;"), q);
  assert(!q.includes("&"), q);
});
