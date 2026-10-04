import { callGemini, extractGeminiAnswer } from "../_shared/gemini/call.ts";
import {
  allowMemoryBypass,
  buildHealthChecks,
  buildRateChecks,
  loadLimits,
  loadTokenBudget,
} from "../_shared/gemini/limits.ts";
import {
  clientIp,
  hashIp,
  healthTokenMatches,
  isBlockedUserAgent,
  isOriginAllowed,
  readJwtClaims,
  type ProxyEnv,
} from "../_shared/gemini/origin.ts";
import { GEMINI_FAST } from "../_shared/geminiModels.ts";
import { acceptProxyParts, buildLegacy, buildTask, estimatePromptTokens } from "../_shared/gemini/tasks.ts";

const ALLOW_HEADERS = "authorization, x-client-info, apikey, content-type";
const GENERAL_MAX = 64 * 1024;
/** 구 로그북 번들의 이미지 본문 상한. 7 MiB = 7340032. */
const LOGBOOK_MAX = 7 * 1024 * 1024;

export type ProxyDeps = {
  env?: ProxyEnv;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

function envOf(deps: ProxyDeps): ProxyEnv {
  return deps.env ?? Deno.env.toObject();
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  origin: string | null,
  allowed: boolean,
  extra?: HeadersInit,
): Response {
  const headers = new Headers(extra);
  headers.set("Content-Type", "application/json");
  headers.set("Vary", "Origin");
  if (allowed && origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Headers", ALLOW_HEADERS);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function corsPreflight(origin: string | null, allowed: boolean): Response {
  const headers = new Headers({ Vary: "Origin" });
  if (allowed && origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Headers", ALLOW_HEADERS);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  return new Response(null, { status: 204, headers });
}

async function rpc(
  fetchImpl: typeof fetch,
  env: ProxyEnv,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const base = env.SUPABASE_URL?.replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("rpc_unconfigured");
  const response = await fetchImpl(`${base}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error(`rpc_${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function logLine(row: Record<string, unknown>) {
  console.log(JSON.stringify({ fn: "gemini-proxy", ...row }));
}

export async function handleGeminiProxy(req: Request, deps: ProxyDeps = {}): Promise<Response> {
  const started = deps.now?.() ?? Date.now();
  const env = envOf(deps);
  const fetchImpl = deps.fetchImpl ?? fetch;
  const origin = req.headers.get("origin");
  const originAllowed = isOriginAllowed(origin, env);

  if (req.method === "OPTIONS") return corsPreflight(origin, originAllowed);
  if (req.method !== "POST") {
    return jsonResponse(405, { success: false, error: "bad_request" }, origin, originAllowed);
  }
  if (isBlockedUserAgent(req.headers.get("user-agent"), env)) {
    logLine({ task: null, status: 403, error: "bot_blocked", ms: Date.now() - started, legacy: false });
    return jsonResponse(403, { success: false, error: "bot_blocked" }, origin, originAllowed);
  }

  const declared = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(declared) && declared > LOGBOOK_MAX) {
    return jsonResponse(413, { success: false, error: "too_large" }, origin, originAllowed);
  }

  const raw = await req.arrayBuffer();
  if (raw.byteLength > LOGBOOK_MAX) {
    return jsonResponse(413, { success: false, error: "too_large" }, origin, originAllowed);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(raw));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse(400, { success: false, error: "bad_request" }, origin, originAllowed);
    }
    body = parsed;
  } catch {
    return jsonResponse(400, { success: false, error: "bad_request" }, origin, originAllowed);
  }

  const taskName = typeof body.task === "string" ? body.task : "";
  const isTask = Boolean(taskName);
  const isLegacy = !isTask && Array.isArray(body.parts);
  if (!isTask && !isLegacy) {
    return jsonResponse(400, { success: false, error: "bad_request" }, origin, originAllowed);
  }

  const sizeLimit = taskName === "logbook_polish" || isLegacy ? LOGBOOK_MAX : GENERAL_MAX;
  if ((declared > 0 && declared > sizeLimit) || raw.byteLength > sizeLimit) {
    return jsonResponse(413, { success: false, error: "too_large" }, origin, originAllowed);
  }

  const healthTokenOk = taskName === "health_ping" && await healthTokenMatches(
    req.headers.get("x-gateo-health"),
    env.GEMINI_HEALTH_TOKEN,
  );
  if (taskName === "health_ping" && !env.GEMINI_HEALTH_TOKEN?.trim()) {
    console.error(JSON.stringify({ fn: "gemini-proxy", error: "missing_health_token" }));
  }

  if (!healthTokenOk && !originAllowed) {
    logLine({ task: taskName || "legacy", status: 403, error: "origin_not_allowed", ms: Date.now() - started, legacy: isLegacy });
    return jsonResponse(403, { success: false, error: "origin_not_allowed" }, origin, false);
  }

  const claims = readJwtClaims(req);
  const legacyEnabled = env.GEMINI_PROXY_LEGACY !== "off";
  const built = isTask
    ? buildTask(taskName, body.params, claims.role)
    : buildLegacy(body, legacyEnabled);
  if (!built.ok) {
    return jsonResponse(built.status, { success: false, error: built.error }, origin, originAllowed);
  }
  const accepted = acceptProxyParts(built.parts);
  if (!accepted.ok) {
    return jsonResponse(400, { success: false, error: "bad_request" }, origin, originAllowed);
  }
  const parts = accepted.parts;

  if (!env.GEMINI_PROXY_IP_SALT?.trim()) {
    console.error(JSON.stringify({ fn: "gemini-proxy", error: "missing_ip_salt" }));
    return jsonResponse(503, { success: false, error: "busy" }, origin, originAllowed);
  }
  const ip = clientIp(req);
  const ipHash = await hashIp(ip, env.GEMINI_PROXY_IP_SALT);
  const uid = claims.role === "authenticated" && claims.sub ? claims.sub : null;
  const limits = loadLimits(env.GEMINI_PROXY_LIMITS);
  const health = healthTokenOk && built.task === "health_ping";
  const checks = health
    ? buildHealthChecks(limits)
    : buildRateChecks(ipHash, uid, built.task, built.tier, limits);
  const tokenBudget = loadTokenBudget(env.GEMINI_DAILY_TOKEN_BUDGET);

  let admitted = false;
  try {
    const result = await rpc(fetchImpl, env, "gemini_proxy_admit", {
      p_checks: checks,
      p_token_budget: null,
    }) as { ok?: boolean; reason?: string; retry_after_s?: number } | null;
    if (result && result.ok === false) {
      const retryAfter = Number(result.retry_after_s) || 1;
      const error = result.reason === "budget" ? "budget" : "rate_limited";
      logLine({
        task: built.task,
        model: built.model,
        status: 429,
        error,
        ipHash8: ipHash.slice(0, 8),
        uidSet: Boolean(uid),
        ms: Date.now() - started,
        legacy: built.task === "legacy",
        ...(health ? { health: true } : {}),
      });
      return jsonResponse(
        429,
        { success: false, error, retryAfter },
        origin,
        originAllowed,
        { "Retry-After": String(retryAfter) },
      );
    }
    admitted = true;
  } catch (error) {
    console.error(JSON.stringify({
      fn: "gemini-proxy",
      error: "rate_rpc_error",
      detail: String(error instanceof Error ? error.message : error).slice(0, 200),
    }));
    if (health || !allowMemoryBypass(ipHash, deps.now?.() ?? Date.now())) {
      if (health) {
        logLine({
          task: built.task,
          status: 503,
          error: "busy",
          health: true,
          ms: Date.now() - started,
          legacy: false,
        });
      }
      return jsonResponse(503, { success: false, error: "busy" }, origin, originAllowed);
    }
  }

  const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || "";
  if (!apiKey) {
    console.error(JSON.stringify({ fn: "gemini-proxy", error: "missing_api_key" }));
    return jsonResponse(502, { success: false, error: "upstream_error" }, origin, originAllowed);
  }

  const reserve = async (modelName: string, outputTokens: number) => {
    const promptTokens = estimatePromptTokens(parts);
    try {
      const result = await rpc(fetchImpl, env, "gemini_proxy_reserve_usage", {
        p_task: built.task,
        p_model: modelName,
        p_calls: 1,
        p_prompt_tokens: promptTokens,
        p_output_tokens: outputTokens,
        p_token_budget: tokenBudget,
      }) as { ok?: boolean; reason?: string; retry_after_s?: number } | null;
      if (!result || result.ok !== true) {
        return { ok: false as const, budget: result?.reason === "budget", retryAfter: Number(result?.retry_after_s) || 1 };
      }
      return { ok: true as const, prompt: promptTokens, output: outputTokens };
    } catch (error) {
      console.error(JSON.stringify({
        fn: "gemini-proxy",
        error: "budget_rpc_error",
        detail: String(error instanceof Error ? error.message : error).slice(0, 200),
      }));
      return { ok: false as const, budget: false, retryAfter: 1 };
    }
  };

  const budgetDenied = (
    held: { ok: false; budget: boolean; retryAfter: number },
  ) => jsonResponse(
    held.budget ? 429 : 503,
    {
      success: false,
      error: held.budget ? "budget" : "busy",
      ...(held.budget ? { retryAfter: held.retryAfter } : {}),
    },
    origin,
    originAllowed,
    held.budget ? { "Retry-After": String(held.retryAfter) } : undefined,
  );

  let model = built.model;
  let reserved: { prompt: number; output: number } | null = null;
  if (!health) {
    const held = await reserve(model, built.maxOutputTokens);
    if (!held.ok) return budgetDenied(held);
    reserved = { prompt: held.prompt, output: held.output };
  }

  let upstream = await callGemini(fetchImpl, apiKey, model, parts, built.maxOutputTokens);
  if (!upstream.ok && (upstream.status === 503 || upstream.status === 404 || upstream.timedOut) && model !== GEMINI_FAST) {
    if (!health) {
      const held = await reserve(GEMINI_FAST, built.maxOutputTokens);
      if (!held.ok) return budgetDenied(held);
      reserved = { prompt: held.prompt, output: held.output };
    }
    model = GEMINI_FAST;
    upstream = await callGemini(fetchImpl, apiKey, model, parts, built.maxOutputTokens);
  }

  if (!upstream.ok) {
    if (upstream.errorText) {
      console.error(JSON.stringify({
        fn: "gemini-proxy",
        error: "upstream",
        status: upstream.status,
        detail: upstream.errorText.slice(0, 500),
      }));
    }
    const exhausted = upstream.status === 429 || /RESOURCE_EXHAUSTED/i.test(upstream.errorText);
    const busy = upstream.status === 503 || upstream.timedOut;
    const status = exhausted ? 429 : busy ? 503 : 502;
    const error = exhausted ? "quota" : busy ? "busy" : "upstream_error";
    logLine({
      task: built.task,
      model,
      status,
      error,
      ipHash8: ipHash.slice(0, 8),
      uidSet: Boolean(uid),
      ms: (deps.now?.() ?? Date.now()) - started,
      legacy: built.task === "legacy",
      admitted,
      ...(health ? { health: true } : {}),
    });
    return jsonResponse(status, { success: false, error }, origin, originAllowed);
  }

  const answer = extractGeminiAnswer(upstream.data);
  const payload: Record<string, unknown> = {
    success: true,
    text: answer.text,
    modelUsed: model,
    finishReason: answer.finishReason,
    truncated: answer.finishReason === "MAX_TOKENS",
  };
  if (built.task === "legacy") payload.data = upstream.data;

  if (!health && reserved) {
    try {
      await rpc(fetchImpl, env, "gemini_proxy_reconcile_usage", {
        p_task: built.task,
        p_model: model,
        p_prompt_delta: answer.promptTokens - reserved.prompt,
        p_output_delta: answer.outputTokens - reserved.output,
        p_calls_delta: 0,
      });
    } catch (error) {
      console.error(JSON.stringify({
        fn: "gemini-proxy",
        error: "usage_rpc_error",
        detail: String(error instanceof Error ? error.message : error).slice(0, 200),
      }));
    }
  }

  logLine({
    task: built.task,
    model,
    status: 200,
    ipHash8: ipHash.slice(0, 8),
    uidSet: Boolean(uid),
    ms: (deps.now?.() ?? Date.now()) - started,
    promptTokens: answer.promptTokens,
    outputTokens: answer.outputTokens,
    thoughts: answer.thoughts,
    finishReason: answer.finishReason,
    legacy: built.task === "legacy",
    ...(health ? { health: true } : {}),
  });
  return jsonResponse(200, payload, origin, originAllowed);
}
