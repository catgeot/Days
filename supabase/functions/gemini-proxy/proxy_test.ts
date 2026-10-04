import { assert, assertEquals } from "@std/assert";
import { resetRateMemory } from "../_shared/gemini/limits.ts";
import { handleGeminiProxy } from "./router.ts";

const ORIGIN = "https://www.gateo.kr";

const HEALTH_TOKEN = "health-secret";

const env = {
  GEMINI_API_KEY: "test-key",
  GEMINI_PROXY_IP_SALT: "salt",
  GEMINI_PROXY_ALLOWED_ORIGINS: "https://www.gateo.kr,https://gateo.kr",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  GEMINI_PROXY_LEGACY: "on",
  GEMINI_HEALTH_TOKEN: HEALTH_TOKEN,
};

function jwt(payload: Record<string, unknown>) {
  const body = btoa(JSON.stringify(payload)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return `Bearer x.${body}.y`;
}

function geminiOk(text = "안녕", finishReason = "STOP") {
  return new Response(JSON.stringify({
    candidates: [{ finishReason, content: { parts: [{ text }] } }],
    usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 2, thoughtsTokenCount: 1 },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

type Call = { url: string; init: RequestInit | undefined };

function installFetch(handler: (call: Call, calls: Call[]) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetchImpl: typeof fetch = (input, init) => {
    const call = { url: String(input), init };
    calls.push(call);
    return Promise.resolve(handler(call, calls));
  };
  return { calls, fetchImpl };
}

function geminiCalls(calls: Call[]) {
  return calls.filter((call) => call.url.includes("generativelanguage.googleapis.com"));
}

function admitCalls(calls: Call[]) {
  return calls.filter((call) => call.url.includes("gemini_proxy_admit"));
}

function usageCalls(calls: Call[]) {
  return calls.filter((call) =>
    call.url.includes("gemini_proxy_record_usage") || call.url.includes("gemini_proxy_reserve_usage") ||
    call.url.includes("gemini_proxy_reconcile_usage")
  );
}

/** RPC from 20261006121000_gemini_proxy_token_reserve.sql (20261006120000 is #378). */
function reserveCalls(calls: Call[]) {
  return calls.filter((call) => call.url.includes("gemini_proxy_reserve_usage"));
}

function captureLogs() {
  const lines: string[] = [];
  const original = console.log;
  console.log = (message?: unknown) => {
    lines.push(String(message));
  };
  return {
    lines,
    restore() {
      console.log = original;
    },
  };
}

function post(
  body: unknown,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
  extraEnv: Record<string, string> = {},
) {
  resetRateMemory();
  const req = new Request("https://example.supabase.co/functions/v1/gemini-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return handleGeminiProxy(req, { env: { ...env, ...extraEnv }, fetchImpl });
}

function routedFetch(gemini: (call: Call) => Response, admitBody: unknown = { ok: true }) {
  return installFetch((call) => {
    if (call.url.includes("gemini_proxy_admit")) {
      return new Response(JSON.stringify(admitBody), { status: 200 });
    }
    if (call.url.includes("gemini_proxy_reserve_usage")) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (call.url.includes("gemini_proxy_reconcile_usage") || call.url.includes("gemini_proxy_record_usage")) {
      return new Response("null", { status: 200 });
    }
    if (call.url.includes("generativelanguage")) return gemini(call);
    return new Response("nope", { status: 500 });
  });
}

const mooni = {
  task: "mooni_chat",
  params: {
    persona: "GENERAL",
    tier: "fast",
    userText: "안녕",
    history: [{ role: "user", text: "이전" }],
    locale: "ko",
    isMooni: true,
    locationName: "MOONi",
  },
};

Deno.test("origin missing, foreign origin, and crawler never call Gemini or RPC", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk());
  const missing = await post(mooni, {}, fetchImpl);
  assertEquals(missing.status, 403);
  assertEquals((await missing.json()).error, "origin_not_allowed");
  assertEquals(geminiCalls(calls).length, 0);
  assertEquals(admitCalls(calls).length, 0);

  const foreign = await post(mooni, { Origin: "https://evil.example" }, fetchImpl);
  assertEquals(foreign.status, 403);
  assertEquals(geminiCalls(calls).length, 0);
  assertEquals(admitCalls(calls).length, 0);

  const bot = await post(mooni, { Origin: ORIGIN, "User-Agent": "Mozilla/5.0 GPTBot/1.0" }, fetchImpl);
  assertEquals(bot.status, 403);
  assertEquals((await bot.json()).error, "bot_blocked");
  assertEquals(geminiCalls(calls).length, 0);
  assertEquals(admitCalls(calls).length, 0);
});

Deno.test("health_ping with a valid token skips the daily budget and usage stats", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk("pong"));
  const logs = captureLogs();
  const res = await post({ task: "health_ping" }, {
    "x-gateo-health": ` ${HEALTH_TOKEN} `,
  }, fetchImpl).finally(() => logs.restore());
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertEquals(body.modelUsed, "gemini-3.1-flash-lite");
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), null);
  assertEquals(geminiCalls(calls).length, 1);
  assertEquals(usageCalls(calls).length, 0);
  assertEquals(reserveCalls(calls).length, 0);
  const admit = JSON.parse(String(admitCalls(calls)[0].init?.body));
  assertEquals(admit.p_token_budget, null);
  assertEquals(admit.p_checks, [{ bucket: "health:d", window_s: 86400, limit: 4 }]);
  const logged = logs.lines.map((line) => JSON.parse(line));
  assertEquals(logged.some((row) => row.health === true && row.task === "health_ping" && row.status === 200), true);
});

