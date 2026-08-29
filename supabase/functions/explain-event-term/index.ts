import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_KO =
  "당신은 GATEO 무니(MOONi) 여행 도우미입니다. 행사·여행 맥락에서 용어를 2~4문장으로 간결히 설명하세요. 실용적이고 사실 위주로 답하세요.";
const SYSTEM_EN =
  "You are MOONi, GATEO travel assistant. Explain the term in 2-4 short sentences for event travel context. Be practical and factual.";

const MODEL = "gemini-2.5-flash";

function normalizeLocale(raw: unknown): "ko" | "en" {
  return String(raw ?? "").trim().toLowerCase() === "en" ? "en" : "ko";
}

async function callGemini(apiKey: string, system: string, prompt: string): Promise<string> {
  const apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.4,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return String(text).trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const eventId = String(body.eventId || "").trim();
    const termId = String(body.termId || "").trim();
    const prompt = String(body.prompt || "").trim();
    const locale = normalizeLocale(body.locale);
    const force = Boolean(body.force);

    if (!eventId || !termId || !prompt) {
      throw new Error("eventId, termId, and prompt are required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (!force) {
      const { data: cached } = await supabaseAdmin
        .from("event_term_glossary_cache")
        .select("answer, model")
        .eq("event_id", eventId)
        .eq("term_id", termId)
        .eq("locale", locale)
        .maybeSingle();

      if (cached?.answer) {
        return new Response(
          JSON.stringify({
            success: true,
            answer: cached.answer,
            model: cached.model,
            fromCache: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("VITE_GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const system = locale === "en" ? SYSTEM_EN : SYSTEM_KO;
    const answer = await callGemini(apiKey, system, prompt);
    if (!answer) {
      throw new Error("empty Gemini response");
    }

    const { error: dbError } = await supabaseAdmin.from("event_term_glossary_cache").upsert({
      event_id: eventId,
      term_id: termId,
      locale,
      answer,
      model: MODEL,
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("event_term_glossary_cache upsert:", dbError);
    }

    return new Response(
      JSON.stringify({ success: true, answer, model: MODEL, fromCache: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("explain-event-term:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
