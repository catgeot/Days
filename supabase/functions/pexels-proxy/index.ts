import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mapPexelsPhoto(photo: Record<string, unknown>) {
  const src = photo.src && typeof photo.src === "object"
    ? (photo.src as Record<string, unknown>)
    : {};
  return {
    id: `pexels-${photo.id}`,
    source: "pexels",
    urls: {
      regular: src.large,
      small: src.medium,
      full: src.original,
    },
    user: {
      name: photo.photographer || "Pexels Contributor",
    },
    links: {
      html: photo.url,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const query = String(body?.query ?? "").trim();
    const page = Math.max(1, Number(body?.page) || 1);

    if (!query) {
      return jsonResponse({ success: false, error: "query required" }, 400);
    }

    const apiKey =
      Deno.env.get("PEXELS_API_KEY") ||
      Deno.env.get("VITE_PEXELS_API_KEY") ||
      "";

    if (!apiKey) {
      return jsonResponse({ success: false, error: "PEXELS_API_KEY not configured" }, 503);
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30&page=${page}`,
      { headers: { Authorization: apiKey } },
    );

    if (!response.ok) {
      return jsonResponse(
        { success: false, error: `Pexels API ${response.status}` },
        response.status >= 500 ? 502 : response.status,
      );
    }

    const data = await response.json();
    const photos = Array.isArray(data.photos) ? data.photos : [];
    const images = photos.map((photo) => mapPexelsPhoto(photo as Record<string, unknown>));

    return jsonResponse({ success: true, images });
  } catch (error) {
    console.error("[pexels-proxy]", error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "unknown error" },
      500,
    );
  }
});
