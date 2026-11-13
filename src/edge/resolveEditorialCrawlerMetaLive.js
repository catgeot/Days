import crawlerEditorialMeta from './crawlerEditorialMeta.generated.js';
import { buildEditorialCrawlerMetaBundle } from './editorialCrawlerMetaFromRow.js';
import { fetchPublishedEditorialBySlug } from './editorialSupabase.js';
import { toCrawlerMetaRow } from './resolveCrawlerMeta.js';

/**
 * Build-time bundle first; else live Supabase read for newly published posts.
 *
 * @param {string} slug
 * @param {'ko'|'en'} [locale]
 * @param {{ timeoutMs?: number, fetchImpl?: typeof fetch }} [options]
 */
export async function resolveEditorialCrawlerMetaLive(slug, locale = 'ko', options = {}) {
  const loc = locale === 'en' ? 'en' : 'ko';
  const bundled = crawlerEditorialMeta?.[slug]?.[loc];
  if (bundled) {
    return toCrawlerMetaRow(bundled, loc);
  }

  const row = await fetchPublishedEditorialBySlug(slug, options);
  if (!row) return null;

  const bundle = buildEditorialCrawlerMetaBundle(row);
  return toCrawlerMetaRow(bundle[loc], loc);
}
