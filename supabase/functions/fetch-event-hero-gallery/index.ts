import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const TARGET_COUNT = 12;
const MIN_CACHE_COUNT = 6;

type GalleryImage = {
  url: string;
  captionKo?: string;
  captionEn?: string;
  source?: string;
};

function normalizeImageUrl(raw: unknown): string {
  return String(raw ?? "").trim();
}

function imageKey(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/thumb\//, "/").replace(/\/\d+px-[^/]+$/, "");
    return `${parsed.hostname}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

const REJECTED_GALLERY_CAPTION =
  /\b(pdf|svg|djvu|manuscript|document|letterhead|commission to|coat of arms|flag of|map of|logo of|scan of|libretto|title page|stamp of)\b/i;
const REJECTED_GALLERY_FILE = /\.(pdf|svg|tif|tiff|djvu)$/i;
const ATMOSPHERE_POS =
  /\b(festival|parade|carnival|crowd|celebration|lantern|firework|concert|performance|audience|orchestra|stage|auditorium|theater|theatre|tent|beer|costume|dancer|illuminat|sakura|blossom|marathon|running|runner|yoga|fitness|fairground|ferris|carousel|samba|mask|ballet|chandelier|float|interior|group exercise|cycling|peloton)\b/i;
const ATMOSPHERE_NEG =
  /\b(skyline|cityscape|facade|aerial view|camel|traffic|office tower|empty street|concrete building|stamp of|libretto|title page)\b/i;

function isHangulQuery(value: string): boolean {
  return /[\uAC00-\uD7A3]/.test(value);
}

function isRejectedFiller(image: GalleryImage): boolean {
  const url = normalizeImageUrl(image?.url).toLowerCase();
  const caption = `${image?.captionEn || ""} ${image?.captionKo || ""}`.trim();
  if (REJECTED_GALLERY_FILE.test(url) || REJECTED_GALLERY_FILE.test(caption)) return true;
  return REJECTED_GALLERY_CAPTION.test(caption);
}

function nearDupKey(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("unsplash.com")) {
      return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
    }
    let file = decodeURIComponent(parsed.pathname.split("/").pop() || "");
    file = file.replace(/^\d+px-/i, "").replace(/\.[a-z0-9]+$/i, "");
    file = file.replace(/(\d)[a-z]$/i, "$1");
    file = file.replace(/[_-][a-z]$/i, "");
    file = file.replace(/[_-]\d{1,3}$/i, "");
    file = file.replace(/[_-]\(\d+\)$/i, "");
    return `${parsed.hostname}/${file}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function isUnsplashImage(image: GalleryImage): boolean {
  if (!image) return false;
  if (String(image.source ?? "").toLowerCase() === "unsplash") return true;
  const url = normalizeImageUrl(image.url).toLowerCase();
  return url.includes("images.unsplash.com");
}

function mergeImages(seed: GalleryImage[], fetched: GalleryImage[]): GalleryImage[] {
  const seen = new Set<string>();
  const nearSeen = new Set<string>();
  const unsplash: GalleryImage[] = [];
  const others: GalleryImage[] = [];

  const push = (image: GalleryImage, allowRejected: boolean, skipNear: boolean) => {
    const url = normalizeImageUrl(image?.url);
    if (!url.startsWith("http")) return;
    const key = imageKey(url);
    if (seen.has(key)) return;
    if (!allowRejected && isRejectedFiller(image)) return;
    const near = nearDupKey(url);
    if (skipNear && nearSeen.has(near)) return;
    seen.add(key);
    nearSeen.add(near);
    const item: GalleryImage = {
      ...image,
      url,
      source: image.source || (isUnsplashImage(image) ? "unsplash" : undefined),
    };
    if (isUnsplashImage(item)) {
      unsplash.push(item);
    } else {
      others.push(item);
    }
  };

  for (const image of seed) push(image, true, false);
  for (const image of fetched) push(image, false, true);

  return rankImages([...unsplash, ...others]);
}

function scoreAtmosphere(image: GalleryImage): number {
  const text = `${image.captionEn || ""} ${image.captionKo || ""} ${image.url || ""}`;
  let score = 0;
  if (isUnsplashImage(image)) score += 2;
  if (ATMOSPHERE_POS.test(text)) score += 6;
  if (ATMOSPHERE_NEG.test(text)) score -= 6;
  return score;
}

function rankImages(images: GalleryImage[]): GalleryImage[] {
  return images
    .map((image, index) => ({ image, index, score: scoreAtmosphere(image) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((item) => item.image);
}

function needsAtmosphereRefresh(images: GalleryImage[]): boolean {
  if (!images.length) return true;
  let positive = 0;
  let negative = 0;
  for (const image of images) {
    const score = scoreAtmosphere(image);
    if (score >= 6) positive += 1;
    if (score < 0) negative += 1;
  }
  return positive === 0 && negative >= 2;
}

function mapUnsplashPhoto(photo: Record<string, unknown>): GalleryImage | null {
  const urls = photo.urls && typeof photo.urls === "object"
    ? (photo.urls as Record<string, unknown>)
    : {};
  const url = normalizeImageUrl(urls.regular || urls.small);
  if (!url.startsWith("http")) return null;
  const caption = String(photo.alt_description || photo.description || "").trim();
  return {
    url,
    captionKo: caption,
    captionEn: caption,
    source: "unsplash",
  };
}

async function fetchUnsplashImages(searchQuery: string, limit = 10): Promise<GalleryImage[]> {
  const q = String(searchQuery || "").trim();
  if (!q || isHangulQuery(q)) return [];

  const accessKey =
    Deno.env.get("UNSPLASH_ACCESS_KEY") ||
    Deno.env.get("VITE_UNSPLASH_ACCESS_KEY") ||
    "";
  if (!accessKey) return [];

  const response = await fetch(
    `https://api.unsplash.com/search/photos?page=1&query=${encodeURIComponent(q)}&per_page=${Math.min(30, limit + 8)}&order_by=relevant`,
    { headers: { Authorization: `Client-ID ${accessKey}` } },
  );

  if (!response.ok) {
    throw new Error(`Unsplash API ${response.status}`);
  }

  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];
  const images: GalleryImage[] = [];

  for (const photo of results) {
    const mapped = mapUnsplashPhoto(photo as Record<string, unknown>);
    if (!mapped) continue;
    images.push(mapped);
    if (images.length >= limit) break;
  }

  return images;
}

async function fetchWikimediaImages(searchQuery: string, limit = 10): Promise<GalleryImage[]> {
  const q = String(searchQuery || "").trim();
  if (!q) return [];

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: `${q} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: String(Math.min(20, limit + 4)),
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "1280",
  });

  const response = await fetch(`${WIKIMEDIA_API}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Wikimedia API ${response.status}`);
  }

  const data = await response.json();
  const pages = data?.query?.pages;
  if (!pages || typeof pages !== "object") return [];

  const images: GalleryImage[] = [];
  for (const page of Object.values(pages) as Array<Record<string, unknown>>) {
    const info = Array.isArray(page.imageinfo) ? page.imageinfo[0] : null;
    const url = normalizeImageUrl(info?.thumburl || info?.url);
    if (!url.startsWith("http")) continue;
    const title = String(page.title || "").replace(/^File:/, "").replace(/_/g, " ").trim();
    const candidate: GalleryImage = {
      url,
      captionKo: title,
      captionEn: title,
      source: "wikimedia",
    };
    if (isRejectedFiller(candidate)) continue;
    images.push(candidate);
    if (images.length >= limit) break;
  }

  return images;
}

async function fetchWikimediaFromQueries(queries: string[], limit = 10): Promise<GalleryImage[]> {
  const fetched: GalleryImage[] = [];

  for (const query of queries) {
    if (fetched.length >= limit) break;
    if (isHangulQuery(query)) continue;
    try {
      fetched.push(...await fetchWikimediaImages(query, limit - fetched.length));
    } catch (err) {
      console.warn("Wikimedia query failed:", query, err);
    }
  }

  return fetched;
}

function seedCacheMatches(cachedImages: GalleryImage[], seedImages: GalleryImage[]): boolean {
  if (!seedImages.length) return true;
  if (!cachedImages.length || cachedImages.length < seedImages.length) return false;

  const cachedKeys = new Set(
    cachedImages.map((img) => imageKey(normalizeImageUrl(img?.url))).filter(Boolean)
  );

  return seedImages.every((seed) => {
    const seedUrl = normalizeImageUrl(seed?.url);
    if (!seedUrl) return false;
    return cachedKeys.has(imageKey(seedUrl));
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const eventId = String(body.eventId || "").trim();
    const searchQuery = String(body.searchQuery || "").trim();
    const fallbackSearchQuery = String(body.fallbackSearchQuery || "").trim();
    const wikimediaQueries = Array.isArray(body.wikimediaQueries)
      ? body.wikimediaQueries.map((query: unknown) => String(query || "").trim()).filter(Boolean)
      : [];
    const seedImages = Array.isArray(body.seedImages) ? body.seedImages : [];
    const force = Boolean(body.force);

    if (!eventId) {
      throw new Error("eventId is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const normalizedSeed: GalleryImage[] = seedImages
      .map((image: GalleryImage) => ({
        url: normalizeImageUrl(image?.url),
        captionKo: image?.captionKo,
        captionEn: image?.captionEn,
        source: image?.source || "seed",
      }))
      .filter((image: GalleryImage) => image.url.startsWith("http"));

    if (!force) {
      const { data: cached } = await supabaseAdmin
        .from("event_hero_gallery")
        .select("images")
        .eq("event_id", eventId)
        .maybeSingle();

      if (cached && Array.isArray(cached.images) && cached.images.length >= MIN_CACHE_COUNT) {
        const cachedImages = cached.images as GalleryImage[];
        if (seedCacheMatches(cachedImages, normalizedSeed) && !needsAtmosphereRefresh(cachedImages)) {
          const images = mergeImages(normalizedSeed, cachedImages).slice(0, TARGET_COUNT);
          if (
            images.length >= MIN_CACHE_COUNT &&
            images[0]?.url !== cachedImages[0]?.url
          ) {
            void supabaseAdmin
              .from("event_hero_gallery")
              .update({
                images,
                gallery_updated_at: new Date().toISOString(),
              })
              .eq("event_id", eventId);
          }
          return new Response(
            JSON.stringify({ success: true, images, fromCache: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
          );
        }
      }
    }

    const need = Math.max(8, TARGET_COUNT - normalizedSeed.length);
    const fetched: GalleryImage[] = [];
    const unsplashQueries = [searchQuery, fallbackSearchQuery, ...wikimediaQueries]
      .filter((query, index, list) => query && list.indexOf(query) === index);

    for (const query of unsplashQueries) {
      if (fetched.length >= need) break;
      try {
        fetched.push(...await fetchUnsplashImages(query, need - fetched.length));
      } catch (err) {
        console.warn("Unsplash query failed:", query, err);
      }
    }

    if (fetched.length < need) {
      const wikiQueries = [
        ...wikimediaQueries,
        fallbackSearchQuery,
        searchQuery,
      ].filter((query, index, list) => query && list.indexOf(query) === index);

      if (wikiQueries.length) {
        try {
          fetched.push(...await fetchWikimediaFromQueries(wikiQueries, need - fetched.length));
        } catch (err) {
          console.warn("Wikimedia fallback failed:", err);
        }
      }
    }

    const images = mergeImages(normalizedSeed, fetched).slice(0, TARGET_COUNT);

    if (images.length >= MIN_CACHE_COUNT) {
      const { error: dbError } = await supabaseAdmin.from("event_hero_gallery").upsert({
        event_id: eventId,
        images,
        gallery_updated_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error("event_hero_gallery upsert:", dbError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, images, fromCache: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("fetch-event-hero-gallery:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
