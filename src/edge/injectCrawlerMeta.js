import { DEFAULT_OG_IMAGE, buildCrawlerGalleryJsonLd } from '../pages/Home/lib/placeSeoOg.js';

const SITE_NAME = 'GATEO';

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeJsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function buildCrawlerHeadTags(meta) {
  const {
    locale,
    title,
    description,
    keywords,
    canonicalUrl,
    hreflangAlternates = [],
    ogImage,
    galleryImages,
  } = meta;
  const seoTitle = `${title} | ${SITE_NAME}`;
  const ogLocale = locale === 'en' ? 'en_US' : 'ko_KR';
  const ogLocaleAlt = locale === 'en' ? 'ko_KR' : 'en_US';
  const desc = escapeAttr(description);
  const kw = escapeAttr(keywords);
  const imageUrl = escapeAttr(ogImage || DEFAULT_OG_IMAGE);
  const hreflang = hreflangAlternates
    .map(
      (alt) =>
        `    <link rel="alternate" hreflang="${escapeAttr(alt.hreflang)}" href="${escapeAttr(alt.href)}" />`,
    )
    .join('\n');

  const gallerySchema = buildCrawlerGalleryJsonLd({
    ...meta,
    galleryImages: galleryImages || (ogImage ? [{ urls: { regular: ogImage } }] : []),
  });
  const jsonLdBlock = gallerySchema
    ? `\n    <script type="application/ld+json" data-schema-type="ImageGallery">${escapeJsonForScript(gallerySchema)}</script>`
    : '';

  return `<!-- crawler-meta-injected -->
    <title>${escapeAttr(seoTitle)}</title>
    <meta name="description" content="${desc}" />
    <meta name="keywords" content="${kw}" />
    <link rel="canonical" href="${escapeAttr(canonicalUrl)}" />
${hreflang}
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeAttr(canonicalUrl)}" />
    <meta property="og:title" content="${escapeAttr(seoTitle)}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="${ogLocale}" />
    <meta property="og:locale:alternate" content="${ogLocaleAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeAttr(canonicalUrl)}" />
    <meta name="twitter:title" content="${escapeAttr(seoTitle)}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${imageUrl}" />${jsonLdBlock}`;
}

export function injectCrawlerMetaIntoHtml(html, meta) {
  const headTags = buildCrawlerHeadTags(meta);
  let out = html.replace(/<html[^>]*>/i, `<html lang="${escapeAttr(meta.locale)}">`);

  out = out.replace(/<title>[\s\S]*?<\/title>/i, '');
  out = out.replace(/<meta name="description"[^>]*>/gi, '');
  out = out.replace(/<meta name="keywords"[^>]*>/gi, '');
  out = out.replace(/<link rel="canonical"[^>]*>/gi, '');
  out = out.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>/gi, '');
  out = out.replace(/<meta property="og:[^"]*"[^>]*>/gi, '');
  out = out.replace(/<meta name="twitter:[^"]*"[^>]*>/gi, '');
  out = out.replace(
    /<script type="application\/ld\+json" data-schema-type="ImageGallery">[\s\S]*?<\/script>/gi,
    '',
  );
  out = out.replace(/<!-- crawler-meta-injected -->[\s\S]*?(?=<meta|<link rel="icon"|<script)/i, '');

  return out.replace(/<head>/i, `<head>\n${headTags}\n`);
}
