import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveCanonicalPlaceId } from "../_shared/resolveCanonicalPlaceId.ts";
import { parseGeminiJsonText } from "../_shared/parseGeminiJson.ts";

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

function buildMagazinePrompt(locationName: string) {
  // wiki.py generate_wiki_data_batch 프롬프트 유지 (배치 1개 = 현재 여행지)
  return `
    당신은 세계적인 하이엔드 여행 매거진 'Conde Nast Traveler'의 수석 에디터이자, 10년 이상 현지에서 머물며 로컬의 일상과 숨겨진 서사를 탐구해온 여행 에세이스트입니다.
    아래 장소들에 대해 독자가 글을 읽는 순간 당장 비행기 표를 끊고 싶게 만드는, 압도적인 몰입감과 깊이를 가진 '피처(Feature) 기사'를 작성하세요.
    단순한 정보 나열을 절대 금지하며, 한 권의 문학적인 여행 수필처럼 길고 유려한 호흡으로 서술해야 합니다.
    결과는 반드시 하나의 JSON 배열로 반환해야 합니다.

    [대상 여행지]
    ${locationName}

    [절대 엄수: 작성 가이드라인 및 제약사항]
    1. 압도적인 분량과 리듬감 (Volume & Rhythm): 가벼운 요약이 아닌 깊이 있는 서사를 작성하세요. 단, 글이 지루하지 않도록 시선을 끄는 짧은 문장(단문)과 깊이 있는 묘사의 긴 문장(장문)을 교차로 사용해 글의 리듬감을 만드세요. 모바일 가독성을 위해 최대 2~3문장마다 반드시 이중 줄바꿈(\\n\\n)을 삽입하세요.
    2. 5감(Senses) 자극 묘사: '아름답다', '멋지다' 같은 상투적인 표현을 철저히 배제하세요. 독자가 그곳의 공기 냄새, 파도 소리, 오래된 골목의 질감, 햇살의 온도를 직접 느낄 수 있도록 문학적이고 감각적인 은유를 적극 사용하세요.
    3. 비관적 정보 검증 (Pessimistic First): 특정 식당, 카페, 숙소의 '상호명'은 폐업할 수 있으므로 절대 적지 마세요. 대신 '특정 거리(Street)'의 분위기나 '반드시 먹어봐야 할 현지 음식의 종류'를 깊이 있게 묘사하세요.
    4. 섬세한 여백 (줄바꿈 강제): 문단과 문단 사이, 소제목과 본문 사이에는 반드시 명시적인 이중 줄바꿈(\\n\\n)을 삽입하여 긴 글임에도 모바일에서 텍스트가 숨을 쉴 수 있게 하세요.
    5. 지명 사용의 미학: place_id로 제공된 장소 이름을 본문 전체에 걸쳐 최소 3~5회 이상 자연스럽게 녹여내세요. 독자가 자신이 어디에 있는지 명확히 인지할 수 있도록, 기계적인 반복이 아닌 문장의 흐름 속에 유려하게 배치하세요. (단, 영문 병기는 여전히 금지합니다.)
    6. 시각적 닻 (Visual Anchor): 새로운 핵심 문단이 시작될 때, 문장 첫머리에 [ 에디터의 시선 ], [ 미각의 기억 ] 처럼 대괄호를 활용한 짧고 감각적인 키워드를 달아 독자의 시선이 머물게 하세요. (주의: 글머리 기호(•)나 숫자 넘버링은 딱딱해 보이므로 절대 사용하지 마세요.)
    7. 다채로운 어미와 어조 (Tone of Voice & Ending): 에디터가 독자에게 이야기하듯 세련되고 정중한 경어체를 사용하되, 문장의 끝맺음을 다양하게 변주하세요. '~합니다', '~해요' 뿐만 아니라, 때로는 명사로 끝내어 여운을 남기거나('~하는 법.', '~풍경.'), 가벼운 감탄형, 의문형을 섞어 글이 딱딱하게 끊어지지 않고 물 흐르듯 이어지게 하세요. 절대 '~한다', '~이다'와 같은 반말/문어체는 사용하지 마세요.
    8. 지명의 배치 전략: 특히 'summary(에디터의 프롤로그)'와 'sections' 중 '[ 에디터의 시선 ]' 혹은 '[ 시간의 흔적 ]' 부분에서는 반드시 해당 장소의 이름을 직접 언급하여 서사의 주인공이 누구인지 명확히 하세요.

    [JSON 구조 및 7단계 심층 기사 요구사항]
    [
      {
        "place_id": "${locationName}",
        "summary": "단순 요약이 아닌 '에디터의 프롤로그(Prologue)'. 왜 지금 이 장소로 떠나야 하는가에 대한 철학적인 질문과 감상을 다채로운 호흡으로 서술하세요 (이모지 2~3개 포함).",
        "sections": [
          {
            "title": "📜 장소의 숨겨진 서사",
            "content": "[ 시간의 흔적 ]\\n이 도시가 지금의 분위기를 갖게 된 흥미로운 배경 이야기. 시간의 흐름을 느낄 수 있게 서술.\\n\\n[ 에디터의 시선 ]\\n(서사 포인트 1에 대한 깊이 있는 설명, 앞 단락과 자연스럽게 이어지도록)\\n\\n[ 잊혀진 기록 ]\\n(서사 포인트 2에 대한 깊이 있는 설명)"
          },
          {
            "title": "🗺️ 시크릿 스팟 & 로컬 루트",
            "content": "[ 숨겨진 골목 ]\\n대부분의 여행자가 랜드마크에 머물 때, 발길이 잘 닿지 않는 한적한 명소 추천. 직접 걸어보는 듯한 시각적 묘사 필수.\\n\\n[ 로컬의 발자취 ]\\n그곳에서만 느낄 수 있는 고요함과 생명력에 대한 서술."
          },
          {
            "title": "🍽️ 미식과 로컬 다이닝",
            "content": "[ 미각의 기억 ]\\n반드시 맛봐야 할 로컬 식재료, 현지인들의 식사 문화. 혀끝에 맴도는 맛과 골목의 음식 냄새를 상상할 수 있는 미각적 묘사 (상호명 절대 금지).\\n\\n[ 로컬 다이닝 팁 ]\\n시장 분위기나 식사 시간대 등 현지식 바이브에 대한 묘사."
          },
          {
            "title": "🛏️ 스테이 & 지역 분위기",
            "content": "[ 창밖의 풍경 ]\\n숙소 위치 선정 팁. 창밖으로 보이는 풍경과 동네의 백그라운드 노이즈(소음, 새소리 등)까지 묘사하여 각 지구의 매력을 대조적으로 서술.\\n\\n[ 머무름의 미학 ]\\n어떤 분위기의 고독이나 활기를 선택해야 할지에 대한 조언."
          },
          {
            "title": "🚌 실전 이동망",
            "content": "[ 길 위의 풍경 ]\\n공항에서 시내 가는 효율적인 방법, 현지 최적의 교통수단.\\n\\n[ 여행자의 발걸음 ]\\n창밖으로 스쳐 지나가는 풍경 등 이동하는 과정 자체가 여행이 되는 팁 제공."
          },
          {
            "title": "⚠️ 로컬 매너 & 치안",
            "content": "[ 현지인의 귀띔 ]\\n여행자가 흔히 하는 실수, 금기사항, 소매치기 주의 구역 등 실존하는 위험 정보.\\n\\n[ 안전한 여정 ]\\n현지 가이드가 조용히 귀띔해주듯 진지하고 상세하게 서술."
          },
          {
            "title": "🗓️ 완벽한 타이밍",
            "content": "[ 계절의 호흡 ]\\n여행하기 가장 눈부신 시기, 피해야 할 우기, 또는 특별한 로컬 축제 정보.\\n\\n[ 여행의 온도 ]\\n계절의 온습도와 바람의 변화가 장소에 미치는 마법 같은 영향 묘사."
          }
        ]
      }
    ]
    
    부가 설명 없이 순수 JSON 배열만 출력하세요.
    content 필드의 줄바꿈은 실제 Enter가 아니라 JSON 문자열 안의 \\n\\n 이스케이프로만 넣으세요.
    `;
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

const JSON_STABILITY_APPENDIX = `

[JSON 출력 안정화 — 이번 요청만 적용]
- 부가 설명 없이 순수 JSON 배열만 출력하세요.
- content 안의 줄바꿈은 실제 Enter가 아니라 반드시 이스케이프된 \\n\\n 문자열로 넣으세요.
- 각 sections[].content는 800~1400자 내외로 유지해 JSON이 중간에 잘리지 않게 하세요.
- 7개 섹션 제목·가이드라인·톤은 그대로 유지하세요.
`;

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
    const { placeId, locationName, slug, canonicalPlaceId, forceUpdate = false } = reqBody;

    if (!placeId || !locationName) {
      throw new Error("placeId and locationName are required");
    }

    const canonicalId = resolveCanonicalPlaceId({
      slug,
      placeId,
      locationName,
      canonicalPlaceId,
    });
    requestedPlaceId = canonicalId;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: existingData } = await supabaseAdmin
      .from("place_wiki")
      .select("place_id, summary, sections")
      .eq("place_id", String(canonicalId))
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
        place_id: String(canonicalId),
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

    const basePrompt = buildMagazinePrompt(String(locationName));
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
        `${basePrompt}${JSON_STABILITY_APPENDIX}`,
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
        place_id: String(canonicalId),
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
        placeId: canonicalId,
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
