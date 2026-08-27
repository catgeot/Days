import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseGeminiJsonText } from "../_shared/parseGeminiJson.ts";
import { buildEventTravelGuidePrompt } from "../_shared/eventTravelGuidePrompts.ts";
import {
  buildEventTravelGuideFactsFromBody,
  normalizeEventTravelGuide,
  type EventTravelGuideFacts,
} from "../_shared/eventTravelGuideSchema.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODELS_TO_TRY = ["gemini-2.5-pro", "gemini-2.5-flash"];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 4000;

function normalizeLocale(raw: unknown): "ko" | "en" {
  return String(raw ?? "").trim().toLowerCase() === "en" ? "en" : "ko";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(apiKey: string, prompt: string): Promise<{ text: string; model: string }> {
  let lastError = "";

  for (const model of MODELS_TO_TRY) {
    const apiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: 8192,
              temperature: 0.5,
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `${response.status}: ${errText}`;
          const retryable = response.status === 429 || response.status === 503;
          if (retryable && attempt < MAX_RETRIES - 1) {
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          break;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (!text.trim()) {
          lastError = "empty Gemini response";
          break;
        }
        return { text, model };
      } catch (err) {
        lastError = String(err);
        if (attempt < MAX_RETRIES - 1) await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw new Error(`Gemini failed: ${lastError}`);
}

function buildPrompt(facts: EventTravelGuideFacts, locale: "ko" | "en") {
  const { systemPrompt, userPrompt } = buildEventTravelGuidePrompt(facts, locale);
  return `${systemPrompt}\n\n${userPrompt}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const locale = normalizeLocale(body?.locale);
    const force = Boolean(body?.force);

    let facts: EventTravelGuideFacts;
    if (body?.facts && typeof body.facts === "object") {
      facts = buildEventTravelGuideFactsFromBody(body.facts as Record<string, unknown>);
    } else if (body?.event && typeof body.event === "object") {
      facts = buildEventTravelGuideFactsFromBody(body.event as Record<string, unknown>);
    } else {
      throw new Error("facts or event object required");
    }

    const eventId = facts.event_id;
    if (!eventId) throw new Error("event_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Supabase service configuration missing");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    if (!force) {
      const { data: existing } = await supabase
        .from("event_travel_guide")
        .select("guide, schema_version, model, guide_updated_at")
        .eq("event_id", eventId)
        .maybeSingle();

      if (existing?.guide && typeof existing.guide === "object") {
        try {
          const guide = normalizeEventTravelGuide(existing.guide);
          if (guide.event_id === eventId) {
            return new Response(
              JSON.stringify({
                success: true,
                cached: true,
                event_id: eventId,
                guide,
                model: existing.model,
                guide_updated_at: existing.guide_updated_at,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
        } catch {
          // stale/invalid cache — regenerate
        }
      }
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const prompt = buildPrompt(facts, locale);
    const { text, model } = await callGemini(geminiKey, prompt);
    const parsed = parseGeminiJsonText(text);
    const guide = normalizeEventTravelGuide(parsed);

    if (guide.event_id !== eventId) {
      throw new Error(`model returned wrong event_id: ${guide.event_id}`);
    }

    const { error: upsertError } = await supabase.from("event_travel_guide").upsert(
      {
        event_id: eventId,
        guide,
        schema_version: guide.schema_version,
        model,
        guide_updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id" },
    );

    if (upsertError) {
      throw new Error(`DB upsert failed: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        event_id: eventId,
        guide,
        model,
        facts_used: facts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[update-event-travel-guide]", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
