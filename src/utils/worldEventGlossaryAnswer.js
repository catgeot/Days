/**
 * Incomplete glossary answers (mid-word / no sentence end) — often bad Gemini cache.
 * @param {string} answer
 * @param {'ko' | 'en'} [locale]
 */
export function isLikelyTruncatedGlossaryAnswer(answer, locale = 'ko') {
  const trimmed = String(answer ?? '').trim();
  if (!trimmed) return true;
  if (/[.!?。…]["'」』)]?\s*$/.test(trimmed)) return false;
  const minChars = locale === 'en' ? 60 : 80;
  return trimmed.length < minChars;
}