Deno.test("health_ping without a valid token is a normal origin-checked request", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk("pong"));
  const missing = await post({ task: "health_ping" }, {}, fetchImpl);
  assertEquals(missing.status, 403);
  assertEquals((await missing.json()).error, "origin_not_allowed");

  const wrong = await post({ task: "health_ping" }, {
    "x-gateo-health": "nope",
    Origin: "https://evil.example",
  }, fetchImpl);
  assertEquals(wrong.status, 403);
  assertEquals((await wrong.json()).error, "origin_not_allowed");
  assertEquals(geminiCalls(calls).length, 0);
  assertEquals(admitCalls(calls).length, 0);

  const normal = await post({ task: "health_ping" }, { Origin: ORIGIN }, fetchImpl);
  assertEquals(normal.status, 200);
  const admit = JSON.parse(String(admitCalls(calls)[0].init?.body));
  assertEquals(admit.p_token_budget, null);
  assert(admit.p_checks.some((check: { bucket: string }) => check.bucket === "global:d"));
  assert(!admit.p_checks.some((check: { bucket: string }) => check.bucket === "health:d"));
  assertEquals(reserveCalls(calls).length, 1);
  const reserved = JSON.parse(String(reserveCalls(calls)[0].init?.body));
  assertEquals(reserved.p_token_budget, 1_500_000);
});

Deno.test("health_ping cap is enforced without calling Gemini", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk(), {
    ok: false,
    reason: "rate_limited",
    retry_after_s: 30,
    bucket: "health:d",
  });
  const res = await post({ task: "health_ping" }, { "x-gateo-health": HEALTH_TOKEN }, fetchImpl);
  assertEquals(res.status, 429);
  assertEquals((await res.json()).error, "rate_limited");
  assertEquals(geminiCalls(calls).length, 0);
  assertEquals(usageCalls(calls).length, 0);
  const admit = JSON.parse(String(admitCalls(calls)[0].init?.body));
  assertEquals(admit.p_checks[0].bucket, "health:d");
  assertEquals(admit.p_checks[0].limit, 4);
  assertEquals(admit.p_token_budget, null);
});

