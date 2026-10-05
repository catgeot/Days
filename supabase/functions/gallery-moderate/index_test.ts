/**
 * gallery-moderate: mocked auth + RPC. No network, no deploy.
 */
function assertEquals(actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`assertEquals failed:\n  actual: ${a}\n  expected: ${b}`);
}

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

type RpcCall = { name: string; args: Record<string, unknown> };

const state: {
  userId: string | null;
  authError: boolean;
  authThrow: boolean;
  authStatus: number | null;
  admin: boolean | "error";
  apply: { data?: unknown; error?: { code?: string; message: string } | null };
  rpcCalls: RpcCall[];
} = {
  userId: null,
  authError: false,
  authThrow: false,
  authStatus: null,
  admin: false,
  apply: { data: { applied: true } },
  rpcCalls: [],
};

const logs: string[] = [];
const origLog = console.log.bind(console);
console.log = (...args: unknown[]) => {
  logs.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
  origLog(...args);
};

function reset(partial?: Partial<typeof state>) {
  state.userId = null;
  state.authError = false;
  state.authThrow = false;
  state.authStatus = null;
  state.admin = false;
  state.apply = { data: { applied: true } };
  state.rpcCalls = [];
  logs.length = 0;
  if (partial) Object.assign(state, partial);
}

function lastLog(): Record<string, unknown> {
  const line = logs.at(-1);
  if (!line) throw new Error("expected a JSON log line");
  return JSON.parse(line) as Record<string, unknown>;
}

(globalThis as Record<string, unknown>).__createSupabaseClient = () => ({
  auth: {
    getUser: (_token: string) => {
      if (state.authThrow) return Promise.reject(new Error("network down"));
      if (state.authStatus != null && state.authStatus >= 500) {
        return Promise.resolve({
          data: { user: null },
          error: { message: "auth 5xx", status: state.authStatus, name: "AuthApiError" },
        });
      }
      if (state.authError || !state.userId) {
        return Promise.resolve({
          data: { user: null },
          error: state.authError ? { message: "no user", status: 401 } : null,
        });
      }
      return Promise.resolve({ data: { user: { id: state.userId } }, error: null });
    },
  },
  rpc: (name: string, args: Record<string, unknown>) => {
    state.rpcCalls.push({ name, args });
    if (name === "is_app_admin") {
      if (state.admin === "error") {
        return Promise.resolve({ data: null, error: { message: "admin rpc down" } });
      }
      return Promise.resolve({ data: state.admin === true, error: null });
    }
    if (name === "gallery_moderate_apply") {
      if (state.apply.error) return Promise.resolve({ data: null, error: state.apply.error });
      return Promise.resolve({ data: state.apply.data, error: null });
    }
    return Promise.resolve({ data: null, error: { message: "unexpected rpc" } });
  },
});

await import("./index.ts");

const handle = (globalThis as Record<string, unknown>).__edgeHandler as (req: Request) => Promise<Response>;
if (typeof handle !== "function") throw new Error("gallery-moderate handler was not captured");

const ANON_JWT = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature";

function post(body: unknown, headers?: Record<string, string>): Promise<Response> {
  return handle(new Request("https://example.test/gallery-moderate", {
    method: "POST",
    headers: {
      Origin: "https://www.gateo.kr",
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_JWT}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));
}

function assertNoToken(line: string) {
  assert(!line.includes(ANON_JWT), "log contains bearer token");
  assert(!line.includes("service_role"), "log contains service role");
}

const valid = { action: "remove", placeId: "paris", imageId: "img-1", reason: "admin" };

Deno.test("401 when the bearer is an anon-key JWT with no user", async () => {
  reset({ authError: true });
  const res = await post(valid);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.ok, false);
  assertEquals(body.error, "unauthorized");
  assertEquals(res.headers.get("access-control-allow-origin"), "https://www.gateo.kr");
  assertEquals(state.rpcCalls.length, 0);
  const line = logs.at(-1) ?? "";
  assertNoToken(line);
  assertEquals(lastLog().status, 401);
  assertEquals(lastLog().error, "unauthorized");
});

Deno.test("503 when auth.getUser throws a network error", async () => {
  reset({ authThrow: true });
  const res = await post(valid);
  assertEquals(res.status, 503);
  const body = await res.json();
  assertEquals(body.error, "auth unavailable");
  assertEquals(res.headers.get("access-control-allow-origin"), "https://www.gateo.kr");
  assertEquals(state.rpcCalls.length, 0);
  assertNoToken(logs.at(-1) ?? "");
  assertEquals(lastLog().status, 503);
});

Deno.test("503 when auth.getUser returns 5xx", async () => {
  reset({ authStatus: 503 });
  const res = await post(valid);
  assertEquals(res.status, 503);
  const body = await res.json();
  assertEquals(body.error, "auth unavailable");
  assertEquals(state.rpcCalls.length, 0);
});

Deno.test("403 when the user is not a gallery admin", async () => {
  reset({ userId: "user-1", admin: false });
  const res = await post(valid);
  assertEquals(res.status, 403);
  assertEquals(state.rpcCalls.map((c) => c.name), ["is_app_admin"]);
  assertEquals(state.rpcCalls[0].args.p_scope, "gallery");
  assertEquals(state.rpcCalls[0].args.p_uid, "user-1");
  assertNoToken(logs.at(-1) ?? "");
  assertEquals(lastLog().status, 403);
  assertEquals(lastLog().actor, "user-1");
  assertEquals(lastLog().error, "forbidden");
});

