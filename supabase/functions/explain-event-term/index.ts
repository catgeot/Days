import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_KO =
  "당신은 GATEO 무니(MOONi) 여행 도우미입니다. 행사·여행 맥락에서 용어를 2~4문장으로 간결히 설명하세요. 실용적이고 사실 위주로 답하세요. 반드시 완전한 문장으로 끝내세요.";
const SYSTEM_EN =
  "You are MOONi, GATEO travel assistant. Explain the term in 2-4 short sentences for event travel context. Be practical and factual. End with complete sentences.";

const MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 2048;

type GeminiPart = { text?: string; thought?: boolean };

function extractGeminiText(candidate: unknown): { text: string; finishReason: string | null } {
  const row = candidate as {
    finishReason?: string;
    content?: { parts?: GeminiPart[] };
  } | null;
  const finishReason = row?.finishReason ? String(row.finishReason) : null;
  const parts = row?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
      .filter((part) => !part?.thought && part?.text)
      .map((part) => part.text ?? "")
      .join("")
      .trim()
    : "";
  return { text, finishReason };
}

function isFinishTruncated(finishReason: string | null): boolean {
  if (!finishReason) return false;
  return finishReason.toUpperCase().includes("MAX_TOKEN");
}

/** Incomplete glossary answers (e.g. mid-word cuts) should not be cached or returned. */
function isLikelyTruncatedGlossaryAnswer(answer: string, locale: "ko" | "en"): boolean {
  const trimmed = String(answer ?? "").trim();
  if (!trimmed) return true;

  if (/[.!?。…]["'」』)]?\s*$/.test(trimmed)) return false;

  const minChars = locale === "en" ? 60 : 80;
  return trimmed.length < minChars;
}

function normalizeLocale(raw: unknown): "ko" | "en" {
  return String(raw ?? "").trim().toLowerCase() === "en" ? "en" : "ko";
}

async function callGemini(
  apiKey: string,
  system: string,
  prompt: string,
  maxOutputTokens = MAX_OUTPUT_TOKENS,
): Promise<{ text: string; finishReason: string | null }> {
  const apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: {
        maxOutputTokens,
        temperature: 0.4,
        thinkingConfig: { thinkingBudget: 0 },
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return extractGeminiText(data.candidates?.[0]);
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

      if (cached?.answer && !isLikelyTruncatedGlossaryAnswer(String(cached.answer), locale)) {
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
    let { text: answer, finishReason } = await callGemini(apiKey, system, prompt);

    if (
      !answer ||
      isFinishTruncated(finishReason) ||
      isLikelyTruncatedGlossaryAnswer(answer, locale)
    ) {
      const retry = await callGemini(apiKey, system, prompt, 4096);
      answer = retry.text;
      finishReason = retry.finishReason;
    }

    if (!answer) {
      throw new Error("empty Gemini response");
    }

    if (isFinishTruncated(finishReason) || isLikelyTruncatedGlossaryAnswer(answer, locale)) {
      throw new Error("truncated Gemini response");
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
