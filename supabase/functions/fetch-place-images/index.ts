// @deno-types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: any) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log(`[DEBUG] Received query: ${query}`);

    if (!query) {
      console.error("[DEBUG] Error: Query is required");
      return new Response(JSON.stringify({ error: "Query is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    const GOOGLE_CX = Deno.env.get("GOOGLE_CX");

    console.log(`[DEBUG] GOOGLE_API_KEY loaded: ${!!GOOGLE_API_KEY}`);
    console.log(`[DEBUG] GOOGLE_CX loaded: ${!!GOOGLE_CX}`);

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      console.error("[DEBUG] Error: Missing Google API credentials");
      throw new Error("Missing Google API credentials in environment variables.");
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(
      query
    )}&searchType=image&num=10`;
    
    console.log(`[DEBUG] Fetching URL: ${url.replace(GOOGLE_API_KEY, "REDACTED")}`);

    const response = await fetch(url);
    console.log(`[DEBUG] Google API response status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();

    if (!response.ok) {
      console.error("[DEBUG] Google API Error Response:", JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || "Failed to fetch images from Google");
    }
    
    const formattedImages = data.items
      ? data.items.map((item: any, index: number) => ({
          id: `google-fallback-${Date.now()}-${index}`,
          urls: {
            regular: item.link,
            small: item.image?.thumbnailLink || item.link,
            full: item.link,
          },
          user: {
            name: item.displayLink || "Google Image Search",
          },
          links: {
            html: item.image?.contextLink || item.link,
          },
        }))
      : [];

    console.log(`[DEBUG] Found and formatted ${formattedImages.length} images.`);

    return new Response(JSON.stringify({ images: formattedImages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[DEBUG] Final catch block error:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
