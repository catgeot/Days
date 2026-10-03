/**
 * gallery-moderate: mocked auth + RPC. No network, no deploy.
 * 401 anon JWT (no user) / 403 normal user / 200 admin / 400 bad action / 503 RPC error.
 */
function assertEquals(actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`assertEquals failed:\n  actual: ${a}\n  expected: ${b}`);
}

type RpcCall = { name: string; args: Record<string, unknown> };

const state: {
  userId: string | null;
  authError: boolean;
  admin: boolean | "error";
  apply: { data?: unknown; error?: { code?: string; message: string } | null };
  rpcCalls: RpcCall[];
} = {
  userId: null,
  authError: false,
  admin: false,
  apply: { data: { applied: true } },
  rpcCalls: [],
};

(globalThis as Record<string, unknown>).__createSupabaseClient = () => ({
  auth: {
    getUser: (_token: string) => {
      if (state.authError || !state.userId) {
        return Promise.resolve({ data: { user: null }, error: state.authError ? { message: "no user" } : null });
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

function post(body: unknown, headers?: HeadersInit): Promise<Response> {
  return handle(new Request("https://example.test/gallery-moderate", {
    method: "POST",
    headers: {
      Origin: "https://www.gateo.kr",
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_JWT}`,
      ...headers,
    },
    body: JSON.stringify(body),
  }));
}

const valid = { action: "remove", placeId: "paris", imageId: "img-1", reason: "admin" };

Deno.test("401 when the bearer is an anon-key JWT with no user", async () => {
  state.userId = null;
  state.authError = true;
  state.admin = false;
  state.rpcCalls = [];
  const res = await post(valid);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.ok, false);
  assertEquals(state.rpcCalls.length, 0);
});

Deno.test("403 when the user is not a gallery admin", async () => {
  state.userId = "user-1";
  state.authError = false;
  state.admin = false;
  state.rpcCalls = [];
  const res = await post(valid);
  assertEquals(res.status, 403);
  assertEquals(state.rpcCalls.map((c) => c.name), ["is_app_admin"]);
  assertEquals(state.rpcCalls[0].args.p_scope, "gallery");
});

Deno.test("200 when a gallery admin applies a valid action", async () => {
  state.userId = "admin-1";
  state.authError = false;
  state.admin = true;
  state.apply = { data: { applied: "remove" } };
  state.rpcCalls = [];
  const res = await post(valid);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, true);
  assertEquals(body.result.applied, "remove");
  assertEquals(state.rpcCalls.map((c) => c.name), ["is_app_admin", "gallery_moderate_apply"]);
});

Deno.test("400 when action is not allowed", async () => {
  state.userId = "admin-1";
  state.authError = false;
  state.admin = true;
  state.rpcCalls = [];
  const res = await post({ ...valid, action: "purge" });
  assertEquals(res.status, 400);
  assertEquals(state.rpcCalls.map((c) => c.name), ["is_app_admin"]);
});

Deno.test("503 when the admin RPC fails", async () => {
  state.userId = "admin-1";
  state.authError = false;
  state.admin = "error";
  state.rpcCalls = [];
  const res = await post(valid);
  assertEquals(res.status, 503);
  const body = await res.json();
  assertEquals(body.error, "admin check unavailable");
});