Deno.test("200 when a gallery admin applies a valid action", async () => {
  reset({ userId: "admin-1", admin: true, apply: { data: { applied: "remove" } } });
  const res = await post(valid);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, true);
  assertEquals(body.result.applied, "remove");
  assertEquals(state.rpcCalls.map((c) => c.name), ["is_app_admin", "gallery_moderate_apply"]);
  const apply = state.rpcCalls[1];
  assertEquals(apply.args.p_actor, "admin-1");
  assertEquals(apply.args.p_actor, state.userId);
  assertNoToken(logs.at(-1) ?? "");
  assertEquals(lastLog().status, 200);
  assertEquals(lastLog().actor, "admin-1");
});

Deno.test("400 when action is not allowed", async () => {
  reset({ userId: "admin-1", admin: true });
  const res = await post({ ...valid, action: "purge" });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "bad input");
  assertEquals(res.headers.get("access-control-allow-origin"), "https://www.gateo.kr");
  assertEquals(state.rpcCalls.map((c) => c.name), ["is_app_admin"]);
  assertEquals(lastLog().status, 400);
  assertEquals(lastLog().error, "bad input");
});

Deno.test("400 with CORS when the JSON body is null or not an object", async () => {
  reset({ userId: "admin-1", admin: true });
  for (const raw of ["null", "[]", "\"hello\"", "1"]) {
    logs.length = 0;
    state.rpcCalls = [];
    const res = await post(raw);
    assertEquals(res.status, 400);
    const body = await res.json();
    assertEquals(body.error, "invalid json");
    assertEquals(res.headers.get("access-control-allow-origin"), "https://www.gateo.kr");
    assertEquals(res.headers.get("access-control-allow-methods"), "POST, OPTIONS");
    assertEquals(state.rpcCalls.map((c) => c.name), ["is_app_admin"]);
    assertEquals(lastLog().status, 400);
    assertNoToken(logs.at(-1) ?? "");
  }
});

Deno.test("gallery_moderate_apply error codes map to 404/400/403/500", async () => {
  const cases = [
    { code: "P0002", status: 404, message: "not found", bodyError: "not found" },
    { code: "22023", status: 400, message: "bad args", bodyError: "bad args" },
    { code: "42501", status: 403, message: "not allowed", bodyError: "not allowed" },
    { code: "XX000", status: 500, message: "secret db detail", bodyError: "moderation failed" },
  ];
  for (const item of cases) {
    reset({
      userId: "admin-1",
      admin: true,
      apply: { error: { code: item.code, message: item.message } },
    });
    const res = await post(valid);
    assertEquals(res.status, item.status);
    const body = await res.json();
    assertEquals(body.ok, false);
    assertEquals(body.error, item.bodyError);
    assertEquals(res.headers.get("access-control-allow-origin"), "https://www.gateo.kr");
    const line = logs.at(-1) ?? "";
    assertNoToken(line);
    if (item.status === 500) assert(!line.includes("secret db detail"), "500 log leaked db message");
    assertEquals(lastLog().status, item.status);
    assertEquals(lastLog().code, item.code);
    assertEquals(lastLog().actor, "admin-1");
  }
});

Deno.test("503 when the admin RPC fails", async () => {
  reset({ userId: "admin-1", admin: "error" });
  const res = await post(valid);
  assertEquals(res.status, 503);
  const body = await res.json();
  assertEquals(body.error, "admin check unavailable");
  assertEquals(lastLog().status, 503);
});

Deno.test("OPTIONS preflight returns CORS for the prod origin only", async () => {
  reset();
  const ok = await handle(new Request("https://example.test/gallery-moderate", {
    method: "OPTIONS",
    headers: { Origin: "https://www.gateo.kr", "Access-Control-Request-Method": "POST" },
  }));
  assertEquals(ok.status, 200);
  assertEquals(await ok.text(), "ok");
  assertEquals(ok.headers.get("access-control-allow-origin"), "https://www.gateo.kr");
  assertEquals(ok.headers.get("access-control-allow-methods"), "POST, OPTIONS");
  assert(String(ok.headers.get("access-control-allow-headers")).includes("authorization"), "allow-headers");
  assertEquals(logs.length, 0);

  const preview = await handle(new Request("https://example.test/gallery-moderate", {
    method: "OPTIONS",
    headers: {
      Origin: "https://days-git-cursor-gallery-moderate-1f02-catgeots-projects.vercel.app",
      "Access-Control-Request-Method": "POST",
    },
  }));
  assertEquals(preview.status, 200);
  assertEquals(preview.headers.get("access-control-allow-origin"), "https://www.gateo.kr");
  assert(
    preview.headers.get("access-control-allow-origin") !==
      "https://days-git-cursor-gallery-moderate-1f02-catgeots-projects.vercel.app",
    "preview origin must not be reflected",
  );
});

Deno.test("405 for methods other than POST", async () => {
  reset();
  for (const method of ["GET", "PUT", "DELETE"]) {
    logs.length = 0;
    const res = await handle(new Request("https://example.test/gallery-moderate", {
      method,
      headers: { Origin: "https://gateo.kr" },
    }));
    assertEquals(res.status, 405);
    const body = await res.json();
    assertEquals(body.error, "method not allowed");
    assertEquals(res.headers.get("access-control-allow-origin"), "https://gateo.kr");
    assertEquals(lastLog().status, 405);
  }
});
