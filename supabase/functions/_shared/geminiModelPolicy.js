/** Edge Gemini model SSOT. Client mirror: src/utils/geminiModels.js */
export const GEMINI_FAST = "gemini-3.1-flash-lite";
export const GEMINI_QUALITY = "gemini-3.8-flash";
export const GEMINI_WRITE = "gemini-3.8-flash";
/** WRITE call failure only. Not a client tier. */
export const GEMINI_WRITE_FALLBACK = "gemini-3.7-flash";

export const GEMINI_MODEL_ALIASES = {
  "gemini-2.5-flash": GEMINI_QUALITY,
  "gemini-2.5-pro": GEMINI_WRITE,
  "gemini-3.1-pro": GEMINI_WRITE,
  "gemini-3.1-pro-preview": GEMINI_WRITE,
  "gemini-3.5-flash": GEMINI_QUALITY,
  "gemini-3.1-flash-lite-preview": GEMINI_FAST,
};

function unique(ids) {
  return ids.filter((id, index, all) => all.indexOf(id) === index);
}

export const GEMINI_ALLOWED_MODELS = unique([
  GEMINI_FAST,
  GEMINI_QUALITY,
  GEMINI_WRITE,
  GEMINI_WRITE_FALLBACK,
]);

/** Resolved ids gemini-proxy may call. Old ids are aliased before this check. */
export const GEMINI_PROXY_MODELS = unique([
  GEMINI_FAST,
  GEMINI_QUALITY,
  GEMINI_WRITE,
  GEMINI_WRITE_FALLBACK,
]);

export const GEMINI_WRITE_TRY_ORDER = [GEMINI_WRITE, GEMINI_WRITE_FALLBACK];

export function resolveGeminiModelId(modelId) {
  const raw = String(modelId || GEMINI_QUALITY).trim();
  return GEMINI_MODEL_ALIASES[raw] || raw;
}

export function isGeminiProxyModelAllowed(modelId) {
  return GEMINI_PROXY_MODELS.includes(resolveGeminiModelId(modelId));
}
