/** TourAPI proxy — intro attach + homepage policy (TOURAPI_PROXY_INTRO_HOMEPAGE=on). */

export const DETAIL_INTRO_DAILY_CAP = 250;

/** Max live detailIntro calls per festivalWindow response (cold-cache safety). */
export const FESTIVAL_WINDOW_INTRO_PER_REQUEST = 10;

export const INTRO_SNIPPET_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isIntroHomepageEnabled(envValue = undefined) {
  let raw = envValue;
  if (raw === undefined) {
    if (typeof Deno !== "undefined") {
      raw = Deno.env.get("TOURAPI_PROXY_INTRO_HOMEPAGE");
    } else if (typeof process !== "undefined" && process.env) {
      raw = process.env.TOURAPI_PROXY_INTRO_HOMEPAGE;
    }
  }
  const v = String(raw ?? "").trim().toLowerCase();
  return v === "on" || v === "1" || v === "true" || v === "yes";
}

/** @type {Record<string, { url: string, verifiedAt: string, source: string }>} */
export const HOMEPAGE_OVERRIDES = {
  637693: {
    url:
      "https://www.changwon.go.kr/cwportal/depart/11063/14383/14384.web",
    verifiedAt: "2026-10-18",
    source: "manual: Cos verified 200, 제26회, 2026.10.31~11.8",
  },
};

export function kstYmd(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replace(/-/g, "");
}

export function addDaysYmd(ymd, days) {
  if (!/^\d{8}$/.test(String(ymd))) return null;
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

/**
 * TourAPI homepage is often HTML (<a href="...">) with optional <br> or multiple links.
 * @param {string | null | undefined} raw
 * @returns {string[]}
 */
export function extractHomepageHrefCandidates(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return [];

  const hrefs = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(s)) !== null) {
    const href = String(m[1] ?? "").trim();
    if (!href || href.startsWith("#") || /^javascript:/i.test(href)) continue;
    hrefs.push(href);
  }
  if (hrefs.length) return hrefs;

  const urlInText = s.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  if (urlInText) return [urlInText.trim()];

  if (!/<[a-z][\s\S]*>/i.test(s)) return [s];
  return [];
}

/**
 * @param {string} candidate
 * @returns {URL | null}
 */
export function homepageUrlFromCandidate(candidate) {
  const s = String(candidate ?? "").trim();
  if (!s) return null;
  let toParse = s;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) {
    toParse = `https://${s.replace(/^\/+/, "")}`;
  }
  try {
    const url = new URL(toParse);
    if (!url.hostname) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * @param {string | null | undefined} raw
 * @returns {URL | null}
 */
export function parseHomepageUrl(raw) {
  for (const candidate of extractHomepageHrefCandidates(raw)) {
    const url = homepageUrlFromCandidate(candidate);
    if (url) return url;
  }
  return null;
}

/**
 * @param {string} candidate
 * @param {URL} url
 */
export function formatResolvedHomepageUrl(candidate, url) {
  const c = String(candidate ?? "").trim();
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(c)) return c;
  return url.href;
}

/**
 * Hide municipal portal front pages (*.go.kr root/index/main).
 * @param {URL} url
 */
export function isGoKrPortalFrontPage(url) {
  const host = String(url.hostname || "").toLowerCase();
  if (host !== "go.kr" && !host.endsWith(".go.kr")) return false;
  if (url.search && url.search.length > 1) return false;
  let path = String(url.pathname || "/");
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/+$/, "") || "/";
  if (path === "/") return true;
  const segments = path.split("/").filter(Boolean);
  if (segments.length !== 1) return false;
  const seg = segments[0].toLowerCase();
  return seg === "main" || seg === "index.do" || seg === "main.do";
}

/**
 * @param {string | null | undefined} contentId
 * @param {string | null | undefined} rawHomepage
 * @returns {string | null}
 */
export function resolvePublicHomepage(contentId, rawHomepage) {
  const id = String(contentId ?? "").trim();
  const override = id ? HOMEPAGE_OVERRIDES[id] : null;
  if (override?.url) return override.url;

  const raw = String(rawHomepage ?? "").trim();
  if (!raw) return null;

  for (const candidate of extractHomepageHrefCandidates(raw)) {
    const url = homepageUrlFromCandidate(candidate);
    if (!url) continue;
    if (isGoKrPortalFrontPage(url)) continue;
    return formatResolvedHomepageUrl(candidate, url);
  }
  return null;
}

/**
 * @param {Record<string, unknown>} item
 * @param {Date} [now]
 */
export function festivalItemWithinIntroWindow(item, now = new Date()) {
  const start = String(item?.eventStartDate ?? "").trim();
  const end = String(item?.eventEndDate ?? start).trim();
  if (!/^\d{8}$/.test(start)) return false;
  const today = kstYmd(now);
  const endYmd = /^\d{8}$/.test(end) ? end : start;
  if (endYmd < today) return false;
  if (start <= today) return true;
  const limit = addDaysYmd(today, 7);
  return limit != null && start <= limit;
}

export function detailIntroCounterCacheKey(ymd = kstYmd()) {
  return `counter:detailIntro:${ymd}`;
}

export function canMakeDetailIntroCall(
  count,
  cap = DETAIL_INTRO_DAILY_CAP,
) {
  const n = Number(count);
  if (!Number.isFinite(n) || n < 0) return true;
  return Math.floor(n) < cap;
}

export function introSnippetCacheKey(locale, contentId) {
  return `introSnippet:${locale}:${contentId}`;
}

/**
 * @param {Record<string, unknown>} item
 * @param {{ playtime?: string | null, usetimefestival?: string | null }} snippet
 */
export function mergeIntroSnippetOntoItem(item, snippet) {
  if (!item || !snippet) return item;
  const playtime = String(snippet.playtime ?? "").trim();
  const usetimefestival = String(snippet.usetimefestival ?? "").trim();
  if (playtime && !String(item.playtime ?? "").trim()) {
    item.playtime = playtime;
  }
  if (usetimefestival && !String(item.usetimefestival ?? "").trim()) {
    item.usetimefestival = usetimefestival;
  }
  return item;
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 * @param {string} contentId
 */
export function applyHomepagePolicyToItem(item, contentId) {
  if (!item) return item;
  const resolved = resolvePublicHomepage(contentId, item.homepage);
  if (resolved) {
    item.homepage = resolved;
  } else if ("homepage" in item) {
    delete item.homepage;
  }
  return item;
}
