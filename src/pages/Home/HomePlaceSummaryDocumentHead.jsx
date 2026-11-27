import { useTranslation } from 'react-i18next';

import SEO from '../../components/SEO/index.jsx';
import { useLocale } from '../../i18n/LocaleProvider.jsx';
import { placeCanonicalPath } from '../../shared/seo/placeCanonicalPath.js';
import {
  getPlaceSeoKeywords,
  getPlaceTabSeoDescription,
  getPlaceTabSeoTitle,
} from './lib/placeSeoText.js';
import { useLocation } from 'react-router-dom';
import { getPlaceUrlParam, resolvePlaceUrlParamForPath } from './lib/formatUrlName.js';

/** /place 딥링크 써머리 — PlaceCard(Outlet)가 null일 때 document head SSOT */
export default function HomePlaceSummaryDocumentHead({ location }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const routeLocation = useLocation();
  const pathSlug = routeLocation.pathname.match(/\/place\/([^/?#]+)/)?.[1] || '';
  const slug = location ? resolvePlaceUrlParamForPath(location, pathSlug) || getPlaceUrlParam(location) : null;
  if (!slug) return null;

  const tabKey = 'gallery';
  const seoTitle = getPlaceTabSeoTitle(location, locale, tabKey);
  const seoDescription = getPlaceTabSeoDescription(location, locale, tabKey, t);
  const seoKeywords = getPlaceSeoKeywords(location, locale, tabKey);

  return (
    <SEO
      title={seoTitle}
      description={seoDescription}
      keywords={seoKeywords}
      url={placeCanonicalPath(slug)}
      location={location}
      tab={tabKey}
    />
  );
}