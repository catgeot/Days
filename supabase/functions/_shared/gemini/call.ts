import { sanitizeGeminiUserText } from "./answerSanitize.mjs";

export type GeminiCallResult = {
  ok: boolean;
  status: number;
  data: Record<string, unknown> | null;
  errorText: string;
  timedOut: boolean;
};

function geminiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

/** Gemini 3.x `thinkingLevel` 과 2.5 `thinkingBudget` 은 한 요청에 같이 넣으면 400. */
export type GeminiThinkingConfig =
  | { thinkingLevel: "minimal" | "low" | "medium" | "high" }
  | { thinkingBudget: number };

/**
 * place_intro 전용. 3.5-flash 기본 thinking(medium)이 maxOutputTokens를 사고에 써 본문이 잘린다.
 * flash-lite 폴백은 레벨 집합이 달라 설정을 생략한다(한도 2048은 유지).
 */
export function thinkingConfigForPlaceIntro(model: string): GeminiThinkingConfig | undefined {
  if (/gemini-2\.5(?:-|$)/.test(model)) return { thinkingBudget: 0 };
  if (/flash-lite/.test(model)) return undefined;
  if (/gemini-3/.test(model)) return { thinkingLevel: "low" };
  return undefined;
}

/** placeChatIntroLimits SUMMARY_SENTENCE_END_RE 와 동일. 「…있는 수」 같은 중간 절단을 본문 미완으로 본다. */
const PLACE_INTRO_SENTENCE_END_RE = /[.!?。！？…]["'”’」』)\]]*\s*$/;

export function isPlaceIntroTruncated(answer: {
  text: string;
  finishReason: string | null;
}): boolean {
  const reason = String(answer.finishReason ?? "").toUpperCase();
  if (reason.includes("MAX_TOKEN")) return true;
  const text = answer.text.trim();
  if (!text) return true;
  return !PLACE_INTRO_SENTENCE_END_RE.test(text);
}

export async function callGemini(
  fetchImpl: typeof fetch,
  apiKey: string,
  model: string,
  parts: unknown[],
  maxOutputTokens: number,
  timeoutMs = 25_000,
  thinkingConfig?: GeminiThinkingConfig,
): Promise<GeminiCallResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const generationConfig: Record<string, unknown> = { maxOutputTokens, candidateCount: 1 };
  if (thinkingConfig) generationConfig.thinkingConfig = thinkingConfig;
  try {
    const response = await fetchImpl(geminiUrl(model), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig,
      }),
      signal: controller.signal,
    });
    const errorText = response.ok ? "" : (await response.text()).slice(0, 500);
    let data: Record<string, unknown> | null = null;
    if (response.ok) {
      data = await response.json();
    }
    return { ok: response.ok, status: response.status, data, errorText, timedOut: false };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: timedOut ? 503 : 502,
      data: null,
      errorText: timedOut ? "timeout" : "fetch_failed",
      timedOut,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function extractGeminiAnswer(data: Record<string, unknown> | null): {
  text: string;
  finishReason: string | null;
  promptTokens: number;
  outputTokens: number;
  thoughts: number;
} {
  const candidate = (data?.candidates as Array<Record<string, unknown>> | undefined)?.[0];
  const content = candidate?.content as { parts?: Array<{ text?: string; thought?: boolean }> } | undefined;
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  const rawText = parts
    .filter((part) => part && !part.thought && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("");
  const text = sanitizeGeminiUserText(rawText);
  const usage = (data?.usageMetadata ?? {}) as {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  const thoughts = Number(usage.thoughtsTokenCount ?? 0) || 0;
  const candidates = Number(usage.candidatesTokenCount ?? 0) || 0;
  return {
    text,
    finishReason: typeof candidate?.finishReason === "string" ? candidate.finishReason : null,
    promptTokens: Number(usage.promptTokenCount ?? 0) || 0,
    outputTokens: candidates + thoughts,
    thoughts,
  };
}
