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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const eventId = String(body.eventId || "").trim();
    const searchQuery = String(body.searchQuery || "").trim();
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

    const fetched = searchQuery
      ? await fetchWikimediaImages(searchQuery, Math.max(8, TARGET_COUNT - normalizedSeed.length))
      : [];

    const images = mergeImages(normalizedSeed, fetched).slice(0, TARGET_COUNT);

    if (images.length > 0) {
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
