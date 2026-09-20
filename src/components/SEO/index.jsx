import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { useLocale } from '../../i18n/LocaleProvider';
import { buildHreflangAlternates, buildLocalePageUrl } from '../../i18n/seoUrls';
import { getLocalizedPlaceName } from '../PlaceCard/common/locationDisplay';
import {
  DEFAULT_OG_IMAGE,
  buildPlaceGalleryJsonLd,
  resolvePlaceOgImageUrl,
} from '../../pages/Home/lib/placeSeoOg.js';

const SCHEMA_TYPES = {
  TOURIST_ATTRACTION: 'TouristAttraction',
  IMAGE_GALLERY: 'ImageGallery',
};

function upsertJsonLdScript(schemaType, schema) {
  const selector = `script[data-schema-type="${schemaType}"]`;
  document.querySelector(selector)?.remove();
  if (!schema) return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-schema-type', schemaType);
  script.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(script);
}

const SEO = ({
  title,
  description,
  keywords,
  url,
  image,
  type = 'website',
  location = null,
  tab = null,
  galleryImages = null,
}) => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { pathname } = useLocation();

  const siteName = 'GATEO';
  const defaultTitle = t('seo.defaultTitle');
  const defaultDescription = t('seo.defaultDescription');
  const defaultKeywords = t('seo.defaultKeywords');

  const pagePath = url ?? pathname ?? '/';
  const seoTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords || defaultKeywords;
  const seoUrl = buildLocalePageUrl(pagePath, locale);
  const isGalleryTab = tab === 'gallery';
  const resolvedOgImage = useMemo(() => {
    if (image) return image;
    if (location) {
      return isGalleryTab
        ? resolvePlaceOgImageUrl(location, galleryImages)
        : resolvePlaceOgImageUrl(location, null);
    }
    return DEFAULT_OG_IMAGE;
  }, [image, location, isGalleryTab, galleryImages]);
  const seoImage = resolvedOgImage || DEFAULT_OG_IMAGE;
  const hreflangAlternates = useMemo(() => buildHreflangAlternates(pagePath), [pagePath]);
  const ogLocale = locale === 'en' ? 'en_US' : 'ko_KR';
  const ogLocaleAlternate = locale === 'en' ? 'ko_KR' : 'en_US';

  const displayName = useMemo(() => {
    if (!location) return '';
    return (
      getLocalizedPlaceName(location, locale) ||
      location.name ||
      location.destination ||
      location.name_en ||
      ''
    );
  }, [location, locale]);

  const touristAttractionSchema = useMemo(() => {
    if (!location) return null;

    const schema = {
      '@context': 'https://schema.org',
      '@type': SCHEMA_TYPES.TOURIST_ATTRACTION,
      name: displayName,
      description: seoDescription,
      url: seoUrl,
      image: seoImage,
    };

    if (location.name_en && location.name_en !== displayName) {
      schema.alternateName = location.name_en;
    } else if (location.name && location.name !== displayName) {
      schema.alternateName = location.name;
    }

    if (location.lat && location.lng) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: location.lat,
        longitude: location.lng,
      };
    }

    if (location.country || location.country_en) {
      schema.address = {
        '@type': 'PostalAddress',
      };

      if (location.country_en) {
        schema.address.addressCountry = location.country_en;
      }

      if (location.name || location.destination) {
        schema.address.addressRegion = location.name || location.destination;
      }
    }

    if (location.primaryCategory || location.categories) {
      const categoryMap = {
        paradise: locale === 'en' ? 'Resort' : '휴양지',
        nature: locale === 'en' ? 'Nature' : '자연 경관',
        urban: locale === 'en' ? 'Urban' : '도시 관광',
        culture: locale === 'en' ? 'Cultural heritage' : '문화 유산',
        adventure: locale === 'en' ? 'Adventure' : '모험/액티비티',
      };

      const category = location.primaryCategory || (location.categories && location.categories[0]);
      if (category && categoryMap[category]) {
        schema.touristType = categoryMap[category];
      }
    }

    return schema;
  }, [location, displayName, seoDescription, seoUrl, seoImage, locale]);

  const gallerySchema = useMemo(() => {
    if (!isGalleryTab || !location || !galleryImages?.length) return null;
    return buildPlaceGalleryJsonLd({
      placeName: displayName,
      description: seoDescription,
      pageUrl: seoUrl,
      galleryImages,
      locale,
    });
  }, [isGalleryTab, location, galleryImages, displayName, seoDescription, seoUrl, locale]);

  useEffect(() => {
    upsertJsonLdScript(SCHEMA_TYPES.TOURIST_ATTRACTION, touristAttractionSchema);
    return () => {
      document
        .querySelector(`script[data-schema-type="${SCHEMA_TYPES.TOURIST_ATTRACTION}"]`)
        ?.remove();
    };
  }, [touristAttractionSchema]);

  useEffect(() => {
    upsertJsonLdScript(SCHEMA_TYPES.IMAGE_GALLERY, gallerySchema);
    return () => {
      document.querySelector(`script[data-schema-type="${SCHEMA_TYPES.IMAGE_GALLERY}"]`)?.remove();
    };
  }, [gallerySchema]);

  return (
    <Helmet>
      <html lang={locale} />
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />

      <link rel="canonical" href={seoUrl} />
      {hreflangAlternates.map((alt) => (
        <link key={alt.hreflang} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
      ))}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlternate} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
    </Helmet>
  );
};

export default SEO;
