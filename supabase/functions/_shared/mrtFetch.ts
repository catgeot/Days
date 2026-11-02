let proxyClientState: Deno.HttpClient | null | undefined;

function proxyUrlFromEnv(): string | null {
  const raw = Deno.env.get("MRT_PROXY_URL");
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getMrtHttpClient(): Deno.HttpClient | null {
  if (proxyClientState !== undefined) return proxyClientState;
  const proxyUrl = proxyUrlFromEnv();
  if (!proxyUrl) {
    proxyClientState = null;
    return null;
  }
  try {
    proxyClientState = Deno.createHttpClient({ proxy: { url: proxyUrl } });
  } catch {
    console.warn("[mrtFetch] createHttpClient failed; using direct fetch (proxyEnabled=false)");
    proxyClientState = null;
  }
  return proxyClientState;
}

/** Whether outbound MRT calls use a fixed-IP proxy (never logs URL/host). */
export function mrtProxyEnabled(): boolean {
  return getMrtHttpClient() != null;
}

export function mrtFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const client = getMrtHttpClient();
  if (client) return fetch(input, { ...init, client });
  return fetch(input, init);
}

/** Test-only: clear lazy proxy client so env changes take effect. */
export function resetMrtFetchProxyClientForTests(): void {
  proxyClientState = undefined;
}
