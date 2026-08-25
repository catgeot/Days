/**
 * Sitemap & RSS 생성 스크립트
 * 네이버 서치어드바이저 제출용
 */

const fs = require('fs');
const path = require('path');

// travelSpots 데이터 import
const travelSpotsPath = path.join(__dirname, '../src/pages/Home/data/travelSpots.js');
const travelSpotsContent = fs.readFileSync(travelSpotsPath, 'utf-8');

// TRAVEL_SPOTS 배열 추출
const travelSpotsMatch = travelSpotsContent.match(/export const TRAVEL_SPOTS = \[([\s\S]*?)\];/);
if (!travelSpotsMatch) {
  console.error('❌ TRAVEL_SPOTS 데이터를 찾을 수 없습니다.');
  process.exit(1);
}

const travelSpotsData = JSON.parse(`[${travelSpotsMatch[1]}]`);

const baseUrl = 'https://www.gateo.kr';
const today = new Date().toISOString().split('T')[0];

/** src/i18n/seoUrls.js I18N_HUB_PATHS 와 동기 */
const i18nHubPaths = [
  '/',
  '/explore',
  '/korea',
  '/korea/theme',
  '/korea/theme/scenic',
  '/korea/theme/courses',
  '/korea/theme/packages',
  '/korea/theme/top10',
  '/korea/theme/regions',
  '/blog',
  '/blog/curation',
];

