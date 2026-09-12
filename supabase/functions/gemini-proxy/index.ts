import "@supabase/functions-js/edge-runtime.d.ts"
import {
  GEMINI_ALLOWED_MODELS,
  GEMINI_FAST,
  GEMINI_QUALITY,
  resolveGeminiModelId,
} from "../_shared/geminiModels.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { modelId = GEMINI_QUALITY, parts } = await req.json()

    if (!parts || !Array.isArray(parts)) {
      throw new Error("Invalid request: 'parts' array is required.");
    }

    let targetModel = resolveGeminiModelId(modelId);

    if (!GEMINI_ALLOWED_MODELS.includes(targetModel)) {
      console.warn(`[Proxy Blocked] Unauthorized model requested: ${targetModel}`);
      throw new Error(`Unauthorized model: ${targetModel} is not allowed.`);
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_GEMINI_API_KEY');

    let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    console.log(`[Proxy] Attempting to call model: ${targetModel}`);

    let response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: parts
        }]
      })
    });

    if (!response.ok && (response.status === 503 || response.status === 404) && targetModel !== GEMINI_FAST) {
      console.warn(`[Proxy Fallback] ${targetModel} failed with ${response.status}. Retrying with ${GEMINI_FAST}...`);

      targetModel = GEMINI_FAST;
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: parts
          }]
        })
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Gemini API Error (${response.status}):`, errorText);
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        modelUsed: targetModel,
        data: data
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    console.error("[Proxy] Unhandled Error:", error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
