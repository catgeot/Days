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

  // 로그북 페이지
  urls.push({
    loc: `${baseUrl}/logbook`,
    lastmod: today,
    changefreq: 'daily',
    priority: '0.8'
  });

  // 각 여행지 페이지
  travelSpotsData.forEach(spot => {
    urls.push({
      loc: `${baseUrl}/place/${spot.slug}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: spot.tier === 1 ? '0.9' : spot.tier === 2 ? '0.8' : '0.7'
    });
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
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

// RSS 피드 생성
function generateRSS() {
  const recentSpots = travelSpotsData
    .filter(spot => spot.tier <= 2)
    .slice(0, 50); // 최근 50개

  // 현재 날짜 사용
  const currentDate = new Date();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GATEO | AI 도슨트와 함께하는 3D 세계 여행</title>
    <link>${baseUrl}</link>
    <description>당신의 여행을 계획하고 기록하는 가장 스마트한 방법, AI 도슨트와 함께하는 3D 세계 여행 GATEO(게이트제로)</description>
    <language>ko</language>
    <lastBuildDate>${currentDate.toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />

${recentSpots.map((spot, index) => {
      // 각 항목마다 며칠씩 뒤로 날짜를 설정 (최신 순)
      const itemDate = new Date(currentDate);
      itemDate.setDate(itemDate.getDate() - index);

      // 네이버 권장: 본문 전체 제공
      const fullDescription = `
        <h2>${spot.name} (${spot.name_en})</h2>
        <p><strong>국가:</strong> ${spot.country} (${spot.country_en})</p>
        <p><strong>카테고리:</strong> ${spot.primaryCategory || spot.category}</p>
        <p>${spot.desc || `${spot.name} 여행 정보, 관광지, 액티비티, 교통편, 숙박 정보를 확인하세요.`}</p>
        ${spot.keywords ? `<p><strong>키워드:</strong> ${spot.keywords.join(', ')}</p>` : ''}
        <p><a href="${baseUrl}/place/${spot.slug}">자세히 보기 →</a></p>
      `.trim().replace(/\s+/g, ' ');

      return `    <item>
      <title>${spot.name} (${spot.name_en}) - ${spot.country} 여행 가이드</title>
      <link>${baseUrl}/place/${spot.slug}</link>
      <description><![CDATA[${fullDescription}]]></description>
      <category>${spot.primaryCategory || spot.category}</category>
      <pubDate>${itemDate.toUTCString()}</pubDate>
      <guid isPermaLink="true">${baseUrl}/place/${spot.slug}</guid>
    </item>`;
    }).join('\n')}
  </channel>
</rss>`;

  return rss;
}

// 파일 저장
try {
  const sitemap = generateSitemap();
  const rss = generateRSS();

  fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemap, 'utf-8');
  fs.writeFileSync(path.join(__dirname, '../public/rss.xml'), rss, 'utf-8');

  console.log('✅ Sitemap 생성 완료: public/sitemap.xml');
  console.log(`   - 총 ${travelSpotsData.length + 32}개 URL 포함`);
  console.log('✅ RSS 피드 생성 완료: public/rss.xml');
  console.log('   - 최근 50개 여행지 포함');
  console.log('');
  console.log('📌 네이버 서치어드바이저 제출 정보:');
  console.log('   - Sitemap URL: https://www.gateo.kr/sitemap.xml');
  console.log('   - RSS URL: https://www.gateo.kr/rss.xml');
} catch (error) {
  console.error('❌ 파일 생성 실패:', error.message);
  process.exit(1);
}
