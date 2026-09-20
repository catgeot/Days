/**
 * gateo.kr Gemini 모델 SSOT (Gemini API, Vertex 아님).
 * 2.5 Flash/Pro: Vertex 퇴직 2026-10-20 · Gemini API 일자는 2026-08 철회.
 * 2.5-flash-image(미사용) 종료 2026-10-02.
 * Edge 미러: supabase/functions/_shared/geminiModels.ts
 */
export const GEMINI_MODELS = {
  FAST: 'gemini-3.1-flash-lite',
  QUALITY: 'gemini-3.5-flash',
  WRITE: 'gemini-3.1-pro-preview',
};

export const GEMINI_MODEL_ALIASES = {
  'gemini-2.5-flash': GEMINI_MODELS.QUALITY,
  'gemini-2.5-pro': GEMINI_MODELS.WRITE,
  'gemini-3.1-pro': GEMINI_MODELS.WRITE,
  'gemini-3.1-flash-lite-preview': GEMINI_MODELS.FAST,
};

export const GEMINI_ALLOWED_MODELS = [
  GEMINI_MODELS.FAST,
  GEMINI_MODELS.QUALITY,
  GEMINI_MODELS.WRITE,
];

export function resolveGeminiModelId(modelId) {
  const raw = String(modelId || GEMINI_MODELS.QUALITY).trim();
  return GEMINI_MODEL_ALIASES[raw] || raw;
}
