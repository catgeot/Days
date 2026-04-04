import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, url, image, type = 'website' }) => {
  const siteName = "Days - 세상의 모든 여행지";
  const defaultDescription = "전 세계 200여 개의 아름다운 여행지를 3D 지구본으로 탐험하고, 위키 정보와 여행 팁을 확인하세요.";
  const defaultImage = "https://www.gateo.kr/og-image.png";
  const siteUrl = "https://www.gateo.kr";

  const seoTitle = title ? `${title} | ${siteName}` : siteName;
  const seoDescription = description || defaultDescription;
  const seoUrl = url ? `${siteUrl}${url}` : siteUrl;
  const seoImage = image || defaultImage;

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
