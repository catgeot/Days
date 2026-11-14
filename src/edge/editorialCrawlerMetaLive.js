const META_DESCRIPTION_MAX = 150;
const SITE_ORIGIN = 'https://www.gateo.kr';
import { DEFAULT_SITE_OG_IMAGE, resolveSocialShareImageUrl } from '../shared/seo/socialOgImage.js';

const DEFAULT_OG_IMAGE = DEFAULT_SITE_OG_IMAGE;
const UNSPLASH_HOST = 'images.unsplash.com';

function buildEditorialPageUrl(slug, locale) {
  const path = `/blog/e/${slug}`;
  if (locale === 'en') return `${SITE_ORIGIN}${path}?lang=en`;
  return `${SITE_ORIGIN}${path}`;
}

function buildEditorialHreflang(slug) {
  const path = `/blog/e/${slug}`;
  return [
    { hreflang: 'ko', href: `${SITE_ORIGIN}${path}` },
    { hreflang: 'en', href: `${SITE_ORIGIN}${path}?lang=en` },
    { hreflang: 'x-default', href: `${SITE_ORIGIN}${path}` },
  ];
}

function placeLabelFromSlug(placeSlug) {
  return String(placeSlug || '')
    .replace(/-/g, ' ')
    .trim();
}

function normalizePlain(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function stripMarkdownSnippet(content, maxLen = 160) {
  const plain = normalizePlain(
    String(content || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]+`/g, ' ')
      .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/[#>*_~\-]/g, ' '),
  );
  if (!plain) return '';
  if (maxLen > 0 && plain.length > maxLen) {
    return `${plain.slice(0, maxLen).trim()}…`;
  }
  return plain;
}

function resolveLiveEditorialDescription(row, maxLen = META_DESCRIPTION_MAX) {
  const titleNorm = normalizePlain(row?.title);
  const explicit = normalizePlain(row?.dek ?? row?.excerpt ?? '');
  if (explicit && explicit !== titleNorm) {
    return explicit.length > maxLen ? `${explicit.slice(0, maxLen).trim()}…` : explicit;
  }
  return stripMarkdownSnippet(row?.content, maxLen);
}

function imageObjectSrc(img) {
  if (!img || typeof img !== 'object') return '';
  return (
    img.src ||
    img.url ||
    img.urls?.regular ||
    img.urls?.full ||
    img.image_url ||
    ''
  );
}

function withUnsplashWidth(src, width) {
  if (!src || !src.includes(UNSPLASH_HOST)) return src;
  try {
    const parsed = new URL(src);
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('w', String(width));
    parsed.searchParams.set('q', '80');
    return parsed.toString();
  } catch {
    return src;
  }
}

function resolveLiveEditorialOgImage(row) {
  const images = row?.images;
  if (Array.isArray(images) && images.length > 0) {
    for (const img of images) {
      const src = imageObjectSrc(img);
      if (!src) continue;
      const sized = withUnsplashWidth(src, 1200);
      const shareUrl = resolveSocialShareImageUrl(sized, '');
      if (shareUrl) return shareUrl;
    }
  }
  return DEFAULT_OG_IMAGE;
}

/**
 * Edge-only editorial meta from a Supabase row (no app data imports).
 *
 * @param {object} row
 * @returns {Record<'ko'|'en', object>}
 */
export function buildEditorialCrawlerMetaLiveBundle(row) {
  const slug = String(row.slug || '').trim();
  const placeSlug = row.place_slug || null;
  const placeNameKo = placeLabelFromSlug(placeSlug);
  const placeNameEn = placeNameKo;
  const headline = String(row.title || '').trim();
  const description = resolveLiveEditorialDescription(row);
  const ogImage = resolveLiveEditorialOgImage(row);

  const kwKo = [placeNameKo, headline, '기행문', '여행 블로그', 'GATEO'].filter(Boolean).join(', ');
  const kwEn = [placeNameEn, headline, 'travelogue', 'travel blog', 'GATEO'].filter(Boolean).join(', ');

  const base = {
    title: headline,
    description,
    ogImage,
    editorialSlug: slug,
    articleTitle: headline,
    placeName: placeNameKo,
    countryName: '',
    placeSlug,
  };

  return {
    ko: {
      ...base,
      keywords: kwKo,
      canonicalUrl: buildEditorialPageUrl(slug, 'ko'),
      hreflangAlternates: buildEditorialHreflang(slug),
    },
    en: {
      ...base,
      keywords: kwEn,
      placeName: placeNameEn,
      canonicalUrl: buildEditorialPageUrl(slug, 'en'),
      hreflangAlternates: buildEditorialHreflang(slug),
    },
  };
}