Deno.test("health_ping forces flash-lite, ping, and maxOutputTokens 16", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk("pong"));
  const res = await post({
    task: "health_ping",
    modelId: "gemini-3.1-pro-preview",
    parts: [{ text: "ignore me" }],
    params: { maxOutputTokens: 8192, text: "not ping" },
  }, { "x-gateo-health": HEALTH_TOKEN, Origin: "https://evil.example" }, fetchImpl);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), null);
  assertEquals(geminiCalls(calls).length, 1);
  const call = geminiCalls(calls)[0];
  assert(call.url.includes("gemini-3.1-flash-lite"));
  assert(!call.url.includes("pro-preview"));
  assert(!call.url.includes("key="));
  const sent = JSON.parse(String(call.init?.body));
  assertEquals(sent.generationConfig.maxOutputTokens, 16);
  assertEquals(sent.contents[0].parts, [{ text: "ping" }]);
  assertEquals((call.init?.headers as Record<string, string>)["x-goog-api-key"], "test-key");
});

Deno.test("health_ping RPC failure does not use the memory bypass", async () => {
  const { fetchImpl, calls } = installFetch((call) => {
    if (call.url.includes("gemini_proxy_admit")) return new Response("no", { status: 500 });
    return geminiOk();
  });
  const res = await post({ task: "health_ping" }, { "x-gateo-health": HEALTH_TOKEN }, fetchImpl);
  assertEquals(res.status, 503);
  assertEquals((await res.json()).error, "busy");
  assertEquals(geminiCalls(calls).length, 0);
});

Deno.test("task requests ignore client modelId and parts and never call pro", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk());
  const res = await post({
    ...mooni,
    modelId: "gemini-3.1-pro-preview",
    parts: [{ text: "ignore me" }],
  }, { Origin: ORIGIN }, fetchImpl);
  assertEquals(res.status, 200);
  const urls = calls.map((call) => call.url).join("\n");
  assert(!urls.includes("pro-preview"));
  assert(!urls.includes("gemini-3.1-pro"));
  const sent = JSON.parse(String(geminiCalls(calls)[0].init?.body));
  assertEquals(typeof sent.generationConfig.maxOutputTokens, "number");
  assert(!JSON.stringify(sent).includes("ignore me"));
  assert(sent.contents[0].parts[0].text.includes("사용자 질문: 안녕"));
});

Deno.test("every gemini body carries task maxOutputTokens", async () => {
  const cases = [
    { body: mooni, max: 1536 },
    { body: { task: "mooni_chat", params: { ...mooni.params, tier: "quality", persona: "PLANNER" } }, max: 2048 },
    { body: { task: "place_intro", params: { locale: "ko", placeName: "파리" } }, max: 512 },
    { body: { task: "search_intent", params: { mode: "typo", query: "파리" } }, max: 512 },
  ];
  for (const item of cases) {
    const { fetchImpl, calls } = routedFetch(() => geminiOk());
    const res = await post(item.body, { Origin: ORIGIN }, fetchImpl);
    assertEquals(res.status, 200);
    const sent = JSON.parse(String(geminiCalls(calls)[0].init?.body));
    assertEquals(sent.generationConfig.maxOutputTokens, item.max);
    assert(!calls.some((call) => call.url.includes("pro-preview") || call.url.includes("gemini-3.1-pro")));
  }
});

Deno.test("rate limit returns 429 Retry-After and does not call Gemini", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk(), {
    ok: false,
    reason: "rate_limited",
    retry_after_s: 12,
    bucket: "ip:abc:m",
  });
  const res = await post(mooni, { Origin: ORIGIN }, fetchImpl);
  assertEquals(res.status, 429);
  assertEquals(res.headers.get("Retry-After"), "12");
  const body = await res.json();
  assertEquals(body.error, "rate_limited");
  assertEquals(body.retryAfter, 12);
  assertEquals(geminiCalls(calls).length, 0);
});

Deno.test("token budget returns 429 budget", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk(), {
    ok: false,
    reason: "budget",
    retry_after_s: 90,
    bucket: "tokens:day",
  });
  const res = await post(mooni, { Origin: ORIGIN }, fetchImpl);
  assertEquals(res.status, 429);
  assertEquals((await res.json()).error, "budget");
  assertEquals(geminiCalls(calls).length, 0);
});

