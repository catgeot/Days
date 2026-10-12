import { parseEngFestivalTitle } from './festivalTitleEnMerge.js';

/**
 * Festival list / promo card title — EN: English (한글) when titleEn exists (#416).
 * @param {Record<string, unknown> | null | undefined} item
 * @param {string} [locale]
 */
export function festivalListDisplayTitle(item, locale = 'ko') {
  const ko = String(item?.title || '').trim();
  if (!ko) return '';
  if (!String(locale || '').startsWith('en')) return ko;
  const rawEn = String(item?.titleEn || '').trim();
  if (!rawEn) return ko;
  const parsed = parseEngFestivalTitle(rawEn);
  const en = String(parsed.en || rawEn).trim();
  if (!en || en === ko) return ko;
  const koParen = ko || String(parsed.koHint || '').trim();
  return `${en} (${koParen})`;
}
