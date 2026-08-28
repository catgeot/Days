import { buildGygActivitiesSearchQuery } from '../components/PlaceCard/tabs/planner/locationRules.js';
import { buildGygSearchUrl, getKlookAffiliateUrl, getKlookRentalUrlByLocation } from './affiliate.js';
import { googleWebSearchUrl } from './worldEventOutboundLinks.js';

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 */
export function hasWorldEventD5bBodyUx(event) {
  return Array.isArray(event?.glossaryTerms) && event.glossaryTerms.length > 0;
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 */
export function getWorldEventHeroImages(event) {
  if (Array.isArray(event?.heroImages) && event.heroImages.length > 0) {
    return event.heroImages;
  }
  const heroImage = String(event?.heroImage || '').trim();
  return heroImage ? [{ url: heroImage }] : [];
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 */
export function getWorldEventGlossaryTerms(event, locale = 'ko') {
  if (!event?.glossaryTerms?.length) return [];
  return event.glossaryTerms.map((term) => ({
    ...term,
    displayTerm: locale === 'en' && term.termEn ? term.termEn : term.termKo,
    prompt: locale === 'en' && term.promptEn ? term.promptEn : term.promptKo,
    searchQuery:
      locale === 'en' && term.searchQueryEn ? term.searchQueryEn : term.searchQueryKo,
  }));
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {number} highlightIndex
 */
export function getHighlightContextLinks(event, highlightIndex) {
  if (!event?.highlightContextLinks?.length) return [];
  const group = event.highlightContextLinks.find(
    (item) => Number(item.highlightIndex) === highlightIndex,
  );
  return group?.links ?? [];
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} termId
 */
export function getWorldEventGlossaryTermById(event, termId) {
  const id = String(termId || '').trim();
  if (!id || !event?.glossaryTerms?.length) return null;
  return event.glossaryTerms.find((term) => term.id === id) ?? null;
}

/**
 * @param {import('./worldEvents').WorldEventGlossaryTerm | null | undefined} term
 * @param {string} [locale]
 */
export function getGlossaryTermSearchUrl(term, locale = 'ko') {
  if (!term) return '';
  const query =
    locale === 'en' && term.searchQueryEn ? term.searchQueryEn : term.searchQueryKo;
  return googleWebSearchUrl(query, locale);
}

/**
 * @param {{
 *   id: string,
 *   labelKo: string,
 *   labelEn?: string,
 *   kind: 'rental' | 'tour' | 'shop',
 *   href?: string,
 * }} link
 * @param {Record<string, unknown>} location
 * @param {string} [locale]
 */
export function resolveHighlightContextLinkHref(link, location, locale = 'ko') {
  if (!link) return '';

  const explicitHref = String(link.href || '').trim();
  if (explicitHref) {
    if (link.kind === 'shop' && /klook\.com/i.test(explicitHref)) {
      return getKlookAffiliateUrl(explicitHref);
    }
    return explicitHref;
  }

  if (link.kind === 'rental') {
    return getKlookRentalUrlByLocation(location) || '';
  }

  if (link.kind === 'tour') {
    const query = buildGygActivitiesSearchQuery(location);
    return query ? buildGygSearchUrl(query, { locale }) : '';
  }

  return '';
}

/**
 * @param {{
 *   id: string,
 *   labelKo: string,
 *   labelEn?: string,
 *   kind: 'rental' | 'tour' | 'shop',
 *   href?: string,
 * }} link
 * @param {Record<string, unknown>} location
 * @param {string} [locale]
 */
export function getResolvedHighlightContextLink(link, location, locale = 'ko') {
  const href = resolveHighlightContextLinkHref(link, location, locale);
  if (!href) return null;
  return {
    id: link.id,
    label: locale === 'en' && link.labelEn ? link.labelEn : link.labelKo,
    href,
    kind: link.kind,
    sponsored: link.kind === 'rental' || link.kind === 'tour' || /klook\.com/i.test(href),
  };
}