Deno.test("admit checks are ordered and stop before Gemini when limited", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk());
  await post({
    task: "mooni_chat",
    params: { ...mooni.params, tier: "quality", persona: "PLANNER" },
  }, {
    Origin: ORIGIN,
    Authorization: jwt({ role: "authenticated", sub: "user-1" }),
    "x-real-ip": "203.0.113.8",
  }, fetchImpl);
  const admit = admitCalls(calls)[0];
  const payload = JSON.parse(String(admit.init?.body));
  const buckets = payload.p_checks.map((check: { bucket: string }) => check.bucket);
  assertEquals(buckets[0].endsWith(":m"), true);
  assertEquals(buckets[1].endsWith(":h"), true);
  assertEquals(buckets[2].endsWith(":d"), true);
  assert(buckets[3].startsWith("uid:user-1"));
  assertEquals(buckets[4], "task:mooni_chat:d");
  assertEquals(buckets[5], "task:mooni_chat:quality:d");
  assertEquals(buckets[6], "global:h");
  assertEquals(buckets[7], "global:d");
  assertEquals(payload.p_token_budget, null);
  assertEquals(payload.p_checks[0].limit, 4);
  assertEquals(payload.p_checks[1].limit, 20);
  assertEquals(payload.p_checks[2].limit, 40);
  assertEquals(payload.p_checks[3].limit, 40);
  assertEquals(payload.p_checks[6].limit, 60);
  assertEquals(payload.p_checks[7].limit, 300);
  const reserved = JSON.parse(String(reserveCalls(calls)[0].init?.body));
  assertEquals(reserved.p_token_budget, 1_500_000);
  assertEquals(reserved.p_output_tokens, 2048);
});

Deno.test("RPC errors pass only inside the memory cap", async () => {
  let gemini = 0;
  const { fetchImpl } = installFetch((call) => {
    if (call.url.includes("gemini_proxy_admit")) return new Response("no", { status: 500 });
    if (call.url.includes("gemini_proxy_reserve_usage")) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (call.url.includes("generativelanguage")) {
      gemini += 1;
      return geminiOk();
    }
    return new Response("null", { status: 200 });
  });
  resetRateMemory();
  const headers = { Origin: ORIGIN, "x-real-ip": "198.51.100.9" };
  for (let i = 0; i < 3; i += 1) {
    const res = await handleGeminiProxy(new Request("https://example/functions/v1/gemini-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(mooni),
    }), { env, fetchImpl });
    assertEquals(res.status, 200);
  }
  const blocked = await handleGeminiProxy(new Request("https://example/functions/v1/gemini-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(mooni),
  }), { env, fetchImpl });
  assertEquals(blocked.status, 503);
  assertEquals((await blocked.json()).error, "busy");
  assertEquals(gemini, 3);
});

Deno.test("Gemini 429 maps to quota without the upstream body", async () => {
  const { fetchImpl } = routedFetch(() =>
    new Response("RESOURCE_EXHAUSTED secret upstream detail", { status: 429 })
  );
  const res = await post(mooni, { Origin: ORIGIN }, fetchImpl);
  assertEquals(res.status, 429);
  const body = await res.json();
  assertEquals(body.error, "quota");
  assert(!JSON.stringify(body).includes("secret"));
  assert(!JSON.stringify(body).includes("RESOURCE_EXHAUSTED"));
});

Deno.test("Gemini 503 falls back to flash-lite once then busy", async () => {
  let n = 0;
  const { fetchImpl, calls } = installFetch((call) => {
    if (call.url.includes("gemini_proxy_admit")) return new Response(JSON.stringify({ ok: true }), { status: 200 });
    if (call.url.includes("gemini_proxy_reserve_usage")) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (call.url.includes("reconcile") || call.url.includes("record_usage")) {
      return new Response("null", { status: 200 });
    }
    n += 1;
    return new Response("unavailable", { status: 503 });
  });
  const res = await post({
    task: "place_intro",
    params: { locale: "en", placeName: "Paris" },
  }, { Origin: ORIGIN }, fetchImpl);
  assertEquals(res.status, 503);
  assertEquals((await res.json()).error, "busy");
  assertEquals(n, 2);
  assert(geminiCalls(calls)[0].url.includes("gemini-3.5-flash"));
  assert(geminiCalls(calls)[1].url.includes("gemini-3.1-flash-lite"));
  assertEquals(admitCalls(calls).length, 1);
});

