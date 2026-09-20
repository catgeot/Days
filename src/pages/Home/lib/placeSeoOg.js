import { PLACE_SEO_OG_IMAGE_OVERRIDES } from '../../../data/placeSeoOgImageOverrides.js';

export const DEFAULT_OG_IMAGE = 'https://www.gateo.kr/og-image.png';

const OG_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1506929562872-bb421704ef0f?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1552832230-c0197dd311ba?auto=format&fit=crop&w=1200&h=630&q=80',
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&h=630&q=80',
];

export const GALLERY_SCHEMA_IMAGE_LIMIT = 8;

function hashSlug(slug) {
  let hash = 0;
  const value = String(slug || '');
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickPoolImage(slug) {
  if (!slug) return DEFAULT_OG_IMAGE;
  return OG_PHOTO_POOL[hashSlug(slug) % OG_PHOTO_POOL.length];
}

export function getGalleryImageContentUrl(image) {
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

export function getPlaceOgImageUrl(location) {
  if (!location) return DEFAULT_OG_IMAGE;

  const slug = String(location.slug || '').trim();
  const thumbnail = String(location.thumbnail || location.image || '').trim();
  if (thumbnail) return thumbnail;

  if (slug && PLACE_SEO_OG_IMAGE_OVERRIDES[slug]) {
    return PLACE_SEO_OG_IMAGE_OVERRIDES[slug];
  }

  if (slug) return pickPoolImage(slug);

  const query = String(location.name_en || location.name || '').trim();
  if (query) return pickPoolImage(query.toLowerCase().replace(/\s+/g, '-'));

  return DEFAULT_OG_IMAGE;
}

export function resolvePlaceOgImageUrl(location, galleryImages) {
  const hero = getGalleryImageContentUrl(galleryImages?.[0]);
  return hero || getPlaceOgImageUrl(location);
}

export function buildGalleryImageObjects(images, { placeName = '', limit = GALLERY_SCHEMA_IMAGE_LIMIT } = {}) {
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

export function buildPlaceGalleryJsonLd({
  placeName,
  description,
  pageUrl,
  galleryImages,
  locale = 'ko',
}) {
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
