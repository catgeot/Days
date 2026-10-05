/**
 * staging-ip-echo stays dark unless STAGING_IP_ECHO_ALLOW=1. No network, no deploy.
 */
function assertEquals(actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`assertEquals failed:\n  actual: ${a}\n  expected: ${b}`);
}

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

Deno.env.delete("STAGING_IP_ECHO_ALLOW");
await import("./index.ts");

const handle = (globalThis as Record<string, unknown>).__edgeHandler as (req: Request) => Response | Promise<Response>;
if (typeof handle !== "function") throw new Error("handler was not captured");

function hit(headers?: Record<string, string>): Promise<Response> {
  return Promise.resolve(handle(new Request("https://example.test/staging-ip-echo", { headers })));
}

Deno.test("404 when STAGING_IP_ECHO_ALLOW is unset", async () => {
  Deno.env.delete("STAGING_IP_ECHO_ALLOW");
  const res = await hit({ "x-forwarded-for": "203.0.113.8" });
  assertEquals(res.status, 404);
  const text = await res.text();
  assert(!text.includes("203.0.113.8"), "unset echo leaked the client address");
  assert(!text.includes("clientIp"), "unset echo leaked the clientIp field");
});

Deno.test("404 when STAGING_IP_ECHO_ALLOW is not exactly 1", async () => {
  Deno.env.set("STAGING_IP_ECHO_ALLOW", "true");
  const res = await hit();
  assertEquals(res.status, 404);
  Deno.env.delete("STAGING_IP_ECHO_ALLOW");
});

Deno.test("200 when STAGING_IP_ECHO_ALLOW is 1", async () => {
  Deno.env.set("STAGING_IP_ECHO_ALLOW", "1");
  const res = await hit({ "x-forwarded-for": "203.0.113.8" });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.clientIp, "203.0.113.8");
  Deno.env.delete("STAGING_IP_ECHO_ALLOW");
});

Deno.test("echo uses cf-connecting-ip, then the XFF hop before the platform hop", async () => {
  Deno.env.set("STAGING_IP_ECHO_ALLOW", "1");
  Deno.env.delete("FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER");
  Deno.env.delete("FETCH_PLACE_VIDEOS_XFF_TRUSTED_HOPS");
  const preferred = await hit({
    "cf-connecting-ip": "203.0.113.50",
    "x-forwarded-for": "1.2.3.4, 198.51.100.8, 3.2.51.9",
    "x-real-ip": "9.9.9.9",
  });
  assertEquals(preferred.status, 200);
  assertEquals((await preferred.json()).clientIp, "203.0.113.50");
  const fallback = await hit({
    "x-forwarded-for": "1.2.3.4, 203.0.113.8, 3.2.51.9",
    "x-real-ip": "9.9.9.9",
  });
  assertEquals((await fallback.json()).clientIp, "203.0.113.8");
  const missing = await hit({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "not-an-ip" });
  assertEquals((await missing.json()).clientIp, "unknown");
  Deno.env.delete("STAGING_IP_ECHO_ALLOW");
});
