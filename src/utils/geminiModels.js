/**
 * gateo.kr Gemini 모델 SSOT (Gemini API, Vertex 아님).
 * WRITE·QUALITY: gemini-3.8-flash. WRITE 실패 시 Edge만 gemini-3.7-flash.
 * FAST: gemini-3.1-flash-lite.
 * 3.8/3.7 thinking 필드는 thinkingLevel (low|medium|high). thinkingBudget·minimal 아님.
 * 2.5 시리즈는 호출하지 않는다. 옛 id는 alias로 3.8에 붙인다.
 * Edge 미러: supabase/functions/_shared/geminiModelPolicy.js
 */
export const GEMINI_MODELS = {
  FAST: 'gemini-3.1-flash-lite',
  QUALITY: 'gemini-3.8-flash',
  WRITE: 'gemini-3.8-flash',
};

export const GEMINI_MODEL_ALIASES = {
  'gemini-2.5-flash': GEMINI_MODELS.QUALITY,
  'gemini-2.5-pro': GEMINI_MODELS.WRITE,
  'gemini-3.1-pro': GEMINI_MODELS.WRITE,
  'gemini-3.1-pro-preview': GEMINI_MODELS.WRITE,
  'gemini-3.5-flash': GEMINI_MODELS.QUALITY,
  'gemini-3.1-flash-lite-preview': GEMINI_MODELS.FAST,
};

export const GEMINI_ALLOWED_MODELS = [
  GEMINI_MODELS.FAST,
  GEMINI_MODELS.QUALITY,
  GEMINI_MODELS.WRITE,
].filter((id, index, all) => all.indexOf(id) === index);

export function resolveGeminiModelId(modelId) {
  const raw = String(modelId || GEMINI_MODELS.QUALITY).trim();
  return GEMINI_MODEL_ALIASES[raw] || raw;
}
