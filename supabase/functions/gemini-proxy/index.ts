import "@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { modelId = "gemini-2.5-flash", parts } = await req.json()

    if (!parts || !Array.isArray(parts)) {
      throw new Error("Invalid request: 'parts' array is required.");
    }

    // 환경 변수에서 API 키 가져오기 (우선순위: GEMINI_API_KEY -> VITE_GEMINI_API_KEY)
    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error("API key not configured on the server.");
    }

    // 1차 시도 (요청된 모델)
    let targetModel = modelId;
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

    // 🚨 503 에러 또는 404 에러 발생 시 자동 Fallback 로직
    if (!response.ok && (response.status === 503 || response.status === 404) && targetModel !== "gemini-3.1-flash-lite-preview") {
      console.warn(`[Proxy Fallback] ${targetModel} failed with ${response.status}. Retrying with gemini-3.1-flash-lite-preview...`);

      targetModel = "gemini-3.1-flash-lite-preview";
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
