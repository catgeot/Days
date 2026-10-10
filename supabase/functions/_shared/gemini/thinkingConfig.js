/**
 * Gemini 3.x `thinkingLevel` and 2.5 `thinkingBudget` 400 if sent together.
 * 3.8-flash and 3.7-flash accept thinkingLevel low|medium|high (not minimal, not thinkingBudget).
 * Thinking tokens are billed as output. Body-text tasks use low.
 * 2.5 ids are alias-rewritten before the API call; the budget branch is defensive only.
 */
export function thinkingConfigForBodyText(model) {
  const id = String(model || "");
  if (/gemini-2\.5(?:-|$)/.test(id)) return { thinkingBudget: 0 };
  if (/gemini-3/.test(id)) return { thinkingLevel: "low" };
  return undefined;
}

/**
 * mooni_chat on flash-lite must not send thinkingConfig.
 * Thinking tokens count against maxOutputTokens and cut the visible answer.
 * 3.8-flash quality turns still use thinkingLevel low.
 */
export function thinkingConfigForMooniChat(model) {
  if (/flash-lite/.test(String(model || ""))) return undefined;
  return thinkingConfigForBodyText(model);
}

export const thinkingConfigForPlaceIntro = thinkingConfigForBodyText;
