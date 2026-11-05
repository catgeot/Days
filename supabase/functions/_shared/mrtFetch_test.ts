import { assertEquals } from "jsr:@std/assert@^1";
import {
  mrtFetch,
  mrtProxyEnabled,
  resetMrtFetchProxyClientForTests,
} from "./mrtFetch.ts";

Deno.test("MRT_PROXY_URL unset — no relay", () => {
  Deno.env.delete("MRT_PROXY_URL");
  resetMrtFetchProxyClientForTests();
  assertEquals(mrtProxyEnabled(), false);
});

Deno.test("MRT_PROXY_URL empty — no relay", () => {
  Deno.env.set("MRT_PROXY_URL", "   ");
  resetMrtFetchProxyClientForTests();
  assertEquals(mrtProxyEnabled(), false);
  Deno.env.delete("MRT_PROXY_URL");
  resetMrtFetchProxyClientForTests();
});

Deno.test("MRT_PROXY_URL with userinfo — relay enabled", () => {
  Deno.env.set("MRT_PROXY_URL", "http://relayuser:relaypass@127.0.0.1:8888");
  resetMrtFetchProxyClientForTests();
  assertEquals(mrtProxyEnabled(), true);
  Deno.env.delete("MRT_PROXY_URL");
  resetMrtFetchProxyClientForTests();
});

Deno.test("mrtFetch without proxy passes through to global fetch", async () => {
  Deno.env.delete("MRT_PROXY_URL");
  resetMrtFetchProxyClientForTests();
  const original = globalThis.fetch;
  let sawClient = false;
  let calledUrl = "";
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    calledUrl = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;
    if (init && "client" in init && (init as { client?: unknown }).client) {
      sawClient = true;
    }
    return Promise.resolve(new Response("ok", { status: 200 }));
  }) as typeof fetch;
  try {
    await mrtFetch("https://partner-ext-api.myrealtrip.com/x", { method: "GET" });
    assertEquals(sawClient, false);
    assertEquals(calledUrl, "https://partner-ext-api.myrealtrip.com/x");
  } finally {
    globalThis.fetch = original;
  }
});

Deno.test("mrtFetch with proxy rewrites to /forward and sets X-Gateo-Proxy-Auth", async () => {
  Deno.env.set("MRT_PROXY_URL", "http://relayuser:relaypass@127.0.0.1:8888");
  resetMrtFetchProxyClientForTests();
  const original = globalThis.fetch;
  let calledUrl = "";
  let authHeader = "";
  let bearerKept = "";
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    calledUrl = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;
    const h = new Headers(init?.headers);
    authHeader = h.get("X-Gateo-Proxy-Auth") ?? "";
    bearerKept = h.get("Authorization") ?? "";
    return Promise.resolve(new Response("{}", { status: 200 }));
  }) as typeof fetch;
  try {
    await mrtFetch("https://partner-ext-api.myrealtrip.com/regions/v2/x?q=1", {
      method: "GET",
      headers: { Authorization: "Bearer test-key" },
    });
    const u = new URL(calledUrl);
    assertEquals(u.origin, "http://127.0.0.1:8888");
    assertEquals(u.pathname, "/forward");
    assertEquals(
      u.searchParams.get("url"),
      "https://partner-ext-api.myrealtrip.com/regions/v2/x?q=1",
    );
    assertEquals(authHeader.startsWith("Basic "), true);
    assertEquals(bearerKept, "Bearer test-key");
  } finally {
    globalThis.fetch = original;
    Deno.env.delete("MRT_PROXY_URL");
    resetMrtFetchProxyClientForTests();
  }
});
