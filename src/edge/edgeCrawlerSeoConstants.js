export const DEFAULT_OG_IMAGE = 'https://www.gateo.kr/og-image.png';

const GALLERY_SCHEMA_IMAGE_LIMIT = 8;

function getGalleryImageContentUrl(image) {
  if (!image || typeof image !== 'object') return '';
  return (
    image.urls?.regular ||
    image.urls?.full ||
    image.urls?.small ||
    image.image_url ||
    image.contentUrl ||
    ''
  );
}

function buildGalleryImageObjects(images, { placeName = '', limit = GALLERY_SCHEMA_IMAGE_LIMIT } = {}) {
  const list = Array.isArray(images) ? images : [];
  const objects = [];

  for (const image of list) {
    if (objects.length >= limit) break;
    const contentUrl = getGalleryImageContentUrl(image);
    if (!contentUrl) continue;

    const caption =
      image.alt_description ||
      image.alt ||
      (placeName ? `${placeName} travel photo` : 'Travel photo');

    objects.push({
      '@type': 'ImageObject',
      contentUrl,
      name: caption,
      caption,
    });
  }

  return objects;
}

function buildPlaceGalleryJsonLd({ placeName, description, pageUrl, galleryImages, locale = 'ko' }) {
  const imageObjects = buildGalleryImageObjects(galleryImages, { placeName });
  if (imageObjects.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: locale === 'en' ? `${placeName} travel photos` : `${placeName} 여행 사진`,
    description,
    url: pageUrl,
    image: imageObjects,
  };
}

export function buildCrawlerGalleryJsonLd(meta) {
  if (!meta?.galleryImages?.length) return null;
  return buildPlaceGalleryJsonLd({
    placeName: meta.placeName,
    description: meta.description,
    pageUrl: meta.canonicalUrl,
    galleryImages: meta.galleryImages,
    locale: meta.locale,
  });
}
