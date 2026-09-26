import { editorialLogbookDisclosure, isEditorialLogbookPublished } from '../../../utils/logbookEditorial.js';
import { logbookHeroImageUrl } from '../../../utils/logbookImageSrc.js';

const GATEO_ORG = {
  '@type': 'Organization',
  name: 'GATEO',
  url: 'https://www.gateo.kr',
};

export function buildEditorialLogbookJsonLd(report, pageUrl) {
  if (!report || !isEditorialLogbookPublished(report)) return null;

  const disclosure = editorialLogbookDisclosure(report);
  const headline = String(report.title || '').trim();
  const published = report.published_at || report.date;
  const hero = logbookHeroImageUrl(report.images);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description: disclosure,
    inLanguage: report.locale || 'ko',
    datePublished: published ? new Date(published).toISOString() : undefined,
    url: pageUrl,
    author: GATEO_ORG,
    publisher: {
      ...GATEO_ORG,
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.gateo.kr/og-default.png',
      },
    },
    ...(hero ? { image: [hero] } : {}),
    mainEntityOfPage: pageUrl,
    isAccessibleForFree: true,
    creativeWorkStatus: 'Published',
    keywords: 'GATEO editorial, AI-assisted travel guide, not a personal trip report',
  };
}