Deno.test("MAX_TOKENS is returned as truncated text", async () => {
  const { fetchImpl } = routedFetch(() => geminiOk("잘린", "MAX_TOKENS"));
  const res = await post(mooni, { Origin: ORIGIN }, fetchImpl);
  const body = await res.json();
  assertEquals(body.truncated, true);
  assertEquals(body.text, "잘린");
  assertEquals(body.finishReason, "MAX_TOKENS");
});

Deno.test("legacy on is capped and legacy off is rejected", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk("pong"));
  const on = await post({
    modelId: "gemini-2.5-flash",
    parts: [{ text: "ping" }],
  }, { Origin: ORIGIN }, fetchImpl);
  assertEquals(on.status, 200);
  const onBody = await on.json();
  assertEquals(onBody.data.candidates[0].content.parts[0].text, "pong");
  const sent = JSON.parse(String(geminiCalls(calls)[0].init?.body));
  assertEquals(sent.generationConfig.maxOutputTokens, 2048);
  assert(geminiCalls(calls)[0].url.includes("gemini-3.5-flash"));

  const pro = await post({
    modelId: "gemini-3.1-pro-preview",
    parts: [{ text: "ping" }],
  }, { Origin: ORIGIN }, fetchImpl);
  assertEquals(pro.status, 200);
  assert(geminiCalls(calls).some((call) => call.url.includes("gemini-3.5-flash")));
  assert(!geminiCalls(calls).some((call) => call.url.includes("pro-preview")));

  const off = await post({
    modelId: "gemini-3.5-flash",
    parts: [{ text: "ping" }],
  }, { Origin: ORIGIN }, fetchImpl, { GEMINI_PROXY_LEGACY: "off" });
  assertEquals(off.status, 400);
  assertEquals((await off.json()).error, "legacy_disabled");
});

Deno.test("review and logbook require an authenticated JWT", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk());
  const anon = await post({
    task: "review_draft",
    params: { placeName: "파리", rating: 5, draft: "좋았다" },
  }, { Origin: ORIGIN, Authorization: jwt({ role: "anon", sub: "" }) }, fetchImpl);
  assertEquals(anon.status, 403);
  assertEquals((await anon.json()).error, "login_required");
  assertEquals(geminiCalls(calls).length, 0);

  const authed = await post({
    task: "logbook_polish",
    params: { mode: "essay", date: "2026-10-03", location: "파리", memo: "걸었다", images: [] },
  }, { Origin: ORIGIN, Authorization: jwt({ role: "authenticated", sub: "user-9" }) }, fetchImpl);
  assertEquals(authed.status, 200);
  assertEquals(geminiCalls(calls).length, 1);
});

Deno.test("fileData and other part types are rejected on every path", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk());
  const fileOnly = await post({
    modelId: "gemini-3.5-flash",
    parts: [{ fileData: { fileUri: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } }],
  }, { Origin: ORIGIN }, fetchImpl);
  assertEquals(fileOnly.status, 400);
  const mixed = await post({
    modelId: "gemini-3.5-flash",
    parts: [{ text: "ping", fileData: { fileUri: "https://youtu.be/x" } }],
  }, { Origin: ORIGIN }, fetchImpl);
  assertEquals(mixed.status, 400);
  const badMime = await post({
    task: "logbook_polish",
    params: {
      mode: "essay",
      date: "2026-10-03",
      location: "파리",
      memo: "걸었다",
      images: [{ mimeType: "image/gif", data: "aaaa" }],
    },
  }, { Origin: ORIGIN, Authorization: jwt({ role: "authenticated", sub: "user-9" }) }, fetchImpl);
  assertEquals(badMime.status, 400);
  assertEquals(geminiCalls(calls).length, 0);
  assertEquals(reserveCalls(calls).length, 0);
});

