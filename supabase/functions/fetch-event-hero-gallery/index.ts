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

function mergeImages(seed: GalleryImage[], fetched: GalleryImage[]): GalleryImage[] {
  const seen = new Set<string>();
  const merged: GalleryImage[] = [];

  for (const image of [...seed, ...fetched]) {
    const url = normalizeImageUrl(image?.url);
    if (!url.startsWith("http")) continue;
    const key = imageKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ ...image, url });
  }

  return merged;
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
  if (!q) return [];

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
    gsrsearch: q,
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
    images.push({
      url,
      captionKo: title,
      captionEn: title,
      source: "wikimedia",
    });
    if (images.length >= limit) break;
  }

  return images;
}

async function fetchWikimediaFromQueries(queries: string[], limit = 10): Promise<GalleryImage[]> {
  const fetched: GalleryImage[] = [];

  for (const query of queries) {
    if (fetched.length >= limit) break;
    try {
      fetched.push(...await fetchWikimediaImages(query, limit - fetched.length));
    } catch (err) {
      console.warn("Wikimedia query failed:", query, err);
    }
  }

  return fetched;
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

    if (!force) {
      const { data: cached } = await supabaseAdmin
        .from("event_hero_gallery")
        .select("images")
        .eq("event_id", eventId)
        .maybeSingle();

      if (cached && Array.isArray(cached.images) && cached.images.length >= MIN_CACHE_COUNT) {
        return new Response(
          JSON.stringify({ success: true, images: cached.images, fromCache: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
    }

    const normalizedSeed: GalleryImage[] = seedImages
      .map((image: GalleryImage) => ({
        url: normalizeImageUrl(image?.url),
        captionKo: image?.captionKo,
        captionEn: image?.captionEn,
        source: image?.source || "seed",
      }))
      .filter((image: GalleryImage) => image.url.startsWith("http"));

    const need = Math.max(8, TARGET_COUNT - normalizedSeed.length);
    const fetched: GalleryImage[] = [];

    if (searchQuery) {
      try {
        fetched.push(...await fetchUnsplashImages(searchQuery, need));
      } catch (err) {
        console.warn("Unsplash primary failed:", err);
      }
    }

    if (fetched.length < need && fallbackSearchQuery && fallbackSearchQuery !== searchQuery) {
      try {
        fetched.push(...await fetchUnsplashImages(fallbackSearchQuery, need - fetched.length));
      } catch (err) {
        console.warn("Unsplash fallback failed:", err);
      }
    }

    if (fetched.length < need) {
      const wikiQueries = [
        ...wikimediaQueries,
        fallbackSearchQuery,
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
