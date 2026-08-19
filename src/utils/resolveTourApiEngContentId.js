import travelSpotTourApi from '../pages/Home/data/travelSpotTourApi.json' with { type: 'json' };
import { resolveTourApiPlace, getTourApiSlugKey } from './tourApiMatch';
import { invokeTourApiProxy } from './tourApiProxy';

function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

function aliasesForSlug(slugKey) {
  if (!slugKey) return [];
  const entry = travelSpotTourApi?.spots?.[slugKey];
  return Array.isArray(entry?.aliases)
    ? entry.aliases.map((a) => String(a || '').trim()).filter(Boolean)
    : [];
}

function englishSearchTerms(opts) {
  /** @type {string[]} */
  const terms = [];
  const titleEn = String(opts?.titleEn || '').trim();
  if (titleEn && /[A-Za-z]/.test(titleEn)) terms.push(titleEn);

  const slugKey = getTourApiSlugKey(opts?.placeSlug || opts?.spotId || '');
  const mapping =
    resolveTourApiPlace(slugKey || opts?.placeSlug || opts?.spotId) ||
    resolveTourApiPlace({ id: opts?.spotId });
  if (mapping) {
    if (/[A-Za-z]/.test(mapping.title)) terms.push(mapping.title);
    for (const alias of aliasesForSlug(slugKey || mapping.slug || '')) {
      if (/[A-Za-z]/.test(alias)) terms.push(alias);
    }
  }

  return [...new Set(terms.map((t) => t.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
}

/**
 * KorService2 contentId에 EngService2 본문이 없을 때 EN searchKeyword로 대응 id 탐색.
 * @param {{
 *   titleEn?: string | null,
 *   placeSlug?: string | null,
 *   spotId?: string | null,
 *   searchAliases?: string[],
 * }} opts
 * @returns {Promise<{ contentId: string, contentTypeId: string } | null>}
 */
export async function resolveTourApiEngContentId(opts) {
  const terms = englishSearchTerms(opts);
  if (!terms.length) return null;

  for (const keyword of terms) {
    const search = await invokeTourApiProxy(
      'searchKeyword',
      { keyword, numOfRows: 8 },
      { locale: 'en' },
    );
    const items = Array.isArray(search?.items) ? search.items : [];
    for (const item of items) {
      const contentId = String(item?.contentId || '').trim();
      if (!/^\d{1,32}$/.test(contentId)) continue;
      const common = await invokeTourApiProxy(
        'detailCommon',
        { contentId },
        { locale: 'en' },
      );
      const row = common?.items?.[0];
      const overview = String(row?.overview || '').trim();
      if (overview.length < 40 && !hasText(row?.title)) continue;
      const contentTypeId = String(
        item?.contentTypeId || row?.contentTypeId || '12',
      ).trim();
      return {
        contentId,
        contentTypeId: /^\d{1,4}$/.test(contentTypeId) ? contentTypeId : '12',
      };
    }
  }
  return null;
}

export { englishSearchTerms };