Deno.test("legacy pro maps to 3.5-flash and image bodies may exceed 64KB up to 7MiB", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk("pong"));
  const res = await post({
    modelId: "gemini-3.1-pro-preview",
    parts: [
      { text: "ping" },
      { inlineData: { mimeType: "image/jpeg", data: "a".repeat(70_000) } },
    ],
  }, { Origin: ORIGIN }, fetchImpl);
  assertEquals(res.status, 200);
  assert(geminiCalls(calls)[0].url.includes("gemini-3.5-flash"));
  assert(!geminiCalls(calls)[0].url.includes("pro"));
});

Deno.test("missing IP salt fails closed", async () => {
  const { fetchImpl, calls } = routedFetch(() => geminiOk());
  const res = await post(mooni, { Origin: ORIGIN }, fetchImpl, { GEMINI_PROXY_IP_SALT: "" });
  assertEquals(res.status, 503);
  assertEquals((await res.json()).error, "busy");
  assertEquals(geminiCalls(calls).length, 0);
  assertEquals(admitCalls(calls).length, 0);
});

Deno.test("budget reserve RPC failure is 503 and does not call Gemini", async () => {
  const { fetchImpl, calls } = installFetch((call) => {
    if (call.url.includes("gemini_proxy_admit")) return new Response(JSON.stringify({ ok: true }), { status: 200 });
    if (call.url.includes("gemini_proxy_reserve_usage")) return new Response("no", { status: 500 });
    return geminiOk();
  });
  const res = await post(mooni, { Origin: ORIGIN }, fetchImpl);
  assertEquals(res.status, 503);
  assertEquals((await res.json()).error, "busy");
  assertEquals(geminiCalls(calls).length, 0);
});

Deno.test("reserve budget hit is 429 and a timeout keeps the reservation", async () => {
  const { fetchImpl, calls } = installFetch((call) => {
    if (call.url.includes("gemini_proxy_admit")) return new Response(JSON.stringify({ ok: true }), { status: 200 });
    if (call.url.includes("gemini_proxy_reserve_usage")) {
      return new Response(JSON.stringify({ ok: false, reason: "budget", retry_after_s: 40 }), { status: 200 });
    }
    return geminiOk();
  });
  const limited = await post(mooni, { Origin: ORIGIN }, fetchImpl);
  assertEquals(limited.status, 429);
  assertEquals((await limited.json()).error, "budget");
  assertEquals(geminiCalls(calls).length, 0);

  const { fetchImpl: fetchTimeout, calls: timed } = installFetch((call) => {
    if (call.url.includes("gemini_proxy_admit")) return new Response(JSON.stringify({ ok: true }), { status: 200 });
    if (call.url.includes("gemini_proxy_reserve_usage")) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (call.url.includes("reconcile")) return new Response("null", { status: 200 });
    const error = new Error("aborted");
    error.name = "AbortError";
    throw error;
  });
  const timedOut = await post(mooni, { Origin: ORIGIN }, fetchTimeout);
  assertEquals(timedOut.status, 503);
  assertEquals(reserveCalls(timed).length, 1);
  assertEquals(timed.filter((call) => call.url.includes("reconcile")).length, 0);
});

Deno.test("OPTIONS echoes only an allowed origin", async () => {
  const ok = await handleGeminiProxy(new Request("https://example/functions/v1/gemini-proxy", {
    method: "OPTIONS",
    headers: { Origin: ORIGIN, "Access-Control-Request-Method": "POST" },
  }), { env });
  assertEquals(ok.status, 204);
  assertEquals(ok.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assertEquals(ok.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
  assertEquals(ok.headers.get("Vary"), "Origin");

  const bad = await handleGeminiProxy(new Request("https://example/functions/v1/gemini-proxy", {
    method: "OPTIONS",
    headers: { Origin: "https://evil.example" },
  }), { env });
  assertEquals(bad.status, 204);
  assertEquals(bad.headers.get("Access-Control-Allow-Origin"), null);
});
