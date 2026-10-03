/**
 * fetch-place-videos S1+D1+D4. Mocked YouTube fetch + supabase client. No network, no deploy.
 */
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
const state: { rpcError: boolean; forceLimited: boolean; yt: "three" | "empty" | "quota" | "boom" } = {
  rpcError: false,
  forceLimited: false,
  yt: "three",
};
let ytCalls = 0;
let lastYtUrl = "";

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
  from: (_table: string) => {
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
  rpc: (_name: string, args: { p_key: string; p_limit: number }) => {
    if (state.rpcError) return Promise.resolve({ data: null, error: { message: "rpc down" } });
    if (state.forceLimited) return Promise.resolve({ data: false, error: null });
    const n = (counts.get(args.p_key) ?? 0) + 1;
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
  state.rpcError = false;
  state.forceLimited = false;
  state.yt = "three";
  ytCalls = 0;
  lastYtUrl = "";
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

Deno.test("quotaExceeded stores last_error, keeps videos, and blocks a same-day retry", async () => {
  reset();
  store.set("paris", {
    place_id: "paris",
    videos: [{ id: "keep-me", title: "old" }],
    fail_count: 0,
    last_error: null,
    next_retry_at: null,
    last_updated: "2020-01-01T00:00:00.000Z",
  });
  // Existing fresh rows short-circuit. Expire the row so this call reaches YouTube.
  store.get("paris")!.next_retry_at = new Date(Date.now() - DAY).toISOString();
  state.yt = "quota";
  const first = await post({ query: "파리", placeId: "paris" });
  assertEquals(first.status, 403);
  const body = await first.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "quotaExceeded");
  assertEquals(ytCalls, 1);
  const row = store.get("paris")!;
  assertEquals(row.videos, [{ id: "keep-me", title: "old" }]);
  assertEquals(row.last_error, "quotaExceeded");
  assertEquals(row.fail_count, 1);
  const retryIn = Date.parse(row.next_retry_at!) - Date.now();
  assert(retryIn > 0.5 * DAY && retryIn < 1.5 * DAY, `backoff not ~1 day (${retryIn})`);

  const second = await post({ query: "파리", placeId: "paris" });
  assertEquals(second.status, 200);
  const secondBody = await second.json();
  assertEquals(secondBody.videos, [{ id: "keep-me", title: "old" }]);
  assertEquals(ytCalls, 1);
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
  const res = await post({ query: "도쿄", placeId: "tokyo" });
  assertEquals(res.status, 502);
  assertEquals(store.get("tokyo")?.videos, [{ id: "stay", title: "kept" }]);
  assertEquals(ytCalls, 1);
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
