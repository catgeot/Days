import { normalizeAppLocale } from './constants';
import { i18n } from './config';
import { KO, EN } from './mooniPromptBundleData.js';

/** @typedef {'ko' | 'en'} PromptLocale */

/**
 * MOONi Gemini system-prompt SSOT — locale bundles (#19).
 * UI chips live in locales/*.json; model instructions live here.
 * Bundle text: mooniPromptBundleData.js (server mirror under supabase/functions/_shared/gemini).
 */

export const MOONI_PROMPT_BUNDLES = { ko: KO, en: EN };

/**
 * @param {string | null | undefined} [lng]
 */
export function getMooniPromptBundle(lng = i18n.language) {
  const locale = normalizeAppLocale(lng?.slice?.(0, 2) ?? lng);
  return MOONI_PROMPT_BUNDLES[locale] ?? KO;
}

/**
 * @param {string} template
 * @param {Record<string, string>} vars
 */
export function fillMooniPromptTemplate(template, vars = {}) {
  return Object.entries(vars).reduce(
    (out, [key, value]) => out.replaceAll(`{{${key}}}`, String(value ?? '')),
    template,
  );
}
