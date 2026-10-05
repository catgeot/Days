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

export async function callGemini(
  fetchImpl: typeof fetch,
  apiKey: string,
  model: string,
  parts: unknown[],
  maxOutputTokens: number,
  timeoutMs = 25_000,
): Promise<GeminiCallResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(geminiUrl(model), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { maxOutputTokens, candidateCount: 1 },
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
  const text = parts
    .filter((part) => part && !part.thought && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("");
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
