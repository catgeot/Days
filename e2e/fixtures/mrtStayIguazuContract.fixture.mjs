/**
 * 테스트 계약용 fixture — Edge `fetch-mrt-stays` items[] 형태만 (클라이언트가 받는 필드).
 * 출처: 배포 Edge read-only POST (2026-11-05, keyword 이구아수 폭포, size≤5) 응답 items 중
 * itemId·itemName·salePrice·starRating·reviewScore·imageUrl·productUrl 필드 형태.
 * (운영 재호출 없음 — 당시 캡처 값을 고정.)
 */
export const MRT_STAY_IGUAZU_CONTRACT_FIXTURE = {
  usedKeyword: '이구아수 폭포',
  region: { regionId: 9001 },
  totalCount: 4,
  items: [
    {
      itemId: 1190340,
      itemName: '칸지 카타라타스 호텔',
      salePrice: 237321,
      originalPrice: 237321,
      starRating: 4,
      reviewScore: '4.2',
      reviewCount: 443,
      imageUrl:
        'https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2023/04/27/KUDq/C9VhmcKQLu.jpg?width=720',
      productUrl:
        'https://accommodation.myrealtrip.com/union/products/1190340?checkIn=2026-11-20&checkOut=2026-11-23&adultCount=2&childCount=0&childAges=',
    },
    {
      itemId: 1190341,
      itemName: '그란 멜리아 이과수',
      salePrice: 1326656,
      originalPrice: 1326656,
      starRating: 5,
      reviewScore: '4.7',
      reviewCount: 1200,
      imageUrl:
        'https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2023/04/27/KUDq/C9VhmcKQLu.jpg?width=720',
      productUrl:
        'https://accommodation.myrealtrip.com/union/products/1190341?checkIn=2026-11-20&checkOut=2026-11-23&adultCount=2&childCount=0&childAges=',
    },
    {
      itemId: 1190342,
      itemName: '산마 호텔',
      salePrice: 312503,
      originalPrice: 312503,
      starRating: 4,
      reviewScore: '4.8',
      reviewCount: 890,
      imageUrl:
        'https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2023/04/27/KUDq/C9VhmcKQLu.jpg?width=720',
      productUrl:
        'https://accommodation.myrealtrip.com/union/products/1190342?checkIn=2026-11-20&checkOut=2026-11-23&adultCount=2&childCount=0&childAges=',
    },
    {
      itemId: 1190343,
      itemName:
        '호텔 다스 카타라타스, 어 벨몬드 호텔, 이과수 폭포 — 긴 제목 줄바꿈 계약 테스트',
      salePrice: 1339944,
      originalPrice: 1339944,
      starRating: 5,
      reviewScore: '5.0',
      reviewCount: 2100,
      imageUrl:
        'https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2023/04/27/KUDq/C9VhmcKQLu.jpg?width=720',
      productUrl:
        'https://accommodation.myrealtrip.com/union/products/1190343?checkIn=2026-11-20&checkOut=2026-11-23&adultCount=2&childCount=0&childAges=',
    },
  ],
};

/** Edge items[] — imageUrl null (별도 회귀) */
export const MRT_STAY_NO_IMAGE_ITEM = {
  itemId: 9999001,
  itemName: '이미지 없음 계약 숙소',
  salePrice: 100000,
  starRating: null,
  reviewScore: null,
  imageUrl: null,
  productUrl: 'https://accommodation.myrealtrip.com/union/products/9999001',
};

export const MRT_STAY_MISSING_PRICE_ITEM = {
  itemId: 9999002,
  itemName: '가격 없음 계약 숙소',
  salePrice: null,
  starRating: 3,
  reviewScore: '4.0',
  imageUrl:
    'https://dry7pvlp22cox.cloudfront.net/mrt-images-prod/2023/04/27/KUDq/C9VhmcKQLu.jpg?width=720',
  productUrl: 'https://accommodation.myrealtrip.com/union/products/9999002',
};
