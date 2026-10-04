const DEFAULT_ORIGINS = ["https://www.gateo.kr", "https://gateo.kr"];
const DEFAULT_ORIGIN_RE =
  /^https:\/\/days-(git-[a-z0-9-]+|[a-z0-9]+)-catgeots-projects\.vercel\.app$/;
const LOCALHOST_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

const BOT_RE =
  /bot|spider|crawler|externalagent|facebookexternalhit|Bytespider|GPTBot|ClaudeBot|PerplexityBot|AhrefsBot|SemrushBot/i;

export type ProxyEnv = Record<string, string | undefined>;

function originList(env: ProxyEnv): string[] {
  const raw = env.GEMINI_PROXY_ALLOWED_ORIGINS?.trim();
  if (!raw) return DEFAULT_ORIGINS;
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function originPattern(env: ProxyEnv): RegExp | null {
  const raw = env.GEMINI_PROXY_ALLOWED_ORIGIN_RE?.trim();
  if (!raw) return DEFAULT_ORIGIN_RE;
  try {
    return new RegExp(raw);
  } catch {
    console.error(JSON.stringify({ fn: "gemini-proxy", error: "bad_origin_re" }));
    return DEFAULT_ORIGIN_RE;
  }
}

export function isOriginAllowed(origin: string | null, env: ProxyEnv): boolean {
  if (!origin) return false;
  if (originList(env).includes(origin)) return true;
  const pattern = originPattern(env);
  if (pattern?.test(origin)) return true;
  if (env.GEMINI_PROXY_ALLOW_LOCALHOST === "1" && LOCALHOST_ORIGINS.includes(origin)) {
    return true;
  }
  return false;
}

export function isBlockedUserAgent(userAgent: string | null, env: ProxyEnv): boolean {
  const ua = userAgent ?? "";
  if (env.GEMINI_PROXY_BLOCK_HEADLESS === "1" && /HeadlessChrome/i.test(ua)) return true;
  return BOT_RE.test(ua);
}

export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "";
}

export async function hashIp(ip: string, salt: string | undefined): Promise<string> {
  if (!salt) {
    console.error(JSON.stringify({ fn: "gemini-proxy", error: "missing_ip_salt" }));
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt ?? ""}${ip ?? ""}`),
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
    .slice(0, 16);
}

/** SHA-256 다이제스트를 고정 길이로 비교한다. 헤더 값과 시크릿 원문은 로그에 남기지 않는다. */
export async function healthTokenMatches(
  presented: string | null,
  secret: string | undefined,
): Promise<boolean> {
  const expected = secret?.trim() ?? "";
  if (!expected) return false;
  const enc = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(presented?.trim() ?? "")),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function readJwtClaims(req: Request): { role: string | null; sub: string | null } {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(\S+)/i);
  if (!match) return { role: null, sub: null };
  const payload = match[1].split(".")[1];
  if (!payload) return { role: null, sub: null };
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return {
      role: typeof json.role === "string" ? json.role : null,
      sub: typeof json.sub === "string" ? json.sub : null,
    };
  } catch {
    return { role: null, sub: null };
  }
}