function buildLocalePageUrl(path = '/', locale = 'ko') {
  const normalized = !path || path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`;
  const base = `${baseUrl}${normalized === '/' ? '' : normalized}`;
  if (locale === 'en') {
    return normalized === '/' ? `${baseUrl}/?lang=en` : `${baseUrl}${normalized}?lang=en`;
  }
  return normalized === '/' ? `${baseUrl}/` : base;
}

function buildHreflangXml(path) {
  const alternates = [
    { hreflang: 'ko', href: buildLocalePageUrl(path, 'ko') },
    { hreflang: 'en', href: buildLocalePageUrl(path, 'en') },
    { hreflang: 'x-default', href: buildLocalePageUrl(path, 'ko') },
  ];
  return alternates
    .map(
      (alt) =>
        `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`,
    )
    .join('\n');
}

function isI18nHubPath(path) {
  return i18nHubPaths.includes(path);
}

function pathFromLoc(loc) {
  if (loc === baseUrl || loc === `${baseUrl}/`) return '/';
  if (loc.startsWith(baseUrl)) return loc.slice(baseUrl.length);
  return null;
}

function shouldIncludeHreflang(path) {
  return Boolean(path && (isI18nHubPath(path) || path.startsWith('/place/')));
}

/** 국내 투톱·테마 허브 (src/i18n/seoUrls.js I18N_HUB_PATHS · vite.config koreaRoutes 레거시와 동기) */
const koreaHubRoutes = [
  { path: '/korea', changefreq: 'daily', priority: '0.95' },
  { path: '/korea/theme', changefreq: 'weekly', priority: '0.85' },
  { path: '/korea/theme/scenic', changefreq: 'daily', priority: '0.95' },
  { path: '/korea/theme/courses', changefreq: 'weekly', priority: '0.7' },
  { path: '/korea/theme/packages', changefreq: 'weekly', priority: '0.65' },
  { path: '/korea/theme/top10', changefreq: 'weekly', priority: '0.6' },
  { path: '/korea/theme/regions', changefreq: 'weekly', priority: '0.6' },
];

// Sitemap 생성
function generateSitemap() {
  const urls = [];

  // 메인 페이지
  urls.push({
    loc: baseUrl,
    lastmod: today,
    changefreq: 'daily',
    priority: '1.0'
  });

  // 탐색 페이지
  urls.push({
    loc: `${baseUrl}/explore`,
    lastmod: today,
    changefreq: 'weekly',
    priority: '0.9'
  });

  koreaHubRoutes.forEach((route) => {
    urls.push({
      loc: `${baseUrl}${route.path}`,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  });

  // 로그북 · AI 큐레이션 (실제 라우트 /blog — /logbook 레거시는 vercel redirect)
  urls.push({
    loc: `${baseUrl}/blog`,
    lastmod: today,
    changefreq: 'daily',
    priority: '0.8',
  });
  urls.push({
    loc: `${baseUrl}/blog/curation`,
    lastmod: today,
    changefreq: 'weekly',
    priority: '0.85',
  });

  // 각 여행지 — 기본·갤러리·플래너 (외부 검색 「지명+여행/갤러리/플래너」)
  const placeTabSeoRoutes = ['', '/gallery', '/planner'];

  travelSpotsData.forEach((spot) => {
    const basePriority = spot.tier === 1 ? 0.9 : spot.tier === 2 ? 0.8 : 0.7;
    for (const suffix of placeTabSeoRoutes) {
      const isGallery = suffix === '/gallery';
      const isPlanner = suffix === '/planner';
      urls.push({
        loc: `${baseUrl}/place/${spot.slug}${suffix}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: isGallery
          ? Math.max(basePriority - 0.05, 0.65).toFixed(2)
          : isPlanner
            ? Math.max(basePriority - 0.1, 0.6).toFixed(2)
            : String(basePriority),
      });
    }
  });

  // 카테고리별 탐색 페이지
  const continents = ['asia', 'europe', 'north_america', 'south_america', 'oceania', 'africa'];
  const categories = ['paradise', 'culture', 'urban', 'nature', 'adventure'];

  continents.forEach(continent => {
    categories.forEach(category => {
      urls.push({
        loc: `${baseUrl}/explore/${continent}/${category}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.7'
      });
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.map(url => {
  const hubPath = pathFromLoc(url.loc);
  const hreflangBlock =
    hubPath && shouldIncludeHreflang(hubPath) ? `\n${buildHreflangXml(hubPath)}` : '';
  return `  <url>
    <loc>${url.loc}</loc>${hreflangBlock}
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
}).join('\n')}
</urlset>`;

  return xml;
}

function placeGalleryPath(slug) {
  return `/place/${slug}/gallery`;
}

function buildPlaceGalleryUrl(slug, locale = 'ko') {
  return buildLocalePageUrl(placeGalleryPath(slug), locale);
}

function getEnPlaceDesc(spot, overrides) {
  const override = overrides?.[spot.slug];
  if (override?.desc_en) {
    return override.desc_en.trim();
  }
  const name = spot.name_en || spot.name;
  const country = spot.country_en || spot.country;
  return `Plan your trip to ${name}, ${country}. Travel photos, guides, and itinerary ideas on GATEO.`;
}

// RSS 피드 생성 — gallery tab = PlaceCard·crawler canonical SSOT
function generateRSS(locale = 'ko', overrides = {}) {
  const recentSpots = travelSpotsData
    .filter((spot) => spot.tier <= 2)
    .slice(0, 50);

  const currentDate = new Date();
  const isEn = locale === 'en';
  const selfHref = isEn ? `${baseUrl}/rss-en.xml` : `${baseUrl}/rss.xml`;
  const alternateHref = isEn ? `${baseUrl}/rss.xml` : `${baseUrl}/rss-en.xml`;
  const alternateLang = isEn ? 'ko' : 'en';

  const channelTitle = isEn
    ? 'GATEO | AI Docent 3D World Travel'
    : 'GATEO | AI 도슨트와 함께하는 3D 세계 여행';
  const channelDescription = isEn
    ? 'Plan and record your travels with GATEO — AI docent and 3D globe travel guides for destinations worldwide.'
    : '당신의 여행을 계획하고 기록하는 가장 스마트한 방법, AI 도슨트와 함께하는 3D 세계 여행 GATEO(게이트제로)';

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${channelTitle}</title>
    <link>${baseUrl}</link>
    <description>${channelDescription}</description>
    <language>${isEn ? 'en' : 'ko'}</language>
    <lastBuildDate>${currentDate.toUTCString()}</lastBuildDate>
    <atom:link href="${selfHref}" rel="self" type="application/rss+xml" />
    <atom:link href="${alternateHref}" rel="alternate" hreflang="${alternateLang}" type="application/rss+xml" />

${recentSpots
  .map((spot, index) => {
    const itemDate = new Date(currentDate);
    itemDate.setDate(itemDate.getDate() - index);

    const galleryUrl = buildPlaceGalleryUrl(spot.slug, isEn ? 'en' : 'ko');
    const galleryUrlKo = buildPlaceGalleryUrl(spot.slug, 'ko');
    const galleryUrlEn = buildPlaceGalleryUrl(spot.slug, 'en');

    let fullDescription;
    let itemTitle;

    if (isEn) {
      const enDesc = getEnPlaceDesc(spot, overrides);
      const keywords = overrides?.[spot.slug]?.keywords_en || spot.keywords;
      fullDescription = `
        <h2>${spot.name_en || spot.name}</h2>
        <p><strong>Country:</strong> ${spot.country_en || spot.country}</p>
        <p><strong>Category:</strong> ${spot.primaryCategory || spot.category}</p>
        <p>${enDesc}</p>
        ${keywords ? `<p><strong>Keywords:</strong> ${keywords.join(', ')}</p>` : ''}
        <p><a href="${galleryUrlEn}">View travel photos →</a></p>
        <p><a href="${galleryUrlKo}" hreflang="ko">한국어</a></p>
      `
        .trim()
        .replace(/\s+/g, ' ');
      itemTitle = `${spot.name_en || spot.name} - ${spot.country_en || spot.country} Travel Guide`;
    } else {
      fullDescription = `
        <h2>${spot.name} (${spot.name_en})</h2>
        <p><strong>국가:</strong> ${spot.country} (${spot.country_en})</p>
        <p><strong>카테고리:</strong> ${spot.primaryCategory || spot.category}</p>
        <p>${spot.desc || `${spot.name} 여행 정보, 관광지, 액티비티, 교통편, 숙박 정보를 확인하세요.`}</p>
        ${spot.keywords ? `<p><strong>키워드:</strong> ${spot.keywords.join(', ')}</p>` : ''}
        <p><a href="${galleryUrlKo}">자세히 보기 →</a></p>
        <p><a href="${galleryUrlEn}" hreflang="en">English</a></p>
      `
        .trim()
        .replace(/\s+/g, ' ');
      itemTitle = `${spot.name} (${spot.name_en}) - ${spot.country} 여행 가이드`;
    }

    return `    <item>
      <title>${itemTitle}</title>
      <link>${galleryUrl}</link>
      <description><![CDATA[${fullDescription}]]></description>
      <category>${spot.primaryCategory || spot.category}</category>
      <pubDate>${itemDate.toUTCString()}</pubDate>
      <guid isPermaLink="true">${galleryUrl}</guid>
    </item>`;
  })
  .join('\n')}
  </channel>
</rss>`;

  return rss;
}

// 파일 저장
async function main() {
  const { PLACE_SEO_EN_OVERRIDES } = await import('../src/data/placeSeoEnOverrides.js');

  const sitemap = generateSitemap();
  const rssKo = generateRSS('ko', PLACE_SEO_EN_OVERRIDES);
  const rssEn = generateRSS('en', PLACE_SEO_EN_OVERRIDES);

  fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemap, 'utf-8');
  fs.writeFileSync(path.join(__dirname, '../public/rss.xml'), rssKo, 'utf-8');
  fs.writeFileSync(path.join(__dirname, '../public/rss-en.xml'), rssEn, 'utf-8');

  const urlCount = (sitemap.match(/<url>/g) || []).length;
  console.log('✅ Sitemap 생성 완료: public/sitemap.xml');
  console.log(`   - 총 ${urlCount}개 URL 포함 (korea 허브 ${koreaHubRoutes.length})`);
  console.log('✅ RSS 피드 생성 완료: public/rss.xml · public/rss-en.xml');
  console.log('   - 최근 50개 여행지 · gallery canonical 링크');
  console.log('');
  console.log('📌 네이버 서치어드바이저 제출 정보:');
  console.log(`   - Sitemap URL: ${baseUrl}/sitemap.xml`);
  console.log(`   - RSS URL (KO): ${baseUrl}/rss.xml`);
  console.log(`   - RSS URL (EN): ${baseUrl}/rss-en.xml`);
}

main().catch((error) => {
  console.error('❌ 파일 생성 실패:', error.message);
  process.exit(1);
});
