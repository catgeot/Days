export const GEMINI_FAST = "gemini-3.1-flash-lite";
export const GEMINI_QUALITY = "gemini-3.5-flash";
export const GEMINI_WRITE = "gemini-3.1-pro-preview";

export const GEMINI_MODEL_ALIASES: Record<string, string> = {
  "gemini-2.5-flash": GEMINI_QUALITY,
  "gemini-2.5-pro": GEMINI_WRITE,
  "gemini-3.1-pro": GEMINI_WRITE,
  "gemini-3.1-flash-lite-preview": GEMINI_FAST,
};

export const GEMINI_ALLOWED_MODELS = [
  GEMINI_FAST,
  GEMINI_QUALITY,
  GEMINI_WRITE,
];

export function resolveGeminiModelId(modelId?: string | null): string {
  const raw = String(modelId || GEMINI_QUALITY).trim();
  return GEMINI_MODEL_ALIASES[raw] || raw;
}
