import {
  buildGygActivitiesSearchQuery,
} from '../components/PlaceCard/tabs/planner/locationRules.js';
import {
  buildGygSearchUrl,
  get12GoAffiliateUrl,
  getKlookAffiliateUrl,
  getKlookRentalUrlByLocation,
  getKlookSearchUrl,
} from './affiliate.js';
import { extractGoogleMapsSearchQuery, googleMapsSearchUrl, googleWebSearchUrl } from './worldEventOutboundLinks.js';

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
  return event.glossaryTerms
    .map((term) => ({
      ...term,
      displayTerm: locale === 'en' ? term.termEn : term.termKo,
      prompt: locale === 'en' ? term.promptEn : term.promptKo,
      searchQuery:
        locale === 'en' && term.searchQueryEn ? term.searchQueryEn : term.searchQueryKo,
    }))
    .filter((term) => {
      if (locale !== 'en') {
        return Boolean(term.displayTerm && term.prompt);
      }
      return Boolean(term.termEn && term.promptEn && term.displayTerm && term.prompt);
    });
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
export function getWorldEventGlossaryTermById(event, termId, locale = 'ko') {
  const id = String(termId || '').trim();
  if (!id || !event?.glossaryTerms?.length) return null;
  const term = event.glossaryTerms.find((item) => item.id === id) ?? null;
  if (!term) return null;
  if (locale === 'en' && (!term.termEn || !term.promptEn)) return null;
  return term;
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
 * @param {import('./worldEvents').WorldEventGlossaryTerm | null | undefined} term
 * @param {string} [locale]
 */
export function getGlossaryTermReferenceUrl(term, locale = 'ko') {
  if (!term) return '';
  const referenceUrlKo = String(term.referenceUrlKo || '').trim();
  const referenceUrl = String(term.referenceUrl || '').trim();
  if (locale === 'en') return referenceUrl || referenceUrlKo;
  return referenceUrlKo || referenceUrl;
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
function getHighlightContextLinkSearchQuery(link, locale = 'ko') {
  if (!link) return '';
  return locale === 'en' && link.searchQueryEn
    ? String(link.searchQueryEn).trim()
    : String(link.searchQueryKo || '').trim();
}

export function resolveHighlightContextLinkHref(link, location, locale = 'ko') {
  if (!link) return '';

  const searchQuery = getHighlightContextLinkSearchQuery(link, locale);
  const searchTarget = String(link.searchTarget || '').trim();

  if (searchQuery && searchTarget === 'google') {
    return googleWebSearchUrl(searchQuery, locale);
  }
  if (searchQuery && searchTarget === 'maps') {
    return googleMapsSearchUrl(searchQuery, locale);
  }
  if (searchQuery && searchTarget === 'klook') {
    return getKlookSearchUrl(searchQuery, locale);
  }

  const explicitHref = String(link.href || '').trim();
  if (explicitHref) {
    if (/12go\.asia/i.test(explicitHref)) {
      return get12GoAffiliateUrl(explicitHref);
    }
    if (link.kind === 'shop' && /klook\.com/i.test(explicitHref)) {
      return getKlookAffiliateUrl(explicitHref);
    }
    if (/google\.com\/maps/i.test(explicitHref)) {
      const mapsQuery = extractGoogleMapsSearchQuery(explicitHref);
      const webQuery = searchQuery || mapsQuery;
      if (webQuery) return googleWebSearchUrl(webQuery, locale);
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
    sponsored:
      link.kind === 'rental' ||
      link.kind === 'tour' ||
      /klook\.com/i.test(href) ||
      /12go\.asia/i.test(href),
  };
}
