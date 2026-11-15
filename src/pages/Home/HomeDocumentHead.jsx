import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import SEO from '../../components/SEO/index.jsx';
import { useLocale } from '../../i18n/LocaleProvider';
import { placeRouteOwnsDocumentHead } from '../../shared/seo/placeDocumentHead.js';
import { getExploreCategorySeoBundle, parseExploreCategoryPath } from './lib/exploreCategorySeo';

export default function HomeDocumentHead() {
  const { pathname } = useLocation();
  const { locale } = useLocale();
  const exploreCategorySeo = useMemo(() => {
    const parsed = parseExploreCategoryPath(pathname);
    if (!parsed) return null;
    return getExploreCategorySeoBundle(parsed.continent, parsed.category, locale);
  }, [pathname, locale]);

  if (placeRouteOwnsDocumentHead(pathname)) return null;

  return (
    <SEO
      title={exploreCategorySeo?.title}
      description={exploreCategorySeo?.description}
      keywords={exploreCategorySeo?.keywords}
      url={exploreCategorySeo?.path}
    />
  );
}
