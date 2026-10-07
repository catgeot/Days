const FERRY_PREFIX_RE = /^(?:페리|Ferry)\s*·\s*/i;

/**
 * @param {string} operatorName
 * @param {'ko' | 'en' | string} [locale]
 */
export function formatFerryOperatorChatLabel(operatorName, locale = 'ko') {
  const name = String(operatorName ?? '').trim();
  if (!name) return name;
  if (FERRY_PREFIX_RE.test(name)) return name;
  const lng = String(locale ?? 'ko').slice(0, 2);
  return lng === 'en' ? `Ferry · ${name}` : `페리 · ${name}`;
}
