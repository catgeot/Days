import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title,
  description,
  url,
  image,
  type = 'website',
  // JSON-LD 구조화 데이터를 위한 추가 props
  location = null
}) => {
  const siteName = 'GATEO';
  const defaultTitle = 'GATEO | AI 도슨트와 함께하는 3D 세계 여행';
  const defaultDescription = '당신의 여행을 계획하고 기록하는 가장 스마트한 방법, AI 도슨트와 함께하는 3D 세계 여행 GATEO(게이트제로)';
  const defaultImage = 'https://www.gateo.kr/og-image.png';
  const siteUrl = 'https://www.gateo.kr';

  const seoTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoUrl = url ? `${siteUrl}${url}` : siteUrl;
  const seoImage = image || defaultImage;

  // JSON-LD 구조화 데이터 생성 (여행지 페이지인 경우)
  const generateTouristAttractionSchema = () => {
    if (!location) return null;

    const schema = {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      "name": location.name || location.destination || location.name_en,
      "description": seoDescription,
      "url": seoUrl,
      "image": seoImage
    };

    // 영문명 추가 (alternateName)
    if (location.name_en && location.name_en !== schema.name) {
      schema.alternateName = location.name_en;
    }

    // 위치 정보 추가 (GeoCoordinates)
    if (location.lat && location.lng) {
      schema.geo = {
        "@type": "GeoCoordinates",
        "latitude": location.lat,
        "longitude": location.lng
      };
    }

    // 주소 정보 추가 (PostalAddress)
    if (location.country || location.country_en) {
      schema.address = {
        "@type": "PostalAddress"
      };

      if (location.country_en) {
        schema.address.addressCountry = location.country_en;
      }

      if (location.name || location.destination) {
        schema.address.addressRegion = location.name || location.destination;
      }
    }

    // 카테고리 정보 추가 (관광지 유형)
    if (location.primaryCategory || location.categories) {
      const categoryMap = {
        'paradise': '휴양지',
        'nature': '자연 경관',
        'urban': '도시 관광',
        'culture': '문화 유산',
        'adventure': '모험/액티비티'
      };

      const category = location.primaryCategory || (location.categories && location.categories[0]);
      if (category && categoryMap[category]) {
        schema.touristType = categoryMap[category];
      }
    }

    return schema;
  };

  const jsonLdSchema = generateTouristAttractionSchema();

  // JSON-LD 스크립트를 직접 DOM에 추가 (react-helmet-async의 script 태그 제한 우회)
  useEffect(() => {
    if (!jsonLdSchema) return;

    // 기존 JSON-LD 스크립트 제거 (중복 방지)
    const existingScript = document.querySelector('script[data-schema-type="TouristAttraction"]');
    if (existingScript) {
      existingScript.remove();
    }

    // 새 JSON-LD 스크립트 생성
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-type', 'TouristAttraction');
    script.textContent = JSON.stringify(jsonLdSchema, null, 2);

    document.head.appendChild(script);

    // 컴포넌트 언마운트 시 스크립트 제거
    return () => {
      const scriptToRemove = document.querySelector('script[data-schema-type="TouristAttraction"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [jsonLdSchema]);

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />

      {/* Canonical URL - 가장 중요한 SEO 요소 (중복 색인 방지) */}
      <link rel="canonical" href={seoUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
    </Helmet>
  );
};

export default SEO;
