const ALLOWED_MRT_HOSTS = new Set([
  "partner-ext-api.myrealtrip.com",
  "api.myrealtrip.com",
]);

let relayConfigured: boolean | undefined;

function proxyUrlFromEnv(): string | null {
  const raw = Deno.env.get("MRT_PROXY_URL");
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function basicTokenFromProxyUrl(proxyUrl: string): string | null {
  try {
    const u = new URL(proxyUrl);
    if (!u.username) return null;
    const user = decodeURIComponent(u.username);
    const pass = decodeURIComponent(u.password ?? "");
    const raw = `${user}:${pass}`;
    // btoa expects Latin1; credentials are ASCII
    return `Basic ${btoa(raw)}`;
  } catch {
    return null;
  }
}

/** Whether outbound MRT calls go through the fixed-IP application relay. */
export function mrtProxyEnabled(): boolean {
  if (relayConfigured !== undefined) return relayConfigured;
  const proxyUrl = proxyUrlFromEnv();
  if (!proxyUrl) {
    relayConfigured = false;
    return false;
  }
  try {
    const u = new URL(proxyUrl);
    relayConfigured = Boolean(u.hostname && u.username);
  } catch {
    relayConfigured = false;
  }
  return relayConfigured;
}

/**
 * Relay sometimes returns a gzip body without Content-Encoding.
 * fetch() then leaves the bytes compressed, JSON parse fails, and
 * region lookup is reported as an empty list.
 */
async function responseWithGzipDecoded(res: Response): Promise<Response> {
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length < 2 || buf[0] !== 0x1f || buf[1] !== 0x8b) {
    return new Response(buf, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  }
  const decoded = await new Response(
    new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip")),
  ).arrayBuffer();
  const headers = new Headers(res.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  return new Response(decoded, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

/**
 * Fetch MRT APIs via Vultr application relay when MRT_PROXY_URL is set.
 * Relay auth uses X-Gateo-Proxy-Auth (Basic from URL userinfo) so the
 * upstream Authorization: Bearer API key is preserved.
 * Falls back to direct fetch when unset / unparsable.
 */
export async function mrtFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (!mrtProxyEnabled()) {
    return responseWithGzipDecoded(await fetch(input, init));
  }

  const proxyUrl = proxyUrlFromEnv()!;
  const target =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return responseWithGzipDecoded(await fetch(input, init));
  }

  if (
    targetUrl.protocol !== "https:" ||
    !ALLOWED_MRT_HOSTS.has(targetUrl.hostname)
  ) {
    console.warn("[mrtFetch] host not allowlisted for relay; direct fetch");
    return responseWithGzipDecoded(await fetch(input, init));
  }

  const proxy = new URL(proxyUrl);
  const relay = new URL(proxy.origin);
  relay.pathname = "/forward";
  relay.searchParams.set("url", targetUrl.toString());

  const headers = new Headers(init?.headers);
  const token = basicTokenFromProxyUrl(proxyUrl);
  if (!token) {
    console.warn("[mrtFetch] proxy URL missing credentials; direct fetch");
    return responseWithGzipDecoded(await fetch(input, init));
  }
  headers.set("X-Gateo-Proxy-Auth", token);

  return responseWithGzipDecoded(await fetch(relay.toString(), {
    method: init?.method ?? "GET",
    headers,
    body: init?.body,
    redirect: init?.redirect,
  }));
}

/** Test-only: clear lazy relay config so env changes take effect. */
export function resetMrtFetchProxyClientForTests(): void {
  relayConfigured = undefined;
}
