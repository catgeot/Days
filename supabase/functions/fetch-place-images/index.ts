import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    const GOOGLE_CX = Deno.env.get("GOOGLE_CX");

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      throw new Error("Missing Google API credentials in environment variables.");
    }

    // Google Custom Search API - Image Search with Creative Commons filter
    // rights=cc_publicdomain,cc_attribute,cc_sharealike (Creative Commons)
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&searchType=image&num=10&rights=cc_publicdomain,cc_attribute,cc_sharealike`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("Google API Error:", data);
      throw new Error(data.error?.message || "Failed to fetch images from Google");
    }

    // 결과를 기존 Unsplash 포맷에 맞춰서 변환 (프론트엔드 호환성 유지)
    const formattedImages = data.items ? data.items.map((item: any, index: number) => ({
      id: `google-fallback-${Date.now()}-${index}`,
      urls: {
        regular: item.link,
        small: item.image?.thumbnailLink || item.link,
        full: item.link
      },
      user: { 
        name: item.displayLink || 'Google Image Search'
      },
      links: { 
        html: item.image?.contextLink || item.link 
      }
    })) : [];

    return new Response(JSON.stringify({ images: formattedImages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});