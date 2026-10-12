/**
 * Festival list / promo card title — EN: English (한글) when titleEn exists (#416).
 * @param {Record<string, unknown> | null | undefined} item
 * @param {string} [locale]
 */
export function festivalListDisplayTitle(item, locale = 'ko') {
  const ko = String(item?.title || '').trim();
  if (!ko) return '';
  if (!String(locale || '').startsWith('en')) return ko;
  const en = String(item?.titleEn || '').trim();
  if (!en) return ko;
  if (en === ko) return en;
  return `${en} (${ko})`;
}
