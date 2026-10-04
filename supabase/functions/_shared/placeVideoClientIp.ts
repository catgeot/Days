/**
 * Client IP for fetch-place-videos rate-limit keys.
 * Staging echo (staging-ip-echo) imports this same function. Delete that echo after verification.
 *
 * The leftmost X-Forwarded-For hop is client-supplied. Do not trust it.
 * Supabase Edge docs do not say the gateway overwrites X-Forwarded-For, and
 * they do not say `cf-connecting-ip` is forwarded. Staging verification is required.
 *
 * FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER (default `x-forwarded-for`):
 *   a single platform header such as `cf-connecting-ip` is used when present.
 *   `x-real-ip` and `x-forwarded-for` as this env value are ignored. The env
 *   does not switch the source to X-Real-IP. X-Real-IP is only the fallback
 *   when X-Forwarded-For is absent.
 * FETCH_PLACE_VIDEOS_XFF_TRUSTED_HOPS (default 1, clamp 1–5), counted from
 * the right. Assumption: one gateway appends the observed peer, so hop 1 is
 * the rightmost address. Client-supplied hops stay on the left.
 * `sb-forwarded-for` is Auth/GoTrue only and is not read here.
 *
 * IPv6 keys use the /64 prefix. IPv4-mapped IPv6 (`::ffff:a.b.c.d`) is the
 * IPv4 address. Ports are stripped so `ip:port` does not split the bucket.
 */

function trustedXffHops(): number {
  const raw = Deno.env.get("FETCH_PLACE_VIDEOS_XFF_TRUSTED_HOPS");
  if (raw == null || raw.trim() === "") return 1;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) return 1;
  return n;
}

export function normalizeIpToken(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("[")) {
    const end = s.indexOf("]");
    if (end > 1) s = s.slice(1, end);
  }
  const v4Port = s.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (v4Port) s = v4Port[1];
  const mapped = s.match(/^(?:::ffff:)(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) return mapped[1];
  return s;
}

function expandIpv6(raw: string): string[] | null {
  const s = raw.toLowerCase();
  if (!s.includes(":") || s.includes(".")) return null;
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const parse = (part: string) => (part ? part.split(":") : []);
  const left = parse(halves[0]);
  const right = halves.length === 2 ? parse(halves[1]) : [];
  const hextet = /^[0-9a-f]{1,4}$/;
  if ([...left, ...right].some((part) => !hextet.test(part))) return null;
  if (halves.length === 1) {
    if (left.length !== 8) return null;
    return left.map((part) => part.padStart(4, "0"));
  }
  const missing = 8 - left.length - right.length;
  if (missing < 1) return null;
  return [...left, ...Array(missing).fill("0000"), ...right].map((part) => part.padStart(4, "0"));
}

function bucketIp(ip: string): string {
  const v6 = expandIpv6(ip);
  if (!v6) return ip;
  return `${v6.slice(0, 4).join(":")}::/64`;
}

export function clientIp(req: Request): string {
  const headerName = (Deno.env.get("FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER") ?? "x-forwarded-for")
    .trim()
    .toLowerCase();
  let raw = "";
  // x-real-ip is not a platform-overwritten header. Setting the env to it is ignored.
  if (headerName && headerName !== "x-forwarded-for" && headerName !== "x-real-ip") {
    raw = (req.headers.get(headerName) ?? "").split(",")[0]?.trim() ?? "";
  }
  if (!raw) {
    const forwarded = (req.headers.get("x-forwarded-for") ?? "")
      .split(",")
      .map((part) => normalizeIpToken(part.trim()))
      .filter(Boolean);
    if (forwarded.length) {
      const index = Math.max(0, forwarded.length - trustedXffHops());
      raw = forwarded[index];
    }
  }
  if (!raw) raw = normalizeIpToken(req.headers.get("x-real-ip")?.trim() || "unknown");
  else raw = normalizeIpToken(raw);
  const cleaned = raw.replace(/[^0-9a-fA-F:.\-]/g, "").slice(0, 64);
  return bucketIp(cleaned || "unknown");
}
