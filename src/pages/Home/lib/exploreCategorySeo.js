/** Explore continent×theme SEO — `/explore/:continent/:category` (검색노출 #18) */

export const EXPLORE_SEO_CONTINENTS = [
  'asia',
  'europe',
  'north_america',
  'south_america',
  'oceania',
  'africa',
];

export const EXPLORE_SEO_CATEGORIES = ['paradise', 'culture', 'urban', 'nature', 'adventure'];

/** index.html 정적 EN 링크 샘플 (KO nav와 동기) */
export const EXPLORE_CATEGORY_FEATURED_LINKS = [
  { continent: 'asia', category: 'paradise' },
  { continent: 'europe', category: 'culture' },
  { continent: 'north_america', category: 'urban' },
  { continent: 'oceania', category: 'nature' },
  { continent: 'south_america', category: 'adventure' },
];

const CONTINENT_LABELS = {
  ko: {
    asia: '아시아',
    europe: '유럽',
    north_america: '북미',
    south_america: '남미',
    oceania: '오세아니아',
    africa: '아프리카',
  },
  en: {
    asia: 'Asia',
    europe: 'Europe',
    north_america: 'North America',
    south_america: 'South America',
    oceania: 'Oceania',
    africa: 'Africa',
  },
};

const CATEGORY_SEO = {
  paradise: {
    ko: {
      phrase: '휴양·호캉스',
      keywords: ['휴양지', '호캉스', '리조트', '해변', '휴양'],
    },
    en: {
      phrase: 'resort & beach getaways',
      keywords: ['resort', 'beach getaway', 'tropical', 'honeymoon', 'island resort'],
    },
  },
  culture: {
    ko: {
      phrase: '랜드마크·문화',
      keywords: ['문화', '랜드마크', '유적', '박물관', '문화유산'],
    },
    en: {
      phrase: 'landmarks & culture',
      keywords: ['landmarks', 'culture', 'heritage', 'museums', 'historic sites'],
    },
  },
  urban: {
    ko: {
      phrase: '대도시·쇼핑',
      keywords: ['도시', '대도시', '쇼핑', '시티', '도심'],
    },
    en: {
      phrase: 'cities & shopping',
      keywords: ['city break', 'shopping', 'urban travel', 'downtown', 'metropolis'],
    },
  },
  nature: {
    ko: {
      phrase: '대자연',
      keywords: ['자연', '대자연', '국립공원', '트레킹', '풍경'],
    },
    en: {
      phrase: 'nature & outdoors',
      keywords: ['nature', 'national park', 'outdoors', 'scenery', 'wildlife'],
    },
  },
  adventure: {
    ko: {
      phrase: '모험·액티비티',
      keywords: ['모험', '액티비티', '익스트림', '트레킹', '스릴'],
    },
    en: {
      phrase: 'adventure travel',
      keywords: ['adventure', 'active travel', 'extreme sports', 'hiking', 'expedition'],
    },
  },
};

const SITE_KEYWORDS = {
  ko: ['GATEO', '게이트제로', '여행지 탐색', '3D 지구본', 'AI 도슨트'],
  en: ['GATEO', 'travel destinations', '3D globe', 'AI docent', 'explore'],
};

export function isExploreSeoContinent(id) {
  return EXPLORE_SEO_CONTINENTS.includes(id);
}

export function isExploreSeoCategory(id) {
  return EXPLORE_SEO_CATEGORIES.includes(id);
}

export function buildExploreCategoryPath(continent, category) {
  return `/explore/${continent}/${category}`;
}

export function parseExploreCategoryPath(pathname) {
  const match = String(pathname || '').match(/^\/explore\/([^/]+)\/([^/]+)\/?$/);
  if (!match) return null;
  const [, continent, category] = match;
  if (!isExploreSeoContinent(continent) || !isExploreSeoCategory(category)) return null;
  return { continent, category, path: buildExploreCategoryPath(continent, category) };
}

export function listExploreCategoryPaths() {
  const paths = [];
  for (const continent of EXPLORE_SEO_CONTINENTS) {
    for (const category of EXPLORE_SEO_CATEGORIES) {
      paths.push(buildExploreCategoryPath(continent, category));
    }
  }
  return paths;
}

function getContinentLabel(continent, locale) {
  return CONTINENT_LABELS[locale]?.[continent] || continent;
}

function getCategorySeo(category, locale) {
  return CATEGORY_SEO[category]?.[locale] || CATEGORY_SEO[category]?.ko;
}

export function getExploreCategorySeoTitle(continent, category, locale = 'ko') {
  const continentLabel = getContinentLabel(continent, locale);
  const seo = getCategorySeo(category, locale);
  if (locale === 'en') {
    return `${continentLabel} ${seo.phrase}`;
  }
  return `${continentLabel} ${seo.phrase} 여행지`;
}

export function getExploreCategorySeoDescription(continent, category, locale = 'ko') {
  const continentLabel = getContinentLabel(continent, locale);
  const seo = getCategorySeo(category, locale);
  if (locale === 'en') {
    return `Browse ${continentLabel.toLowerCase()} ${seo.phrase} on GATEO — photos, videos, and an AI docent on a 3D globe to plan your trip.`;
  }
  return `GATEO 3D 지구본에서 ${continentLabel} ${seo.phrase} 여행지를 탐색하세요. 사진·영상·AI 도슨트와 함께 여행을 계획하세요.`;
}

export function getExploreCategorySeoKeywords(continent, category, locale = 'ko') {
  const continentLabel = getContinentLabel(continent, locale);
  const seo = getCategorySeo(category, locale);
  const parts = [continentLabel, ...seo.keywords, ...SITE_KEYWORDS[locale]];
  return [...new Set(parts.map((p) => String(p).trim()).filter(Boolean))].join(', ');
}

export function getExploreCategorySeoBundle(continent, category, locale = 'ko') {
  const path = buildExploreCategoryPath(continent, category);
  return {
    path,
    title: getExploreCategorySeoTitle(continent, category, locale),
    description: getExploreCategorySeoDescription(continent, category, locale),
    keywords: getExploreCategorySeoKeywords(continent, category, locale),
  };
}

/** index.html EN 정적 링크 라벨 */
export function getExploreCategoryStaticLinkLabel(continent, category, locale = 'en') {
  if (locale === 'en') {
    return getExploreCategorySeoTitle(continent, category, 'en');
  }
  return getExploreCategorySeoTitle(continent, category, 'ko');
}
