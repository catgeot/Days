import { parseEngFestivalTitle } from './festivalTitleEnMerge.js';

/**
 * Festival list / promo card title — EN: English (한글) when titleEn exists (#416).
 * @param {Record<string, unknown> | null | undefined} item
 * @param {string} [locale]
 */
function resolveEnKoTitleParts(item) {
  const ko = String(item?.title || '').trim();
  if (!ko) return null;
  const rawEn = String(item?.titleEn || '').trim();
  if (!rawEn) return { en: '', ko };
  const parsed = parseEngFestivalTitle(rawEn);
  const en = String(parsed.en || rawEn).trim();
  if (!en || en === ko) return { en: '', ko };
  const koLine = ko || String(parsed.koHint || '').trim();
  return { en, ko: koLine };
}

/**
 * EN promo/list — English line 1, Korean line 2 (no truncation).
 * @returns {{ primary: string, secondary?: string } | null}
 */
export function festivalListDisplayTitleLines(item, locale = 'ko') {
  const ko = String(item?.title || '').trim();
  if (!ko) return null;
  if (!String(locale || '').startsWith('en')) {
    return { primary: ko };
  }
  const parts = resolveEnKoTitleParts(item);
  if (!parts?.en) return { primary: ko };
  return { primary: parts.en, secondary: parts.ko };
}

export function festivalListDisplayTitle(item, locale = 'ko') {
  const lines = festivalListDisplayTitleLines(item, locale);
  if (!lines) return '';
  if (lines.secondary) return `${lines.primary} (${lines.secondary})`;
  return lines.primary;
}
