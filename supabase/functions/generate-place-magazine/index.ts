import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveCanonicalPlaceId } from "../_shared/resolveCanonicalPlaceId.ts";
import { parseGeminiJsonText } from "../_shared/parseGeminiJson.ts";
import {
  buildMagazineJsonStabilityAppendix,
  buildMagazinePrompt,
  magazineStorageId,
} from "../_shared/magazinePrompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODELS_TO_TRY = ["gemini-3.1-pro-preview", "gemini-2.5-pro"];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

type MagazineSection = { title?: string; content?: string };
type MagazineItem = {
  place_id?: string;
  summary?: string;
  sections?: MagazineSection[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isMagazineComplete(row: { summary?: unknown; sections?: unknown } | null | undefined) {
  const summary = row?.summary;
  const sections = row?.sections;
  const summaryOk = Boolean(summary && String(summary).trim() && String(summary).trim() !== "[[LOADING]]");
  const sectionsOk = Array.isArray(sections) && sections.length > 0;
  return summaryOk && sectionsOk;
}

function normalizeMagazineItem(parsed: unknown, locationName: string): MagazineItem | null {
  let item: unknown = parsed;
  if (Array.isArray(parsed)) {
    item = parsed[0];
  } else if (parsed && typeof parsed === "object" && Array.isArray((parsed as { results?: unknown }).results)) {
    item = (parsed as { results: unknown[] }).results[0];
  }

  if (!item || typeof item !== "object") return null;

  const row = item as MagazineItem;
  const summary = String(row.summary ?? "").trim();
  const sections = (Array.isArray(row.sections) ? row.sections : [])
    .map((sec) => ({
      title: String(sec?.title ?? "").trim(),
      content: String(sec?.content ?? "").trim(),
    }))
    .filter((sec) => sec.title || sec.content);

  if (!summary || sections.length === 0) return null;

  return {
    place_id: locationName,
    summary,
    sections,
  };
}

type GeminiCallResult = {
  text: string;
  finishReason: string | null;
  model: string;
};

async function callGeminiMagazine(
  apiKey: string,
  prompt: string,
  models: string[] = MODELS_TO_TRY,
): Promise<GeminiCallResult> {
  let lastError = "";

  for (const model of models) {
    const apiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`[generate-place-magazine] model=${model} attempt=${attempt + 1}/${MAX_RETRIES}`);
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generationConfig: {
              responseMimeType: "application/json",
              // 7섹션 장문 피처 — 잘림 방지 (2.5 Pro 상한 65536)
              maxOutputTokens: 65536,
              temperature: 0.7,
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `${response.status}: ${errText}`;
          const retryable =
            response.status === 429 ||
            response.status === 503 ||
            errText.includes("RESOURCE_EXHAUSTED") ||
            errText.includes("quota") ||
            errText.includes("UNAVAILABLE");
          if (retryable && attempt < MAX_RETRIES - 1) {
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          // 모델 폴백
          break;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const finishReason = candidate?.finishReason ?? data.promptFeedback?.blockReason ?? null;
        const parts = candidate?.content?.parts;
        // thought 파트 제외 — 본문 text만 합침
        const text = Array.isArray(parts)
          ? parts
            .filter((p: { thought?: boolean; text?: string }) => !p?.thought && p?.text)
            .map((p: { text?: string }) => p?.text ?? "")
            .join("")
          : candidate?.content?.parts?.[0]?.text;

        if (!text?.trim()) {
          lastError = `Empty Gemini response (finishReason=${finishReason})`;
          console.error("[generate-place-magazine] empty content", {
            model,
            finishReason,
            promptFeedback: data.promptFeedback ?? null,
          });
          if (attempt < MAX_RETRIES - 1) {
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          break;
        }

        return { text, finishReason: finishReason ? String(finishReason) : null, model };
      } catch (e) {
        lastError = (e as Error).message;
        console.error(`[generate-place-magazine] fetch error:`, lastError);
        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
      }
    }
  }

  throw new Error(`Gemini 매거진 생성 실패: ${lastError}`);
}

function parseMagazineFromGemini(
  generatedText: string,
  locationName: string,
  meta: { model?: string; finishReason?: string | null } = {},
): MagazineItem {
  let parsed: unknown;
  try {
    parsed = parseGeminiJsonText(generatedText);
  } catch (e) {
    console.error("[generate-place-magazine] JSON parse failed", {
      model: meta.model,
      finishReason: meta.finishReason,
      preview: String(generatedText).slice(0, 800),
      tail: String(generatedText).slice(-400),
      message: (e as Error).message,
    });
    const truncated = meta.finishReason && String(meta.finishReason).toUpperCase().includes("MAX_TOKEN");
    throw new Error(
      truncated
        ? "Gemini JSON truncated (MAX_TOKENS) — 다시 생성해 주세요"
        : "Gemini did not return valid JSON",
    );
  }

  const magazine = normalizeMagazineItem(parsed, locationName);
  if (!magazine) {
    throw new Error("Gemini did not return a valid magazine object");
  }
  return magazine;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let requestedPlaceId: string | null = null;
  let previousSummary: string | null = null;
  let previousSections: MagazineSection[] | null = null;

  try {
    const reqBody = await req.json();
    const { placeId, locationName, slug, canonicalPlaceId, forceUpdate = false, locale = "ko" } = reqBody;

    if (!placeId || !locationName) {
      throw new Error("placeId and locationName are required");
    }

    const canonicalId = resolveCanonicalPlaceId({
      slug,
      placeId,
      locationName,
      canonicalPlaceId,
    });
    const storageId = magazineStorageId(String(canonicalId), locale === "en" ? "en" : "ko");
    requestedPlaceId = storageId;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: existingData } = await supabaseAdmin
      .from("place_wiki")
      .select("place_id, summary, sections")
      .eq("place_id", String(storageId))
      .maybeSingle();

    previousSummary =
      existingData?.summary && existingData.summary !== "[[LOADING]]"
        ? String(existingData.summary)
        : null;
    previousSections = Array.isArray(existingData?.sections) ? existingData.sections : null;

    if (!forceUpdate && isMagazineComplete(existingData)) {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyExists: true,
          summary: existingData?.summary,
          sections: existingData?.sections,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 생성 중 표시 — 창을 닫아도 폴링으로 완료 감지
    const { error: loadingError } = await supabaseAdmin.from("place_wiki").upsert(
      {
        place_id: String(storageId),
        summary: "[[LOADING]]",
        sections: [],
      },
      { onConflict: "place_id" },
    );
    if (loadingError) {
      throw new Error(`Failed to mark magazine loading: ${loadingError.message}`);
    }

    const geminiApiKey = Deno.env.get("VITE_GEMINI_API_KEY") || Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured on server");
    }

    const basePrompt = buildMagazinePrompt(String(locationName), locale);
    let magazine: MagazineItem | null = null;

    const firstCall = await callGeminiMagazine(geminiApiKey, basePrompt);
    console.log("[generate-place-magazine] gemini ok", {
      pass: 1,
      model: firstCall.model,
      finishReason: firstCall.finishReason,
      chars: firstCall.text.length,
    });

    try {
      magazine = parseMagazineFromGemini(firstCall.text, String(locationName), {
        model: firstCall.model,
        finishReason: firstCall.finishReason,
      });
    } catch (parseErr) {
      // 장문 JSON 잘림·이스케이프 실패 시: 2.5 Pro + 안정화 appendix로 1회만 재시도 (타임아웃 방어)
      console.warn("[generate-place-magazine] retry with JSON stability appendix", {
        error: (parseErr as Error).message,
        finishReason: firstCall.finishReason,
      });
      await sleep(2000);
      const retryCall = await callGeminiMagazine(
        geminiApiKey,
        `${basePrompt}${buildMagazineJsonStabilityAppendix(locale)}`,
        ["gemini-2.5-pro"],
      );
      console.log("[generate-place-magazine] gemini ok", {
        pass: 2,
        model: retryCall.model,
        finishReason: retryCall.finishReason,
        chars: retryCall.text.length,
      });
      magazine = parseMagazineFromGemini(retryCall.text, String(locationName), {
        model: retryCall.model,
        finishReason: retryCall.finishReason,
      });
    }

    const mapsQuery = String(locationName).replace(/\s+/g, "+");
    const sourceUrl = `https://google.com/maps/search/?api=1&query=${mapsQuery}`;

    const { error: dbError } = await supabaseAdmin.from("place_wiki").upsert(
      {
        place_id: String(storageId),
        summary: magazine.summary,
        sections: magazine.sections,
        source_url: sourceUrl,
      },
      { onConflict: "place_id" },
    );

    if (dbError) {
      throw new Error(`Failed to upsert place_wiki magazine: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        placeId: storageId,
        summary: magazine.summary,
        sections: magazine.sections,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const errObj = error as Error;
    console.error("[generate-place-magazine] Error:", errObj.message);

    if (requestedPlaceId) {
      try {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );
        await supabaseAdmin
          .from("place_wiki")
          .update({
            summary: previousSummary,
            sections: previousSections ?? [],
          })
          .eq("place_id", String(requestedPlaceId))
          .eq("summary", "[[LOADING]]");
      } catch (restoreErr) {
        console.error("[generate-place-magazine] Failed to restore DB state:", restoreErr);
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: errObj.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }
});
