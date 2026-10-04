/**
 * Client IP for fetch-place-videos rate-limit keys.
 * Staging echo (staging-ip-echo) imports this same function. Delete that echo after verification.
 *
 * Staging on 2026-10-04: Supabase sends X-Forwarded-For as
 * `<client>, <client>, <internal hop>`. The rightmost hop is a platform
 * address (3.2.51.x / 99.82.165.x) and changes per request, so trusting one
 * hop from the right shares one counter and never trips the per-minute cap.
 * `cf-connecting-ip` is the real client. Spoofed CF-Connecting-IP is rejected
 * by Cloudflare (403, non-JSON, error code 1000) before the function runs.
 * Spoofed X-Forwarded-For and X-Real-IP are stripped by the platform.
 *
 * Default source is `cf-connecting-ip` (code default, not an env requirement).
 * If that header is missing or not a valid IP, fall back to X-Forwarded-For.
 * FETCH_PLACE_VIDEOS_XFF_TRUSTED_HOPS defaults to 2 (clamp 1–5), counted from
 * the right, so the internal hop is skipped and the client hop is kept.
 * FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER overrides the primary header when it is
 * some other single platform header. `x-real-ip` and `x-forwarded-for` as this
 * env value are ignored. X-Real-IP is not a client identity source.
 * `sb-forwarded-for` is Auth/GoTrue only and is not read here.
 *
 * If neither the primary header nor XFF yields a valid IP, the key is
 * `unknown`. Every such request shares that bucket, so a missing IP cannot
 * bypass the per-IP limits.
 *
 * IPv6 keys use the /64 prefix. IPv4-mapped IPv6 (`::ffff:a.b.c.d`) is the
 * IPv4 address. Ports are stripped so `ip:port` does not split the bucket.
 */

const DEFAULT_CLIENT_IP_HEADER = "cf-connecting-ip";
const DEFAULT_XFF_TRUSTED_HOPS = 2;

function trustedXffHops(): number {
  const raw = Deno.env.get("FETCH_PLACE_VIDEOS_XFF_TRUSTED_HOPS");
  if (raw == null || raw.trim() === "") return DEFAULT_XFF_TRUSTED_HOPS;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) return DEFAULT_XFF_TRUSTED_HOPS;
  return n;
}

function primaryHeaderName(): string {
  const configured = (Deno.env.get("FETCH_PLACE_VIDEOS_CLIENT_IP_HEADER") ?? DEFAULT_CLIENT_IP_HEADER)
    .trim()
    .toLowerCase();
  if (!configured || configured === "x-forwarded-for" || configured === "x-real-ip") {
    return DEFAULT_CLIENT_IP_HEADER;
  }
  return configured;
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

function isIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function isValidIp(ip: string): boolean {
  if (!ip || ip === "unknown") return false;
  if (isIpv4(ip)) return true;
  return expandIpv6(ip) !== null;
}

function bucketIp(ip: string): string {
  const v6 = expandIpv6(ip);
  if (!v6) return ip;
  return `${v6.slice(0, 4).join(":")}::/64`;
}

function xffClient(req: Request): string {
  const forwarded = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => normalizeIpToken(part.trim()))
    .filter(Boolean);
  if (!forwarded.length) return "";
  const index = Math.max(0, forwarded.length - trustedXffHops());
  const hop = forwarded[index];
  if (!isValidIp(hop)) return "";
  return bucketIp(hop);
}

export function clientIp(req: Request): string {
  const headerName = primaryHeaderName();
  const headerRaw = normalizeIpToken((req.headers.get(headerName) ?? "").split(",")[0]?.trim() ?? "");
  if (isValidIp(headerRaw)) return bucketIp(headerRaw);
  const fromXff = xffClient(req);
  if (fromXff) return fromXff;
  return "unknown";
}
