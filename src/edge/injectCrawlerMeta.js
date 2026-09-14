import { DEFAULT_OG_IMAGE, buildCrawlerGalleryJsonLd } from '../pages/Home/lib/placeSeoOg.js';

const SITE_NAME = 'GATEO';

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeJsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function placeHref(slug, tab, locale) {
  const path = tab ? `/place/${slug}/${tab}` : `/place/${slug}`;
  return locale === 'en' ? `${path}?lang=en` : path;
}

function replaceRootInnerHtml(html, inner) {
  const openMatch = html.match(/<div id="root">/i);
  if (!openMatch || openMatch.index == null) return html;
  const openEnd = openMatch.index + openMatch[0].length;
  let depth = 1;
  let i = openEnd;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextClose === -1) return html;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return `${html.slice(0, openMatch.index)}<div id="root">\n${inner}\n    </div>${html.slice(nextClose + 6)}`;
    }
    i = nextClose + 6;
  }
  return html;
}

export function buildCrawlerPlaceBodyHtml(meta) {
  const slug = String(meta?.slug || '').trim();
  const placeName = String(meta?.placeName || '').trim();
  if (!slug || !placeName) return '';

  const locale = meta.locale === 'en' ? 'en' : 'ko';
  const country = String(meta.countryName || '').trim();
  const destIata = String(meta.destIata || '').trim();
  const titlePlace = country ? `${placeName} (${country})` : placeName;
  const h1 =
    locale === 'en'
      ? `${escapeHtml(titlePlace)} — travel guide &amp; attractions`
      : `${escapeHtml(titlePlace)} - 여행 가이드 &amp; 명소`;
  const h2 =
    locale === 'en'
      ? 'Suggested routes and essentials (Gallery · Planner · AI docent)'
      : '추천 코스 및 필수 정보 (갤러리 · 플래너 · AI 도슨트)';
  const galleryLabel = locale === 'en' ? `${placeName} gallery` : `${placeName} 갤러리`;
  const plannerLabel =
    locale === 'en'
      ? `${placeName} planner · stays · tours`
      : `${placeName} 플래너 · 숙소 · 투어`;
  const wikiLabel = locale === 'en' ? `${placeName} AI docent` : `${placeName} AI 도슨트`;
  const airportLine = destIata
    ? locale === 'en'
      ? `Nearby airport: ${destIata}`
      : `인근 공항: ${destIata}`
    : locale === 'en'
      ? 'Airport, stay, and tour links are in the planner.'
      : '인근 공항 · 숙소 · 투어 안내는 플래너에서 확인할 수 있습니다.';

  return `      <!-- crawler-body-injected -->
      <article id="crawler-place-body">
        <h1>${h1}</h1>
        <p>${escapeHtml(meta.description)}</p>
        <p>${escapeHtml(meta.keywords)}</p>
        <h2>${h2}</h2>
        <nav>
          <ul>
            <li><a href="${escapeAttr(placeHref(slug, 'gallery', locale))}">${escapeHtml(galleryLabel)}</a></li>
            <li><a href="${escapeAttr(placeHref(slug, 'planner', locale))}">${escapeHtml(plannerLabel)}</a></li>
            <li><a href="${escapeAttr(placeHref(slug, 'wiki', locale))}">${escapeHtml(wikiLabel)}</a></li>
          </ul>
          <p>${escapeHtml(airportLine)}</p>
        </nav>
      </article>`;
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

  out = out.replace(/<head>/i, `<head>\n${headTags}\n`);

  const bodyHtml = buildCrawlerPlaceBodyHtml(meta);
  if (bodyHtml) {
    out = replaceRootInnerHtml(out, bodyHtml);
  }
  return out;
}
