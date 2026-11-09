/**
 * 해운대 MRT TNA 카드 UI 계약 — fetch-mrt-tnas mock.
 * imageUrl 호스트(d2urynajlo0k6r…)는 실존하지 않음 → 로드 실패(사실상 404/DNS).
 * UI는 onError 후 "No image" 폴백을 보여야 함(깨진 아이콘 금지).
 */
export const MRT_TNA_HAEUNDAE_CONTRACT_FIXTURE = {
  ok: true,
  keywordUsed: '해운대',
  items: [
    {
      gid: '9001001',
      itemName: '부산 해운대 해수욕장 스노클링 체험 (모닝 투어)',
      category: '해양스포츠',
      imageUrl: 'https://d2urynajlo0k6r.cloudfront.net/tna/contract/haeundae-snorkel.jpg',
      reviewScore: 4.8,
      reviewCount: 126,
      salePrice: 49000,
      productUrl: 'https://experiences.myrealtrip.com/products/9001001',
    },
    {
      gid: '9001002',
      itemName: '해운대 야경 & 광안리 야경 투어',
      category: '투어',
      imageUrl: 'https://d2urynajlo0k6r.cloudfront.net/tna/contract/haeundae-night.jpg',
      reviewScore: 4.6,
      salePrice: 35000,
      productUrl: 'https://experiences.myrealtrip.com/products/9001002',
    },
    {
      gid: '9001003',
      itemName: '해운대 SUP 체험 패키지',
      category: '해양스포츠',
      imageUrl: 'https://d2urynajlo0k6r.cloudfront.net/tna/contract/haeundae-sup.jpg',
      reviewScore: 4.9,
      reviewCount: 88,
      salePrice: 59000,
      productUrl: 'https://experiences.myrealtrip.com/products/9001003',
    },
    {
      gid: '9001004',
      itemName: '부산 시티투어 (해운대·감천문화마을)',
      category: '시티투어',
      imageUrl: 'https://d2urynajlo0k6r.cloudfront.net/tna/contract/busan-city.jpg',
      reviewScore: 4.5,
      salePrice: 42000,
      productUrl: 'https://experiences.myrealtrip.com/products/9001004',
    },
  ],
  totalCount: 4,
};

export const MRT_TNA_NO_IMAGE_ITEM = {
  gid: '9001999',
  itemName: '이미지 없음 투어 (회귀)',
  category: '체험',
  imageUrl: '',
  reviewScore: 4.2,
  salePrice: 12000,
  productUrl: 'https://experiences.myrealtrip.com/products/9001999',
};

export const MRT_TNA_MISSING_PRICE_ITEM = {
  gid: '9001998',
  itemName: '가격 미표시 티켓',
  category: '티켓',
  imageUrl: 'https://d2urynajlo0k6r.cloudfront.net/tna/contract/no-price.jpg',
  reviewScore: 4.0,
  productUrl: 'https://experiences.myrealtrip.com/products/9001998',
};
