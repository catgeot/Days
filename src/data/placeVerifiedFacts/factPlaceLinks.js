/** In-app /place/… chips on verified-fact topic bodies. */

/**
 * @param {{ label: string, labelEn?: string | null }} link
 * @param {'ko' | 'en'} locale
 */
export function placeLinkLabelForLocale(link, locale) {
  if (locale === 'en') {
    const en = String(link?.labelEn || '').trim();
    if (en) return en;
  }
  return String(link?.label || '').trim();
}
