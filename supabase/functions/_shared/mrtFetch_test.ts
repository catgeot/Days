import { assertEquals } from "jsr:@std/assert@^1";
import {
  mrtFetch,
  mrtProxyEnabled,
  resetMrtFetchProxyClientForTests,
} from "./mrtFetch.ts";

Deno.test("MRT_PROXY_URL unset — no proxy client", () => {
  Deno.env.delete("MRT_PROXY_URL");
  resetMrtFetchProxyClientForTests();
  assertEquals(mrtProxyEnabled(), false);
});

Deno.test("MRT_PROXY_URL empty — no proxy client", () => {
  Deno.env.set("MRT_PROXY_URL", "   ");
  resetMrtFetchProxyClientForTests();
  assertEquals(mrtProxyEnabled(), false);
  Deno.env.delete("MRT_PROXY_URL");
  resetMrtFetchProxyClientForTests();
});

Deno.test("mrtFetch without proxy passes through to global fetch", async () => {
  Deno.env.delete("MRT_PROXY_URL");
  resetMrtFetchProxyClientForTests();
  const original = globalThis.fetch;
  let sawClient = false;
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    if (init && "client" in init && init.client) sawClient = true;
    return Promise.resolve(new Response("ok", { status: 200 }));
  }) as typeof fetch;
  try {
    await mrtFetch("https://example.test/mrt-proxy-test", { method: "GET" });
    assertEquals(sawClient, false);
  } finally {
    globalThis.fetch = original;
  }
});
